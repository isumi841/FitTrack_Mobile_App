import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { saveOnboardingData } from '@/features/member1/utils/onboarding-store';
import { useTheme } from '@/features/member1/constants/theme';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';
import { OnboardingProgress } from '@/features/member1/components/OnboardingProgress';
import { PrimaryButton } from '@/features/member1/components/PrimaryButton';
import { ThemeToggle } from '@/features/member1/components/ThemeToggle';
import { Ionicons } from '@expo/vector-icons';

type AvailableTime = 5 | 15 | 30 | 'custom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface TimeOptionCardProps {
  title: string;
  description: string;
  tag?: string;
  kcal?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: () => void;
  isCustom?: boolean;
  onEditCustom?: () => void;
}

function TimeOptionCard({ title, description, tag, kcal, iconName, selected, onSelect, isCustom, onEditCustom }: TimeOptionCardProps) {
  const t = useTheme();

  return (
    <Pressable
      style={[
        styles.timeCard,
        {
          backgroundColor: selected ? '#181C26' : '#101218',
          borderColor: selected ? t.lime : '#242835',
        }
      ]}
      onPress={onSelect}
    >
      <View style={[styles.iconBox, { backgroundColor: '#1A1D24' }]}>
        <Ionicons name={iconName} size={18} color={selected ? t.lime : '#FFF'} />
      </View>

      <View style={styles.timeCardBody}>
        <View style={styles.timeTitleRow}>
          <Text style={[styles.timeTitle, { color: '#FFF' }]}>{title}</Text>
          {tag && (
            <Text style={[styles.timeTag, { color: t.teal }]}>{tag}</Text>
          )}
        </View>
        <Text style={[styles.timeDesc, { color: '#AAA' }]}>{description}</Text>
      </View>

      <View style={styles.timeCardRight}>
        {kcal && (
          <Text style={[styles.kcalText, { color: '#AAA' }]}>{kcal}</Text>
        )}
        {isCustom && (
          <Pressable style={styles.customBtn} onPress={onEditCustom}>
            <Text style={styles.customBtnText}>Set</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function AvailableTimeScreen() {
  const t = useTheme();
  const [time, setTime] = useState<AvailableTime | null>(null);
  const [customVal, setCustomVal] = useState<number>(45);
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2]); // Default selection

  const toggleDay = (index: number) => {
    setSelectedDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

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
            Set your schedule
          </Text>

          {/* Days Selector - Bubbles */}
          <View style={[styles.daysContainer, { backgroundColor: '#101218', borderColor: '#242835' }]}>
            <View style={styles.streakHeader}>
              <Ionicons name="flame" size={24} color="#FF5722" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.streakLabel}>STREAK</Text>
                <Text style={styles.streakValue}>32 <Text style={styles.streakValueSub}>DAYS</Text></Text>
              </View>
            </View>

            <View style={styles.bubblesRow}>
              {DAYS.map((day, index) => {
                const isSelected = selectedDays.includes(index);
                return (
                  <Pressable
                    key={day}
                    style={styles.dayCol}
                    onPress={() => toggleDay(index)}
                  >
                    <View style={[
                      styles.dayBubble,
                      {
                        backgroundColor: isSelected ? t.lime : '#1A1D24',
                        borderColor: isSelected ? t.lime : '#333',
                        borderWidth: isSelected ? 0 : 1
                      }
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#000" />}
                    </View>
                    <Text style={styles.dayText}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={[styles.subHeading, { color: t.textPrimary, marginTop: 24 }]}>
            How much time do you have?
          </Text>

          {/* Time Options Container */}
          <View style={[styles.daysContainer, { backgroundColor: '#101218', borderColor: '#242835', marginTop: 8 }]}>
            <View style={styles.streakHeader}>
              <Ionicons name="time" size={24} color="#00E676" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.streakLabel}>DURATION</Text>
                <Text style={styles.streakValue}>
                  {time ? (time === 'custom' ? customVal : time) : '--'} <Text style={styles.streakValueSub}>MIN/DAY</Text>
                </Text>
              </View>
            </View>

            <View style={styles.optionsContainer}>
            <TimeOptionCard
              title="5 MIN"
              tag="EXPRESS"
              description="Warm-up + fast movement"
              kcal="≈ 35–60 kcal"
              iconName="time-outline"
              selected={time === 5}
              onSelect={() => setTime(5)}
            />

            <TimeOptionCard
              title="15 MIN"
              tag="RECOMMENDED"
              description="Balanced full-body workout"
              kcal="≈ 100–160 kcal"
              iconName="time-outline"
              selected={time === 15}
              onSelect={() => setTime(15)}
            />

            <TimeOptionCard
              title="30 MIN"
              tag="FULL SESSION"
              description="Strength + cardio session"
              kcal="≈ 200–300 kcal"
              iconName="time-outline"
              selected={time === 30}
              onSelect={() => setTime(30)}
            />

            <TimeOptionCard
              title={time === 'custom' ? `${customVal} MIN` : 'CUSTOM'}
              description="Set your own time"
              iconName="options-outline"
              selected={time === 'custom'}
              onSelect={() => setTime('custom')}
              isCustom={true}
              onEditCustom={handleCustomSelect}
            />
            </View>
          </View>

          <View style={styles.spacer} />

          {/* Summary Box */}
          {time && selectedDays.length > 0 && (
            <View style={[styles.summaryBox, { backgroundColor: 'rgba(0, 230, 118, 0.1)', borderColor: '#00E676' }]}>
              <Ionicons name="calendar-outline" size={20} color="#00E676" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryText, { color: '#00E676' }]}>
                  Your Commitment:
                </Text>
                <Text style={[styles.summarySubText, { color: '#FFF' }]}>
                  {selectedDays.length} Days/week • {currentDuration} Min/day
                </Text>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <PrimaryButton
              title="NEXT →"
              onPress={async () => {
                await saveOnboardingData({ availableTime: currentDuration });
                router.push('/member1_onboarding_personalization/signup');
              }}
              disabled={!time || selectedDays.length === 0}
            />
          </View>
        </ScrollView>

        {/* Custom Time Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Set Custom Time</Text>
              <Text style={[styles.modalSubtitle, { color: t.textSecondary }]}>Select your preferred workout duration in minutes.</Text>

              <View style={styles.customGrid}>
                {customOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[styles.customTile, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}
                    onPress={() => handleSetCustom(opt)}>
                    <Text style={[styles.customTileText, { color: t.textPrimary }]}>{opt} min</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.modalClose} onPress={() => setShowModal(false)}>
                <Text style={[styles.modalCloseText, { color: t.textSecondary }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
    marginBottom: 20,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  /* Days Selector Styles */
  daysContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  streakLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  streakValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  streakValueSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCC',
  },
  bubblesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Time Options Styles */
  optionsContainer: {
    gap: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timeCardBody: {
    flex: 1,
  },
  timeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
  timeTag: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeDesc: {
    fontSize: 13,
  },
  timeCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  kcalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1A1D24',
  },

  customBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summarySubText: {
    fontSize: 15,
    fontWeight: '700',
  },

  spacer: { flex: 1, minHeight: 30 },
  footer: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  customGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  customTile: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTileText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
