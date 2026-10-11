import { Redirect } from 'expo-router';
import { useAuth } from '@/features/member1/auth/provider';
export default function LoginSuccess() {
  const { session } = useAuth();
  return <Redirect href={session?.user.role === 'admin' ? '/admin' : session ? '/member2/workout' : '/member1_onboarding_personalization/login'} />;
}
