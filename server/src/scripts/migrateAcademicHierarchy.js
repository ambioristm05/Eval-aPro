import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { migrateAcademicHierarchy } from '../utils/migrateAcademicHierarchy.js';

try {
  await connectDb();
  const summary = await migrateAcademicHierarchy();

  console.log(
    `Migración completada: ${summary.evaluators} evaluadores revisados, ${summary.tasksUpdated} tareas actualizadas.`
  );
  await mongoose.connection.close(false);
  process.exit(0);
} catch (error) {
  console.error(`No se pudo migrar la jerarquía académica: ${error.message}`);
  await mongoose.connection.close(false).catch(() => {});
  process.exit(1);
}
