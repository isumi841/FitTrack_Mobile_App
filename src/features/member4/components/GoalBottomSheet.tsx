import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';

import {
  NAV_COLORS as N,
} from '@/components/navigation/navigation-theme';

import {
  FitnessIcon,
  type FitnessIconName,
} from './FitnessIcon';

import {
  useM4Theme,
} from '../hooks/useM4Theme';

import type {
  Goal,
  GoalDuration,
  GoalType,
} from '../types';

type GoalOption = {
  type: GoalType;

  label: string;

  description: string;

  icon: FitnessIconName;
};

const GOAL_OPTIONS:
  GoalOption[] = [
    {
      type:
        'Workouts per week',

      label:
        'Weekly workouts',

      description:
        'Choose how many sessions you want each week.',

      icon:
        'workouts',
    },

    {
      type:
        'Calories per week',

      label:
        'Weekly calories',

      description:
        'Set a calorie-burn target for your training week.',

      icon:
        'flame',
    },

    {
      type:
        'Workout minutes',

      label:
        'Workout minutes',

      description:
        'Build consistency around time spent training.',

      icon:
        'clock',
    },

    {
      type:
        'Monthly workouts',

      label:
        'Monthly workouts',

      description:
        'Set a longer-term workout consistency target.',

      icon:
        'calendar',
    },
  ];

const DURATIONS:
  GoalDuration[] = [
    'Weekly',
    'Monthly',
  ];

const UNIT_MAP: Record<
  GoalType,
  string
> = {
  'Workouts per week':
    'workouts',

  'Calories per week':
    'kcal',

  'Workout minutes':
    'minutes',

  'Monthly workouts':
    'workouts',
};

const DEFAULT_TARGETS: Record<
  GoalType,
  number
> = {
  'Workouts per week':
    5,

  'Calories per week':
    1200,

  'Workout minutes':
    150,

  'Monthly workouts':
    20,
};

const STEP_VALUES: Record<
  GoalType,
  number
> = {
  'Workouts per week':
    1,

  'Calories per week':
    100,

  'Workout minutes':
    5,

  'Monthly workouts':
    1,
};

const MAX_VALUES: Record<
  GoalType,
  number
> = {
  'Workouts per week':
    14,

  'Calories per week':
    10000,

  'Workout minutes':
    1000,

  'Monthly workouts':
    100,
};

interface GoalBottomSheetProps {
  visible: boolean;

  editGoal?:
    | Goal
    | null;

  onClose:
    () => void;

  onSave: (
    type: GoalType,
    targetValue: number,
    duration: GoalDuration,
  ) =>
    | Promise<void>
    | void;

  onDelete?: (
    goal: Goal,
  ) =>
    | Promise<void>
    | void;
}

