import { User } from '../models/User.js';
import { BLOCKED_USER_STATUSES, USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { findValidInvitation } from './invitation.controller.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateToken } from '../utils/generateToken.js';

function buildAuthResponse(user) {
  return {
    user: user.toJSON(),
    token: generateToken(user)
  };
}

export const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este email', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE
  });

  res.status(201).json(buildAuthResponse(user));
});

export const registerEvaluatorWithInvitation = asyncHandler(async (req, res) => {
  const { name, email, password, token } = req.validated.body;
  const invitation = await findValidInvitation(token);

  if (invitation.role !== USER_ROLES.EVALUATOR || invitation.email !== email) {
    throw new AppError('La invitacion no corresponde a este email', 403);
  }

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este email', 409);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: USER_ROLES.EVALUATOR,
    status: USER_STATUSES.ACTIVE,
    createdBy: invitation.createdBy
  });

  invitation.used = true;
  invitation.usedAt = new Date();
  await invitation.save();

  res.status(201).json(buildAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Credenciales invalidas', 401);
  }

  if (BLOCKED_USER_STATUSES.includes(user.status)) {
    throw new AppError('Tu cuenta no esta activa', 403);
  }

  res.json(buildAuthResponse(user));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.toJSON()
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({
    message: 'Sesion cerrada correctamente'
  });
});
