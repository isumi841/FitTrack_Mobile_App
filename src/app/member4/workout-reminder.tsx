import { router } from 'expo-router';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  FitnessIcon,
  type FitnessIconName,
} from '@/features/member4/components/FitnessIcon';

import { M4Screen } from '@/features/member4/components/M4Screen';

import {
  ProfilePressable,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';

import {
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
  type ApiReminder,
  type ApiReminderDay,
  type ReminderPayload,
} from '@/features/member4/services/member4Service';

import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

type DayCode =
  ApiReminderDay;

type ReminderPreset = {
  id: string;
  label: string;
  time: string;
  description: string;
  icon: FitnessIconName;
};

const DAYS: DayCode[] = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const TIME_PRESETS: ReminderPreset[] = [
  {
    id: 'early',
    label: 'Early Morning',
    time: '06:30 AM',
    description: 'Start the day strong',
    icon: 'spark',
  },
  {
    id: 'morning',
    label: 'Morning',
    time: '08:00 AM',
    description: 'A fresh start before work',
    icon: 'activity',
  },
  {
    id: 'evening',
    label: 'Evening',
    time: '06:00 PM',
    description: 'Train after your day',
    icon: 'flame',
  },
  {
    id: 'night',
    label: 'Night',
    time: '08:30 PM',
    description: 'Finish the day with movement',
    icon: 'clock',
  },
];

function ReminderPulse({
  active,
}: {
  active: boolean;
}) {
  const c = useM4Theme();

  const pulse = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, pulse]);

  const ringStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [
        active ? 0.5 : 0,
        0,
      ],
    }),

    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.8],
        }),
      },
    ],
  };

  return (
    <View style={styles.pulseWrap}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: c.teal,
          },
          ringStyle,
        ]}
      />

      <View
        style={[
          styles.pulseDot,
          {
            backgroundColor: active
              ? c.teal
              : c.muted,
          },
        ]}
      />
    </View>
  );
}

