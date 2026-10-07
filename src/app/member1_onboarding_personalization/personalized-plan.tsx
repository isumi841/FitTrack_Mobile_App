import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Animated, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { useTheme } from '@/constants/theme';
import { getOnboardingData, type OnboardingData } from '@/features/member1/utils/onboarding-store';

const alternatives = ['Low-impact strength circuit', 'Beginner cardio flow'];

function label(value: string | number | undefined, fallback: string) {
  if (!value) return fallback;
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PersonalizedPlanScreen() {
  const t = useTheme();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const images = [
    require('../../../assets/images/P(1).png'),
    require('../../../assets/images/P(2).png'),
    require('../../../assets/images/P(6).png'),
    require('../../../assets/images/png3.png'),
  ];

  useEffect(() => { getOnboardingData().then(setData); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [fadeAnim]);

  const fitnessLevel = label(data?.fitnessLevel, 'Beginner');
  const fitnessGoal = label(data?.fitnessGoal, 'Lose Weight');
  const time = `${data?.availableTime || 15} min`;
  const accent = t.isDark ? t.primaryLime : t.primaryGreen;

  return (
    <MobileScreenContainer>
      <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={t.textPrimary} />
            <Text style={[styles.backText, { color: t.textPrimary }]}>Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Your Personalized Plan</Text>
          <Pressable style={[styles.profileButton, { borderColor: t.border }]} accessibilityRole="button" accessibilityLabel="Profile">
            <Ionicons name="person-outline" size={18} color={t.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.basedOn, { color: t.textMuted }]}>BASED ON</Text>
          <View style={styles.chips}>
            {[fitnessLevel, fitnessGoal, time].map((item) => <View key={item} style={[styles.chip, { backgroundColor: t.limeDim }]}><Text style={[styles.chipText, { color: accent }]}>{item}</Text></View>)}
          </View>

          <View style={[styles.card, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
            <View style={styles.imageWrap}>
              <Animated.Image source={images[currentImageIndex]} style={[styles.image, { opacity: fadeAnim }]} resizeMode="cover" />
              <View style={styles.levelBadge}><Text style={styles.levelText}>{fitnessLevel.toUpperCase()}</Text></View>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Full Body {fitnessLevel} Workout</Text>
              <Text style={[styles.description, { color: t.textSecondary }]}>A balanced session built to support your {fitnessGoal.toLowerCase()} goal.</Text>
              <View style={styles.metadata}>
                <Meta icon="time-outline" text={time} color={t.textPrimary} muted={t.textMuted} />
                <Meta icon="person-outline" text={fitnessLevel} color={t.textPrimary} muted={t.textMuted} />
                <Meta icon="flame-outline" text="140 kcal" color={t.textPrimary} muted={t.textMuted} />
              </View>
              <View style={styles.tags}>{['Jumping Jacks', 'Bodyweight Squats', 'Plank Hold'].map((exercise) => <View key={exercise} style={[styles.tag, { backgroundColor: t.surface }]}><Text style={[styles.tagText, { color: t.textSecondary }]}>{exercise}</Text></View>)}</View>
            </View>
          </View>

          <Pressable onPress={() => router.push('/member1_onboarding_personalization/workout-session' as any)} style={[styles.primaryButton, { backgroundColor: accent }]} accessibilityRole="button">
            <Text style={[styles.primaryText, { color: t.isDark ? '#080D0B' : '#FFFFFF' }]}>START WORKOUT</Text>
            <Ionicons name="arrow-forward" size={18} color={t.isDark ? '#080D0B' : '#FFFFFF'} />
          </Pressable>
          <Pressable onPress={() => setShowAlternatives((current) => !current)} style={[styles.secondaryButton, { borderColor: t.border }]} accessibilityRole="button">
            <Text style={[styles.secondaryText, { color: t.textPrimary }]}>{showAlternatives ? 'HIDE ALTERNATIVES' : 'SEE MORE ALTERNATIVES'}</Text>
          </Pressable>
          {showAlternatives && <View style={styles.alternatives}>{alternatives.map((title) => <View key={title} style={[styles.alternativeCard, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}><Ionicons name="fitness-outline" size={18} color={accent} /><View style={styles.alternativeCopy}><Text style={[styles.alternativeTitle, { color: t.textPrimary }]}>{title}</Text><Text style={[styles.alternativeMeta, { color: t.textSecondary }]}>{time} · {fitnessLevel}</Text></View></View>)}</View>}
        </ScrollView>

        <View style={[styles.nav, { backgroundColor: '#171B19' }]}>
          <NavItem icon="home-outline" label="Home" color={t.textMuted} />
          <NavItem icon="barbell-outline" label="Workouts" color={accent} active />
          <NavItem icon="stats-chart-outline" label="Progress" color={t.textMuted} />
          <NavItem icon="person-outline" label="Profile" color={t.textMuted} />
        </View>
      </SafeAreaView>
    </MobileScreenContainer>
  );
}

function Meta({ icon, text, color, muted }: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string; muted: string }) {
  return <View style={styles.meta}><Ionicons name={icon} size={15} color={muted} /><Text style={[styles.metaText, { color }]}>{text}</Text></View>;
}

function NavItem({ icon, label, color, active = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; active?: boolean }) {
  return <Pressable style={[styles.navItem, active && styles.activeNav]} accessibilityRole="tab" accessibilityState={{ selected: active }}><Ionicons name={icon} size={20} color={color} /><Text style={[styles.navText, { color }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, header: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerButton: { width: 58, flexDirection: 'row', alignItems: 'center' }, backText: { fontSize: 12 }, headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', textAlign: 'center' }, profileButton: { width: 34, height: 34, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22 }, basedOn: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 }, chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 }, chipText: { fontSize: 11, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }, imageWrap: { height: 170, position: 'relative' }, image: { width: '100%', height: '100%' }, levelBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: '#FFFFFF' }, levelText: { color: '#152018', fontSize: 10, fontWeight: '800' }, cardContent: { padding: 15 }, cardTitle: { fontSize: 19, fontWeight: '800', marginBottom: 5 }, description: { fontSize: 13, lineHeight: 19, marginBottom: 14 }, metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaText: { fontSize: 11, fontWeight: '600' }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tag: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 }, tagText: { fontSize: 10, fontWeight: '600' },
  primaryButton: { height: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 10 }, primaryText: { fontSize: 14, fontWeight: '800' }, secondaryButton: { height: 50, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, secondaryText: { fontSize: 12, fontWeight: '700' }, alternatives: { gap: 8, marginTop: 12 }, alternativeCard: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 14, padding: 12 }, alternativeCopy: { flex: 1 }, alternativeTitle: { fontSize: 13, fontWeight: '700' }, alternativeMeta: { fontSize: 11, marginTop: 3 },
  nav: { minHeight: 72, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-around', borderTopLeftRadius: 22, borderTopRightRadius: 22 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12 }, activeNav: { backgroundColor: 'rgba(184,245,42,0.12)' }, navText: { fontSize: 10, fontWeight: '600' },
});
