import { env } from '../config/env.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateInvitationToken, hashInvitationToken } from '../utils/invitationToken.js';

function serializeInvitation(invitation) {
  return {
    id: invitation._id,
    email: invitation.email,
    role: invitation.role,
    used: invitation.used,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt
  };
}

async function findValidInvitation(token) {
  const hashedToken = hashInvitationToken(token);
  const invitation = await Invitation.findOne({ token: hashedToken }).select('+token');

  if (!invitation) {
    throw new AppError('Invitacion invalida', 404);
  }

  if (invitation.used) {
    throw new AppError('La invitacion ya fue utilizada', 409);
  }

  if (invitation.expiresAt <= new Date()) {
    throw new AppError('La invitacion expiro', 410);
  }

  return invitation;
}

export const createEvaluatorInvitation = asyncHandler(async (req, res) => {
  const { email, expiresInDays } = req.validated.body;

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este email', 409);
  }

  const rawToken = generateInvitationToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    email,
    role: USER_ROLES.EVALUATOR,
    token: hashInvitationToken(rawToken),
    expiresAt,
    createdBy: req.user._id
  });

  res.status(201).json({
    invitation: serializeInvitation(invitation),
    token: rawToken,
    registrationUrl: `${env.clientUrl}/register/evaluator?token=${rawToken}`
  });
});

export const validateInvitation = asyncHandler(async (req, res) => {
  const invitation = await findValidInvitation(req.validated.params.token);

  res.json({
    valid: true,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    }
  });
});

export { findValidInvitation, serializeInvitation };
