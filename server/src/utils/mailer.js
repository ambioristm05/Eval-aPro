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
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Restablece tu contraseña en EvaluaPro',
    html: `<p>Usa este enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return { sent: true };
}

function buildInvitationEmailHtml({ inviterName, registrationUrl, formattedExpiry }) {
  const assetsBase = env.clientUrl.replace(/\/$/, '');
  const introLine = inviterName
    ? `${inviterName} te invitó a unirte a EvaluaPro como evaluador.`
    : 'Has sido invitado a unirte a EvaluaPro como evaluador.';

  return `
    <div style="margin:0; padding:32px 16px; background:#F4F6F5; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:480px; margin:0 auto; background:#FFFFFF; border:1px solid #E4E7E5; border-radius:12px; padding:40px 32px; text-align:center;">
        <img src="${assetsBase}/icono-plano.svg" width="56" height="56" alt="EvaluaPro" style="display:block; margin:0 auto 24px;" />

        <p style="margin:0 0 24px; color:#5B6B7A; font-size:14px; line-height:1.5;">
          Antes de poder comenzar, necesitamos confirmar tu cuenta.
        </p>

        <h1 style="margin:0 0 20px; color:#17202A; font-size:22px; line-height:1.3;">
          Confirma tu cuenta
        </h1>

        <p style="margin:0 0 28px; color:#3D4A56; font-size:15px; line-height:1.6; text-align:left;">
          ${introLine} Para crear tu cuenta, haz clic en el botón de abajo.
        </p>

        <a href="${registrationUrl}" style="display:inline-block; padding:14px 32px; background:#2F6F4E; color:#FFFFFF; font-size:15px; font-weight:bold; text-decoration:none; border-radius:8px;">
          Confirmar cuenta
        </a>

        <p style="margin:28px 0 0; color:#8A97A2; font-size:12px; line-height:1.5;">
          Este enlace es de un solo uso y expira el ${formattedExpiry}.<br />
          Si no esperabas esta invitación, puedes ignorar este correo.
        </p>

        <div style="margin-top:32px; padding-top:24px; border-top:1px solid #E4E7E5;">
          <img src="${assetsBase}/logo-horizontal.svg" height="24" alt="EvaluaPro" style="display:block; margin:0 auto;" />
        </div>
      </div>
    </div>
  `;
}

export async function sendEvaluatorInvitationEmail({ to, registrationUrl, expiresAt, inviterName }) {
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
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: 'Confirma tu cuenta de evaluador en EvaluaPro',
    html: buildInvitationEmailHtml({ inviterName, registrationUrl, formattedExpiry })
  });

  return { sent: true };
}
