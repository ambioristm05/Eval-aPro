import { GROUP_STATUSES } from '../constants/group.constants.js';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function groupScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  return { evaluator: req.user._id };
}

async function findGroupForUser(req, id) {
  const group = await Group.findOne({
    _id: id,
    ...groupScope(req)
  }).populate('evaluator', 'name email role');

  if (!group) {
    throw new AppError('Grupo no encontrado', 404);
  }

  return group;
}

export const getMyGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ students: req.user._id })
    .populate('evaluator', 'name email')
    .populate('students', 'name email');

  if (!group) {
    throw new AppError('No perteneces a ningún grupo todavía', 404);
  }

  res.json({ group });
});

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.validated.body;

  const group = await Group.create({
    name,
    description,
    evaluator: req.user._id,
    status: GROUP_STATUSES.ACTIVE
  });

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { groups: group._id }
  });

  res.status(201).json({ group });
});

export const getGroups = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.validated.query;
  const filter = {
    ...groupScope(req)
  };

  if (status) filter.status = status;
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate('evaluator', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Group.countDocuments(filter)
  ]);

  res.json({
    groups,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getGroupById = asyncHandler(async (req, res) => {
  const group = await findGroupForUser(req, req.validated.params.id);

  res.json({ group });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const group = await findGroupForUser(req, req.validated.params.id);
  const { name, description, status } = req.validated.body;

  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (status !== undefined) group.status = status;

  await group.save();

  res.json({ group });
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const group = await findGroupForUser(req, req.validated.params.id);

  await Group.deleteOne({ _id: group._id });
  await User.updateMany(
    { groups: group._id },
    {
      $pull: { groups: group._id }
    }
  );

  res.json({
    message: 'Grupo eliminado correctamente'
  });
});

export const addStudentToGroup = asyncHandler(async (req, res) => {
  const group = await findGroupForUser(req, req.validated.params.id);
  const { studentId } = req.validated.body;

  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE
  });

  if (!student) {
    throw new AppError('Estudiante activo no encontrado', 404);
  }

  await Group.findByIdAndUpdate(group._id, {
    $addToSet: { students: student._id }
  });
  await User.findByIdAndUpdate(student._id, {
    $addToSet: { groups: group._id }
  });

  const updatedGroup = await Group.findById(group._id)
    .populate('evaluator', 'name email role')
    .populate('students', 'name email role status');

  res.json({ group: updatedGroup });
});

export const removeStudentFromGroup = asyncHandler(async (req, res) => {
  const group = await findGroupForUser(req, req.validated.params.id);
  const { studentId } = req.validated.params;

  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLES.STUDENT
  });

  if (!student) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  await Group.findByIdAndUpdate(group._id, {
    $pull: { students: student._id }
  });
  await User.findByIdAndUpdate(student._id, {
    $pull: { groups: group._id }
  });

  res.json({
    message: 'Estudiante removido del grupo correctamente'
  });
});
