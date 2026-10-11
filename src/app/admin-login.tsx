import { Redirect } from 'expo-router';
import { useAuth } from '@/features/member1/auth/provider';
export default function AdminLogin() {
  const { session } = useAuth();
  return <Redirect href={session?.user.role === 'admin' ? '/admin' : '/member1_onboarding_personalization/login'} />;
}
