import { Router } from 'express';
import { createHash } from 'node:crypto';
import { workouts, workoutOverviews, findWorkout } from './catalog.js';
import { developmentIdentity } from './identity.js';
import { advance, skipMovement, isFinished } from '../../shared/workout-engine.ts';
import { publicExercise } from './exercise-repository.js';

export class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new RequestError(status, message); };
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const keyValid = key => typeof key === 'string' && /^[a-zA-Z0-9-]{16,100}$/.test(key);
function body(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) fail(400, 'Invalid request fields.');
}
function publicSession(value) {
  const { createFingerprint, lastOperation, ...session } = value;
  return session;
}
const hash = value => createHash('sha256').update(value).digest('hex');
export function member3Routes({ repository, exerciseRepository, config, identity = developmentIdentity(config) }) {
  const routes = Router();
  routes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  routes.get('/workouts', (req, res) => res.json({ workouts: req.query.source === 'leader' ? workoutOverviews : workouts }));
  routes.get('/workouts/:workoutId', async (req, res) => {
    const workout = findWorkout(req.params.workoutId);
    if (!workout) fail(404, 'Workout not found.');
    if (!workout.sample && exerciseRepository) return res.json({ workout: { ...workout, guidanceManaged: true, exercises: (await exerciseRepository.list(workout.id)).map(publicExercise) } });
    res.json({ workout });
  });
  routes.use('/workout-sessions', identity, (_req, _res, next) => {
    if (!repository) fail(503, 'Session storage is unavailable.');
    next();
  });
  routes.post('/workout-sessions', async (req, res) => {
    body(req.body, ['workoutId', 'requestId', 'workSeconds', 'restSeconds']);
    const { workoutId, requestId } = req.body;
    if (typeof workoutId !== 'string' || !keyValid(requestId)) fail(400, 'A workoutId and valid requestId are required.');
    const workout = findWorkout(workoutId);
    if (!workout) fail(404, 'Workout not found.');
    if (workout.sessionReady === false) fail(409, 'Guided sessions are not available for this workout yet.');
    const workSeconds = req.body.workSeconds === undefined ? workout.workSeconds : req.body.workSeconds;
    const restSeconds = req.body.restSeconds === undefined ? workout.restSeconds : req.body.restSeconds;
    if (!integer(workSeconds, 10, 120) || !integer(restSeconds, 5, 120)) fail(400, 'Work must be 10–120 seconds; rest must be 5–120 seconds.');
    const id = hash(`${req.ownerId}:${requestId}`);
    const createFingerprint = hash(JSON.stringify([workoutId, workSeconds, restSeconds]));
    const existing = await repository.get(req.ownerId, id);
    const now = Date.now();
    const session = existing ?? await repository.create({ id, ownerId: req.ownerId, workoutId, createFingerprint,
      snapshot: { ...structuredClone(workout), workSeconds, restSeconds, durationSeconds: workout.exercises.length * workout.rounds * (workSeconds + restSeconds) },
      status: 'running', startedAt: now, updatedAt: now, phase: 0, remainingMs: workSeconds * 1000, elapsedMs: 0,
      workSeconds, restSeconds, completedSets: 0, skippedSets: 0, completedIntervals: [], skippedIntervals: [], note: '', revision: 0 });
    if (session.createFingerprint !== createFingerprint) fail(409, 'This requestId was already used with different settings.');
    res.status(existing ? 200 : 201).json({ session: publicSession(session) });
  });
  routes.get('/workout-sessions', async (req, res) => res.json({ sessions: (await repository.list(req.ownerId)).map(publicSession) }));
  routes.param('sessionId', (req, _res, next, id) => {
    if (!/^[a-f0-9]{64}$/.test(id)) fail(400, 'Invalid session ID.');
    next();
  });
  async function owned(req) {
    const session = await repository.get(req.ownerId, req.params.sessionId);
    if (!session) fail(404, 'Session not found.');
    return session;
  }
  routes.get('/workout-sessions/:sessionId', async (req, res) => res.json({ session: publicSession(await owned(req)) }));
  routes.patch('/workout-sessions/:sessionId', async (req, res) => {
    body(req.body, ['revision', 'operationId', 'action', 'deltaMs', 'note']);
    const { revision, operationId, action, deltaMs = 0, note } = req.body;
    if (!integer(revision, 0, Number.MAX_SAFE_INTEGER - 1) || !keyValid(operationId) || !['checkpoint', 'pause', 'resume', 'skip', 'end', 'note'].includes(action) || !integer(deltaMs, 0, 60000)) fail(400, 'Invalid revision, operation, action or elapsed duration.');
    if ((action === 'note' && (typeof note !== 'string' || note.length > 500 || deltaMs !== 0)) || (action !== 'note' && note !== undefined)) fail(400, 'Invalid note fields.');
    const fingerprint = hash(JSON.stringify([revision, operationId, action, deltaMs, note ?? null]));
    const before = await owned(req);
    if (before.lastOperation?.id === operationId && before.lastOperation.fingerprint === fingerprint) return res.json({ session: publicSession(before) });
    if (before.revision !== revision || before.lastOperation?.id === operationId) fail(409, 'Session changed. Reload the saved session before making further changes.');
    if (action === 'note') {
      if (!isFinished(before)) fail(409, 'Notes may be edited only on finished sessions.');
    } else {
      if (isFinished(before)) fail(409, 'This session is already finished.');
      if (before.status === 'paused' && deltaMs !== 0) fail(400, 'Paused time cannot count as active time.');
      if (action === 'resume' && (before.status !== 'paused' || deltaMs !== 0)) fail(409, 'Only a paused session can resume.');
      if (['checkpoint', 'skip'].includes(action) && before.status !== 'running') fail(409, 'This action requires a running session.');
    }
    const now = Date.now();
    let next = advance(before, deltaMs, now);
    if (!isFinished(next)) {
      if (action === 'pause') next = { ...next, status: 'paused' };
      if (action === 'resume') next = { ...next, status: 'running' };
      if (action === 'skip') next = skipMovement(next, now);
      if (action === 'end') next = { ...next, status: 'ended-early', finishedAt: now };
    }
    if (action === 'note') next = { ...next, note: note.trim() };
    next = { ...next, updatedAt: now, revision: revision + 1, lastOperation: { id: operationId, fingerprint } };
    const saved = await repository.update(req.ownerId, before.id, revision, next);
    if (!saved) {
      const latest = await owned(req);
      if (latest.lastOperation?.id === operationId && latest.lastOperation.fingerprint === fingerprint) return res.json({ session: publicSession(latest) });
      fail(409, 'Session changed. Reload the saved session before making further changes.');
    }
    res.json({ session: publicSession(saved) });
  });
  routes.delete('/workout-sessions/:sessionId', async (req, res) => {
    body(req.body, ['revision']);
    if (!integer(req.body.revision, 0, Number.MAX_SAFE_INTEGER)) fail(400, 'A valid revision is required.');
    const session = await owned(req);
    if (!isFinished(session)) fail(409, 'Only completed or ended sessions can be deleted.');
    if (!await repository.delete(req.ownerId, session.id, req.body.revision)) fail(409, 'Session changed. Reload before deleting.');
    res.status(204).end();
  });
  return routes;
}
