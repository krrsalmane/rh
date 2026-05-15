import { env } from './config/env';
import { app } from './app';
import { initializeStorage } from './config/storage';
import { getClient } from './config/database';
import { createServer } from 'http';
import { initializeNotifications } from './modules/notifications/notifications.service';

const DEFAULT_PORT = env.PORT || 3000;

initializeStorage();

async function startServer() {
  try {
    const client = await getClient();
    console.log('✅ Database connected');
    client.release();

    // Try to start on default port, if busy try alternatives
    function tryStart(port: number) {
      const server = createServer(app);
      initializeNotifications(server);

      server.once('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          if (port === DEFAULT_PORT) {
            console.log(`⚠️ Port ${port} is busy, trying alternative ports...`);
            tryStart(port + 1);
          } else if (port < DEFAULT_PORT + 5) {
            console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
            tryStart(port + 1);
          } else {
            console.error(`❌ Ports ${DEFAULT_PORT}-${DEFAULT_PORT + 4} are all in use`);
            console.log('💡 Try killing the process using this port:');
            console.log(`   netstat -ano | findstr :${DEFAULT_PORT}`);
            console.log(`   taskkill /F /PID <PID_FROM_NETSTAT>`);
            process.exit(1);
          }
          return;
        }

        console.error('❌ Server error:', error);
        process.exit(1);
      });

      server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📦 Environment: ${env.NODE_ENV}`);
      });
    }

    tryStart(DEFAULT_PORT);

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
