import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import apiRoutes from './routes/index.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
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
