import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import {
  createNotificationModel,
  createNotificationService,
  messages,
  publicNotification,
  userIdFromOwner,
} from '../src/notifications.js';

test('notification model has correct collection, schema and indexes', () => {
  const odm = new mongoose.Mongoose();
  const model = createNotificationModel(odm);
  assert.equal(model.collection.name, 'notifications');
  assert.equal(model.schema.options.autoCreate, false);
  assert.equal(model.schema.options.autoIndex, false);
  assert.ok(model.schema.paths.userId);
  assert.ok(model.schema.paths.type);
  assert.ok(model.schema.paths.title);
  assert.ok(model.schema.paths.message);
  assert.ok(model.schema.paths.read);
});

test('messages format appropriate copy for signup, login, workout, exercise, and sessions', () => {
  const welcome = messages.welcome();
  assert.equal(welcome.type, 'welcome');
  assert.ok(welcome.title.includes('Welcome to FitTrack'));
  assert.ok(welcome.message.includes('workout library'));

  const welcomeBack = messages.welcomeBack();
  assert.equal(welcomeBack.type, 'welcome_back');
  assert.equal(welcomeBack.title, 'Welcome back');
  assert.ok(welcomeBack.message.includes('see you again'));

  const workoutNotice = messages.newWorkout({
    _id: '507f1f77bcf86cd799439011',
    title: 'HIIT Burn',
    category: 'Cardio',
    difficulty: 'Intermediate',
    duration: 25,
  });
  assert.equal(workoutNotice.type, 'new_workout');
  assert.equal(workoutNotice.workoutId, '507f1f77bcf86cd799439011');
  assert.ok(workoutNotice.title.includes('New workout'));
  assert.ok(workoutNotice.message.includes('HIIT Burn'));
  assert.ok(workoutNotice.message.includes('Cardio'));

  const exerciseNotice = messages.newExercise(
    { id: 'ex-1', name: 'Burpees' },
    'HIIT Burn',
    '507f1f77bcf86cd799439011',
  );
  assert.equal(exerciseNotice.type, 'new_exercise');
  assert.equal(exerciseNotice.workoutId, '507f1f77bcf86cd799439011');
  assert.ok(exerciseNotice.title.includes('New exercise'));
  assert.ok(exerciseNotice.message.includes('Burpees'));
  assert.ok(exerciseNotice.message.includes('HIIT Burn'));

  const completed = messages.sessionFinished({
    id: 'sess-1',
    status: 'completed',
    completedSets: 4,
    skippedSets: 0,
    snapshot: { name: 'Full Body Sculpt' },
  });
  assert.equal(completed.type, 'workout_completed');
  assert.equal(completed.title, 'Workout completed');
  assert.ok(completed.message.includes('Full Body Sculpt'));
  assert.ok(completed.message.includes('4 sets completed'));

  const ended = messages.sessionFinished({
    id: 'sess-2',
    status: 'ended-early',
    completedSets: 2,
    skippedSets: 1,
    snapshot: { name: 'Full Body Sculpt' },
  });
  assert.equal(ended.type, 'workout_ended');
  assert.equal(ended.title, 'Workout ended early');
  assert.ok(ended.message.includes('ended'));
});

