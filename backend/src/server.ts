import { env } from './config/env';
import { app } from './app';
import { initializeStorage } from './config/storage';
import pool from './config/database';

const PORT = env.PORT;

initializeStorage();

async function startServer() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected');
    client.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📦 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();

process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});
