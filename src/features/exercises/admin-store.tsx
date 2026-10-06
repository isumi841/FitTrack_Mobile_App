import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/features/workout/api';
export type AdminSession = { token: string; expiresAt: number };
const Context = createContext<{ token: string; setSession: (session: AdminSession | null) => void; logout: () => Promise<void> } | null>(null);
export function AdminProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => setSession(null), Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  const logout = async () => {
    const token = session?.token;
    setSession(null);
    if (token) {
      try { await api('/admin/logout', token, 'POST'); }
      catch { /* Local access is cleared offline; server sessions expire automatically. */ }
    }
  };
  return <Context.Provider value={{ token: session?.token ?? '', setSession, logout }}>{children}</Context.Provider>;
}
export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error('AdminProvider is required.');
  return value;
}
