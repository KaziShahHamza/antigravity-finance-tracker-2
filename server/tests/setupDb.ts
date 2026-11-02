// server/tests/setupDb.ts

// Test helper to manage MongoDB test connections and clean collection state for integration tests.

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';

/**
 * Connects to the isolated test database before running tests.
 * Falls back safely if the database is not accessible.
 */
export const setupTestDb = async (): Promise<boolean> => {
  try {
    const testUri = env.MONGODB_TEST_URI;
    await connectDatabase(testUri);
    return true;
  } catch (error) {
    console.warn('MongoDB test connection could not be established:', (error as Error).message);
    return false;
  }
};

/**
 * Drops all collections in the test database to ensure clean, isolated test runs.
 */
export const clearTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

/**
 * Closes the MongoDB test connection and cleans up resources.
 */
export const teardownTestDb = async (): Promise<void> => {
  await disconnectDatabase();
};
