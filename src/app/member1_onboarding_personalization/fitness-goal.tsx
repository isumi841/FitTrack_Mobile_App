import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveOnboardingData } from '@/features/member1/utils/onboarding-store';
import { useTheme } from '@/features/member1/theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { OnboardingProgress } from '@/components/member1/OnboardingProgress';
import { PrimaryButton } from '@/components/member1/PrimaryButton';
import { GridOptionCard } from '@/components/member1/GridOptionCard';
import { ThemeToggle } from '@/components/member1/ThemeToggle';

type FitnessGoal = 'lose_weight' | 'build_muscle' | 'improve_stamina' | 'stay_active' | 'reduce_stress' | 'improve_flexibility';

export default function FitnessGoalScreen() {
  const t = useTheme();
  const [goal, setGoal] = useState<FitnessGoal | null>(null);

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

          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <GridOptionCard
                title="LOSE WEIGHT"
                description="Burn fat and improve cardio"
                tag="Fat Burn"
                iconName="flame-outline"
                selected={goal === 'lose_weight'}
                onSelect={() => setGoal('lose_weight')}
              />
              <GridOptionCard
                title="BUILD MUSCLE"
                description="Gain strength and lean mass"
                tag="Strength"
                iconName="barbell-outline"
                selected={goal === 'build_muscle'}
                onSelect={() => setGoal('build_muscle')}
              />
            </View>
            <View style={styles.row}>
              <GridOptionCard
                title="IMPROVE STAMINA"
                description="Boost endurance and energy"
                tag="Endurance"
                iconName="pulse-outline"
                selected={goal === 'improve_stamina'}
                onSelect={() => setGoal('improve_stamina')}
              />
              <GridOptionCard
                title="STAY ACTIVE"
                description="Stay consistent every day"
                tag="Daily Movement"
                iconName="walk-outline"
                selected={goal === 'stay_active'}
                onSelect={() => setGoal('stay_active')}
              />
            </View>
            <View style={styles.row}>
              <GridOptionCard
                title="REDUCE STRESS"
                description="Move, breathe and reset"
                tag="Wellness"
                iconName="leaf-outline"
                selected={goal === 'reduce_stress'}
                onSelect={() => setGoal('reduce_stress')}
              />
              <GridOptionCard
                title="FLEXIBILITY"
                description="Improve mobility and movement"
                tag="Mobility"
                iconName="body-outline"
                selected={goal === 'improve_flexibility'}
                onSelect={() => setGoal('improve_flexibility')}
              />
            </View>
          </View>

          <View style={styles.spacer} />
          
          <View style={styles.footer}>
            <PrimaryButton 
              title="NEXT →" 
              onPress={async () => {
                await saveOnboardingData({ fitnessGoal: goal || '' });
                router.push('/member1_onboarding_personalization/available-time');
              }} 
              disabled={!goal}
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
    marginBottom: 12,
  },
  themeToggle: {
    position: 'absolute',
    right: 0,
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 33,
    letterSpacing: -0.4,
    marginBottom: 18,
    marginTop: 6,
  },
  gridContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spacer: { flex: 1, minHeight: 20 },
  footer: { paddingTop: 16 },
});
