import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { getOnboardingData, type OnboardingData } from '@/features/member1/utils/onboarding-store';
import { useWorkouts } from '@/features/discovery/use-workouts';
import { Button, Card, Page, Badge, s } from '@/features/workout/ui';
import { useAuth } from '@/features/member1/auth/provider';
import { PlanImages } from '@/features/member1/plan-images';

export default function PersonalizedPlan() {
  const { session } = useAuth();
  const [preferences, setPreferences] = useState<OnboardingData | null>(null);
  const { items, loading, error, retry } = useWorkouts();
  useEffect(() => { void getOnboardingData().then(setPreferences); }, []);
  const matches = items.filter(workout => (!preferences?.fitnessLevel || workout.difficulty.toLowerCase() === preferences.fitnessLevel.toLowerCase()) &&
    (!preferences?.availableTime || workout.duration <= Number(preferences.availableTime)));
  const recommendations = matches.length ? matches.slice(0, 3) : items.slice(0, 3);
  return <Page title="Your workout plan" showSessionFeedback={false} onBack={() => router.replace('/member2/workout')}>
    <Text style={s.title}>Welcome{session?.user.displayName ? `, ${session.user.displayName}` : ' to FitTrack'}</Text>
    <PlanImages />
    <Text style={s.body}>{preferences ? 'Workouts selected from the latest library using your level and available time.' : 'Explore the latest workouts or set your preferences for a closer match.'}</Text>
    {preferences && <Badge>{`${preferences.fitnessLevel} · ${preferences.availableTime} min · ${preferences.fitnessGoal}`}</Badge>}
    {loading && <Text style={s.body}>Finding workouts…</Text>}
    {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text><Button title="Try again" onPress={retry} /></Card>}
    {!loading && !error && !items.length && <Card><Text style={s.body}>No workouts are available yet. Check back after your trainer adds them.</Text></Card>}
    {!!preferences && !matches.length && !!items.length && <Text style={s.body}>No exact matches yet. Here are other workouts you can explore.</Text>}
    {recommendations.map(workout => <Card key={workout.id}><Badge>{workout.category}</Badge><Text style={s.heading}>{workout.title}</Text>
      <Text style={s.body}>{workout.description}</Text><Text style={s.smallStrong}>{workout.difficulty} · {workout.duration} min</Text>
      <Button title="View workout" onPress={() => router.push({ pathname: '/workout/details', params: { workoutId: workout.id } })} />
    </Card>)}
    <Button title="Explore all workouts" onPress={() => router.replace('/member2/workout')} />
    <Button title="Set workout preferences" secondary onPress={() => router.push('/member1_onboarding_personalization/fitness-level')} />
  </Page>;
}