test('notification service creates welcome on signup and welcome_back on subsequent login', async () => {
  const store = [];
  const fakeModel = {
    async create(doc) {
      const saved = { _id: new mongoose.Types.ObjectId(), createdAt: new Date(), read: false, ...doc };
      store.push(saved);
      return saved;
    },
    async find() {
      return {
        sort() {
          return {
            skip() { return { select() { return { lean: async () => [] }; } }; },
            limit() { return { lean() { return { exec: async () => [...store] }; } }; },
          };
        },
      };
    },
    findOne(query) {
      const match = store.find(s => {
        if (s.userId !== query.userId) return false;
        if (query.type?.$in && !query.type.$in.includes(s.type)) return false;
        if (query.type && typeof query.type === 'string' && s.type !== query.type) return false;
        if (query.createdAt?.$gte && s.createdAt < query.createdAt.$gte) return false;
        return true;
      }) ?? null;
      return { lean: async () => match };
    },
    async deleteMany() { return { deletedCount: 0 }; },
  };

  const userId = '507f1f77bcf86cd799439099';
  const service = createNotificationService({
    Notification: fakeModel,
    getUser: () => ({ find: () => ({ select: () => ({ lean: () => ({ cursor: async function* () {} }) }) }) }),
    logger: { warn: () => {} },
  });

  // 1. Signup creates welcome
  await service.onAccountEvent({ type: 'signup', userId });
  assert.equal(store.length, 1);
  assert.equal(store[0].type, 'welcome');
  assert.equal(store[0].title, 'Welcome to FitTrack');

  // 2. Immediate login within 60s is debounced
  await service.onAccountEvent({ type: 'login', userId });
  assert.equal(store.length, 1);

  // 3. Login later (> 60s simulated by backdating existing notice)
  store[0].createdAt = new Date(Date.now() - 70000);
  await service.onAccountEvent({ type: 'login', userId });
  assert.equal(store.length, 2);
  assert.equal(store[1].type, 'welcome_back');
  assert.equal(store[1].title, 'Welcome back');
});

test('notifications HTTP routes enforce auth and support list, mark read, and delete', async t => {
  const userId = '507f1f77bcf86cd799439099';
  const notices = [
    { _id: new mongoose.Types.ObjectId(), userId, type: 'welcome', title: 'Welcome', message: 'Hello', read: false, createdAt: new Date() },
  ];

  const fakeService = {
    async list(uid) {
      return uid === userId ? notices.map(publicNotification) : [];
    },
    async markRead(uid, id) {
      const target = notices.find(n => n.userId === uid && String(n._id) === id);
      if (target) target.read = true;
    },
    async markAllRead(uid) {
      notices.filter(n => n.userId === uid).forEach(n => { n.read = true; });
    },
    async remove(uid, id) {
      const index = notices.findIndex(n => n.userId === uid && String(n._id) === id);
      if (index !== -1) notices.splice(index, 1);
    },
  };

  let authedOwner = `user:${userId}`;
  const mockIdentity = (req, _res, next) => {
    if (!authedOwner) return _res.status(401).json({ error: 'Unauthorized' });
    req.ownerId = authedOwner;
    next();
  };

  const app = createApp({
    database: { ping: async () => true },
    corsOrigins: [],
    config: {},
    notifications: fakeService,
    identity: mockIdentity,
  });

  const server = createServer(app).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));

  const base = `http://127.0.0.1:${server.address().port}/api/notifications`;
  const get = (url) => fetch(url);
  const patch = (url) => fetch(url, { method: 'PATCH' });
  const del = (url) => fetch(url, { method: 'DELETE' });

  // 1. Authenticated list
  const listRes = await (await get(base)).json();
  assert.equal(listRes.notifications.length, 1);
  assert.equal(listRes.unread, 1);
  assert.equal(listRes.notifications[0].title, 'Welcome');

  // 2. Mark one read
  const notifId = listRes.notifications[0].id;
  const readRes = await patch(`${base}/${notifId}/read`);
  assert.equal(readRes.status, 204);
  const updatedList = await (await get(base)).json();
  assert.equal(updatedList.unread, 0);
  assert.equal(updatedList.notifications[0].read, true);

  // 3. Mark all read
  assert.equal((await patch(`${base}/read-all`)).status, 204);

  // 4. Delete notification
  assert.equal((await del(`${base}/${notifId}`)).status, 204);
  const emptyList = await (await get(base)).json();
  assert.equal(emptyList.notifications.length, 0);

  // 5. Unauthenticated fails with 401
  authedOwner = null;
  assert.equal((await get(base)).status, 401);
});
