import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import {
    getProfile,
    type ApiUserProfile,
} from '@/features/member4/services/member4Service';

type Member4ProfileContextValue = {
  profile: ApiUserProfile | null;
  loadingProfile: boolean;

  refreshProfile: () => Promise<void>;

  setSharedProfile: (
    profile: ApiUserProfile | null,
  ) => void;
};

const Member4ProfileContext =
  createContext<
    Member4ProfileContextValue | undefined
  >(undefined);

type Props = {
  children: ReactNode;
};

export function Member4ProfileProvider({
  children,
}: Props) {
  const [
    profile,
    setProfile,
  ] = useState<ApiUserProfile | null>(
    null,
  );

  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);

  const refreshProfile =
    useCallback(async () => {
      try {
        setLoadingProfile(true);

        const response =
          await getProfile();

        setProfile(
          response?.data ?? null,
        );
      } catch (error) {
        console.error(
          'Shared profile load error:',
          error,
        );

        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const value =
    useMemo<Member4ProfileContextValue>(
      () => ({
        profile,
        loadingProfile,
        refreshProfile,
        setSharedProfile:
          setProfile,
      }),
      [
        profile,
        loadingProfile,
        refreshProfile,
      ],
    );

  return (
    <Member4ProfileContext.Provider
      value={value}
    >
      {children}
    </Member4ProfileContext.Provider>
  );
}

export function useMember4Profile() {
  const context =
    useContext(
      Member4ProfileContext,
    );

  if (context === undefined) {
    throw new Error(
      'useMember4Profile must be used inside Member4ProfileProvider.',
    );
  }

  return context;
}