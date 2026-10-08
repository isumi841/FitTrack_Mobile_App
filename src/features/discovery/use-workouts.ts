import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useResource } from '@/features/workout/resources';
import type { Member2Workout, WorkoutFilters } from '@/data/member2-workouts';
import type { WorkoutOverview } from '../../../shared/discovery/overview';

export function useWorkouts(query = '', filters: WorkoutFilters = {}) {
  const [search, setSearch] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const params = new URLSearchParams({ source: 'leader' });
  if (search.trim()) params.set('search', search.trim());
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const resource = useResource<{ workouts: WorkoutOverview[] }>(`/workouts?${params}`);
  const retry = resource.retry;
  useFocusEffect(useCallback(() => { retry(); }, [retry]));
  const items: Member2Workout[] = (resource.value?.workouts ?? []).map(workout => ({
    id: workout.id, title: workout.name, category: workout.category,
    difficulty: workout.level, duration: workout.durationSeconds / 60,
    equipment: workout.equipment.join(', '), description: workout.description,
    lowImpact: workout.lowImpact,
    exercises: workout.exercises.map(exercise => ({ title: exercise.name, target: exercise.target })),
  }));
  return { ...resource, items, loading: resource.loading || search !== query };
}
