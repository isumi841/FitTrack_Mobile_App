import { Router } from 'express';
import { createHash } from 'node:crypto';
import { resolveWorkout } from './catalog.js';
import { createDevelopmentAdminAuth } from './admin-auth.js';
import { RequestError } from './session-routes.js';
import { publicExercise } from './exercise-repository.js';
import { exerciseVideo, VIDEO_URL_ERROR } from '../../shared/exercise-validation.ts';

const fail = (status, message) => { throw new RequestError(status, message); };
const hash = value => createHash('sha256').update(value).digest('hex');
const revisionValid = value => Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;
const fields = ['name', 'target', 'subtitle', 'cue', 'steps', 'video', 'position'];
function body(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) fail(400, 'Invalid exercise fields.');
}
function text(value, name, max, required = true) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, `Invalid ${name}.`);
  return value.trim();
}
function validate(input, partial = false) {
  const result = {};
  for (const [key, max, required] of [['name', 100, true], ['target', 100, true], ['subtitle', 200, false], ['cue', 300, false]]) {
    if (!partial || key in input) result[key] = text(input[key] ?? (!required && !partial ? '' : undefined), key, max, required);
  }
  if (!partial || 'steps' in input) {
    if (!Array.isArray(input.steps) || input.steps.length < 1 || input.steps.length > 20) fail(400, 'Provide 1–20 instruction steps.');
    result.steps = input.steps.map(step => text(step, 'instruction step', 500));
  }
  if (!partial || 'position' in input) {
    if (!Number.isSafeInteger(input.position) || input.position < 1 || input.position > 9999) fail(400, 'Exercise order must be between 1 and 9999.');
    result.position = input.position;
  }
  if (!partial || 'video' in input) {
    result.video = null;
    if (input.video !== null && input.video !== undefined && input.video !== '') {
      const video = text(input.video, 'video URL', 2048);
      const parsed = exerciseVideo(video);
      if (!parsed) fail(400, VIDEO_URL_ERROR);
      result.video = parsed.url;
    }
  }
  return result;
}
export function exerciseRoutes({ exerciseRepository: repo, workoutRepository, config, adminIdentity, notifications }) {
  const routes = Router();
  const auth = createDevelopmentAdminAuth(config);
  routes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const storage = () => { if (!repo) fail(503, 'Exercise storage is unavailable.'); };
  const workout = async id => { const value = await resolveWorkout(id, workoutRepository); if (!value) fail(404, 'Workout not found.'); return value; };
  routes.get('/workouts/:workoutId/exercises', async (req, res) => {
    const selected = await workout(req.params.workoutId);
    if (selected.sample) return res.json({ workout: { id: selected.id, name: selected.name, exercises: selected.exercises } });
    storage();
    res.json({ workout: { id: selected.id, name: selected.name, exercises: (await repo.list(selected.id)).map(publicExercise) } });
  });
  routes.post('/admin/login', auth.login);
  routes.use('/admin', adminIdentity ?? auth.authenticate);
  routes.post('/admin/logout', auth.logout);
  routes.use('/admin', (_req, _res, next) => { storage(); next(); });
  routes.get('/admin/access', (_req, res) => res.json({ admin: true }));
  routes.get('/admin/exercises', async (req, res) => {
    if (typeof req.query.workoutId !== 'string') fail(400, 'Select a workout.');
    const selected = await workout(req.query.workoutId);
    res.json({ exercises: (await repo.list(selected.id)).map(publicExercise) });
  });
  routes.post('/admin/exercises', async (req, res) => {
    body(req.body, [...fields, 'workoutId', 'requestId']);
    const { workoutId, requestId } = req.body;
    if (typeof workoutId !== 'string' || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,100}$/.test(requestId)) fail(400, 'A workout and valid requestId are required.');
    const selected = await workout(workoutId);
    if (selected.sample) fail(400, 'Sample routines cannot be edited. Select a leader workout.');
    const values = validate(req.body);
    const id = hash(`exercise:${req.adminId}:${requestId}`);
    const fingerprint = hash(JSON.stringify([selected.id, values]));
    const existing = await repo.get(id);
    const now = Date.now();
    const saved = existing ?? await repo.create({ id, workoutId: selected.id, ...values, revision: 0, createdAt: now, updatedAt: now, createdBy: req.adminId, createFingerprint: fingerprint });
    if (saved.deletedAt !== undefined || saved.createFingerprint !== fingerprint) fail(409, 'This create request has already been used. Reload before creating another exercise.');
    if (!existing) void notifications?.exerciseAdded({ exercise: publicExercise(saved), workoutName: selected.name, workoutId: selected.id });
    res.status(existing ? 200 : 201).json({ exercise: publicExercise(saved) });
  });
  routes.param('exerciseId', (_req, _res, next, id) => {
    if (!/^[a-f0-9]{64}$/.test(id)) fail(400, 'Invalid exercise ID.');
    next();
  });
  async function existing(id) {
    const value = await repo.get(id);
    if (!value || value.deletedAt !== undefined) fail(404, 'Exercise not found.');
    return value;
  }
  routes.get('/admin/exercises/:exerciseId', async (req, res) => res.json({ exercise: publicExercise(await existing(req.params.exerciseId)) }));
  routes.patch('/admin/exercises/:exerciseId', async (req, res) => {
    body(req.body, [...fields, 'revision']);
    if (!revisionValid(req.body.revision) || !fields.some(field => field in req.body)) fail(400, 'Provide changes and the current revision.');
    const values = validate(req.body, true);
    await existing(req.params.exerciseId);
    const saved = await repo.update(req.params.exerciseId, req.body.revision, { ...values, updatedAt: Date.now() });
    if (!saved) fail(409, 'Exercise changed. Reload it before saving.');
    res.json({ exercise: publicExercise(saved) });
  });
  routes.delete('/admin/exercises/:exerciseId', async (req, res) => {
    body(req.body, ['revision']);
    if (!revisionValid(req.body.revision)) fail(400, 'Provide the current revision.');
    const record = await repo.get(req.params.exerciseId);
    if (!record) fail(404, 'Exercise not found.');
    if (record.deletedAt !== undefined && record.revision === req.body.revision + 1) return res.status(204).end();
    if (!await repo.delete(req.params.exerciseId, req.body.revision, Date.now())) fail(409, 'Exercise changed. Reload it before deleting.');
    res.status(204).end();
  });
  return routes;
}
