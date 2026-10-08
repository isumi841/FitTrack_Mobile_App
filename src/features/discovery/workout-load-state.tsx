import { WorkoutButton, WorkoutText } from '@/components/workouts/workout-ui';

export function WorkoutLoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <WorkoutText muted>Loading workouts…</WorkoutText>;
  if (error) return <><WorkoutText accessibilityRole="alert" muted>{error}</WorkoutText><WorkoutButton title="Retry workouts" secondary onPress={retry} /></>;
  return null;
}
