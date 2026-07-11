import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Group } from '../models/Group.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function serializeUser(user) {
  if (!user) return null;

  return {
    _id: user._id,
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

function serializeMessage(message, currentUserId) {
  return {
    _id: message._id,
    id: String(message._id),
    body: message.body,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    readAt: message.readAt,
    direction: String(message.sender?._id ?? message.sender) === String(currentUserId) ? 'outgoing' : 'incoming',
    sender: serializeUser(message.sender),
    recipient: serializeUser(message.recipient),
  };
}

async function getStudentEvaluatorContacts(user) {
  const groupEvaluatorIds = await Group.find({
    students: user._id,
    status: 'active',
  }).distinct('evaluator');
  const contactIds = new Set(groupEvaluatorIds.map(String));

  if (user.createdBy) {
    contactIds.add(String(user.createdBy));
  }

  if (!contactIds.size) return [];

  return User.find({
    _id: { $in: Array.from(contactIds) },
    role: USER_ROLES.EVALUATOR,
    status: USER_STATUSES.ACTIVE,
  })
    .select('name email role status')
    .sort({ name: 1 });
}

async function getEvaluatorStudentContacts(user) {
  const groupStudentIds = await Group.find({
    evaluator: user._id,
    status: 'active',
  }).distinct('students');

  return User.find({
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE,
    $or: [{ createdBy: user._id }, { _id: { $in: groupStudentIds } }],
  })
    .select('name email role status')
    .sort({ name: 1 });
}

async function getAdminEvaluatorContacts() {
  return User.find({
    role: USER_ROLES.EVALUATOR,
    status: USER_STATUSES.ACTIVE,
  })
    .select('name email role status')
    .sort({ name: 1 });
}

async function getEvaluatorAdminContacts() {
  return User.find({
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.ACTIVE,
  })
    .select('name email role status')
    .sort({ name: 1 });
}

async function getAllowedContacts(user) {
  if (user.role === USER_ROLES.STUDENT) {
    return getStudentEvaluatorContacts(user);
  }

  if (user.role === USER_ROLES.EVALUATOR) {
    const [students, admins] = await Promise.all([
      getEvaluatorStudentContacts(user),
      getEvaluatorAdminContacts(),
    ]);

    return [...students, ...admins].sort((left, right) => {
      if (left.role !== right.role) return left.role === USER_ROLES.ADMIN ? 1 : -1;
      return left.name.localeCompare(right.name, 'es');
    });
  }

  if (user.role === USER_ROLES.ADMIN) {
    return getAdminEvaluatorContacts();
  }

  return [];
}

async function findAllowedContact(user, contactId) {
  const contacts = await getAllowedContacts(user);
  return contacts.find((contact) => String(contact._id) === String(contactId)) ?? null;
}

function buildContactSummaries(contacts, messages, currentUserId) {
  const summaries = new Map(
    contacts.map((contact) => [
      String(contact._id),
      {
        user: serializeUser(contact),
        unreadCount: 0,
        lastMessage: '',
        lastMessageAt: null,
      },
    ])
  );

  messages.forEach((message) => {
    const senderId = String(message.sender);
    const recipientId = String(message.recipient);
    const contactId = senderId === String(currentUserId) ? recipientId : senderId;
    const summary = summaries.get(contactId);
    if (!summary) return;

    if (!summary.lastMessageAt || new Date(message.createdAt) > new Date(summary.lastMessageAt)) {
      summary.lastMessageAt = message.createdAt;
      summary.lastMessage = message.body;
    }

    if (recipientId === String(currentUserId) && !message.readAt) {
      summary.unreadCount += 1;
    }
  });

  return Array.from(summaries.values()).sort((left, right) => {
    if (left.lastMessageAt && right.lastMessageAt) {
      return new Date(right.lastMessageAt) - new Date(left.lastMessageAt);
    }

    if (left.lastMessageAt) return -1;
    if (right.lastMessageAt) return 1;
    return left.user.name.localeCompare(right.user.name, 'es');
  });
}

export const listMessageContacts = asyncHandler(async (req, res) => {
  const contacts = await getAllowedContacts(req.user);
  const contactIds = contacts.map((contact) => contact._id);
  const messages = contactIds.length
    ? await Message.find({
        $or: [
          { sender: req.user._id, recipient: { $in: contactIds } },
          { sender: { $in: contactIds }, recipient: req.user._id },
        ],
      })
        .select('sender recipient body createdAt readAt')
        .sort({ createdAt: -1 })
        .lean()
    : [];

  res.json({
    contacts: buildContactSummaries(contacts, messages, req.user._id),
  });
});

export const getMessageThread = asyncHandler(async (req, res) => {
  const { userId } = req.validated.params;
  const contact = await findAllowedContact(req.user, userId);

  if (!contact) {
    throw new AppError('No puedes conversar con este usuario', 403);
  }

  const readAt = new Date();
  await Message.updateMany(
    {
      sender: contact._id,
      recipient: req.user._id,
      readAt: { $exists: false },
    },
    { $set: { readAt } }
  );
  await Message.updateMany(
    {
      sender: contact._id,
      recipient: req.user._id,
      readAt: null,
    },
    { $set: { readAt } }
  );

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: contact._id },
      { sender: contact._id, recipient: req.user._id },
    ],
  })
    .populate('sender', 'name email role status')
    .populate('recipient', 'name email role status')
    .sort({ createdAt: 1 });

  res.json({
    contact: serializeUser(contact),
    messages: messages.map((message) => serializeMessage(message, req.user._id)),
  });
});

export const createMessage = asyncHandler(async (req, res) => {
  const { recipientId, body } = req.validated.body;
  const recipient = await findAllowedContact(req.user, recipientId);

  if (!recipient) {
    throw new AppError('No puedes enviar mensajes a este usuario', 403);
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient: recipient._id,
    body,
  });

  await message.populate('sender', 'name email role status');
  await message.populate('recipient', 'name email role status');

  res.status(201).json({
    message: serializeMessage(message, req.user._id),
  });
});
