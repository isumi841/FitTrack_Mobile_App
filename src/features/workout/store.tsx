import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { api, ApiError, requestKey } from './api';
import { advance, isFinished, type Session } from './engine';
import type { Workout } from './data';
import { useAuth } from '@/features/member1/auth/provider';

type Notice = { id: string; title: string; message: string; read: boolean; createdAt: number; sessionId?: string; workoutId?: string; type?: string };
type Settings = { workSeconds: number; restSeconds: number };
type Preferences = { notices: Notice[]; notes: Record<string, string>; viewed: Record<string, boolean>; saved: boolean; settings: Settings; customSettings: boolean };
type Action = 'checkpoint' | 'pause' | 'resume' | 'skip' | 'complete' | 'end' | 'note';
type Journal = { path: string; method: string; body: Record<string, unknown> };
const defaults: Preferences = { notices: [], notes: {}, viewed: {}, saved: false, settings: { workSeconds: 40, restSeconds: 20 }, customSettings: false };
function useWorkoutState() {
  const { session: account } = useAuth();
  const owner = account?.user.role === 'admin' ? null : account?.user.id;
  const PREFS = `fittrack:user:${owner}:preferences:v1`;
  const JOURNAL = `fittrack:user:${owner}:api-pending:v1`;
  const [prefs, setPrefs] = useState(defaults);
  const [session, renderSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!owner);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [recordsVersion, setRecordsVersion] = useState(0);
  const token = owner ? account?.session.accessToken ?? '' : '';
  const credential = useRef(token);
  useEffect(() => { credential.current = token; }, [token]);
  const current = useRef<Session | null>(null);
  const server = useRef<Session | null>(null);
  const journal = useRef<Journal | null>(null);
  const working = useRef(false);
  const blocked = useRef(false);
  const delta = useRef(0);
  const lastTick = useRef(0);
  const wantPause = useRef(false);
  const preferenceQueue = useRef(Promise.resolve());
  const prefsLoaded = useRef(false);
  const setSession = useCallback((value: Session | null) => { current.current = value; renderSession(value); }, []);
  useEffect(() => {
    if (!ready || !prefsLoaded.current) return;
    preferenceQueue.current = preferenceQueue.current.catch(() => {}).then(() => AsyncStorage.setItem(PREFS, JSON.stringify(prefs)))
      .catch(() => setError('Local preferences could not be saved. Backend session records are separate.'));
  }, [prefs, ready, PREFS]);
  const notice = useCallback((value: Session) => {
    if (!isFinished(value)) return;
    setPrefs(p => p.notices.some(n => n.sessionId === value.id) ? p : { ...p, notices: [{ id: `api-${value.id}`, sessionId: value.id, title: 'Session saved to backend', message: `${value.completedSets} completed, ${value.skippedSets} skipped. Local-only notification.`, read: false, createdAt: Date.now() }, ...p.notices] });
  }, []);
  const writeJournal = useCallback(async (value: Journal | null) => {
    if (value) { journal.current = value; setPending(true); await AsyncStorage.setItem(JOURNAL, JSON.stringify(value)); }
    else { await AsyncStorage.removeItem(JOURNAL); journal.current = null; setPending(false); }
  }, [JOURNAL]);
  const fail = useCallback((err: unknown) => {
    blocked.current = true; wantPause.current = true;
    if (current.current?.status === 'running') setSession({ ...current.current, status: 'paused' });
    setConflict(err instanceof ApiError && (err.status === 409 || (err.status === 404 && journal.current?.method !== 'POST')));
    setError(`${err instanceof Error ? err.message : 'Request failed.'} Unsaved changes are retained; the timer is stopped. Retry before continuing.`);
  }, [setSession]);
  const flush = useCallback(async function flush(action: Action, note?: string): Promise<boolean> {
    if (working.current) {
      if (action === 'pause') { wantPause.current = true; if (current.current?.status === 'running') setSession({ ...current.current, status: 'paused' }); }
      return false;
    }
    if (blocked.current || journal.current || !server.current) return false;
    const base = server.current;
    if (isFinished(base) && action !== 'note') return true;
    working.current = true; setBusy(true);
    const elapsed = delta.current; delta.current = 0;
    const entry: Journal = { path: `/workout-sessions/${base.id}`, method: 'PATCH', body: { revision: base.revision, operationId: requestKey(), action, deltaMs: elapsed, ...(note !== undefined ? { note } : {}) } };
    if (action === 'pause' && current.current?.status === 'running') setSession({ ...current.current, status: 'paused' });
    try {
      await writeJournal(entry);
      const result = await api<{ session: Session }>(entry.path, credential.current, entry.method, entry.body);
      server.current = result.session;
      await writeJournal(null);
      if (isFinished(result.session)) delta.current = 0;
      let local = advance(result.session, delta.current, Date.now());
      if (wantPause.current && local.status === 'running') local = { ...local, status: 'paused' };
      setSession(local); notice(result.session); if (isFinished(result.session)) setRecordsVersion(n => n + 1); setError(''); setConflict(false);
      if (action === 'resume') lastTick.current = Date.now();
      return true;
    } catch (err) { fail(err); return false; }
    finally {
      working.current = false; setBusy(false);
      if (!blocked.current && wantPause.current) { wantPause.current = false; void flush('pause'); }
      else if (!blocked.current && current.current && server.current && !isFinished(server.current) &&
        (current.current.phase !== server.current.phase || delta.current >= 10000)) {
        // A phase can finish while the preceding checkpoint is in flight.
        void flush('checkpoint');
      }
    }
  }, [fail, notice, setSession, writeJournal]);
  const pause = useCallback(() => {
    if (current.current?.status !== 'running') return;
    wantPause.current = working.current;
    setSession({ ...current.current, status: 'paused' });
    void flush('pause');
  }, [flush, setSession]);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now(); const elapsed = Math.max(0, now - lastTick.current); lastTick.current = now;
      const value = current.current;
      if (!value || value.status !== 'running' || blocked.current) return;
      // Long scheduler gaps are treated as suspension, not workout activity.
      if (elapsed > 5000) { pause(); return; }
      delta.current += elapsed;
      const next = advance(value, elapsed, now); setSession(next);
      if (!working.current && (next.phase !== value.phase || delta.current >= 10000 || isFinished(next))) void flush('checkpoint');
    }, 250);
    const sub = AppState.addEventListener('change', state => { if (state !== 'active') pause(); else lastTick.current = Date.now(); });
    const hidden = () => { if (document.visibilityState !== 'visible') pause(); };
    if (Platform.OS === 'web') { document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', pause); }
    return () => { clearInterval(timer); sub.remove(); if (Platform.OS === 'web') { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pause); } };
  }, [flush, pause, setSession]);
  const retrySave = useCallback(async (): Promise<boolean> => {
    if (working.current || !journal.current) return false;
    working.current = true; setBusy(true);
    const entry = journal.current;
    try {
      // Persist again if the original failure was a local journal write.
      await writeJournal(entry);
      let result: { session: Session } | undefined;
      try { result = await api<{ session: Session } | undefined>(entry.path, credential.current, entry.method, entry.body); }
      catch (err) {
        // A delete may have committed before its response was lost.
        if (!(entry.method === 'DELETE' && err instanceof ApiError && err.status === 404)) throw err;
      }
      await writeJournal(null);
      blocked.current = false; setConflict(false); setError('');
      const summaryEdit = entry.body.action === 'note' || entry.method === 'DELETE';
      const affectedId = entry.path.split('/')[2];
      if (!summaryEdit || current.current?.id === affectedId) {
        if (result) { server.current = result.session; if (isFinished(result.session)) delta.current = 0; setSession(advance(result.session, delta.current, Date.now())); notice(result.session); }
        else { server.current = null; setSession(null); delta.current = 0; }
      }
      if (entry.method === 'DELETE') setPrefs(p => ({ ...p, notices: p.notices.filter(n => n.sessionId !== affectedId) }));
      setRecordsVersion(n => n + 1);
      if (summaryEdit && !current.current) { setReady(false); setRecoveryAttempt(n => n + 1); }
    } catch (err) { fail(err); return false; }
    finally { working.current = false; setBusy(false); }
    wantPause.current = false;
    if (server.current && !isFinished(server.current)) return flush('pause');
    return true;
  }, [fail, flush, notice, setSession, writeJournal]);
  const start = useCallback(async (workout: Workout, options?: { rounds: number; restSeconds: number }): Promise<boolean> => {
    if (!ready || working.current || blocked.current || journal.current) return false;
    if (!credential.current) { setError('Log in before starting your workout.'); return false; }
    if (current.current && !isFinished(current.current)) return true;
    const settings = !workout.managed && prefs.customSettings ? prefs.settings : { workSeconds: workout.workSeconds, restSeconds: workout.restSeconds };
    const entry: Journal = { path: '/workout-sessions', method: 'POST', body: { workoutId: workout.id, requestId: requestKey(), ...settings, ...options } };
    working.current = true; setBusy(true);
    try {
      await writeJournal(entry);
      const result = await api<{ session: Session }>(entry.path, credential.current, entry.method, entry.body);
      await writeJournal(null); server.current = result.session; delta.current = 0; lastTick.current = Date.now();
      setSession(result.session); setError(''); return true;
    } catch (err) {
      if (err instanceof ApiError && [400, 401, 403, 404, 409].includes(err.status)) {
        try { await writeJournal(null); setError(err.message); }
        catch (storageError) { fail(storageError); }
      } else fail(err);
      return false;
    }
    finally { working.current = false; setBusy(false); }
  }, [fail, prefs.customSettings, prefs.settings, ready, setSession, writeJournal]);
  const loadSession = useCallback(async (id: string): Promise<boolean> => {
    if (working.current || blocked.current || journal.current) return false;
    if (current.current?.status === 'running') {
      if (!await flush('pause')) return false;
    }
    working.current = true; setBusy(true);
    try {
      const result = await api<{ session: Session }>(`/workout-sessions/${id}`, credential.current);
      server.current = result.session; delta.current = 0; setSession(result.session); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load session.'); return false; }
    finally { working.current = false; setBusy(false); }
    if (server.current?.status === 'running') return flush('pause');
    return true;
  }, [flush, setSession]);
  const fetchNotices = useCallback(async () => {
    if (!credential.current) return;
    try {
      const res = await api<{ notifications: Notice[]; unread: number }>('/notifications', credential.current);
      if (Array.isArray(res?.notifications)) {
        setPrefs(p => {
          const backendIds = new Set(res.notifications.map(n => n.id));
          const localOnly = p.notices.filter(n => !backendIds.has(n.id) && n.id.startsWith('api-'));
          return { ...p, notices: [...res.notifications, ...localOnly] };
        });
      }
    } catch {
      // Offline or network error - retain local notices
    }
  }, []);

  useEffect(() => {
    let live = true;
    if (!owner) return;
    (async () => {
      const [raw, pendingRaw] = await Promise.all([AsyncStorage.getItem(PREFS), AsyncStorage.getItem(JOURNAL)]);
      if (!live) return;
      const parsed = JSON.parse(raw ?? 'null');
      if (parsed) setPrefs({ ...defaults, ...parsed });
      prefsLoaded.current = true;
      if (pendingRaw) {
        journal.current = JSON.parse(pendingRaw); setPending(true); blocked.current = true;
        setError('Your last save was interrupted. Retry saving to recover your workout.');
        setRecoveryFailed(false); return;
      }
      const result = await api<{ sessions: Session[] }>('/workout-sessions', credential.current);
      if (!live) return;
      blocked.current = false;
      const unfinished = result.sessions.find(value => !isFinished(value));
      if (unfinished && !await loadSession(unfinished.id) && !journal.current) throw new Error('Session recovery failed.');
      if (!unfinished) setError('');
      setRecoveryFailed(false);
      void fetchNotices();
    })().catch(() => {
      if (!live) return;
      blocked.current = true; setRecoveryFailed(true);
      setError('We could not restore your saved workout. Check your connection and retry before starting a new session.');
    }).finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, [owner, PREFS, JOURNAL, loadSession, recoveryAttempt, fetchNotices]);


  const saveSummary = useCallback(async (value: Session, action: 'note' | 'delete', note?: string): Promise<boolean> => {
    if (working.current || blocked.current || journal.current || !isFinished(value)) return false;
    if (current.current?.status === 'running' && !await flush('pause')) return false;
    working.current = true; setBusy(true);
    const entry: Journal = { path: `/workout-sessions/${value.id}`, method: action === 'delete' ? 'DELETE' : 'PATCH',
      body: { revision: value.revision, ...(action === 'note' ? { operationId: requestKey(), action, deltaMs: 0, note } : {}) } };
    try {
      await writeJournal(entry);
      const result = await api<{ session: Session } | undefined>(entry.path, credential.current, entry.method, entry.body);
      await writeJournal(null);
      if (current.current?.id === value.id) { server.current = result?.session ?? null; setSession(result?.session ?? null); }
      if (action === 'delete') setPrefs(p => ({ ...p, notices: p.notices.filter(n => n.sessionId !== value.id) }));
      setRecordsVersion(n => n + 1); setError('');
      void fetchNotices();
      return true;
    } catch (err) { fail(err); return false; }
    finally { working.current = false; setBusy(false); }
  }, [fail, flush, setSession, writeJournal, fetchNotices]);
  const discardConflict = useCallback(async () => {
    const id = journal.current?.path.split('/')[2] ?? server.current?.id;
    if (!id || working.current) return;
    working.current = true; setBusy(true);
    try {
      let saved: Session | null = null;
      try { saved = (await api<{ session: Session }>(`/workout-sessions/${id}`, credential.current)).session; }
      catch (err) { if (!(err instanceof ApiError && err.status === 404)) throw err; }
      const summaryEdit = journal.current?.body.action === 'note' || journal.current?.method === 'DELETE';
      await writeJournal(null); blocked.current = false; delta.current = 0; setConflict(false); setError('');
      if (!summaryEdit || current.current?.id === id) { server.current = saved; setSession(saved); }
      setRecordsVersion(n => n + 1); wantPause.current = false;
      if (summaryEdit && !current.current) { setReady(false); setRecoveryAttempt(n => n + 1); }
    } catch (err) { fail(err); return; }
    finally { working.current = false; setBusy(false); }
    if (server.current && !isFinished(server.current)) await flush('pause');
  }, [fail, flush, setSession, writeJournal]);
  return {
    data: { ...prefs, session }, ready, error, busy, pending, conflict, token, recoveryFailed, recordsVersion,
    retrySave, discardConflict, start, pause, loadSession,
    retryRecovery: () => { setReady(false); setRecoveryAttempt(n => n + 1); },
    deleteSummary: (value: Session) => saveSummary(value, 'delete'),
    prepareSignOut: async () => {
      if (working.current || journal.current) return false;
      if (recoveryFailed) return true;
      if (blocked.current) return false;
      return current.current && !isFinished(current.current) ? flush('pause') : true;
    },
    resume: () => flush('resume'), skip: () => flush('skip'), complete: () => flush('complete'), finish: () => flush('end'),
    updateSummary: (value: Session, note: string) => saveSummary(value, 'note', note),
    toggleSaved: () => setPrefs(p => ({ ...p, saved: !p.saved })),
    saveNote: (id: string, value: string) => setPrefs(p => ({ ...p, notes: { ...p.notes, [id]: value.trim() } })),
    markViewed: (id: string) => setPrefs(p => ({ ...p, viewed: { ...p.viewed, [id]: true } })),
    saveSettings: (value: Settings) => setPrefs(p => ({ ...p, settings: value, customSettings: true })),
    resetSettings: () => setPrefs(p => ({ ...p, settings: defaults.settings, customSettings: false })),
    refreshNotices: fetchNotices,
    readNotice: (id?: string) => {
      setPrefs(p => ({ ...p, notices: p.notices.map(n => !id || n.id === id ? { ...n, read: true } : n) }));
      if (credential.current) {
        const path = id ? `/notifications/${id}/read` : '/notifications/read-all';
        void api(path, credential.current, 'PATCH').catch(() => {});
      }
    },
    deleteNotice: (id: string) => {
      setPrefs(p => ({ ...p, notices: p.notices.filter(n => n.id !== id) }));
      if (credential.current) {
        void api(`/notifications/${id}`, credential.current, 'DELETE').catch(() => {});
      }
    },
  };
}
const WorkoutContext = createContext<ReturnType<typeof useWorkoutState> | null>(null);
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const value = useWorkoutState();
  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}
export function useWorkout() {
  const value = useContext(WorkoutContext);
  if (!value) throw new Error('WorkoutProvider is missing');
  return value;
}
