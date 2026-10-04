import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { advance, newSession, skipMovement, type Session } from './engine';

type Notice = { id: string; title: string; message: string; read: boolean; createdAt: number; sessionId?: string };
type Settings = { workSeconds: number; restSeconds: number };
type Data = { version: 1; session: Session | null; history: Session[]; notices: Notice[]; notes: Record<string, string>; viewed: Record<string, boolean>; saved: boolean; settings: Settings };
const KEY = 'fittrack:member3:workout:v1';
const initial: Data = { version: 1, session: null, history: [], notices: [], notes: {}, viewed: {}, saved: false, settings: { workSeconds: 40, restSeconds: 20 } };
type Context = {
  data: Data; ready: boolean; error: string; retrySave: () => void;
  start: () => void; pause: () => void; resume: () => void; skip: () => void; finish: () => void;
  toggleSaved: () => void; saveNote: (id: string, value: string) => void; markViewed: (id: string) => void;
  saveSettings: (value: Settings) => void; resetSettings: () => void;
  readNotice: (id?: string) => void; deleteNotice: (id: string) => void;
  updateSummary: (id: string, note: string) => void; deleteSummary: (id: string) => void;
};
const WorkoutContext = createContext<Context | null>(null);
const isFinished = (s: Session) => s.status === 'completed' || s.status === 'ended';
function settle(d: Data, s: Session): Data {
  if (!isFinished(s)) return { ...d, session: s };
  if (d.history.some(item => item.id === s.id)) return { ...d, session: s };
  const allDone = s.status === 'completed' && s.completedSets === 15;
  return { ...d, session: s, history: [s, ...d.history], notices: [{ id: `notice-${s.id}`, sessionId: s.id, title: allDone ? 'Workout completed' : 'Workout session saved', message: `${s.completedSets} of 15 sets completed. Your session summary is ready.`, read: false, createdAt: s.finishedAt ?? Date.now() }, ...d.notices] };
}
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const lastTick = useRef(0);
  const queue = useRef(Promise.resolve());
  const alive = useRef(true);
  const storageLoaded = useRef(false);
  useEffect(() => {
    alive.current = true;
    AsyncStorage.getItem(KEY).then(raw => {
      if (!alive.current) return;
      if (!raw) { storageLoaded.current = true; return; }
      const parsed = JSON.parse(raw) as Data;
      if (parsed.version !== 1 || !Array.isArray(parsed.history) || !Array.isArray(parsed.notices) || !parsed.settings || !parsed.notes || !parsed.viewed) throw new Error('Invalid saved data');
      // Reloads always restore an unfinished session paused; hidden time is never counted.
      if (parsed.session?.status === 'running') parsed.session.status = 'paused';
      storageLoaded.current = true;
      setData(parsed);
    }).catch(() => { if (alive.current) setError('Saved data could not be loaded. Your stored copy has been kept. Reload the app to retry; changes cannot be saved until loading succeeds.'); })
      .finally(() => { if (alive.current) setReady(true); });
    return () => { alive.current = false; };
  }, []);
  const persist = useCallback((value: Data) => {
    if (!storageLoaded.current) return;
    const snapshot = JSON.stringify(value);
    queue.current = queue.current.catch(() => {}).then(() => AsyncStorage.setItem(KEY, snapshot)).then(() => {
      if (alive.current) setError('');
    }).catch(() => { if (alive.current) setError('Changes are in memory but could not be saved on this device. Retry saving.'); });
  }, []);
  useEffect(() => { if (ready) persist(data); }, [data, ready, persist]);
  useEffect(() => {
    lastTick.current = Date.now();
    const timer = setInterval(() => {
      const now = Date.now(); const delta = Math.max(0, now - lastTick.current); lastTick.current = now;
      setData(d => d.session?.status === 'running' ? settle(d, advance(d.session, delta, now)) : d);
    }, 1000);
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') setData(d => {
        if (d.session?.status !== 'running') return d;
        const now = Date.now(); const s = advance(d.session, Math.max(0, now - lastTick.current), now); lastTick.current = now;
        return settle(d, isFinished(s) ? s : { ...s, status: 'paused' });
      });
      else lastTick.current = Date.now();
    });
    return () => { clearInterval(timer); sub.remove(); };
  }, []);
  const pause = () => setData(d => {
    if (d.session?.status !== 'running') return d;
    const now = Date.now(); const s = advance(d.session, Math.max(0, now - lastTick.current), now); lastTick.current = now;
    return settle(d, isFinished(s) ? s : { ...s, status: 'paused' });
  });
  return <WorkoutContext.Provider value={{ data, ready, error, retrySave: () => persist(data),
    start: () => { lastTick.current = Date.now(); setData(d => d.session && !isFinished(d.session) ? d : { ...d, session: newSession(Date.now(), d.settings.workSeconds, d.settings.restSeconds) }); },
    pause,
    resume: () => { lastTick.current = Date.now(); setData(d => d.session?.status === 'paused' ? { ...d, session: { ...d.session, status: 'running' } } : d); },
    skip: () => { const now = Date.now(); const delta = Math.max(0, now - lastTick.current); lastTick.current = now; setData(d => d.session ? settle(d, skipMovement(advance(d.session, delta, now), now)) : d); },
    finish: () => setData(d => { if (!d.session || isFinished(d.session)) return d; const now = Date.now(); const s = advance(d.session, Math.max(0, now - lastTick.current), now); lastTick.current = now; return settle(d, isFinished(s) ? s : { ...s, status: 'ended', finishedAt: now }); }),
    toggleSaved: () => setData(d => ({ ...d, saved: !d.saved })),
    saveNote: (id, value) => setData(d => ({ ...d, notes: { ...d.notes, [id]: value.trim() } })),
    markViewed: id => setData(d => ({ ...d, viewed: { ...d.viewed, [id]: true } })),
    saveSettings: value => setData(d => ({ ...d, settings: value })),
    resetSettings: () => setData(d => ({ ...d, settings: initial.settings })),
    readNotice: id => setData(d => ({ ...d, notices: d.notices.map(n => !id || n.id === id ? { ...n, read: true } : n) })),
    deleteNotice: id => setData(d => ({ ...d, notices: d.notices.filter(n => n.id !== id) })),
    updateSummary: (id, note) => setData(d => ({ ...d, history: d.history.map(s => s.id === id ? { ...s, note } : s), session: d.session?.id === id ? { ...d.session, note } : d.session })),
    deleteSummary: id => setData(d => ({ ...d, history: d.history.filter(s => s.id !== id), session: d.session?.id === id ? null : d.session, notices: d.notices.filter(n => n.sessionId !== id) })),
  }}>{children}</WorkoutContext.Provider>;
}
export function useWorkout() {
  const value = useContext(WorkoutContext);
  if (!value) throw new Error('WorkoutProvider is missing');
  return value;
}
