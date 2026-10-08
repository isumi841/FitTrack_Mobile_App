import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { clearAuthSession, getAuthSession, getSessionSnapshot, subscribeToSession } from './session';
import { AuthApiError, getCurrentUser, type SessionSuccessResponse } from './auth-api';

const Context = createContext<{ session: SessionSuccessResponse | null; ready: boolean; logout: () => Promise<void> } | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(getSessionSnapshot);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const unsubscribe = subscribeToSession(() => { if (live) setSession(getSessionSnapshot()); });
    void getAuthSession().then(async restored => {
      if (restored) {
        try { await getCurrentUser(restored.session.accessToken); }
        catch (error) { if (error instanceof AuthApiError && [401, 403].includes(error.status ?? 0) && getSessionSnapshot() === restored) await clearAuthSession(); }
      }
    }).catch(() => { /* Sign-in remains available if secure storage cannot be read. */ })
      .finally(() => { if (live) { setSession(getSessionSnapshot()); setReady(true); } });
    return () => { live = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!session) return;
    const expire = () => { if (Date.parse(session.session.expiresAt) <= Date.now() && getSessionSnapshot() === session) void clearAuthSession().catch(() => {}); };
    const timer = setTimeout(expire, Math.max(0, Date.parse(session.session.expiresAt) - Date.now()));
    const appState = AppState.addEventListener('change', state => { if (state === 'active') expire(); });
    return () => { clearTimeout(timer); appState.remove(); };
  }, [session]);
  return <Context.Provider value={{ session, ready, logout: clearAuthSession }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is required.');
  return value;
}
