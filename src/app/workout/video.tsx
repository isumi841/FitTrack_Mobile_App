import { Redirect, useLocalSearchParams } from 'expo-router';

// Keep existing video links working with the combined guidance screen.
export default function VideoDemonstrationScreen() {
  const { workoutId, sessionId, exercise } = useLocalSearchParams<{ workoutId?: string; sessionId?: string; exercise?: string }>();
  return <Redirect href={{ pathname: '/workout/instructions', params: {
    ...(typeof workoutId === 'string' ? { workoutId } : {}),
    ...(typeof sessionId === 'string' ? { sessionId } : {}),
    ...(typeof exercise === 'string' ? { exercise } : {}),
  } }} />;
}
