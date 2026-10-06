import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { api, ApiError, requestKey } from './api';
import { advance, isFinished, type Session } from './engine';
import type { Workout } from './data';

type Notice = { id: string; title: string; message: string; read: boolean; createdAt: number; sessionId?: string };
type Settings = { workSeconds: number; restSeconds: number };
type Preferences = { notices: Notice[]; notes: Record<string, string>; viewed: Record<string, boolean>; saved: boolean; settings: Settings; customSettings: boolean };
type Action = 'checkpoint' | 'pause' | 'resume' | 'skip' | 'end' | 'note';
type Journal = { path: string; method: string; body: Record<string, unknown> };
const PREFS = 'fittrack:member3:preferences:v2';
const JOURNAL = 'fittrack:member3:api-pending:v1';
const defaults: Preferences = { notices: [], notes: {}, viewed: {}, saved: false, settings: { workSeconds: 40, restSeconds: 20 }, customSettings: false };
function useWorkoutState() {
  const [prefs, setPrefs] = useState(defaults);
  const [session, renderSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [token, updateToken] = useState('');
  const credential = useRef('');
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
    let live = true;
    (async () => {
      const [raw, old, pendingRaw] = await Promise.all([AsyncStorage.getItem(PREFS), AsyncStorage.getItem('fittrack:member3:workout:v1'), AsyncStorage.getItem(JOURNAL)]);
      if (!live) return;
      const parsed = JSON.parse(raw ?? old ?? 'null');
      // Copy only preferences. Old sample sessions/history/notices are never uploaded.
      if (parsed) setPrefs({ ...defaults, notes: parsed.notes ?? {}, viewed: parsed.viewed ?? {}, saved: !!parsed.saved, settings: parsed.settings ?? defaults.settings, customSettings: parsed.customSettings ?? (!!parsed.settings && (parsed.settings.workSeconds !== 40 || parsed.settings.restSeconds !== 20)), notices: raw ? parsed.notices ?? [] : [] });
      prefsLoaded.current = true;
      if (pendingRaw) { journal.current = JSON.parse(pendingRaw); setPending(true); blocked.current = true; setError('An interrupted API request is recoverable. Enter your token and retry the pending request.'); }
    })().catch(() => { if (live) { blocked.current = true; setError('Local preferences or recovery data could not be read. Saving is blocked to preserve pending requests. Reload to retry; the stored copy has been preserved.'); } })
      .finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!ready || !prefsLoaded.current) return;
    preferenceQueue.current = preferenceQueue.current.catch(() => {}).then(() => AsyncStorage.setItem(PREFS, JSON.stringify(prefs)))
      .catch(() => setError('Local preferences could not be saved. Backend session records are separate.'));
  }, [prefs, ready]);
  const notice = useCallback((value: Session) => {
    if (!isFinished(value)) return;
    setPrefs(p => p.notices.some(n => n.sessionId === value.id) ? p : { ...p, notices: [{ id: `api-${value.id}`, sessionId: value.id, title: 'Session saved to backend', message: `${value.completedSets} completed, ${value.skippedSets} skipped. Local-only notification.`, read: false, createdAt: Date.now() }, ...p.notices] });
  }, []);
  const writeJournal = useCallback(async (value: Journal | null) => {
    if (value) { journal.current = value; setPending(true); await AsyncStorage.setItem(JOURNAL, JSON.stringify(value)); }
    else { await AsyncStorage.removeItem(JOURNAL); journal.current = null; setPending(false); }
  }, []);
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
      setSession(local); notice(result.session); setError(''); setConflict(false);
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
      if (result) { server.current = result.session; if (isFinished(result.session)) delta.current = 0; setSession(advance(result.session, delta.current, Date.now())); notice(result.session); }
      else { server.current = null; setSession(null); delta.current = 0; }
    } catch (err) { fail(err); return false; }
    finally { working.current = false; setBusy(false); }
    wantPause.current = false;
    if (server.current && !isFinished(server.current)) return flush('pause');
    return true;
  }, [fail, flush, notice, setSession, writeJournal]);
  const start = useCallback(async (workout: Workout): Promise<boolean> => {
    if (working.current || blocked.current || journal.current) return false;
    if (current.current && !isFinished(current.current)) return true;
    const settings = prefs.customSettings ? prefs.settings : { workSeconds: workout.workSeconds, restSeconds: workout.restSeconds };
    const entry: Journal = { path: '/workout-sessions', method: 'POST', body: { workoutId: workout.id, requestId: requestKey(), ...settings } };
    working.current = true; setBusy(true);
    try {
      await writeJournal(entry);
      const result = await api<{ session: Session }>(entry.path, credential.current, entry.method, entry.body);
      await writeJournal(null); server.current = result.session; delta.current = 0; lastTick.current = Date.now();
      setSession(result.session); setError(''); return true;
    } catch (err) { fail(err); return false; }
    finally { working.current = false; setBusy(false); }
  }, [fail, prefs.customSettings, prefs.settings, setSession, writeJournal]);
  const loadSession = useCallback(async (id: string): Promise<boolean> => {
    if (working.current || blocked.current || journal.current) return false;
    if (current.current?.id !== id && current.current?.status === 'running') {
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
  const deleteSummary = useCallback(async (id: string): Promise<boolean> => {
    if (working.current || blocked.current || journal.current || server.current?.id !== id) return false;
    working.current = true; setBusy(true);
    const entry: Journal = { path: `/workout-sessions/${id}`, method: 'DELETE', body: { revision: server.current.revision } };
    try {
      await writeJournal(entry);
      await api(entry.path, credential.current, entry.method, entry.body);
      await writeJournal(null); server.current = null; setSession(null); setError('');
      setPrefs(p => ({ ...p, notices: p.notices.filter(n => n.sessionId !== id) })); return true;
    } catch (err) { fail(err); return false; }
    finally { working.current = false; setBusy(false); }
  }, [fail, setSession, writeJournal]);
  const discardConflict = useCallback(async () => {
    const id = journal.current?.path.split('/')[2] ?? server.current?.id;
    if (!id || working.current) return;
    working.current = true; setBusy(true);
    try {
      let saved: Session | null = null;
      try { saved = (await api<{ session: Session }>(`/workout-sessions/${id}`, credential.current)).session; }
      catch (err) { if (!(err instanceof ApiError && err.status === 404)) throw err; }
      await writeJournal(null); blocked.current = false; delta.current = 0; setConflict(false); setError('');
      server.current = saved; setSession(saved); wantPause.current = false;
    } catch (err) { fail(err); return; }
    finally { working.current = false; setBusy(false); }
    if (server.current && !isFinished(server.current)) await flush('pause');
  }, [fail, flush, setSession, writeJournal]);
  return {
    data: { ...prefs, session }, ready, error, busy, pending, conflict, token,
    setToken: (value: string) => { if (__DEV__ && !working.current) { pause(); credential.current = value; updateToken(value); } },
    retrySave, discardConflict, start, pause, loadSession, deleteSummary,
    resume: () => flush('resume'), skip: () => flush('skip'), finish: () => flush('end'),
    updateSummary: (id: string, note: string) => server.current?.id === id ? flush('note', note) : Promise.resolve(false),
    toggleSaved: () => setPrefs(p => ({ ...p, saved: !p.saved })),
    saveNote: (id: string, value: string) => setPrefs(p => ({ ...p, notes: { ...p.notes, [id]: value.trim() } })),
    markViewed: (id: string) => setPrefs(p => ({ ...p, viewed: { ...p.viewed, [id]: true } })),
    saveSettings: (value: Settings) => setPrefs(p => ({ ...p, settings: value, customSettings: true })),
    resetSettings: () => setPrefs(p => ({ ...p, settings: defaults.settings, customSettings: false })),
    readNotice: (id?: string) => setPrefs(p => ({ ...p, notices: p.notices.map(n => !id || n.id === id ? { ...n, read: true } : n) })),
    deleteNotice: (id: string) => setPrefs(p => ({ ...p, notices: p.notices.filter(n => n.id !== id) })),
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
