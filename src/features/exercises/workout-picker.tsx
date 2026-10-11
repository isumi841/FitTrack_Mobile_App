import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WorkoutIcon } from '@/components/workouts/workout-ui';
import { categoryDetails } from '@/data/member2-workouts';
import { useResource } from '@/features/workout/resources';
import { Button, Card, Page, c, s } from '@/features/workout/ui';
import type { WorkoutOverview } from '../../../shared/discovery/overview';
import { adminStyles as a } from './admin-styles';
import { AdminCardGrid } from './admin-card-grid';

export default function AdminWorkoutPicker() {
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const category = categoryDetails.find(item => item.title === categoryParam);
  const { value, loading, error, retry } = useResource<{ workouts: WorkoutOverview[] }>('/workouts?source=leader');
  useFocusEffect(useCallback(() => { retry(); }, [retry]));

  return <Page scope="admin" title={category ? `${category.title} workouts` : 'Exercise management'}
    onBack={() => router.replace(category ? '/admin/exercises' : '/admin')}>
    <View style={styles.content}>
      <View style={styles.toolbar}>
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={s.title}>{category ? category.title : 'Workout categories'}</Text>
          <Text style={s.body}>{category
            ? 'Choose a workout to add or manage its exercise instructions and videos.'
            : 'Choose a category, then a workout to manage its exercises.'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh workouts"
          accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={retry}
          style={({ pressed }) => [styles.refresh, (pressed || loading) && styles.dimmed]}>
          <WorkoutIcon ios="arrow.clockwise" material="refresh" color={c.accent} size={20} />
          <Text style={s.smallStrong}>{loading ? 'Refreshing…' : 'Refresh workouts'}</Text>
        </Pressable>
      </View>

      {loading && <Text accessibilityLiveRegion="polite" style={s.body}>Loading the latest workouts…</Text>}
      {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text>
        <Button title="Retry workouts" secondary onPress={retry} />
      </Card>}

      {category ? <>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/admin/exercises')} style={styles.categoriesLink}>
          <WorkoutIcon ios="chevron.left" material="chevron_left" color={c.accent} size={18} />
          <Text style={styles.linkText}>All categories</Text>
        </Pressable>
        {!loading && !error && value && <CategoryWorkouts key={category.title} category={category.title}
          workouts={value.workouts.filter(workout => workout.category === category.title)} />}
      </> : <View style={styles.grid}>
        {categoryDetails.map(item => <Pressable key={item.title} accessibilityRole="button"
          accessibilityLabel={`Explore ${item.title} workouts`}
          onPress={() => router.push({ pathname: '/admin/exercises', params: { category: item.title } })}
          style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
          <View style={s.row}>
            <View style={styles.iconTile}><WorkoutIcon ios={item.ios} material={item.material} color={c.accent} size={30} /></View>
            <WorkoutIcon ios="chevron.right" material="chevron_right" color={c.muted} size={20} />
          </View>
          <Text style={styles.categoryTitle}>{item.title}</Text>
          <Text style={s.body}>Explore workouts</Text>
        </Pressable>)}
      </View>}
    </View>
  </Page>;
}

function CategoryWorkouts({ category, workouts }: { category: string; workouts: WorkoutOverview[] }) {
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const matches = workouts.filter(workout => `${workout.name} ${workout.level} ${workout.description}`.toLowerCase().includes(search));
  return <View style={styles.list}>
    <TextInput accessibilityLabel={`Search ${category} workouts`} placeholder={`Search ${category.toLowerCase()} workouts`}
      placeholderTextColor={c.muted} value={query} onChangeText={setQuery} autoCorrect={false} style={s.input} />
    <Text accessibilityLiveRegion="polite" style={s.body}>{matches.length} {matches.length === 1 ? 'workout' : 'workouts'}</Text>
    {!matches.length && <Card>
      <Text style={s.heading}>{workouts.length ? 'No matching workouts' : 'No workouts in this category yet'}</Text>
      <Text style={s.body}>{workouts.length ? 'Try another name or clear your search.' : 'When a workout is added, use Refresh workouts to load it here.'}</Text>
      {!!query && <Button title="Clear search" secondary onPress={() => setQuery('')} />}
    </Card>}
    <AdminCardGrid>{matches.map(workout => <View key={workout.id} style={[a.tile, { flexBasis: 'auto', minWidth: 0 }]}>
      <Text style={a.pill}>{workout.level.toUpperCase()}</Text>
      <View style={a.tileBody}><Text style={s.heading}>{workout.name}</Text>
      <Text style={s.body}>{workout.durationSeconds / 60} min · {workout.equipment.join(', ')}</Text>
      {!!workout.description && <Text numberOfLines={3} style={s.body}>{workout.description}</Text>}</View>
      <View style={a.divider} />
      <Button title="Manage exercises" onPress={() => router.push({ pathname: '/admin/exercises',
        params: { workoutId: workout.id, category } })} />
    </View>)}</AdminCardGrid>
  </View>;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 960, alignSelf: 'center', gap: 20 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  intro: { flexGrow: 1, flexShrink: 1, flexBasis: 300, gap: 8 },
  refresh: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 16,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  categoryCard: { flexBasis: '46%', flexGrow: 1, minWidth: 140, minHeight: 177,
    padding: 20, gap: 12, borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  iconTile: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: c.accentSoft },
  categoryTitle: { fontSize: 18, fontWeight: '700', color: c.text },
  pressed: { borderColor: c.accent, backgroundColor: c.surfaceRaised },
  dimmed: { opacity: 0.55 },
  categoriesLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, gap: 6 },
  linkText: { color: c.accent, fontSize: 14, fontWeight: '600' },
  list: { gap: 16 },
});