export default function WorkoutReminderScreen() {
  const c = useM4Theme();

  const [
  reminderId,
  setReminderId,
] = useState<string | null>(
  null,
);

const [
  loadingReminder,
  setLoadingReminder,
] = useState(true);

const [
  savingReminder,
  setSavingReminder,
] = useState(false);

const [
  deletingReminder,
  setDeletingReminder,
] = useState(false);

  const [enabled, setEnabled] =
    useState(true);

  const [selectedTime, setSelectedTime] =
    useState('06:30 AM');

  const [selectedDays, setSelectedDays] =
    useState<DayCode[]>([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
    ]);

  const [soundEnabled, setSoundEnabled] =
    useState(true);

  const [vibrationEnabled, setVibrationEnabled] =
    useState(true);

  const [motivationalMessage, setMotivationalMessage] =
    useState(true);

  const [timeModalVisible, setTimeModalVisible] =
    useState(false);

  const [savedSnapshot, setSavedSnapshot] =
    useState({
      enabled: true,
      selectedTime: '06:30 AM',
      selectedDays: [
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
      ] as DayCode[],
      soundEnabled: true,
      vibrationEnabled: true,
      motivationalMessage: true,
    });

function applyReminder(
  reminder: ApiReminder,
) {
  const reminderDays: DayCode[] =
    [...reminder.days];

  setReminderId(
    reminder._id,
  );

  setEnabled(
    reminder.enabled,
  );

  setSelectedTime(
    reminder.time,
  );

  setSelectedDays(
    reminderDays,
  );

  setSoundEnabled(
    reminder.soundEnabled,
  );

  setVibrationEnabled(
    reminder.vibrationEnabled,
  );

  setMotivationalMessage(
    reminder.motivationalMessage,
  );

  setSavedSnapshot({
    enabled:
      reminder.enabled,

    selectedTime:
      reminder.time,

    selectedDays:
      reminderDays,

    soundEnabled:
      reminder.soundEnabled,

    vibrationEnabled:
      reminder.vibrationEnabled,

    motivationalMessage:
      reminder.motivationalMessage,
  });
}

useEffect(() => {
  let mounted = true;

  async function loadReminder() {
    try {
      setLoadingReminder(
        true,
      );

      const response =
        await getReminders();

      if (!mounted) {
        return;
      }

      const firstReminder =
        response.data[0];

      if (firstReminder) {
        applyReminder(
          firstReminder,
        );
      } else {
        setReminderId(
          null,
        );
      }
    } catch (error) {
      console.error(
        'Reminder load error:',
        error,
      );

      if (mounted) {
        Alert.alert(
          'Unable to load reminder',
          error instanceof Error
            ? error.message
            : 'Please try again.',
        );
      }
    } finally {
      if (mounted) {
        setLoadingReminder(
          false,
        );
      }
    }
  }

  void loadReminder();

  return () => {
    mounted = false;
  };
}, []);

  const hasChanges = useMemo(() => {
    return (
      enabled !== savedSnapshot.enabled ||
      selectedTime !==
        savedSnapshot.selectedTime ||
      JSON.stringify(selectedDays) !==
        JSON.stringify(
          savedSnapshot.selectedDays,
        ) ||
      soundEnabled !==
        savedSnapshot.soundEnabled ||
      vibrationEnabled !==
        savedSnapshot.vibrationEnabled ||
      motivationalMessage !==
        savedSnapshot.motivationalMessage
    );
  }, [
    enabled,
    motivationalMessage,
    savedSnapshot,
    selectedDays,
    selectedTime,
    soundEnabled,
    vibrationEnabled,
  ]);

  const canSave =
  !loadingReminder &&
  !savingReminder &&
  !deletingReminder &&
  (
    reminderId === null ||
    hasChanges
  );

  const scheduleLabel = useMemo(() => {
    if (!enabled) {
      return 'Reminder paused';
    }

    if (selectedDays.length === 7) {
      return `Every day at ${selectedTime}`;
    }

    if (selectedDays.length === 0) {
      return 'Select at least one day';
    }

    return `${selectedDays.join(
      ', ',
    )} at ${selectedTime}`;
  }, [
    enabled,
    selectedDays,
    selectedTime,
  ]);

  const nextReminderText = useMemo(() => {
    if (!enabled) {
      return 'Paused';
    }

    if (!selectedDays.length) {
      return 'No day selected';
    }

    return `${selectedDays[0]} • ${selectedTime}`;
  }, [
    enabled,
    selectedDays,
    selectedTime,
  ]);

  function handleBack() {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'Your reminder settings have not been saved.',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(
                  '/member4/progress',
                );
              }
            },
          },
        ],
      );

      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(
        '/member4/progress',
      );
    }
  }

  function toggleDay(day: DayCode) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter(
          (item) => item !== day,
        );
      }

      return DAYS.filter(
        (item) =>
          current.includes(item) ||
          item === day,
      );
    });
  }

  function selectWeekdays() {
    setSelectedDays([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
    ]);
  }

  function selectEveryDay() {
    setSelectedDays([...DAYS]);
  }

  function clearDays() {
    setSelectedDays([]);
  }

  async function handleSave() {
      if (
        loadingReminder ||
        savingReminder ||
        deletingReminder
      ) {
        return;
      }

      if (
        reminderId !== null &&
        !hasChanges
      ) {
        return;
      }

      if (
        enabled &&
        selectedDays.length === 0
      ) {
        Alert.alert(
          'Choose reminder days',
          'Please select at least one workout reminder day.',
        );

        return;
      }

  const payload:
    ReminderPayload = {
      enabled,

      time:
        selectedTime,

      days:
        selectedDays,

      soundEnabled,

      vibrationEnabled,

      motivationalMessage,

      timezone:
        'Asia/Colombo',

      label:
        'Workout reminder',
    };

  try {
    setSavingReminder(
      true,
    );

    const creating =
      reminderId === null;

    const response =
      creating
        ? await createReminder(
            payload,
          )
        : await updateReminder(
            reminderId,
            payload,
          );

    applyReminder(
      response.data,
    );

    Alert.alert(
      creating
        ? 'Reminder created'
        : 'Reminder updated',

      response.data.enabled
        ? `Your workout reminder is scheduled for ${response.data.time}.`
        : 'Your workout reminder has been paused.',
    );
  } catch (error) {
    console.error(
      'Reminder save error:',
      error,
    );

    Alert.alert(
      'Unable to save reminder',
      error instanceof Error
        ? error.message
        : 'Please try again.',
    );
  } finally {
    setSavingReminder(
      false,
    );
  }
}

