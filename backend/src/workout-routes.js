// Read API adapted from the leader's workoutController/workoutRoutes at da9ba24.
import { Router } from 'express';
import { RequestError } from './session-routes.js';
import { publicWorkout } from './workout-repository.js';
import { validateAdminWorkout } from '../../shared/admin-workout-validation.ts';
import { developmentAdminIdentity } from './identity.js';

export function workoutFilter(query) {
  const result = {};
  for (const key of ['category', 'difficulty', 'equipment', 'duration', 'lowImpact', 'search']) {
    const value = query[key];
    if (value === undefined || value === '') continue;
    if (typeof value !== 'string' || value.length > 200) throw new RequestError(400, `Invalid ${key} filter.`);
    if (key === 'duration') {
      if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 1440) throw new RequestError(400, 'Invalid duration filter.');
      result.duration = Number(value);
    } else if (key === 'lowImpact') {
      if (!['true', 'false'].includes(value)) throw new RequestError(400, 'Invalid lowImpact filter.');
      if (value === 'true') result.lowImpact = true;
    } else if (key === 'search') {
      // Treat user input as literal text, not an executable regular expression.
      const literal = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result.$or = ['title', 'category', 'description'].map(field => ({ [field]: { $regex: literal, $options: 'i' } }));
    } else result[key] = value;
  }
  return result;
}

export function workoutRoutes({ workoutRepository: repo, adminIdentity, config, notifications }) {
  const routes = Router();
  const authorize = adminIdentity ?? developmentAdminIdentity(config);
  const admin = () => {
    if (!repo?.admin) throw new RequestError(503, 'Workout management storage is unavailable.');
    return repo.admin;
  };
  const id = req => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new RequestError(400, 'Invalid workout ID.');
    return req.params.id;
  };
  const present = value => {
    if (!value) throw new RequestError(404, 'Workout not found.');
    return { ...publicWorkout(value), active: value.active === true };
  };
  const input = (body, partial = false) => {
    try { return validateAdminWorkout(body, partial); }
    catch (error) { throw new RequestError(400, error.message); }
  };
  // Adapted from admin_workout_management 8cebec0; mutations and inactive reads require admin access.
  routes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  routes.get(['/admin', '/admin/all'], authorize, async (_req, res) => {
    const data = (await admin().list()).map(present);
    res.json({ success: true, count: data.length, data });
  });
  routes.get('/admin/:id', authorize, async (req, res) => res.json({ success: true, data: present(await admin().get(id(req))) }));
  routes.post('/', authorize, async (req, res) => {
    const created = present(await admin().create(input(req.body)));
    // Only workouts members can actually see are announced.
    if (created.active) void notifications?.workoutAdded(created);
    res.status(201).json({ success: true, data: created });
  });
  routes.put('/:id', authorize, async (req, res) => {
    const key = id(req);
    const before = await admin().get(key);
    const updated = present(await admin().update(key, input(req.body, true)));
    // A hidden workout that has just been published is new to members.
    if (before && before.active !== true && updated.active) void notifications?.workoutAdded(updated);
    res.json({ success: true, data: updated });
  });
  routes.delete('/:id', authorize, async (req, res) => {
    present(await admin().remove(id(req)));
    // Guidance and immutable session snapshots are intentionally retained.
    res.json({ success: true, message: 'Workout deleted successfully.' });
  });
  routes.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!repo) throw new RequestError(503, 'Workout storage is unavailable.');
    next();
  });
  routes.get('/', async (req, res) => {
    const data = (await repo.list(workoutFilter(req.query))).map(publicWorkout);
    res.json({ success: true, count: data.length, data });
  });
  routes.get('/:id', async (req, res) => {
    const value = await repo.get(req.params.id);
    if (!value) throw new RequestError(404, 'Workout not found.');
    res.json({ success: true, data: publicWorkout(value) });
  });
  return routes;
}
