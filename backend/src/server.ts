import { env } from './config/env';
import { app } from './app';
import { initializeStorage } from './config/storage';
import { getClient } from './config/database';
import { createServer } from 'http';
import { initializeNotifications } from './modules/notifications/notifications.service';

const PORT = env.PORT;

initializeStorage();

async function startServer() {
  try {
    const client = await getClient();
    console.log('✅ Database connected');
    client.release();

    const server = createServer(app);
    initializeNotifications(server);

    server.listen(PORT, () => {
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
