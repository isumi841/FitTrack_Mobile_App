import express from 'express';
import cors from 'cors';
import { member3Routes, RequestError } from './session-routes.js';
import { exerciseRoutes } from './exercise-routes.js';
import { workoutRoutes } from './workout-routes.js';
import { notificationRoutes } from './notifications.js';

export function createApp({ database, corsOrigins, repository, exerciseRepository, workoutRepository, member4, notifications, auth, config, identity, adminIdentity, isStopping = () => false }) {
  const app = express();
  const allowedOrigins = new Set(corsOrigins);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    next();
  });
  // Native apps and PowerShell may have no Origin header; browser origins are explicit.
  app.use(cors({ origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: false }));
  app.use(express.json({ limit: '16kb', strict: true }));

  app.get('/api/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!isStopping() && await database.ping()) {
        return res.status(200).json({ status: 'ok', database: 'available' });
      }
    } catch {
      // Driver errors may contain connection details. Never return or log them here.
    }
    return res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  });

  if (auth) app.use('/api/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth.rateLimiter, auth.router);
  if (auth?.usersRouter) app.use('/api/users', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth.usersRouter);
  if (auth && member4) {
    if (auth.adminIdentity) {
      app.get('/api/admin/overview', auth.adminIdentity, async (_req, res) => {
        try {
          let usersCount = 0;
          let recentUsers = [];
          if (auth.models?.User) {
            usersCount = await auth.models.User.countDocuments();
            recentUsers = await auth.models.User.find({}).select('displayName email createdAt').sort({ createdAt: -1 }).limit(10).lean();
          }
          let goalsCount = 0;
          let activeGoalsCount = 0;
          let recentGoals = [];
          if (member4.models?.Goal) {
            goalsCount = await member4.models.Goal.countDocuments();
            activeGoalsCount = await member4.models.Goal.countDocuments({ status: { $ne: 'completed' } });
            recentGoals = await member4.models.Goal.find({}).sort({ updatedAt: -1 }).limit(10).lean();
          }
          let exercisesCount = 0;
          let recentExercises = [];
          if (exerciseRepository?.count) {
            exercisesCount = await exerciseRepository.count();
          }
          if (exerciseRepository?.listAll) {
            recentExercises = (await exerciseRepository.listAll()).slice(0, 5);
          }
          res.json({
            success: true,
            usersCount,
            exercisesCount,
            goalsCount,
            activeGoalsCount,
            recentUsers,
            recentGoals,
            recentExercises,
          });
        } catch {
          res.status(500).json({ success: false, message: 'Failed to load system overview.' });
        }
      });
      app.get('/api/admin/exercises-count', auth.adminIdentity, async (_req, res) => {
        try {
          const count = exerciseRepository?.count ? await exerciseRepository.count() : 0;
          res.json({ success: true, count });
        } catch {
          res.status(500).json({ success: false, message: 'Failed to count exercises.' });
        }
      });
      app.get('/api/admin/goals', auth.adminIdentity, async (_req, res) => {
        try {
          const goals = member4.models?.Goal ? await member4.models.Goal.find({}).sort({ createdAt: -1 }).lean() : [];
          res.json({ success: true, goals });
        } catch {
          res.status(500).json({ success: false, message: 'Failed to load goals.' });
        }
      });
      app.post('/api/admin/goals', auth.adminIdentity, async (req, res) => {
        try {
          const { userId, title, goalType = 'workoutMinutes', target, current = 0, duration = 'Weekly', status = 'active' } = req.body || {};
          if (!title || !target) return res.status(400).json({ success: false, message: 'Title and target are required.' });
          const goal = await member4.models.Goal.create({
            userId,
            title: String(title).trim(),
            goalType,
            target: Number(target),
            current: Number(current),
            duration,
            status: Number(current) >= Number(target) ? 'completed' : status,
          });
          res.status(201).json({ success: true, goal });
        } catch (err) {
          res.status(400).json({ success: false, message: err?.message || 'Failed to create goal.' });
        }
      });
      app.delete('/api/admin/goals/:id', auth.adminIdentity, async (req, res) => {
        try {
          await member4.models.Goal.findByIdAndDelete(req.params.id);
          res.json({ success: true, message: 'Goal deleted.' });
        } catch {
          res.status(500).json({ success: false, message: 'Failed to delete goal.' });
        }
      });
    }
    app.use('/api/member4', auth.identity, member4.router);
  }
  const routeConfig = auth ? { ...config, devAuthEnabled: false, adminDevAuthEnabled: false } : config;
  const notificationRouter = notifications ? notificationRoutes({ notifications, identity: auth?.identity ?? identity, RequestError }) : null;
  if (notificationRouter) {
    app.use('/api/notifications', notificationRouter);
    app.use('/api/member3/notifications', notificationRouter);
  }
  app.use('/api/member2/workouts', workoutRoutes({ workoutRepository, notifications, config: routeConfig, adminIdentity: auth?.adminIdentity ?? adminIdentity }));
  app.use('/api/member3', exerciseRoutes({ exerciseRepository, workoutRepository, notifications, config: routeConfig, adminIdentity: auth?.adminIdentity ?? adminIdentity }));
  app.use('/api/member3', member3Routes({ repository, exerciseRepository, workoutRepository, notifications, config: routeConfig, identity: auth?.identity ?? identity }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof RequestError) return res.status(error.status).json({ error: error.message });
    if (_req.path.startsWith('/api/auth') || _req.path.startsWith('/api/users')) {
      if (error.code === 11000) return res.status(409).json({ success: false, message: 'This account or verification request already exists.' });
      if (error.expose === true && Number.isInteger(error.status) && error.status >= 400 && error.status <= 599) {
        const retryAfterSeconds = Number.isInteger(error.retryAfterSeconds) ? error.retryAfterSeconds : undefined;
        if (retryAfterSeconds) res.set('Retry-After', String(retryAfterSeconds));
        return res.status(error.status).json({ success: false, message: error.message, retryAfterSeconds });
      }
    }
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    return res.status(503).json({ error: 'Request could not be saved or loaded. Retry when the service is available.' });
  });
  return app;
}
