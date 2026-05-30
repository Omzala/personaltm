import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

function getAllowedOrigins() {
  return [
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://localhost:5173'
  ].filter(Boolean);
}

export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || getAllowedOrigins().includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: '9to5wrapped-server' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Something went wrong'
    });
  });

  return app;
}
