import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDb } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

dotenv.config(); // Load environment variables from .env


const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

connectDb()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${port} is already in use.`);
        console.error(`   Run: npx kill-port ${port}   — then restart.\n`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
