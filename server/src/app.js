import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

export const app = express();
const allowedOrigins = env.clientUrl.split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isConfiguredOrigin = allowedOrigins.includes(origin);
      const isLocalDevelopmentOrigin =
        env.nodeEnv === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

      callback(null, isConfiguredOrigin || isLocalDevelopmentOrigin);
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/', (req, res) => {
  res.json({
    name: 'EvaluaPro API',
    status: 'ok'
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);
