import dotenv from 'dotenv';
import { connectDb } from './src/config/db.js';
import { createApp } from './src/app.js';

dotenv.config(); // Load environment variables from .env

const app = createApp();
const port = process.env.PORT || 5000;

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
