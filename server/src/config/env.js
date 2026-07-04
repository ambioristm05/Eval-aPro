import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const productionRequiredEnv = ['JWT_SECRET', 'ADMIN_PASSWORD'];
const insecureProductionValues = {
  JWT_SECRET: ['dev_secret_change_me', 'change_this_secret'],
  ADMIN_PASSWORD: ['Admin12345']
};

if (nodeEnv === 'production') {
  const missing = productionRequiredEnv.filter((key) => !process.env[key]?.trim());
  const insecure = productionRequiredEnv.filter((key) =>
    insecureProductionValues[key]?.includes(process.env[key]?.trim())
  );

  if (missing.length || insecure.length) {
    const problems = [
      missing.length ? `faltan: ${missing.join(', ')}` : null,
      insecure.length ? `valores inseguros: ${insecure.join(', ')}` : null
    ].filter(Boolean);

    throw new Error(`Configuracion insegura para produccion (${problems.join('; ')}).`);
  }
}

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/evaluapro',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv,
  adminName: process.env.ADMIN_NAME || 'Administrador',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@evaluapro.local',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin12345',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'EvalúaPro <no-reply@evaluapro.local>'
  }
};
