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
    subject: 'Restablece tu contraseña en EvalúaPro',
    html: `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return { sent: true };
}
