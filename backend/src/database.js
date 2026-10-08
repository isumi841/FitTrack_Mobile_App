import mongoose from 'mongoose';
import { createSessionRepository } from './session-repository.js';
import { createExerciseRepository } from './exercise-repository.js';
import { createWorkoutRepository } from './workout-repository.js';
import { createMemberAuth } from './member-auth.js';
import { createMember4, createMember4Models } from './member4/index.js';
import { createNotifications } from './notifications.js';

export function createDatabase({ odm = new mongoose.Mongoose(), logger = console } = {}) {
  let closing = false;
  odm.set('bufferCommands', false);
  odm.connection.on('error', () => {
    if (!closing) logger.error('MongoDB connection error. Check database access and network connectivity.');
  });
  odm.connection.on('disconnected', () => {
    if (!closing) logger.warn('MongoDB is disconnected. Health checks will report unavailable.');
  });

  return {
    createMemberAuth: (config, options) => createMemberAuth(odm, config, options),
    createNotifications: () => createNotifications(odm),
    createMember4: () => createMember4({ models: createMember4Models(odm) }),
    createSessionRepository: () => createSessionRepository(odm),
    createExerciseRepository: () => createExerciseRepository(odm),
    createWorkoutRepository: databaseName => createWorkoutRepository(odm, databaseName),
    async connect(uri) {
      closing = false;
      await odm.connect(uri, {
        autoCreate: false,
        autoIndex: false,
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      });
    },
    async ping() {
      if (closing || odm.connection.readyState !== 1 || !odm.connection.db) return false;
      const result = await odm.connection.db.command({ ping: 1 }, { timeoutMS: 3000 });
      return result.ok === 1;
    },
    async disconnect() {
      closing = true;
      await odm.disconnect();
    },
  };
}
