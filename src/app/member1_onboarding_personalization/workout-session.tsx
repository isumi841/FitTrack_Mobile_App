import { Redirect } from 'expo-router';
// Keep old onboarding links connected to the shared workout flow.
export default function WorkoutSession() { return <Redirect href="/member2/workout" />; }
