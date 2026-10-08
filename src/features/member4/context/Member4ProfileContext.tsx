import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getProfile, type ApiUserProfile } from '../services/member4Service';
type ProfileState = { profile: ApiUserProfile | null; loadingProfile: boolean; profileError: string; refreshProfile: () => Promise<void>; setSharedProfile: (profile: ApiUserProfile | null) => void };
const Context = createContext<ProfileState | null>(null);
export function Member4ProfileProvider({ children }: { children: ReactNode }) {
 const [profile, setProfile] = useState<ApiUserProfile | null>(null);
 const [loadingProfile, setLoadingProfile] = useState(true);
 const [profileError, setProfileError] = useState('');
 const refreshProfile = useCallback(async () => {
  try { const response = await getProfile(); setProfile(response?.data ?? null); setProfileError(''); }
  catch (error) { setProfileError(error instanceof Error ? error.message : 'Unable to load your profile.'); }
  finally { setLoadingProfile(false); }
 }, []);
 useEffect(() => { void Promise.resolve().then(refreshProfile); }, [refreshProfile]);
 const value = useMemo(() => ({ profile, loadingProfile, profileError, refreshProfile, setSharedProfile: setProfile }), [profile, loadingProfile, profileError, refreshProfile]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMember4Profile() { const context = useContext(Context); if (!context) throw new Error('Member4ProfileProvider is required.'); return context; }
