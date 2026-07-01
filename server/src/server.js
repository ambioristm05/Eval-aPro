import mongoose from 'mongoose';
import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

let server;

async function bootstrap() {
  try {
    await connectDb();

    server = app.listen(env.port, () => {
      console.log(`Servidor escuchando en puerto ${env.port}`);
    });
  } catch (error) {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`${signal} recibido. Cerrando servidor...`);

  if (!server) {
    mongoose.connection.close(false).finally(() => process.exit(0));
    return;
  }

  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (error) => {
  console.error(`Promesa rechazada sin manejar: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

bootstrap();
