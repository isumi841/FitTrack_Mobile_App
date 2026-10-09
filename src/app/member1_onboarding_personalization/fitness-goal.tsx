import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveOnboardingData } from '@/features/member1/utils/onboarding-store';
import { useTheme } from '@/features/member1/constants/theme';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';
import { OnboardingProgress } from '@/features/member1/components/OnboardingProgress';
import { PrimaryButton } from '@/features/member1/components/PrimaryButton';
import { ThemeToggle } from '@/features/member1/components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

type FitnessGoal = 'lose_weight' | 'build_muscle' | 'improve_stamina' | 'stay_active' | 'reduce_stress' | 'improve_flexibility' | 'improve_balance';

const IMG_GOAL1 = require('@/assets/images/member1/goal1.png');
const IMG_GOAL2 = require('@/assets/images/member1/goal2.png');
const IMG_GOAL3 = require('@/assets/images/member1/png1.png');
const IMG_GOAL4 = require('@/assets/images/member1/png2.png');
const IMG_GOAL5 = require('@/assets/images/member1/png3.png');
const IMG_GOAL6 = require('@/assets/images/member1/png4.png');
const IMG_GOAL7 = require('@/assets/images/member1/png5.png');

interface GoalOption {
  key: FitnessGoal;
  title: string;
  description: string;
  tag: string;
  image: ImageSourcePropType;
}

const GOALS: GoalOption[] = [
  {
    key: 'lose_weight',
    title: 'LOSE WEIGHT',
    description: 'Burn fat and improve cardio',
    tag: 'Fat Burn',
    image: IMG_GOAL1,
  },
  {
    key: 'build_muscle',
    title: 'BUILD MUSCLE',
    description: 'Gain strength and lean mass',
    tag: 'Strength',
    image: IMG_GOAL2,
  },
  {
    key: 'improve_stamina',
    title: 'IMPROVE STAMINA',
    description: 'Boost endurance and energy',
    tag: 'Endurance',
    image: IMG_GOAL3,
  },
  {
    key: 'stay_active',
    title: 'STAY ACTIVE',
    description: 'Stay consistent every day',
    tag: 'Daily Movement',
    image: IMG_GOAL4,
  },
  {
    key: 'reduce_stress',
    title: 'REDUCE STRESS',
    description: 'Move, breathe and reset',
    tag: 'Wellness',
    image: IMG_GOAL5,
  },
  {
    key: 'improve_flexibility',
    title: 'IMPROVE FLEXIBILITY',
    description: 'Move freely and stretch better',
    tag: 'FLEXIBILITY 🧘',
    image: IMG_GOAL6,
  },
  {
    key: 'improve_balance',
    title: 'IMPROVE BALANCE',
    description: 'Build stability and body control',
    tag: 'BALANCE ⚖️',
    image: IMG_GOAL7,
  }
];

export default function FitnessGoalScreen() {
  const t = useTheme();
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <MobileScreenContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>

          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <OnboardingProgress currentStep={3} />
            </View>
            <ThemeToggle style={styles.themeToggle} />
          </View>

          <Text style={[styles.heading, { color: t.textPrimary }]}>
            What&apos;s your goal?
          </Text>

          <View style={styles.listContainer}>
            {GOALS.map((opt) => {
              const isSelected = selectedGoal === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[
                    styles.card,
                    { backgroundColor: isSelected ? '#181C26' : '#101218', borderColor: isSelected ? t.lime : '#242835' }
                  ]}
                  onPress={() => setSelectedGoal(opt.key)}
                >
                  {isSelected && <View style={[styles.selectedAccent, { backgroundColor: t.lime }]} />}
                  <View style={styles.cardContent}>
                    <View style={styles.textSection}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={[styles.cardTitle, { color: t.textHeading }]}>{opt.title}</Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={t.lime} style={{ marginLeft: 6 }} />
                        )}
                      </View>
                      <Text style={[styles.cardDescription, { color: t.muted }]}>{opt.description}</Text>
                      <View style={[styles.tagBadge, { backgroundColor: t.surface }]}>
                        <Text style={[styles.tagText, { color: t.teal }]}>{opt.tag}</Text>
                      </View>
                    </View>

                    <Image source={opt.image} style={styles.cardImage} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <PrimaryButton
              title="NEXT →"
              onPress={async () => {
                await saveOnboardingData({ fitnessGoal: selectedGoal || '' });
                router.push('/member1_onboarding_personalization/available-time');
              }}
              disabled={!selectedGoal}
            />
          </View>
        </ScrollView>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  themeToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  listContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  selectedAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 110,
  },
  textSection: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardImage: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  spacer: { flex: 1, minHeight: 30 },
  footer: {
    marginTop: 10,
  },
});
