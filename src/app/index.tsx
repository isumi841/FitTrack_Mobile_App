/**
 * App root entry point.
 * Immediately redirects to the Member 1 Welcome / Onboarding screen.
 */
import { Redirect } from 'expo-router';

export default function Root() {
  return <Redirect href="/member1_onboarding_personalization" />;
}
