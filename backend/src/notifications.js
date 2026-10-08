import { Router } from 'express';

// Stored in the connection's default database (the one named in MONGODB_URI, e.g. /test).
export const NOTIFICATION_COLLECTION = 'notifications';
const MAX_PER_USER = 100;
const USER_OWNER = /^user:([a-f\d]{24})$/i;
const OBJECT_ID = /^[a-f\d]{24}$/i;
const clip = (value, max) => String(value ?? '').trim().slice(0, max);

export function createNotificationModel(odm) {
  const schema = new odm.Schema({
    userId: { type: odm.Schema.Types.ObjectId, required: true },
    type: { type: String, required: true, enum: ['welcome', 'welcome_back', 'new_workout', 'new_exercise', 'workout_completed', 'workout_ended'] },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    // Prevents repeated deliveries of the same event (retries, double submits).
    dedupeKey: { type: String, maxlength: 200 },
    workoutId: { type: String, maxlength: 64 },
    sessionId: { type: String, maxlength: 64 },
  }, { collection: NOTIFICATION_COLLECTION, timestamps: { createdAt: true, updatedAt: false }, autoCreate: false, autoIndex: false, bufferCommands: false });
  schema.index({ userId: 1, createdAt: -1 });
  schema.index({ userId: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
  return odm.models.Notification ?? odm.model('Notification', schema, NOTIFICATION_COLLECTION);
}

// All user-facing wording lives here so every message stays consistent and appropriate.
export const messages = {
  welcome: () => ({
    type: 'welcome', dedupeKey: 'welcome',
    title: 'Welcome to FitTrack',
    message: 'Your account is ready. Browse the workout library, pick a workout that suits you and start your first session.',
  }),
  welcomeBack: () => ({
    type: 'welcome_back',
    title: 'Welcome back',
    message: 'Good to see you again. Pick up where you left off and keep your training going.',
  }),
  newWorkout: workout => ({
    type: 'new_workout', dedupeKey: `workout:${workout._id}`, workoutId: String(workout._id),
    title: 'New workout available',
    message: `"${clip(workout.title, 80)}" (${clip(workout.category, 40)}, ${clip(workout.difficulty, 40)}, ${Number(workout.duration) || 0} min) was added to the workout library. Take a look and give it a try.`,
  }),
  newExercise: (exercise, workoutName, workoutId) => ({
    type: 'new_exercise', dedupeKey: `exercise:${exercise.id}`, workoutId: String(workoutId),
    title: 'New exercise added',
    message: `"${clip(exercise.name, 80)}" was added to the "${clip(workoutName, 80)}" workout. Open the workout to see the updated routine.`,
  }),
  sessionFinished: session => {
    const name = clip(session.snapshot?.name ?? session.snapshot?.title ?? 'your workout', 80);
    const done = Number(session.completedSets) || 0;
    const skipped = Number(session.skippedSets) || 0;
    const sets = `${done} ${done === 1 ? 'set' : 'sets'} completed`;
    const base = { dedupeKey: `session:${session.id}`, sessionId: String(session.id), workoutId: session.workoutId ? String(session.workoutId) : undefined };
    if (session.status === 'completed') {
      return { ...base, type: 'workout_completed', title: 'Workout completed',
        message: `Great job! You finished "${name}" with ${sets}${skipped ? ` and ${skipped} skipped` : ''}. Review your summary or add a note.` };
    }
    return { ...base, type: 'workout_ended',
      title: 'Workout ended early',
      message: `You ended "${name}" early with ${sets}. Every session counts, so come back whenever you're ready.` };
  },
};

export function userIdFromOwner(ownerId) {
  return USER_OWNER.exec(ownerId ?? '')?.[1];
}

export function publicNotification(record) {
  return {
    id: String(record._id), type: record.type, title: record.title, message: record.message,
    read: record.read === true, createdAt: new Date(record.createdAt).getTime(),
    ...(record.workoutId ? { workoutId: record.workoutId } : {}),
    ...(record.sessionId ? { sessionId: record.sessionId } : {}),
  };
}

export function createNotificationService({ Notification, getUser, logger = console }) {
  // Notification problems must never break sign-in, workouts or sessions.
  const safe = work => Promise.resolve().then(work).catch(() => { logger.warn?.('A notification could not be saved.'); });
  const duplicate = error => error?.code === 11000 || error?.writeErrors?.every?.(item => item.code === 11000);

  async function trim(userId) {
    const stale = await Notification.find({ userId }).sort({ createdAt: -1, _id: -1 }).skip(MAX_PER_USER).select('_id').lean();
    if (stale.length) await Notification.deleteMany({ _id: { $in: stale.map(item => item._id) } });
  }

  async function create(userId, notice) {
    try { await Notification.create({ ...notice, userId }); }
    catch (error) { if (!duplicate(error)) throw error; return; }
    await trim(userId);
  }

  async function broadcast(notice) {
    const User = getUser();
    const filter = { $or: [{ role: { $exists: false } }, { role: null }, { role: 'user' }] };
    let batch = [];
    const flush = async () => {
      if (!batch.length) return;
      const documents = batch.map(_id => ({ ...notice, userId: _id }));
      batch = [];
      try { await Notification.insertMany(documents, { ordered: false }); }
      catch (error) { if (!duplicate(error)) throw error; }
    };
    for await (const user of User.find(filter).select('_id').lean().cursor()) {
      batch.push(user._id);
      if (batch.length >= 500) await flush();
    }
    await flush();
  }

  return {
    // Auth hook: signup => welcome; login => welcome back.
    onAccountEvent: ({ type, userId }) => safe(async () => {
      if (!OBJECT_ID.test(userId ?? '')) return;
      if (type === 'signup') return create(userId, messages.welcome());
      if (type === 'login') {
        const recentNotice = await Notification.findOne({
          userId,
          type: { $in: ['welcome', 'welcome_back'] },
          createdAt: { $gte: new Date(Date.now() - 60000) },
        }).lean();
        if (recentNotice) return;
        return create(userId, messages.welcomeBack());
      }
    }),
    workoutAdded: workout => safe(() => broadcast(messages.newWorkout(workout))),
    exerciseAdded: ({ exercise, workoutName, workoutId }) => safe(() => broadcast(messages.newExercise(exercise, workoutName, workoutId))),
    sessionFinished: (ownerId, session) => safe(async () => {
      const userId = userIdFromOwner(ownerId);
      if (userId) await create(userId, messages.sessionFinished(session));
    }),
    sessionRemoved: (ownerId, sessionId) => safe(async () => {
      const userId = userIdFromOwner(ownerId);
      if (userId) await Notification.deleteMany({ userId, sessionId: String(sessionId) });
    }),
    list: async userId => {
      const records = await Notification.find({ userId }).sort({ createdAt: -1, _id: -1 }).limit(MAX_PER_USER).lean().exec();
      return records.map(publicNotification);
    },
    markRead: (userId, id) => Notification.updateOne({ _id: id, userId, read: false }, { $set: { read: true, readAt: new Date() } }).exec(),
    markAllRead: userId => Notification.updateMany({ userId, read: false }, { $set: { read: true, readAt: new Date() } }).exec(),
    remove: (userId, id) => Notification.deleteOne({ _id: id, userId }).exec(),
    initialize: () => Notification.createIndexes(),
  };
}

export function notificationRoutes({ notifications, identity, RequestError }) {
  const routes = Router();
  routes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  routes.use(identity);
  const owner = req => {
    const userId = userIdFromOwner(req.ownerId);
    if (!userId) throw new RequestError(403, 'Notifications are available to member accounts.');
    return userId;
  };
  const target = req => {
    if (!OBJECT_ID.test(req.params.id)) throw new RequestError(400, 'Invalid notification ID.');
    return req.params.id;
  };
  routes.get('/', async (req, res) => {
    const data = await notifications.list(owner(req));
    res.json({ notifications: data, unread: data.filter(item => !item.read).length });
  });
  routes.patch('/read-all', async (req, res) => { await notifications.markAllRead(owner(req)); res.status(204).end(); });
  routes.patch('/:id/read', async (req, res) => { await notifications.markRead(owner(req), target(req)); res.status(204).end(); });
  routes.delete('/:id', async (req, res) => { await notifications.remove(owner(req), target(req)); res.status(204).end(); });
  return routes;
}

// Registered by the database adapter once the shared mongoose instance exists.
export function createNotifications(odm) {
  const Notification = createNotificationModel(odm);
  return createNotificationService({ Notification, getUser: () => odm.models.User });
}
