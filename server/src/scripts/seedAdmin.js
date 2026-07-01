import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { ensureAdminUser } from '../utils/ensureAdminUser.js';

try {
  await connectDb();
  await ensureAdminUser();
  await mongoose.connection.close(false);
  process.exit(0);
} catch (error) {
  console.error(`No se pudo crear el admin inicial: ${error.message}`);
  await mongoose.connection.close(false).catch(() => {});
  process.exit(1);
}
