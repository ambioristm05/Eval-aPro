import { env } from '../config/env.js';
import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { User } from '../models/User.js';

export async function ensureAdminUser() {
  if (!env.adminEmail || !env.adminPassword) {
    console.log('Admin inicial omitido: ADMIN_EMAIL o ADMIN_PASSWORD no estan configurados.');
    return null;
  }

  const email = env.adminEmail.toLowerCase().trim();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    console.log(`Admin inicial omitido: ya existe una cuenta con ${email}.`);
    return existingAdmin;
  }

  const admin = await User.create({
    name: env.adminName,
    email,
    password: env.adminPassword,
    role: USER_ROLES.ADMIN,
    status: USER_STATUSES.ACTIVE
  });

  console.log(`Admin inicial creado: ${email}.`);
  return admin;
}
