import { createContext, useContext, useState, type ReactNode } from 'react';

// Selection bookmarks remain in memory, as on the leader's branch.
// This context is deliberately independent of authentication and session identity.
const Context = createContext<{ favorites: string[]; toggleFavorite: (id: string) => void } | null>(null);
export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id)
    ? previous.filter(item => item !== id) : [...previous, id]);
  return <Context.Provider value={{ favorites, toggleFavorite }}>{children}</Context.Provider>;
}
export function useDiscovery() {
  const value = useContext(Context);
  if (!value) throw new Error('DiscoveryProvider is required.');
  return value;
}
