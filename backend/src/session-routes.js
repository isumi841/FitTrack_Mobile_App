import { Router } from 'express';
import { createHash } from 'node:crypto';
import { workouts, workoutOverviews, resolveWorkout } from './catalog.js';
import { workoutOverview } from './workout-repository.js';
import { workoutFilter } from './workout-routes.js';
import { developmentIdentity } from './identity.js';
import { advance, skipMovement, isFinished, completeMovement, manualMovement } from '../../shared/workout-engine.ts';
import { exerciseDuration } from '../../shared/exercise-duration.ts';
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
export function member3Routes({ repository, exerciseRepository, workoutRepository, config, identity = developmentIdentity(config), notifications }) {
  const routes = Router();
  async function sessionPlan(workoutId) {
    const workout = await resolveWorkout(workoutId, workoutRepository);
    if (!workout) fail(404, 'Workout not found.');
    if (workout.sample) return workout;
    const exercises = exerciseRepository ? await exerciseRepository.list(workout.id) : [];
    if (!exercises.length) fail(409, 'Exercises have not been added to this workout yet. Please choose another workout.');
    return { ...workout, sessionReady: true, managed: true, rounds: 1, workSeconds: 40, restSeconds: 20,
      exercises: exercises.map(record => {
        const exercise = publicExercise(record);
        return { id: exercise.id, name: exercise.name, target: exercise.target, subtitle: exercise.subtitle ?? '',
          cue: exercise.cue ?? '', steps: exercise.steps, video: exercise.video ?? null, durationSeconds: exerciseDuration(exercise.target) };
      }) };
  }
  routes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  routes.get('/workouts', async (req, res) => res.json({ workouts: req.query.source === 'leader'
    ? workoutRepository ? (await workoutRepository.list(workoutFilter(req.query))).map(workoutOverview) : workoutOverviews
    : workouts }));
  routes.get('/workouts/:workoutId', async (req, res) => {
    const workout = await resolveWorkout(req.params.workoutId, workoutRepository);
    if (!workout) fail(404, 'Workout not found.');
    if (!workout.sample && exerciseRepository) return res.json({ workout: { ...workout, guidanceManaged: true, exercises: (await exerciseRepository.list(workout.id)).map(publicExercise) } });
    res.json({ workout });
  });
  routes.get('/workouts/:workoutId/session-plan', async (req, res) => res.json({ workout: await sessionPlan(req.params.workoutId) }));
  routes.use('/workout-sessions', identity, (_req, _res, next) => {
    if (!repository) fail(503, 'Session storage is unavailable.');
    next();
  });
  routes.post('/workout-sessions', async (req, res) => {
    body(req.body, ['workoutId', 'requestId', 'workSeconds', 'restSeconds', 'rounds']);
    const { workoutId, requestId } = req.body;
    if (typeof workoutId !== 'string' || !keyValid(requestId)) fail(400, 'A workoutId and valid requestId are required.');
    const id = hash(`${req.ownerId}:${requestId}`);
    const existing = await repository.get(req.ownerId, id);
    // Recover a lost response using the original snapshot, even if an admin has
    // since edited/deleted the workout or its exercises.
    const workout = existing?.snapshot ?? await sessionPlan(workoutId);
    const workSeconds = req.body.workSeconds === undefined ? workout.workSeconds : req.body.workSeconds;
    const restSeconds = req.body.restSeconds === undefined ? workout.restSeconds : req.body.restSeconds;
    const rounds = req.body.rounds === undefined ? workout.rounds : req.body.rounds;
    if (!integer(rounds, 1, 5)) fail(400, 'Choose between 1 and 5 rounds.');
    if (!integer(workSeconds, 10, 120) || !integer(restSeconds, 5, 120)) fail(400, 'Work must be 10–120 seconds; rest must be 5–120 seconds.');
    const createFingerprint = hash(JSON.stringify([workoutId, workSeconds, restSeconds, ...(req.body.rounds === undefined ? [] : [rounds])]));
    const now = Date.now();
    const durationSeconds = workout.managed
      ? workout.exercises.reduce((sum, exercise) => sum + (exercise.durationSeconds ?? 0), 0) * rounds + (workout.exercises.length * rounds - 1) * restSeconds
      : workout.exercises.length * rounds * (workSeconds + restSeconds);
    const session = existing ?? await repository.create({ id, ownerId: req.ownerId, workoutId, createFingerprint,
      snapshot: { ...structuredClone(workout), rounds, workSeconds, restSeconds, durationSeconds },
      status: 'running', startedAt: now, updatedAt: now, phase: 0, remainingMs: (workout.managed ? workout.exercises[0].durationSeconds ?? 0 : workSeconds) * 1000, elapsedMs: 0,
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
    if (!integer(revision, 0, Number.MAX_SAFE_INTEGER - 1) || !keyValid(operationId) || !['checkpoint', 'pause', 'resume', 'skip', 'complete', 'end', 'note'].includes(action) || !integer(deltaMs, 0, 60000)) fail(400, 'Invalid revision, operation, action or elapsed duration.');
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
      if (['checkpoint', 'skip', 'complete'].includes(action) && before.status !== 'running') fail(409, 'This action requires a running session.');
      if (action === 'complete' && !manualMovement(before)) fail(409, 'Only a rep-based or manual exercise can be marked complete.');
    }
    const now = Date.now();
    let next = advance(before, deltaMs, now);
    if (!isFinished(next)) {
      if (action === 'pause') next = { ...next, status: 'paused' };
      if (action === 'resume') next = { ...next, status: 'running' };
      // If elapsed time already advanced this interval, don't skip the next one.
      if (action === 'skip' && next.phase === before.phase) next = skipMovement(next, now);
      if (action === 'complete') next = completeMovement(next, now);
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
    if (!isFinished(before) && isFinished(saved)) void notifications?.sessionFinished(req.ownerId, saved);
    res.json({ session: publicSession(saved) });
  });
  routes.delete('/workout-sessions/:sessionId', async (req, res) => {
    body(req.body, ['revision']);
    if (!integer(req.body.revision, 0, Number.MAX_SAFE_INTEGER)) fail(400, 'A valid revision is required.');
    const session = await owned(req);
    if (!isFinished(session)) fail(409, 'Only completed or ended sessions can be deleted.');
    if (!await repository.delete(req.ownerId, session.id, req.body.revision)) fail(409, 'Session changed. Reload before deleting.');
    void notifications?.sessionRemoved(req.ownerId, session.id);
    res.status(204).end();
  });
  return routes;
}
