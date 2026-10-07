import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveOnboardingData } from '@/features/member1/utils/onboarding-store';
import { useTheme } from '@/constants/theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { OnboardingProgress } from '@/components/member1/OnboardingProgress';
import { PrimaryButton } from '@/components/member1/PrimaryButton';
import { SelectableOptionCard } from '@/components/member1/SelectableOptionCard';
import { ThemeToggle } from '@/components/member1/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

type AvailableTime = 5 | 15 | 30 | 'custom';

export default function AvailableTimeScreen() {
  const t = useTheme();
  const [time, setTime] = useState<AvailableTime | null>(null);
  const [customVal, setCustomVal] = useState<number>(45);
  const [showModal, setShowModal] = useState(false);

  const customOptions = [10, 20, 25, 40, 45, 60];

  const handleCustomSelect = () => {
    setTime('custom');
    setShowModal(true);
  };

  const handleSetCustom = (val: number) => {
    setCustomVal(val);
    setShowModal(false);
  };

  const currentDuration = time === 'custom' ? customVal : time || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]}>
      <MobileScreenContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <OnboardingProgress currentStep={4} />
            </View>
            <ThemeToggle style={styles.themeToggle} />
          </View>

          <Text style={[styles.heading, { color: t.textPrimary }]}> 
            How much time do you have today?
          </Text>

          <View style={styles.optionsContainer}>
            <SelectableOptionCard
              title="5 MIN"
              description="Warm-up + fast movement"
              tag="Express"
              rightData="≈ 35–60 kcal"
              iconName="time-outline"
              selected={time === 5}
              onSelect={() => setTime(5)}
            />
            
            <SelectableOptionCard
              title="15 MIN"
              description="Balanced full-body workout"
              tag="Recommended"
              rightData="≈ 100–160 kcal"
              iconName="time-outline"
              selected={time === 15}
              onSelect={() => setTime(15)}
            />
            
            <SelectableOptionCard
              title="30 MIN"
              description="Strength + cardio session"
              tag="Full Session"
              rightData="≈ 200–300 kcal"
              iconName="time-outline"
              selected={time === 30}
              onSelect={() => setTime(30)}
            />

            <SelectableOptionCard
              title={time === 'custom' ? `${customVal} MIN` : 'CUSTOM'}
              description="Set your own time"
              tag={time === 'custom' ? 'Custom' : undefined}
              iconName="options-outline"
              selected={time === 'custom'}
              onSelect={handleCustomSelect}
              rightAction={
                <Pressable 
                  onPress={handleCustomSelect}
                  hitSlop={10}
                  style={[
                    styles.setButton,
                    {
                      backgroundColor: time === 'custom'
                        ? t.secondaryTeal
                        : t.surfaceElevated,
                      borderColor: time === 'custom' ? t.secondaryTeal : t.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.setButtonText,
                      {
                        color: time === 'custom'
                          ? (t.isDark ? '#080D0B' : '#FFFFFF')
                          : t.textPrimary,
                      },
                    ]}>
                    {time === 'custom' ? 'Edit' : 'Set'}
                  </Text>
                </Pressable>
              }
            />
          </View>

          {time && (
            <View style={[styles.summaryCard, { backgroundColor: t.tealDim, borderColor: t.secondaryTeal }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="calendar-outline" size={16} color={t.secondaryTeal} />
                <Text style={[styles.summaryTitle, { color: t.textPrimary }]}>TODAY&apos;S PLAN</Text>
              </View>
              <Text style={[styles.summaryData, { color: t.textSecondary }]}>
                Duration: <Text style={{ color: t.textPrimary, fontWeight: '700' }}>{currentDuration} min</Text>
              </Text>
              <Text style={[styles.summaryData, { color: t.textSecondary }]}>
                Intensity: <Text style={{ color: t.textPrimary, fontWeight: '700' }}>Based on fitness level</Text>
              </Text>
            </View>
          )}

          <View style={styles.spacer} />
          
          <View style={styles.footer}>
            <PrimaryButton 
              title="CONTINUE →" 
              onPress={async () => {
                await saveOnboardingData({ availableTime: currentDuration });
                router.push('/member1_onboarding_personalization/signup');
              }} 
              disabled={!time}
            />
          </View>
        </ScrollView>
      </MobileScreenContainer>

      {/* Modal for Custom Duration */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select Duration</Text>
            <View style={styles.modalGrid}>
              {customOptions.map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.modalOption,
                    {
                      backgroundColor: customVal === opt ? t.tealDim : t.surface,
                      borderColor: customVal === opt ? t.secondaryTeal : t.border,
                    },
                  ]}
                  onPress={() => handleSetCustom(opt)}>
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: customVal === opt ? t.secondaryTeal : t.textPrimary },
                    ]}>
                    {opt} min
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowModal(false)}>
              <Text style={[styles.modalCloseText, { color: t.textSecondary }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  optionsContainer: {
    marginBottom: 18,
  },
  setButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  setButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  summaryCard: {
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryData: {
    fontSize: 13,
    marginBottom: 4,
  },
  spacer: { flex: 1, minHeight: 30 },
  footer: { paddingTop: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalOption: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
