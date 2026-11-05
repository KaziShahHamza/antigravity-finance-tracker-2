// server/src/server.ts

// Standalone HTTP server bootstrap connecting to database and listening on configured port.

import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    await connectDatabase();
    const server = app.listen(env.PORT, () => {
      console.log(`Finance Tracker server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('Server HTTP listener closed.');
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const server = startServer();
export default server;
