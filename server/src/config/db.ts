// server/src/config/db.ts

// MongoDB connection manager using Mongoose with reconnect listeners and graceful shutdown hooks.

import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Connects to MongoDB with connection pooling and lifecycle event listeners.
 * Safe to call multiple times (idempotent).
 */
export const connectDatabase = async (uri: string = env.MONGODB_URI): Promise<typeof mongoose> => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    mongoose.set('strictQuery', true);

    // Event listeners for connection monitoring
    mongoose.connection.on('connected', () => {
      isConnected = true;
      if (env.NODE_ENV !== 'test') {
        console.log('MongoDB connection established successfully.');
      }
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      if (env.NODE_ENV !== 'test') {
        console.warn('MongoDB connection lost. Attempting reconnection...');
      }
    });

    const instance = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    return instance;
  } catch (error) {
    isConnected = false;
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Disconnects from MongoDB cleanly. Useful for graceful shutdown and test cleanup.
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
