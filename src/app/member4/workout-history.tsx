/**
 * Workout History Screen – Member 4.
 * Route: /member4/workout-history
 * Next-level dark fitness UI redesign.
 */
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Member4Header } from '@/features/member4/components/Member4Header';
import { WorkoutHistoryCard } from '@/features/member4/components/WorkoutHistoryCard';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import { mockWorkoutHistory } from '@/features/member4/data/mockData';
import type { WorkoutHistoryItem } from '@/features/member4/types';

type FilterTag = 'All' | '5 min' | '15 min' | '30 min' | 'This Month';

const FILTER_TAGS: FilterTag[] = ['All', '5 min', '15 min', '30 min', 'This Month'];
const SECTIONS: WorkoutHistoryItem['section'][] = ['Today', 'Yesterday', 'Last Week'];

export default function WorkoutHistoryScreen() {
  const c = useM4Theme();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTag>('All');

  const filtered = useMemo(() => {
    return mockWorkoutHistory.filter((w) => {
      const matchQuery =
        query.trim() === '' ||
        w.name.toLowerCase().includes(query.toLowerCase());

      const matchFilter =
        activeFilter === 'All' ||
        (activeFilter === 'This Month'
          ? w.tags.includes('This Month')
          : w.tags.includes(activeFilter));

      return matchQuery && matchFilter;
    });
  }, [query, activeFilter]);

  const totalWorkouts = filtered.length;
  const totalMinutes = filtered.reduce((sum, w) => sum + (w.duration ?? 0), 0);

  function renderSection(section: WorkoutHistoryItem['section']) {
    const items = filtered.filter((w) => w.section === section);
    if (items.length === 0) return null;

    return (
      <View key={section} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.muted }]}>{section}</Text>
        {items.map((item) => (
          <WorkoutHistoryCard key={item.id} item={item} />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <Member4Header title="Workout History" />

      {/* ── Stats Bar ── */}
      <View style={[styles.statsBar, { backgroundColor: c.cardBg, borderBottomColor: c.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: c.teal }]}>{totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: c.muted }]}>Workouts</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: c.text }]}>{totalMinutes}m</Text>
          <Text style={[styles.statLabel, { color: c.muted }]}>Minutes</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: c.teal }]}>🔥</Text>
          <Text style={[styles.statLabel, { color: c.muted }]}>On Track</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrapper, { borderBottomColor: c.border }]}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Text style={[styles.searchIcon, { color: c.subtle }]}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search workouts..."
            placeholderTextColor={c.subtle}
            style={[styles.searchInput, { color: c.text }]}
            returnKeyType="search"
            accessibilityLabel="Search workouts"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={{ flexGrow: 0 }}
      >
        {FILTER_TAGS.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => setActiveFilter(tag)}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === tag ? c.teal : c.surface,
                borderColor: activeFilter === tag ? c.teal : c.border,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: activeFilter === tag }}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: activeFilter === tag ? '#0D1117' : c.muted },
              ]}
            >
              {tag}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyText, { color: c.subtle }]}>No workouts found</Text>
          </View>
        ) : (
          SECTIONS.map(renderSection)
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500' },
  statDivider: { width: 1, height: 28 },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, height: '100%' },

  filtersRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  empty: { paddingTop: 64, alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15 },
});