function handleDeleteReminder() {
      if (
        !reminderId ||
        deletingReminder ||
        savingReminder
      ) {
        return;
      }

      Alert.alert(
        'Delete workout reminder?',
        'This reminder will be permanently removed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',

            onPress: async () => {
              try {
                setDeletingReminder(
                  true,
                );

                await deleteReminder(
                  reminderId,
                );

                const defaultDays:
                  DayCode[] = [
                    'Mon',
                    'Tue',
                    'Wed',
                    'Thu',
                    'Fri',
                  ];

                setReminderId(
                  null,
                );

                setEnabled(true);

                setSelectedTime(
                  '06:30 AM',
                );

                setSelectedDays(
                  defaultDays,
                );

                setSoundEnabled(
                  true,
                );

                setVibrationEnabled(
                  true,
                );

                setMotivationalMessage(
                  true,
                );

                setSavedSnapshot({
                  enabled: true,

                  selectedTime:
                    '06:30 AM',

                  selectedDays:
                    defaultDays,

                  soundEnabled:
                    true,

                  vibrationEnabled:
                    true,

                  motivationalMessage:
                    true,
                });

                Alert.alert(
                  'Reminder deleted',
                  'Your workout reminder has been removed.',
                );
              } catch (error) {
                console.error(
                  'Reminder delete error:',
                  error,
                );

                Alert.alert(
                  'Unable to delete reminder',
                  error instanceof Error
                    ? error.message
                    : 'Please try again.',
                );
              } finally {
                setDeletingReminder(
                  false,
                );
              }
            },
          },
        ],
      );
    }

  function restoreSettings() {
    setEnabled(savedSnapshot.enabled);
    setSelectedTime(
      savedSnapshot.selectedTime,
    );
    setSelectedDays([
      ...savedSnapshot.selectedDays,
    ]);
    setSoundEnabled(
      savedSnapshot.soundEnabled,
    );
    setVibrationEnabled(
      savedSnapshot.vibrationEnabled,
    );
    setMotivationalMessage(
      savedSnapshot.motivationalMessage,
    );
  }

  return (
    <M4Screen>
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            borderBottomColor: c.border,
          },
        ]}
      >
        <ProfilePressable
          label="Go back"
          onPress={handleBack}
          style={[
            styles.headerButton,
            {
              backgroundColor:
                c.cardBg,
              borderColor: c.cardBdr,
            },
          ]}
        >
          <FitnessIcon
            name="arrow-left"
            size={20}
            color={c.text}
          />
        </ProfilePressable>

        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.headerEyebrow,
              {
                color: c.muted,
              },
            ]}
          >
            FITTRACK / ROUTINE
          </Text>

          <Text
            accessibilityRole="header"
            style={[
              styles.headerTitle,
              {
                color: c.text,
              },
            ]}
          >
            Workout reminder.
          </Text>
        </View>

        <ProfilePressable
          label="Save reminder"
          onPress={() => {
              if (!canSave) {
                return;
              }

              void handleSave();
            }}
          style={[
            styles.headerSaveButton,
            {
              backgroundColor:
                canSave
                  ? c.teal
                  : c.surface,

              borderColor:
                canSave
                  ? c.teal
                  : c.border,

              opacity:
                canSave
                  ? 1
                  : 0.55,
            },
          ]}
        >
          <FitnessIcon
            name="check"
            size={18}
            color={
              canSave
                ? '#07130F'
                : c.muted
            }
          />
        </ProfilePressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}

        <ProfileReveal>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  enabled
                    ? c.teal
                    : c.cardBdr,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            />

            <View style={styles.heroTop}>
              <View
                style={[
                  styles.heroIcon,
                  {
                    backgroundColor:
                      c.tealDim,
                    borderColor:
                      enabled
                        ? c.teal
                        : c.border,
                  },
                ]}
              >
                <ReminderPulse
                  active={enabled}
                />

                <FitnessIcon
                  name="clock"
                  size={29}
                  color={
                    enabled
                      ? c.teal
                      : c.muted
                  }
                />
              </View>

              <View style={styles.heroCopy}>
                <Text
                  style={[
                    styles.heroEyebrow,
                    {
                      color:
                        enabled
                          ? c.teal
                          : c.muted,
                    },
                  ]}
                >
                  {enabled
                    ? 'REMINDER ACTIVE'
                    : 'REMINDER PAUSED'}
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Stay consistent,
                  one reminder at a time.
                </Text>

                <Text
                  style={[
                    styles.heroDescription,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  Build a reliable training
                  routine with a reminder that
                  fits your schedule.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.reminderStatusRow,
                {
                  borderTopColor:
                    c.border,
                },
              ]}
            >
              <View
                style={
                  styles.reminderStatusCopy
                }
              >
                <View
                  style={
                    styles.statusTitleRow
                  }
                >
                  <ReminderPulse
                    active={enabled}
                  />

                  <Text
                    style={[
                      styles.statusTitle,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    Workout reminders
                  </Text>
                </View>

                <Text
                  style={[
                    styles.statusDescription,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {enabled
                    ? 'Notifications are enabled.'
                    : 'Notifications are currently paused.'}
                </Text>
              </View>

              <Switch
                value={enabled}
                onValueChange={setEnabled}
                thumbColor={
                  enabled
                    ? c.teal
                    : c.muted
                }
                trackColor={{
                  false: c.surface,
                  true: c.tealDim,
                }}
              />
            </View>
          </View>
        </ProfileReveal>

        {/* NEXT REMINDER */}

        <ProfileReveal delay={60}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                UPCOMING
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Next reminder
              </Text>
            </View>

            <View
              style={[
                styles.activePill,
                {
                  backgroundColor:
                    enabled
                      ? c.tealDim
                      : c.surface,
                },
              ]}
            >
              <ReminderPulse
                active={enabled}
              />

              <Text
                style={[
                  styles.activePillText,
                  {
                    color:
                      enabled
                        ? c.teal
                        : c.muted,
                  },
                ]}
              >
                {enabled
                  ? 'ACTIVE'
                  : 'PAUSED'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.nextCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.nextIcon,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="calendar"
                size={23}
                color={c.teal}
              />
            </View>

            <View style={styles.nextCopy}>
              <Text
                style={[
                  styles.nextLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                NEXT WORKOUT ALERT
              </Text>

              <Text
                style={[
                  styles.nextValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {nextReminderText}
              </Text>

              <Text
                style={[
                  styles.nextSchedule,
                  {
                    color: c.muted,
                  },
                ]}
              >
                {scheduleLabel}
              </Text>
            </View>

            <FitnessIcon
              name="chevron"
              size={18}
              color={c.muted}
            />
          </View>
        </ProfileReveal>

        {/* TIME */}

        <ProfileReveal delay={100}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                TIME
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Reminder time
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change reminder time"
            onPress={() =>
              setTimeModalVisible(true)
            }
            style={({ pressed }) => [
              styles.timeCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
                opacity: pressed
                  ? 0.85
                  : 1,
              },
            ]}
          >
            <View
              style={[
                styles.timeIcon,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="clock"
                size={24}
                color={c.teal}
              />
            </View>

            <View style={styles.timeCopy}>
              <Text
                style={[
                  styles.timeLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                SCHEDULED TIME
              </Text>

              <Text
                style={[
                  styles.timeValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {selectedTime}
              </Text>

              <Text
                style={[
                  styles.timeHint,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                Tap to choose another time
              </Text>
            </View>

            <View
              style={[
                styles.changeTimeButton,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <Text
                style={[
                  styles.changeTimeText,
                  {
                    color: c.teal,
                  },
                ]}
              >
                Change
              </Text>
            </View>
          </Pressable>
        </ProfileReveal>

        {/* DAYS */}

        <ProfileReveal delay={140}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                REPEAT
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Training days
              </Text>
            </View>

            <Text
              style={[
                styles.dayCount,
                {
                  color: c.teal,
                },
              ]}
            >
              {selectedDays.length}/7
            </Text>
          </View>

          <View
            style={[
              styles.daysCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <View style={styles.daysRow}>
              {DAYS.map((day) => {
                const selected =
                  selectedDays.includes(
                    day,
                  );

                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle ${day}`}
                    onPress={() =>
                      toggleDay(day)
                    }
                    style={({ pressed }) => [
                      styles.dayButton,
                      {
                        backgroundColor:
                          selected
                            ? c.teal
                            : pressed
                              ? c.tealDim
                              : c.surface,

                        borderColor:
                          selected
                            ? c.teal
                            : c.border,
                      },
                    ]}
                  >
                    {selected && (
                      <FitnessIcon
                        name="check"
                        size={11}
                        color="#07130F"
                      />
                    )}

                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: selected
                            ? '#07130F'
                            : c.muted,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.quickOptions,
                {
                  borderTopColor:
                    c.border,
                },
              ]}
            >
              <Pressable
                onPress={selectWeekdays}
                style={[
                  styles.quickButton,
                  {
                    backgroundColor:
                      c.surface,
                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Weekdays
                </Text>
              </Pressable>

              <Pressable
                onPress={selectEveryDay}
                style={[
                  styles.quickButton,
                  {
                    backgroundColor:
                      c.surface,
                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Every day
                </Text>
              </Pressable>

              <Pressable
                onPress={clearDays}
                style={[
                  styles.quickButton,
                  {
                    backgroundColor:
                      c.surface,
                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.quickButtonText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  Clear
                </Text>
              </Pressable>
            </View>
          </View>
        </ProfileReveal>

        {/* NOTIFICATION OPTIONS */}

        <ProfileReveal delay={180}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                NOTIFICATIONS
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Alert preferences
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <SettingRow
              icon="activity"
              title="Reminder sound"
              description="Play a notification sound"
              value={soundEnabled}
              onChange={setSoundEnabled}
            />

            <SettingDivider />

            <SettingRow
              icon="spark"
              title="Vibration"
              description="Add vibration to alerts"
              value={vibrationEnabled}
              onChange={
                setVibrationEnabled
              }
            />

            <SettingDivider />

            <SettingRow
              icon="goal"
              title="Motivational message"
              description="Include a short fitness boost"
              value={
                motivationalMessage
              }
              onChange={
                setMotivationalMessage
              }
            />
          </View>
        </ProfileReveal>

        {/* PREVIEW */}

        <ProfileReveal delay={220}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: c.muted,
                  },
                ]}
              >
                PREVIEW
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Notification preview
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.previewIcon,
                {
                  backgroundColor:
                    c.teal,
                },
              ]}
            >
              <FitnessIcon
                name="workouts"
                size={21}
                color="#07130F"
              />
            </View>

            <View style={styles.previewCopy}>
              <View
                style={
                  styles.previewTitleRow
                }
              >
                <Text
                  style={[
                    styles.previewTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Time to move!
                </Text>

                <Text
                  style={[
                    styles.previewTime,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  now
                </Text>
              </View>

              <Text
                style={[
                  styles.previewText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                {motivationalMessage
                  ? "Your FitTrack workout is waiting. Today's effort builds tomorrow's progress."
                  : `Your workout reminder is scheduled for ${selectedTime}.`}
              </Text>
            </View>
          </View>
        </ProfileReveal>

        {/* UNSAVED */}

        {hasChanges && (
          <ProfileReveal delay={240}>
            <View
              style={[
                styles.unsavedCard,
                {
                  backgroundColor:
                    c.tealDim,
                  borderColor:
                    c.teal,
                },
              ]}
            >
              <View
                style={[
                  styles.unsavedIcon,
                  {
                    backgroundColor:
                      c.teal,
                  },
                ]}
              >
                <FitnessIcon
                  name="activity"
                  size={17}
                  color="#07130F"
                />
              </View>

              <View
                style={
                  styles.unsavedCopy
                }
              >
                <Text
                  style={[
                    styles.unsavedTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Unsaved reminder changes
                </Text>

                <Text
                  style={[
                    styles.unsavedText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  Save the new schedule before
                  leaving this screen.
                </Text>
              </View>
            </View>
          </ProfileReveal>
        )}

        {/* ACTIONS */}

        <ProfileReveal delay={260}>
          <ProfilePressable
            label="Save reminder settings"
            onPress={() => {
              if (!canSave) {
                return;
              }

              void handleSave();
            }}
            style={[
              styles.primaryButton,
              {
                backgroundColor:
                  canSave
                    ? c.teal
                    : c.surface,

                borderColor:
                  canSave
                    ? c.teal
                    : c.border,

                opacity:
                  canSave
                    ? 1
                    : 0.55,

                shadowColor: c.teal,
              },
            ]}
          >
            <FitnessIcon
              name="check"
              size={19}
              color={
                canSave
                  ? '#07130F'
                  : c.muted
              }
            />

            <Text
              style={[
                styles.primaryButtonText,
                {
                  color: canSave
                    ? '#07130F'
                    : c.muted,
                },
              ]}
            >
              {savingReminder
                ? 'Saving...'
                : reminderId
                  ? 'Save Changes'
                  : 'Create Reminder'}
            </Text>
          </ProfilePressable>

          <ProfilePressable
            label="Restore reminder settings"
            onPress={restoreSettings}
            style={[
              styles.secondaryButton,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  color: c.muted,
                },
              ]}
            >
              Reset Changes
            </Text>
          </ProfilePressable>

          {reminderId && (
          <ProfilePressable
            label="Delete workout reminder"
            onPress={
              handleDeleteReminder
            }
            style={[
              styles.secondaryButton,
              {
                backgroundColor:
                  c.cardBg,

                borderColor:
                  '#FF6B6B',

                opacity:
                  deletingReminder
                    ? 0.55
                    : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                {
                  color:
                    '#FF6B6B',
                },
              ]}
            >
              {deletingReminder
                ? 'Deleting...'
                : 'Delete Reminder'}
            </Text>
          </ProfilePressable>
        )}
        </ProfileReveal>

        <ProfileReveal delay={290}>
          <View
            style={[
              styles.motivationCard,
              {
                backgroundColor:
                  c.cardBg,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <View
              style={[
                styles.motivationIcon,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="trend-up"
                size={21}
                color={c.teal}
              />
            </View>

            <View
              style={
                styles.motivationCopy
              }
            >
              <Text
                style={[
                  styles.motivationTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Make showing up easier.
              </Text>

              <Text
                style={[
                  styles.motivationText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                A consistent reminder reduces
                the chance of skipping the
                workout you planned.
              </Text>
            </View>
          </View>
        </ProfileReveal>
      </ScrollView>

      {/* TIME MODAL */}

      <Modal
        visible={timeModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setTimeModalVisible(false)
        }
      >
        <View
          style={[
            styles.modalBackdrop,
            {
              backgroundColor:
                c.overlay ??
                'rgba(0,0,0,0.72)',
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() =>
              setTimeModalVisible(false)
            }
          />

          <View
            style={[
              styles.modalCard,
              {
                backgroundColor:
                  c.bg2,
                borderColor:
                  c.cardBdr,
              },
            ]}
          >
            <View
              style={styles.modalHeader}
            >
              <View>
                <Text
                  style={[
                    styles.modalEyebrow,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  WORKOUT REMINDER
                </Text>

                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Choose your time
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close time picker"
                onPress={() =>
                  setTimeModalVisible(
                    false,
                  )
                }
                style={[
                  styles.modalClose,
                  {
                    backgroundColor:
                      c.surface,
                    borderColor:
                      c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalCloseText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.modalDescription,
                {
                  color: c.muted,
                },
              ]}
            >
              Pick the time that gives you the
              best chance of completing your
              workout.
            </Text>

            <View
              style={
                styles.presetList
              }
            >
              {TIME_PRESETS.map(
                (preset) => {
                  const selected =
                    selectedTime ===
                    preset.time;

                  return (
                    <Pressable
                      key={preset.id}
                      onPress={() => {
                        setSelectedTime(
                          preset.time,
                        );

                        setTimeModalVisible(
                          false,
                        );
                      }}
                      style={({ pressed }) => [
                        styles.presetCard,
                        {
                          backgroundColor:
                            selected
                              ? c.tealDim
                              : pressed
                                ? c.surface
                                : c.cardBg,

                          borderColor:
                            selected
                              ? c.teal
                              : c.cardBdr,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.presetIcon,
                          {
                            backgroundColor:
                              selected
                                ? c.teal
                                : c.surface,
                          },
                        ]}
                      >
                        <FitnessIcon
                          name={preset.icon}
                          size={18}
                          color={
                            selected
                              ? '#07130F'
                              : c.teal
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.presetCopy
                        }
                      >
                        <Text
                          style={[
                            styles.presetTitle,
                            {
                              color: c.text,
                            },
                          ]}
                        >
                          {preset.label}
                        </Text>

                        <Text
                          style={[
                            styles.presetDescription,
                            {
                              color:
                                c.muted,
                            },
                          ]}
                        >
                          {
                            preset.description
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.presetRight
                        }
                      >
                        <Text
                          style={[
                            styles.presetTime,
                            {
                              color:
                                selected
                                  ? c.teal
                                  : c.text,
                            },
                          ]}
                        >
                          {preset.time}
                        </Text>

                        {selected && (
                          <FitnessIcon
                            name="check"
                            size={15}
                            color={c.teal}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>

            <Text
              style={[
                styles.modalNote,
                {
                  color: c.subtle,
                },
              ]}
            >
              Custom native time selection can
              be connected later when the
              notification service is added.
            </Text>
          </View>
        </View>
      </Modal>
    </M4Screen>
  );

  function SettingDivider() {
    return (
      <View
        style={[
          styles.settingDivider,
          {
            backgroundColor: c.border,
          },
        ]}
      />
    );
  }

  function SettingRow({
    icon,
    title,
    description,
    value,
    onChange,
  }: {
    icon: FitnessIconName;
    title: string;
    description: string;
    value: boolean;
    onChange: (
      value: boolean,
    ) => void;
  }) {
    return (
      <View style={styles.settingRow}>
        <View
          style={[
            styles.settingIcon,
            {
              backgroundColor:
                value
                  ? c.tealDim
                  : c.surface,
            },
          ]}
        >
          <FitnessIcon
            name={icon}
            size={19}
            color={
              value
                ? c.teal
                : c.muted
            }
          />
        </View>

        <View style={styles.settingCopy}>
          <Text
            style={[
              styles.settingTitle,
              {
                color: c.text,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.settingDescription,
              {
                color: c.muted,
              },
            ]}
          >
            {description}
          </Text>
        </View>

        <Switch
          value={value}
          onValueChange={onChange}
          thumbColor={
            value
              ? c.teal
              : c.muted
          }
          trackColor={{
            false: c.surface,
            true: c.tealDim,
          }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCopy: {
    flex: 1,
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  headerSaveButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 26,
    padding: 19,
    marginBottom: 24,
  },

  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -135,
    right: -75,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCopy: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  heroTitle: {
    marginTop: 6,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  heroDescription: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 16,
  },

  reminderStatusRow: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  reminderStatusCopy: {
    flex: 1,
  },

  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  statusTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 9,
  },

  pulseWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pulseRing: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
  },

  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  sectionHeader: {
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent:
      'space-between',
    gap: 12,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  activePill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  activePillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  nextCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  nextIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextCopy: {
    flex: 1,
  },

  nextLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  nextValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
  },

  nextSchedule: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
  },

  timeCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  timeIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeCopy: {
    flex: 1,
  },

  timeLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  timeValue: {
    marginTop: 3,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  timeHint: {
    marginTop: 2,
    fontSize: 8,
  },

  changeTimeButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },

  changeTimeText: {
    fontSize: 9,
    fontWeight: '800',
  },

  dayCount: {
    fontSize: 11,
    fontWeight: '900',
  },

  daysCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
    marginBottom: 24,
  },

  daysRow: {
    flexDirection: 'row',
    gap: 5,
  },

  dayButton: {
    flex: 1,
    minHeight: 47,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  dayText: {
    fontSize: 8,
    fontWeight: '800',
  },

  quickOptions: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
  },

  quickButton: {
    flex: 1,
    minHeight: 35,
    borderWidth: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickButtonText: {
    fontSize: 8,
    fontWeight: '800',
  },

  settingsCard: {
    borderWidth: 1,
    borderRadius: 21,
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  settingRow: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  settingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingCopy: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  settingDescription: {
    marginTop: 3,
    fontSize: 9,
  },

  settingDivider: {
    height:
      StyleSheet.hairlineWidth,
  },

  previewCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 24,
  },

  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewCopy: {
    flex: 1,
  },

  previewTitleRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    gap: 8,
  },

  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
  },

  previewTime: {
    fontSize: 8,
  },

  previewText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 15,
  },

  unsavedCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  unsavedIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unsavedCopy: {
    flex: 1,
  },

  unsavedTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  unsavedText: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },

  secondaryButton: {
    minHeight: 46,
    marginTop: 9,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },

  motivationCard: {
    marginTop: 17,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  motivationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  motivationCopy: {
    flex: 1,
  },

  motivationTitle: {
    fontSize: 13,
    fontWeight: '800',
  },

  motivationText: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 16,
  },

  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '84%',
    borderWidth: 1,
    borderRadius: 26,
    padding: 17,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  modalEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  modalTitle: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: 21,
    lineHeight: 23,
  },

  modalDescription: {
    marginTop: 8,
    maxWidth: 330,
    fontSize: 10,
    lineHeight: 15,
  },

  presetList: {
    marginTop: 15,
    gap: 8,
  },

  presetCard: {
    minHeight: 70,
    borderWidth: 1,
    borderRadius: 17,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  presetIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  presetCopy: {
    flex: 1,
  },

  presetTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  presetDescription: {
    marginTop: 3,
    fontSize: 8,
  },

  presetRight: {
    alignItems: 'flex-end',
    gap: 5,
  },

  presetTime: {
    fontSize: 11,
    fontWeight: '900',
  },

  modalNote: {
    marginTop: 13,
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 13,
  },
});