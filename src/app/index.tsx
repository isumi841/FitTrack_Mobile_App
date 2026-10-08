import { Redirect, type Href } from "expo-router";
import { useAuth } from '@/features/member1/auth/provider';
export default function Index() {
  const { session } = useAuth();
  return <Redirect href={(session?.user.role === 'admin' ? '/admin' : session ? '/member2/workout' : '/member1_onboarding_personalization') as Href} />;
}
