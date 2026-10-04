import { router, type Href } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { NAV_COLORS as N } from '@/components/navigation/navigation-theme';
import { M4Screen } from '@/features/member4/components/M4Screen';
import { ProfileIcon } from '@/features/member4/components/ProfileIcon';
import { ProfilePressable, ProfileProgressBar, ProfileReveal } from '@/features/member4/components/ProfileMotion';
import { mockAchievements, mockGoals, mockProgressStats, mockUserProfile } from '@/features/member4/data/mockData';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

export default function ProfileScreen() {
  const c = useM4Theme();
  const dark = useColorScheme() === 'dark';
  const profile = mockUserProfile;
  const weeklyGoal = mockGoals.find((goal) => goal.type === 'Workouts per week');
  const earned = mockAchievements.filter((badge) => badge.isUnlocked).length;
  const badgeProgress = mockAchievements.length ? Math.round(earned / mockAchievements.length * 100) : 0;
  const activeGoals = mockGoals.filter((goal) => goal.currentValue < goal.targetValue).length;

  // Always push detail pages so Back returns here, including shared History routes.
  const open = (href: Href) => router.push(href);

  return (
    <M4Screen>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <ProfilePressable label="Back" testID="profile-back"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
          style={[styles.backButton, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
          <ProfileIcon name="arrow-left" color={c.text} size={20} />
        </ProfilePressable>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: c.text }]}>User Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <ProfileReveal>
          <ProfilePressable label={`Edit profile for ${profile.fullName}`} hint="Opens your personal details and fitness focus"
            testID="profile-edit" onPress={() => open('/member4/edit-profile')} style={styles.hero}>
            <View pointerEvents="none" style={styles.heroOrbit} />
            <View style={styles.heroTop}>
              <Text style={styles.eyebrow}>YOUR FITNESS, YOUR WAY</Text>
              <View style={styles.editPill}>
                <Text style={styles.editText}>Edit profile</Text>
                <NavigationIcon name="chevron" color={N.accent} size={12} />
              </View>
            </View>
            <View style={styles.identity}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.initials}>{profile.avatarInitials}</Text>
                </View>
                {profile.emailVerified && (
                  <View style={styles.verified}>
                    <ProfileIcon name="check" color={N.ink} size={12} />
                  </View>
                )}
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.name}>{profile.fullName}</Text>
                <Text style={styles.username}>{profile.username}</Text>
                <View style={styles.focusTag}>
                  <ProfileIcon name="spark" color={N.accent} size={12} />
                  <Text style={styles.focusText}>{profile.fitnessFocusTags[0] ?? 'Keep moving forward'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.heroFooter}>
              <View style={styles.streak}>
                <View style={styles.liveDot} />
                <Text style={styles.streakText}>{mockProgressStats.streakDays}-day streak</Text>
              </View>
              <Text style={styles.footerMessage}>Small steps. Stronger you.</Text>
            </View>
          </ProfilePressable>
        </ProfileReveal>

        <ProfileReveal delay={60}>
          <SectionHeading title="YOUR MILESTONES" subtitle="Keep the momentum" />
          <View style={styles.cardStack}>
            <ProfilePressable label={`My Goals, ${activeGoals} active${weeklyGoal ? `, ${weeklyGoal.currentValue} of ${weeklyGoal.targetValue} workouts this week` : ''}`} hint="View and manage your fitness goals"
              testID="profile-goals" onPress={() => open('/member4/goals')}
              style={[styles.milestone, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
              <View style={styles.milestoneTop}>
                <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                  <NavigationIcon name="goal" color={c.teal} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>My Goals</Text>
                  <Text style={[styles.rowDescription, { color: c.muted }]}>{weeklyGoal?.remainingLabel ?? 'Set your next milestone'}</Text>
                </View>
                <NavigationIcon name="chevron" color={c.muted} size={17} />
              </View>
              <View style={styles.progressCopy}>
                <Text style={[styles.progressLabel, { color: c.muted }]}>{activeGoals} active {activeGoals === 1 ? 'goal' : 'goals'}</Text>
                <Text style={[styles.progressValue, { color: c.teal }]}>{weeklyGoal ? `${weeklyGoal.currentValue}/${weeklyGoal.targetValue} this week` : 'Get started'}</Text>
              </View>
              <ProfileProgressBar value={weeklyGoal?.progressPct ?? 0} color={c.teal} trackColor={c.tealDim} label="Weekly workout goal" />
            </ProfilePressable>

            <ProfilePressable label={`Achievements, ${earned} of ${mockAchievements.length} badges earned`}
              hint="Explore your earned badges and upcoming achievements" testID="profile-achievements"
              onPress={() => open('/member4/achievements')}
              style={[styles.milestone, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
              <View style={styles.milestoneTop}>
                <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                  <ProfileIcon name="badge" color={c.teal} />
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>Achievements</Text>
                  <Text style={[styles.rowDescription, { color: c.muted }]}>Every effort deserves a badge</Text>
                </View>
                <NavigationIcon name="chevron" color={c.muted} size={17} />
              </View>
              <View style={styles.progressCopy}>
                <Text style={[styles.progressLabel, { color: c.muted }]}>{earned} of {mockAchievements.length} earned</Text>
                <Text style={[styles.progressValue, { color: c.teal }]}>{badgeProgress}% unlocked</Text>
              </View>
              <ProfileProgressBar value={badgeProgress} color={c.teal} trackColor={c.tealDim} label="Badges unlocked" />
            </ProfilePressable>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={120}>
          <SectionHeading title="YOUR ROUTINE" subtitle="Make it yours" />
          <View style={[styles.settingsGroup, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <ProfilePressable label="Workout Reminders" hint="Choose workout times and days"
              testID="profile-reminders" onPress={() => open('/member4/workout-reminder')} style={styles.settingsRow}>
              <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                <NavigationIcon name="reminder" color={c.teal} size={22} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: c.text }]}>Workout Reminders</Text>
                <Text style={[styles.rowDescription, { color: c.muted }]}>Make time for your next session</Text>
              </View>
              <NavigationIcon name="chevron" color={c.muted} size={17} />
            </ProfilePressable>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <ProfilePressable label="Workout History" hint="Browse previous workouts and completed sessions"
              testID="profile-history" onPress={() => open('/member4/workout-history')} style={styles.settingsRow}>
              <View style={[styles.iconTile, { backgroundColor: c.tealDim }]}>
                <ProfileIcon name="history" color={c.teal} size={22} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: c.text }]}>Workout History</Text>
                <Text style={[styles.rowDescription, { color: c.muted }]}>Look back at how far you’ve come</Text>
              </View>
              <NavigationIcon name="chevron" color={c.muted} size={17} />
            </ProfilePressable>
          </View>
        </ProfileReveal>

        <ProfileReveal delay={180}>
          <View style={[styles.appearance, { borderColor: c.cardBdr }]}>
            <ProfileIcon name="appearance" color={c.muted} size={20} />
            <View style={styles.rowCopy}>
              <Text style={[styles.appearanceTitle, { color: c.text }]}>Following device appearance</Text>
              <Text style={[styles.rowDescription, { color: c.muted }]}>{dark ? 'Dark' : 'Light'} mode is currently active</Text>
            </View>
            <View style={[styles.systemPill, { backgroundColor: c.tealDim }]}>
              <Text style={[styles.systemText, { color: c.teal }]}>System</Text>
            </View>
          </View>
          <View style={styles.signature}>
            <Text style={[styles.brand, { color: c.muted }]}>FITTRACK</Text>
            <Text style={[styles.signatureText, { color: c.muted }]}>Your pace. Your progress.</Text>
          </View>
        </ProfileReveal>
      </ScrollView>
    </M4Screen>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const c = useM4Theme();
  return (
    <View style={styles.sectionHeading}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: c.muted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 16 : 8, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: -0.4 },
  headerSpacer: { width: 44 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 12 },
  hero: { backgroundColor: N.surface, borderRadius: 26, borderWidth: 1, borderColor: N.border, padding: 20, overflow: 'hidden' },
  heroOrbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 30, borderColor: 'rgba(212,249,85,0.035)', top: -110, right: -95 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 22 },
  eyebrow: { color: N.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  editPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  editText: { color: N.accent, fontSize: 11, fontWeight: '600' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 64, height: 64 },
  avatar: { width: 64, height: 64, borderRadius: 23, backgroundColor: N.accent, alignItems: 'center', justifyContent: 'center' },
  initials: { color: N.ink, fontSize: 25, fontWeight: '800', letterSpacing: -1 },
  verified: { position: 'absolute', right: -4, bottom: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: N.accent, borderWidth: 3, borderColor: N.surface, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 23, fontWeight: '700', letterSpacing: -0.8, color: N.text },
  username: { fontSize: 12, color: N.muted, marginTop: 4 },
  focusTag: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: N.accentSoft, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7, marginTop: 10 },
  focusText: { flexShrink: 1, color: N.accent, fontSize: 10, fontWeight: '600' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: N.border, paddingTop: 16, marginTop: 22 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: N.accent },
  streakText: { color: N.text, fontSize: 11, fontWeight: '600' },
  footerMessage: { color: N.muted, fontSize: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  sectionSubtitle: { fontSize: 10 },
  cardStack: { gap: 12 },
  milestone: { borderRadius: 21, borderWidth: 1, padding: 16, gap: 12 },
  milestoneTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.25 },
  rowDescription: { fontSize: 11, lineHeight: 16 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  progressLabel: { fontSize: 10, fontWeight: '500' },
  progressValue: { fontSize: 10, fontWeight: '700' },
  settingsGroup: { borderRadius: 21, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 82 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70, marginRight: 16 },
  appearance: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 16 },
  appearanceTitle: { fontSize: 11, fontWeight: '600' },
  systemPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  systemText: { fontSize: 10, fontWeight: '600' },
  signature: { alignItems: 'center', paddingTop: 25, paddingBottom: 12, gap: 5 },
  brand: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8 },
  signatureText: { fontSize: 10 },
});
