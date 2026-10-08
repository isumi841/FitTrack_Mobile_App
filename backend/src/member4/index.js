// Adapted from member4_progress_motivation 61893fb; uses the shared ODM and JWT identity.
import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { goalSchema } from './models/Goal.js';
import { userProfileSchema } from './models/UserProfile.js';
import { workoutReminderSchema } from './models/WorkoutReminder.js';
import { goalControllers } from './goal-controllers.js';
import { profileControllers } from './profile-controllers.js';
import { reminderControllers } from './reminder-controllers.js';
import { avatarUpload } from './avatar-upload.js';

export function createMember4Models(odm) {
  const models = {};
  for (const [name, schema, collection] of [['Goal', goalSchema, 'goals'], ['UserProfile', userProfileSchema, 'userprofiles'], ['WorkoutReminder', workoutReminderSchema, 'workoutreminders']]) {
    models[name] = odm.models[name] ?? odm.model(name, schema.clone(), collection);
  }
  return models;
}

export function createMember4({ models, avatar = cloudinary, env = process.env }) {
  const ready = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every(key => env[key]?.trim());
  if (ready) avatar.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!/^user:[a-f\d]{24}$/i.test(req.ownerId ?? '')) return res.status(401).json({ error: 'Member login required.' });
    req.user = { id: req.ownerId.slice(5) };
    if (Object.values(req.query).some(value => typeof value !== 'string' || value.length > 200)) return res.status(400).json({ message: 'Invalid filter.' });
    if (['POST', 'PATCH'].includes(req.method) && !req.path.endsWith('/avatar')) {
      if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') return res.status(400).json({ message: 'A JSON object is required.' });
      if (Object.keys(req.body).some(key => ['userId', '_id', 'avatarPublicId', '__v'].includes(key) || key.startsWith('$'))) return res.status(400).json({ message: 'Protected fields cannot be changed.' });
      const strings = ['fullName', 'username', 'email', 'phone', 'gender', 'bio', 'avatarUrl', 'goalType', 'title', 'duration', 'status', 'time', 'timezone', 'label'];
      const numbers = ['target', 'current'];
      const booleans = ['enabled', 'soundEnabled', 'vibrationEnabled', 'motivationalMessage'];
      if (strings.some(key => key in req.body && typeof req.body[key] !== 'string') || numbers.some(key => key in req.body && (typeof req.body[key] !== 'number' || !Number.isFinite(req.body[key]))) || booleans.some(key => key in req.body && typeof req.body[key] !== 'boolean')) return res.status(400).json({ message: 'Invalid field value.' });
      if (['focus', 'days'].some(key => key in req.body && (!Array.isArray(req.body[key]) || req.body[key].length > 10 || req.body[key].some(value => typeof value !== 'string' || value.length > 60)))) return res.status(400).json({ message: 'Invalid selection.' });
      if (req.body.dateOfBirth && (typeof req.body.dateOfBirth !== 'string' || !Number.isFinite(Date.parse(req.body.dateOfBirth)) || Date.parse(req.body.dateOfBirth) > Date.now())) return res.status(400).json({ message: 'Enter a valid date of birth.' });
      if (req.body.avatarUrl && !/^https:\/\//.test(req.body.avatarUrl)) return res.status(400).json({ message: 'A profile image must use HTTPS.' });
    }
    next();
  });
  const goals = goalControllers(models);
  const profile = profileControllers({ ...models, cloudinary: avatar });
  const reminders = reminderControllers(models);
  router.route('/goals').get(goals.getGoals).post(goals.createGoal);
  router.route('/goals/:id').get(goals.getGoalById).patch(goals.updateGoal).delete(goals.deleteGoal);
  router.route('/profile').get(profile.getProfile).post(profile.createProfile).patch(profile.updateProfile).delete(profile.deleteProfile);
  router.post('/profile/avatar', (_req, res, next) => ready ? next() : res.status(503).json({ message: 'Profile photo uploads are not configured yet.' }), avatarUpload, profile.uploadProfileAvatar);
  router.delete('/profile/avatar', profile.deleteProfileAvatar);
  router.route('/reminders').get(reminders.getReminders).post(reminders.createReminder);
  router.route('/reminders/:id').get(reminders.getReminderById).patch(reminders.updateReminder).delete(reminders.deleteReminder);
  // Workout history uses /api/member3/workout-sessions. Do not register a second Workout model.
  return { router, initialize: async () => { for (const model of Object.values(models)) await model.createIndexes(); } };
}
