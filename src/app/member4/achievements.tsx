/**
 * Achievements Screen – Member 4.
 * Route: /member4/achievements
 * Next-level dark fitness UI redesign.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AchievementBadge } from '@/features/member4/components/AchievementBadge';
import { BadgeDetailModal } from '@/features/member4/components/BadgeDetailModal';
import { Member4Header } from '@/features/member4/components/Member4Header';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import { mockAchievements } from '@/features/member4/data/mockData';
import type { Achievement } from '@/features/member4/types';

export default function AchievementsScreen() {
  const c = useM4Theme();

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const unlocked = mockAchievements.filter((a) => a.isUnlocked);
  const locked = mockAchievements.filter((a) => !a.isUnlocked);
  const totalBadges = mockAchievements.length;
  const earnedBadges = unlocked.length;
  const progressPct = Math.round((earnedBadges / totalBadges) * 100);
  const recentlyEarned = unlocked.slice(-1);

  function handleBadgePress(achievement: Achievement) {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <Member4Header title="Achievements" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ── */}
        <View style={[styles.heroBanner, { backgroundColor: c.teal }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>YOUR BADGES</Text>
            <Text style={styles.heroCount}>{earnedBadges} / {totalBadges}</Text>
            <Text style={styles.heroSub}>Keep earning to unlock all!</Text>
          </View>
          <View style={[styles.trophyCircle, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: c.teal },
              ]}
            />
          </View>
          <Text style={[styles.pctText, { color: c.teal }]}>{progressPct}% complete</Text>
        </View>

        {/* ── Recently Earned ── */}
        {recentlyEarned.length > 0 && (
          <View style={[styles.recentCard, { backgroundColor: c.cardBg, borderColor: c.borderH }]}>
            <Text style={[styles.recentTitle, { color: c.teal }]}>🌟 Recently Earned</Text>
            {recentlyEarned.map((a) => (
              <View key={a.id} style={styles.recentRow}>
                <Text style={styles.recentIcon}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recentName, { color: c.text }]}>{a.title}</Text>
                  {a.earnedOn && (
                    <Text style={[styles.recentDate, { color: c.muted }]}>
                      Earned {a.earnedOn}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Unlocked Badges ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Unlocked
          </Text>
          <View style={[styles.countBadge, { backgroundColor: c.tealDim }]}>
            <Text style={[styles.countBadgeText, { color: c.teal }]}>{earnedBadges}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {unlocked.map((a) => (
            <View key={a.id} style={styles.gridItem}>
              <AchievementBadge achievement={a} onPress={handleBadgePress} />
            </View>
          ))}
        </View>

        {/* ── Locked Badges ── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            Locked
          </Text>
          <View style={[styles.countBadge, { backgroundColor: c.surface }]}>
            <Text style={[styles.countBadgeText, { color: c.muted }]}>{locked.length}</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {locked.map((a) => (
            <View key={a.id} style={styles.gridItem}>
              <AchievementBadge achievement={a} onPress={handleBadgePress} />
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BadgeDetailModal
        visible={modalVisible}
        achievement={selectedAchievement}
        onClose={() => {
          setModalVisible(false);
          setSelectedAchievement(null);
        }}
      />

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
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Hero banner
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLeft: { gap: 4, flex: 1 },
  heroLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
  },
  heroCount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D1117',
    letterSpacing: -0.5,
  },
  heroSub: { fontSize: 13, color: 'rgba(0,0,0,0.55)', fontWeight: '500' },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 32 },

  progressBarWrapper: { marginBottom: 20, gap: 6 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 12, fontWeight: '700' },

  // Recently earned
  recentCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  recentTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentIcon: { fontSize: 24 },
  recentName: { fontSize: 14, fontWeight: '700' },
  recentDate: { fontSize: 12, marginTop: 2 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '30%', flexGrow: 1, maxWidth: '33%' },
});
