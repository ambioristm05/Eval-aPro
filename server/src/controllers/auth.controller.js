import crypto from 'crypto';
import { User } from '../models/User.js';
import { BLOCKED_USER_STATUSES, USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { findValidInvitation } from './invitation.controller.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../utils/audit.js';
import { generateToken } from '../utils/generateToken.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

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
    throw new AppError('La invitación no corresponde a este email', 403);
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
    throw new AppError('Tu cuenta no está activa', 403);
  }

  res.json(buildAuthResponse(user));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email });

  if (user && !BLOCKED_USER_STATUSES.includes(user.status)) {
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail({ to: user.email, token: resetToken });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('No se pudo enviar el correo de restablecimiento', 500);
    }
  }

  res.json({
    message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.'
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated.body;
  const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Token inválido o expirado', 400);
  }

  if (BLOCKED_USER_STATUSES.includes(user.status)) {
    throw new AppError('Token inválido o expirado', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await writeAudit({
    actor: user._id,
    action: 'auth.password_reset',
    entity: 'User',
    entityId: user._id,
    before: null,
    after: {
      id: user._id,
      email: user.email,
      status: user.status
    }
  });

  res.json({
    message: 'Contraseña restablecida correctamente'
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    user: req.user.toJSON()
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({
    message: 'Sesión cerrada correctamente'
  });
});
