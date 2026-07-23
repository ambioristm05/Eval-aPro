import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export async function sendPasswordResetEmail({ to, token }) {
  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    console.log(`Password reset para ${to}: ${resetUrl}`);
    return { preview: resetUrl };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure ?? env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Restablece tu contraseña en EvaluaPro',
    html: `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return { sent: true };
}

export async function sendEvaluatorInvitationEmail({ to, registrationUrl, expiresAt }) {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    console.log(`Invitación de evaluador para ${to}: ${registrationUrl}`);
    return { sent: false, preview: registrationUrl };
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure ?? env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Invitación para unirte a EvaluaPro como evaluador',
    html: `
      <p>Has sido invitado a crear una cuenta de evaluador en EvaluaPro.</p>
      <p><a href="${registrationUrl}">${registrationUrl}</a></p>
      <p>Este enlace es de un solo uso y expira el ${formattedExpiry}.</p>
    `
  });

  return { sent: true };
}
