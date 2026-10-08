import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/features/member1/auth/provider';
const Context = createContext<{ token: string; logout: () => Promise<void> } | null>(null);
export function AdminProvider({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  return <Context.Provider value={{ token: session?.user.role === 'admin' ? session.session.accessToken : '', logout }}>{children}</Context.Provider>;
}
export function useAdmin() {
  const value = useContext(Context);
  if (!value) throw new Error('AdminProvider is required.');
  return value;
}
