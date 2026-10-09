import { useFocusEffect } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { type AuthUser } from '@/features/member1/auth/auth-api';
import { getAuthSession } from '@/features/member1/auth/session';
import { getProfile, type ApiUserProfile } from '@/features/member4/services/member4Service';

type Member4ProfileContextValue = {
  profile: ApiUserProfile | null;
  authUser: AuthUser | null;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  setSharedProfile: (profile: ApiUserProfile | null) => void;
};

const Member4ProfileContext = createContext<Member4ProfileContextValue | undefined>(undefined);

export function Member4ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const requestVersion = useRef(0);
  const currentUserId = useRef<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoadingProfile(true);
    try {
      const session = await getAuthSession();
      if (version !== requestVersion.current) return;
      const user = session?.user ?? null;
      if (currentUserId.current !== (user?.id ?? null)) setProfile(null);
      currentUserId.current = user?.id ?? null;
      setAuthUser(user);
      if (!user) return;
      const response = await getProfile();
      if (version === requestVersion.current) setProfile(response?.data ?? null);
    } catch {
      // Keep the account's email and any previously loaded profile on transient failures.
    } finally {
      if (version === requestVersion.current) setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refreshProfile();
    return () => { requestVersion.current += 1; };
  }, [refreshProfile]));

  const value = useMemo(() => ({
    profile, authUser, loadingProfile, refreshProfile, setSharedProfile: setProfile,
  }), [profile, authUser, loadingProfile, refreshProfile]);

  return <Member4ProfileContext.Provider value={value}>{children}</Member4ProfileContext.Provider>;
}

export function useMember4Profile() {
  const context = useContext(Member4ProfileContext);
  if (context === undefined) throw new Error('useMember4Profile must be used inside Member4ProfileProvider.');
  return context;
}