export function GoalBottomSheet({
  visible,
  editGoal,
  onClose,
  onSave,
  onDelete,
}: GoalBottomSheetProps) {
  const c =
    useM4Theme();

  const { height } =
    useWindowDimensions();

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<GoalType>(
      'Workouts per week',
    );

  const [
    targetValue,
    setTargetValue,
  ] =
    useState(5);

  const [
    duration,
    setDuration,
  ] =
    useState<GoalDuration>(
      'Weekly',
    );

  const selectedOption =
    useMemo(
      () =>
        GOAL_OPTIONS.find(
          (option) =>
            option.type ===
            selectedType,
        ) ??
        GOAL_OPTIONS[0],

      [selectedType],
    );

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (editGoal) {
      setSelectedType(
        editGoal.type,
      );

      setTargetValue(
        editGoal.targetValue,
      );

      setDuration(
        editGoal.duration,
      );

      return;
    }

    setSelectedType(
      'Workouts per week',
    );

    setTargetValue(
      DEFAULT_TARGETS[
        'Workouts per week'
      ],
    );

    setDuration(
      'Weekly',
    );
  }, [
    editGoal,
    visible,
  ]);

  function selectType(
    type: GoalType,
  ) {
    setSelectedType(
      type,
    );

    if (!editGoal) {
      setTargetValue(
        DEFAULT_TARGETS[
          type
        ],
      );

      if (
        type ===
        'Monthly workouts'
      ) {
        setDuration(
          'Monthly',
        );
      } else {
        setDuration(
          'Weekly',
        );
      }
    }
  }

  function decrement() {
    const step =
      STEP_VALUES[
        selectedType
      ];

    setTargetValue(
      (value) =>
        Math.max(
          step,
          value - step,
        ),
    );
  }

  function increment() {
    const step =
      STEP_VALUES[
        selectedType
      ];

    const maximum =
      MAX_VALUES[
        selectedType
      ];

    setTargetValue(
      (value) =>
        Math.min(
          maximum,
          value + step,
        ),
    );
  }

  /* =====================================================
     SAVE TO MONGODB
  ===================================================== */

  async function handleSave() {
    if (
      saving ||
      deleting
    ) {
      return;
    }

    try {
      setSaving(
        true,
      );

      await onSave(
        selectedType,
        targetValue,
        duration,
      );

      onClose();
    } catch (error) {
      console.error(
        'Save goal error:',
        error,
      );

      Alert.alert(
        'Unable to save goal',

        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  /* =====================================================
     DELETE FROM MONGODB
  ===================================================== */

  function handleDelete() {
    if (
      !editGoal ||
      !onDelete ||
      saving ||
      deleting
    ) {
      return;
    }

    Alert.alert(
      'Delete goal?',

      `Are you sure you want to delete "${editGoal.label}"?`,

      [
        {
          text:
            'Cancel',

          style:
            'cancel',
        },

        {
          text:
            'Delete',

          style:
            'destructive',

          onPress:
            async () => {
              try {
                setDeleting(
                  true,
                );

                await onDelete(
                  editGoal,
                );

                onClose();
              } catch (
                error
              ) {
                console.error(
                  'Delete goal error:',
                  error,
                );

                Alert.alert(
                  'Unable to delete goal',

                  error instanceof
                  Error
                    ? error.message
                    : 'Please try again.',
                );
              } finally {
                setDeleting(
                  false,
                );
              }
            },
        },
      ],
    );
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={
        onClose
      }
    >
      {/* BACKDROP */}

      <Animated.View
        entering={FadeIn
          .duration(180)
          .reduceMotion(
            ReduceMotion.System,
          )}
        exiting={FadeOut
          .duration(140)
          .reduceMotion(
            ReduceMotion.System,
          )}
        style={[
          StyleSheet.absoluteFill,

          styles.backdrop,

          {
            backgroundColor:
              c.overlay,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close goal editor"
          onPress={
            onClose
          }
          style={
            StyleSheet.absoluteFill
          }
        />
      </Animated.View>

      {/* SHEET */}

      <View
        pointerEvents="box-none"
        style={
          styles.container
        }
      >
        <Animated.View
          entering={FadeInDown
            .duration(320)
            .reduceMotion(
              ReduceMotion.System,
            )}
          style={[
            styles.sheet,

            {
              backgroundColor:
                c.bg2,

              borderColor:
                c.border,

              maxHeight:
                Platform.OS ===
                'web'
                  ? Math.min(
                      height *
                        0.88,
                      760,
                    )
                  : height *
                    0.88,
            },
          ]}
        >
          <View
            style={[
              styles.handle,

              {
                backgroundColor:
                  c.border,
              },
            ]}
          />

          {/* HEADING */}

          <View
            style={
              styles.heading
            }
          >
            <View
              style={[
                styles.headingIcon,

                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name={
                  editGoal
                    ? 'goal'
                    : 'plus'
                }
                color={
                  c.teal
                }
                size={23}
              />
            </View>

            <View
              style={
                styles.headingCopy
              }
            >
              <Text
                style={[
                  styles.eyebrow,

                  {
                    color:
                      c.teal,
                  },
                ]}
              >
                {editGoal
                  ? 'ADJUST YOUR TARGET'
                  : 'BUILD A NEW TARGET'}
              </Text>

              <Text
                style={[
                  styles.title,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                {editGoal
                  ? 'Edit goal'
                  : 'Set your goal'}
              </Text>

              <Text
                style={[
                  styles.subtitle,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                Choose
                something
                realistic
                enough to
                repeat, but
                challenging
                enough to move
                you forward.
              </Text>
            </View>

            <Pressable
              onPress={
                onClose
              }
              accessibilityRole="button"
              accessibilityLabel="Close goal editor"
              style={({
                pressed,
              }) => [
                styles.closeButton,

                {
                  backgroundColor:
                    pressed
                      ? c.tealDim
                      : c.surface,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.closeText,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                ×
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            bounces={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.scrollContent
            }
          >
            {/* GOAL TYPE */}

            <View
              style={
                styles.sectionHeading
              }
            >
              <Text
                style={[
                  styles.sectionLabel,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                GOAL TYPE
              </Text>

              <Text
                style={[
                  styles.sectionHint,

                  {
                    color:
                      c.subtle,
                  },
                ]}
              >
                What do you
                want to
                improve?
              </Text>
            </View>

            <View
              style={
                styles.optionsGrid
              }
            >
              {GOAL_OPTIONS.map(
                (
                  option,
                ) => {
                  const selected =
                    selectedType ===
                    option.type;

                  return (
                    <Pressable
                      key={
                        option.type
                      }
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected,
                      }}
                      accessibilityLabel={
                        option.label
                      }
                      onPress={() =>
                        selectType(
                          option.type,
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.option,

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
                          styles.optionIcon,

                          {
                            backgroundColor:
                              selected
                                ? c.teal
                                : c.surface,
                          },
                        ]}
                      >
                        <FitnessIcon
                          name={
                            option.icon
                          }
                          color={
                            selected
                              ? N.ink
                              : c.teal
                          }
                          size={
                            20
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.optionCopy
                        }
                      >
                        <Text
                          style={[
                            styles.optionTitle,

                            {
                              color:
                                selected
                                  ? c.teal
                                  : c.text,
                            },
                          ]}
                        >
                          {
                            option.label
                          }
                        </Text>

                        <Text
                          numberOfLines={
                            2
                          }
                          style={[
                            styles.optionDescription,

                            {
                              color:
                                c.muted,
                            },
                          ]}
                        >
                          {
                            option.description
                          }
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radio,

                          {
                            borderColor:
                              selected
                                ? c.teal
                                : c.subtle,
                          },
                        ]}
                      >
                        {selected && (
                          <View
                            style={[
                              styles.radioInner,

                              {
                                backgroundColor:
                                  c.teal,
                              },
                            ]}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>

            {/* TARGET */}

            <View
              style={
                styles.block
              }
            >
              <View
                style={
                  styles.sectionHeading
                }
              >
                <Text
                  style={[
                    styles.sectionLabel,

                    {
                      color:
                        c.muted,
                    },
                  ]}
                >
                  TARGET VALUE
                </Text>

                <Text
                  style={[
                    styles.sectionHint,

                    {
                      color:
                        c.subtle,
                    },
                  ]}
                >
                  {
                    selectedOption.label
                  }
                </Text>
              </View>

              <View
                style={[
                  styles.targetCard,

                  {
                    backgroundColor:
                      c.cardBg,

                    borderColor:
                      c.cardBdr,
                  },
                ]}
              >
                <Pressable
                  onPress={
                    decrement
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Decrease target"
                  style={({
                    pressed,
                  }) => [
                    styles.stepButton,

                    {
                      backgroundColor:
                        pressed
                          ? c.tealDim
                          : c.surface,

                      borderColor:
                        c.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.minus,

                      {
                        color:
                          c.teal,
                      },
                    ]}
                  >
                    −
                  </Text>
                </Pressable>

                <View
                  style={
                    styles.targetValueArea
                  }
                >
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={
                      1
                    }
                    style={[
                      styles.targetValue,

                      {
                        color:
                          c.text,
                      },
                    ]}
                  >
                    {targetValue.toLocaleString()}
                  </Text>

                  <Text
                    style={[
                      styles.targetUnit,

                      {
                        color:
                          c.muted,
                      },
                    ]}
                  >
                    {
                      UNIT_MAP[
                        selectedType
                      ]
                    }
                  </Text>
                </View>

                <Pressable
                  onPress={
                    increment
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Increase target"
                  style={({
                    pressed,
                  }) => [
                    styles.stepButton,

                    {
                      backgroundColor:
                        pressed
                          ? c.tealDim
                          : c.surface,

                      borderColor:
                        c.border,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="plus"
                    color={
                      c.teal
                    }
                    size={19}
                  />
                </Pressable>
              </View>

              <View
                style={
                  styles.quickValues
                }
              >
                {[
                  DEFAULT_TARGETS[
                    selectedType
                  ],

                  DEFAULT_TARGETS[
                    selectedType
                  ] * 2,

                  DEFAULT_TARGETS[
                    selectedType
                  ] * 3,
                ].map(
                  (
                    value,
                  ) => (
                    <Pressable
                      key={
                        value
                      }
                      onPress={() =>
                        setTargetValue(
                          Math.min(
                            MAX_VALUES[
                              selectedType
                            ],

                            value,
                          ),
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.quickValue,

                        {
                          backgroundColor:
                            targetValue ===
                            value
                              ? c.tealDim
                              : pressed
                                ? c.surface
                                : 'transparent',

                          borderColor:
                            targetValue ===
                            value
                              ? c.teal
                              : c.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickValueText,

                          {
                            color:
                              targetValue ===
                              value
                                ? c.teal
                                : c.muted,
                          },
                        ]}
                      >
                        {value.toLocaleString()}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            {/* DURATION */}

            <View
              style={
                styles.block
              }
            >
              <View
                style={
                  styles.sectionHeading
                }
              >
                <Text
                  style={[
                    styles.sectionLabel,

                    {
                      color:
                        c.muted,
                    },
                  ]}
                >
                  TRACKING PERIOD
                </Text>

                <Text
                  style={[
                    styles.sectionHint,

                    {
                      color:
                        c.subtle,
                    },
                  ]}
                >
                  How often
                  should it
                  reset?
                </Text>
              </View>

              <View
                style={
                  styles.durationRow
                }
              >
                {DURATIONS.map(
                  (
                    item,
                  ) => {
                    const selected =
                      duration ===
                      item;

                    return (
                      <Pressable
                        key={
                          item
                        }
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected,
                        }}
                        onPress={() =>
                          setDuration(
                            item,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.durationButton,

                          {
                            backgroundColor:
                              selected
                                ? c.teal
                                : pressed
                                  ? c.tealDim
                                  : c.cardBg,

                            borderColor:
                              selected
                                ? c.teal
                                : c.cardBdr,
                          },
                        ]}
                      >
                        <FitnessIcon
                          name={
                            item ===
                            'Weekly'
                              ? 'calendar'
                              : 'trend-up'
                          }
                          color={
                            selected
                              ? N.ink
                              : c.muted
                          }
                          size={
                            18
                          }
                        />

                        <Text
                          style={[
                            styles.durationText,

                            {
                              color:
                                selected
                                  ? N.ink
                                  : c.text,
                            },
                          ]}
                        >
                          {
                            item
                          }
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </View>

            {/* PREVIEW */}

            <View
              style={[
                styles.previewCard,

                {
                  backgroundColor:
                    N.surface,

                  borderColor:
                    N.border,
                },
              ]}
            >
              <View
                style={[
                  styles.previewIcon,

                  {
                    backgroundColor:
                      N.accentSoft,
                  },
                ]}
              >
                <FitnessIcon
                  name={
                    selectedOption.icon
                  }
                  color={
                    N.accent
                  }
                  size={22}
                />
              </View>

              <View
                style={
                  styles.previewCopy
                }
              >
                <Text
                  style={
                    styles.previewLabel
                  }
                >
                  YOUR TARGET
                </Text>

                <Text
                  style={
                    styles.previewTitle
                  }
                >
                  {targetValue.toLocaleString()}
                  {' '}
                  {
                    UNIT_MAP[
                      selectedType
                    ]
                  }
                </Text>

                <Text
                  style={
                    styles.previewSubtitle
                  }
                >
                  Tracked on a{' '}
                  {duration.toLowerCase()}{' '}
                  basis
                </Text>
              </View>

              <FitnessIcon
                name="check"
                color={
                  N.accent
                }
                size={20}
              />
            </View>

            {/* SAVE */}

            <Pressable
              onPress={
                handleSave
              }
              disabled={
                saving ||
                deleting
              }
              accessibilityRole="button"
              accessibilityLabel={
                editGoal
                  ? 'Save goal changes'
                  : 'Create goal'
              }
              style={({
                pressed,
              }) => [
                styles.saveButton,

                {
                  backgroundColor:
                    pressed
                      ? c.tealDim
                      : c.teal,

                  borderColor:
                    c.teal,

                  shadowColor:
                    c.teal,
                },
              ]}
            >
              <FitnessIcon
                name="check"
                color={
                  N.ink
                }
                size={19}
              />

              <Text
                style={
                  styles.saveText
                }
              >
                {saving
                  ? 'Saving...'
                  : editGoal
                    ? 'Save Changes'
                    : 'Create Goal'}
              </Text>
            </Pressable>

            {/* DELETE */}

            {editGoal &&
              onDelete && (
                <Pressable
                  onPress={
                    handleDelete
                  }
                  disabled={
                    saving ||
                    deleting
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Delete goal"
                  style={
                    styles.cancelButton
                  }
                >
                  <Text
                    style={[
                      styles.cancelText,

                      {
                        color:
                          '#ff6b6b',
                      },
                    ]}
                  >
                    {deleting
                      ? 'Deleting...'
                      : 'Delete Goal'}
                  </Text>
                </Pressable>
              )}

            {/* CANCEL */}

            <Pressable
              onPress={
                onClose
              }
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={
                styles.cancelButton
              }
            >
              <Text
                style={[
                  styles.cancelText,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    backdrop: {
      zIndex: 1,
    },

    container: {
      flex: 1,

      zIndex: 2,

      justifyContent:
        'flex-end',

      alignItems:
        'center',
    },

    sheet: {
      width: '100%',

      maxWidth: 480,

      borderTopLeftRadius:
        30,

      borderTopRightRadius:
        30,

      borderTopWidth: 1,

      borderLeftWidth: 1,

      borderRightWidth: 1,

      paddingTop: 10,

      paddingHorizontal:
        18,

      paddingBottom:
        Platform.OS ===
        'ios'
          ? 26
          : 20,

      overflow:
        'hidden',
    },

    handle: {
      width: 42,

      height: 4,

      borderRadius:
        99,

      alignSelf:
        'center',

      marginBottom:
        15,
    },

    heading: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap: 11,

      marginBottom:
        14,
    },

    headingIcon: {
      width: 46,

      height: 46,

      borderRadius: 15,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    headingCopy: {
      flex: 1,
    },

    eyebrow: {
      fontSize: 8,

      fontWeight:
        '900',

      letterSpacing:
        1.15,

      marginBottom:
        3,
    },

    title: {
      fontSize: 22,

      fontWeight:
        '900',

      letterSpacing:
        -0.6,
    },

    subtitle: {
      marginTop: 4,

      maxWidth: 310,

      fontSize: 11,

      lineHeight: 16,
    },

    closeButton: {
      width: 36,

      height: 36,

      borderRadius: 13,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    closeText: {
      fontSize: 23,

      fontWeight:
        '300',

      lineHeight: 25,
    },

    scrollContent: {
      paddingBottom: 6,
    },

    sectionHeading: {
      marginTop: 10,

      marginBottom: 9,
    },

    sectionLabel: {
      fontSize: 9,

      fontWeight:
        '900',

      letterSpacing:
        1.1,
    },

    sectionHint: {
      marginTop: 3,

      fontSize: 10,
    },

    optionsGrid: {
      gap: 8,
    },

    option: {
      minHeight: 70,

      borderWidth: 1,

      borderRadius: 18,

      paddingHorizontal:
        12,

      paddingVertical:
        11,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 11,
    },

    optionIcon: {
      width: 39,

      height: 39,

      borderRadius: 13,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    optionCopy: {
      flex: 1,
    },

    optionTitle: {
      fontSize: 12,

      fontWeight:
        '800',
    },

    optionDescription: {
      marginTop: 2,

      fontSize: 9,

      lineHeight: 13,
    },

    radio: {
      width: 18,

      height: 18,

      borderRadius: 9,

      borderWidth: 1.5,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    radioInner: {
      width: 8,

      height: 8,

      borderRadius: 4,
    },

    block: {
      marginTop: 10,
    },

    targetCard: {
      minHeight: 82,

      borderWidth: 1,

      borderRadius: 20,

      padding: 12,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 10,
    },

    stepButton: {
      width: 48,

      height: 48,

      borderRadius: 15,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    minus: {
      fontSize: 26,

      fontWeight:
        '300',

      lineHeight: 29,
    },

    targetValueArea: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    targetValue: {
      maxWidth: '100%',

      fontSize: 26,

      fontWeight:
        '900',

      letterSpacing:
        -0.7,
    },

    targetUnit: {
      marginTop: 2,

      fontSize: 9,

      fontWeight:
        '700',

      textTransform:
        'uppercase',

      letterSpacing:
        0.7,
    },

    quickValues: {
      marginTop: 8,

      flexDirection:
        'row',

      gap: 7,
    },

    quickValue: {
      flex: 1,

      minHeight: 35,

      borderRadius: 11,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    quickValueText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    durationRow: {
      flexDirection:
        'row',

      gap: 8,
    },

    durationButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 15,

      borderWidth: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,
    },

    durationText: {
      fontSize: 11,

      fontWeight:
        '800',
    },

    previewCard: {
      marginTop: 20,

      borderWidth: 1,

      borderRadius: 19,

      padding: 13,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 11,
    },

    previewIcon: {
      width: 40,

      height: 40,

      borderRadius: 13,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    previewCopy: {
      flex: 1,
    },

    previewLabel: {
      color:
        N.muted,

      fontSize: 8,

      fontWeight:
        '900',

      letterSpacing:
        1,
    },

    previewTitle: {
      color:
        N.text,

      marginTop: 2,

      fontSize: 14,

      fontWeight:
        '800',
    },

    previewSubtitle: {
      color:
        N.muted,

      marginTop: 2,

      fontSize: 9,
    },

    saveButton: {
      marginTop: 16,

      minHeight: 52,

      borderRadius: 17,

      borderWidth: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      shadowOffset: {
        width: 0,

        height: 4,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        12,

      elevation: 4,
    },

    saveText: {
      color:
        N.ink,

      fontSize: 13,

      fontWeight:
        '900',
    },

    cancelButton: {
      minHeight: 42,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    cancelText: {
      fontSize: 11,

      fontWeight:
        '700',
    },
  });