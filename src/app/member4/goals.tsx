import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  NAV_COLORS as N,
} from '@/components/navigation/navigation-theme';

import {
  FitnessIcon,
  type FitnessIconName,
} from '@/features/member4/components/FitnessIcon';

import {
  GoalBottomSheet,
} from '@/features/member4/components/GoalBottomSheet';

import {
  GoalCard,
} from '@/features/member4/components/GoalCard';

import {
  M4Screen,
} from '@/features/member4/components/M4Screen';

import {
  ProfilePressable,
  ProfileProgressBar,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';

import {
  mockProgressStats,
} from '@/features/member4/data/mockData';

import {
  useM4Theme,
} from '@/features/member4/hooks/useM4Theme';

import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
  type ApiGoal,
  type ApiGoalType,
} from '@/features/member4/services/member4Service';

import type {
  Goal,
  GoalDuration,
  GoalType,
} from '@/features/member4/types';

type InsightItem = {
  label: string;
  value: string;
  caption: string;
  icon: FitnessIconName;
};

const GOAL_UNIT: Record<
  GoalType,
  string
> = {
  'Workouts per week':
    'workouts',

  'Calories per week':
    'kcal',

  'Workout minutes':
    'min',

  'Monthly workouts':
    'workouts',
};

const GOAL_LABEL: Record<
  GoalType,
  (value: number) => string
> = {
  'Workouts per week':
    (value) =>
      `Work out ${value} days a week`,

  'Calories per week':
    (value) =>
      `Burn ${value} calories weekly`,

  'Workout minutes':
    (value) =>
      `Train ${value} minutes`,

  'Monthly workouts':
    (value) =>
      `Complete ${value} workouts this month`,
};

const GOAL_TYPE_TO_API: Record<
  GoalType,
  ApiGoalType
> = {
  'Workouts per week':
    'workoutsPerWeek',

  'Calories per week':
    'caloriesPerWeek',

  'Workout minutes':
    'workoutMinutes',

  'Monthly workouts':
    'monthlyWorkouts',
};

const API_TYPE_TO_GOAL: Record<
  ApiGoalType,
  GoalType
> = {
  workoutsPerWeek:
    'Workouts per week',

  caloriesPerWeek:
    'Calories per week',

  workoutMinutes:
    'Workout minutes',

  monthlyWorkouts:
    'Monthly workouts',
};

function buildRemainingLabel(
  type: GoalType,
  currentValue: number,
  targetValue: number,
) {
  const remaining =
    Math.max(
      0,
      targetValue -
        currentValue,
    );

  if (remaining === 0) {
    return 'Goal completed';
  }

  switch (type) {
    case 'Calories per week':
      return `${remaining.toLocaleString()} kcal remaining`;

    case 'Workout minutes':
      return `${remaining} minutes remaining`;

    case 'Workouts per week':
      return `${remaining} more ${
        remaining === 1
          ? 'workout'
          : 'workouts'
      } to go`;

    case 'Monthly workouts':
      return `${remaining} ${
        remaining === 1
          ? 'workout'
          : 'workouts'
      } to go`;

    default:
      return `${remaining} remaining`;
  }
}

function mapApiGoalToGoal(
  apiGoal: ApiGoal,
): Goal {
  const type =
    API_TYPE_TO_GOAL[
      apiGoal.goalType
    ];

  const targetValue =
    apiGoal.target;

  const currentValue =
    apiGoal.current ?? 0;

  const progressPct =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (
            currentValue /
            Math.max(
              targetValue,
              1,
            )
          ) * 100,
        ),
      ),
    );

  return {
    id: apiGoal._id,

    type,

    label:
      apiGoal.title ||
      GOAL_LABEL[type](
        targetValue,
      ),

    targetValue,

    currentValue,

    unit:
      GOAL_UNIT[type],

    duration:
      apiGoal.duration,

    progressPct,

    remainingLabel:
      buildRemainingLabel(
        type,
        currentValue,
        targetValue,
      ),
  };
}

export default function GoalsScreen() {
  const c =
    useM4Theme();

  const { width } =
    useWindowDimensions();

  const compact =
    width < 370;

  /*
   * Keep this for now.
   * Progress API will replace it later.
   */
  const stats =
    mockProgressStats;

  const { create } =
    useLocalSearchParams<{
      create?: string;
    }>();

  const [
    goals,
    setGoals,
  ] = useState<Goal[]>([]);

  const [
    loadingGoals,
    setLoadingGoals,
  ] = useState(true);

  const [
    sheetVisible,
    setSheetVisible,
  ] = useState(false);

  const [
    editGoal,
    setEditGoal,
  ] =
    useState<Goal | null>(
      null,
    );

  /* =====================================================
     LOAD GOALS FROM MONGODB
  ===================================================== */

  useEffect(() => {
    void loadGoals();
  }, []);

  async function loadGoals() {
    try {
      setLoadingGoals(
        true,
      );

      const response =
        await getGoals();

      const mappedGoals =
        response.data.map(
          mapApiGoalToGoal,
        );

      setGoals(
        mappedGoals,
      );
    } catch (error) {
      console.error(
        'Load goals error:',
        error,
      );

      Alert.alert(
        'Unable to load goals',

        error instanceof Error
          ? error.message
          : 'Please check your backend connection.',
      );
    } finally {
      setLoadingGoals(
        false,
      );
    }
  }

  /* =====================================================
     OPEN CREATE SHEET FROM ROUTE
  ===================================================== */

  useEffect(() => {
    if (
      create !== '1'
    ) {
      return;
    }

    setEditGoal(null);

    setSheetVisible(
      true,
    );

    router.setParams({
      create: undefined,
    });
  }, [create]);

  const weeklyPct =
    Math.min(
      100,

      Math.round(
        (
          stats.workoutsCompleted /
          Math.max(
            stats.workoutsTarget,
            1,
          )
        ) * 100,
      ),
    );

  const completedGoals =
    useMemo(
      () =>
        goals.filter(
          (goal) =>
            goal.progressPct >=
            100,
        ).length,

      [goals],
    );

  const averageProgress =
    useMemo(() => {
      if (!goals.length) {
        return 0;
      }

      return Math.round(
        goals.reduce(
          (
            total,
            goal,
          ) =>
            total +
            goal.progressPct,

          0,
        ) /
          goals.length,
      );
    }, [goals]);

  const closestGoal =
    useMemo(() => {
      const unfinished =
        goals.filter(
          (goal) =>
            goal.progressPct <
            100,
        );

      if (
        !unfinished.length
      ) {
        return null;
      }

      return [
        ...unfinished,
      ].sort(
        (a, b) =>
          b.progressPct -
          a.progressPct,
      )[0];
    }, [goals]);

  const insights:
    InsightItem[] = [
      {
        label: 'ACTIVE',

        value:
          String(
            goals.length,
          ),

        caption:
          'goals in motion',

        icon: 'goal',
      },

      {
        label:
          'COMPLETE',

        value:
          String(
            completedGoals,
          ),

        caption:
          'targets reached',

        icon: 'check',
      },

      {
        label:
          'AVERAGE',

        value:
          `${averageProgress}%`,

        caption:
          'overall progress',

        icon:
          'trend-up',
      },
    ];

  function handleAddGoal() {
    setEditGoal(null);

    setSheetVisible(
      true,
    );
  }

  function handleEditGoal(
    goal: Goal,
  ) {
    setEditGoal(goal);

    setSheetVisible(
      true,
    );
  }

  function handleEditWeeklyGoal() {
    const weeklyGoal =
      goals.find(
        (goal) =>
          goal.type ===
          'Workouts per week',
      );

    if (weeklyGoal) {
      handleEditGoal(
        weeklyGoal,
      );

      return;
    }

    handleAddGoal();
  }

  /* =====================================================
     CREATE / UPDATE GOAL
  ===================================================== */

  async function handleSaveGoal(
    type: GoalType,
    targetValue: number,
    duration: GoalDuration,
  ) {
    const payload = {
      goalType:
        GOAL_TYPE_TO_API[
          type
        ],

      title:
        GOAL_LABEL[type](
          targetValue,
        ),

      target:
        targetValue,

      duration,
    };

    /*
     * UPDATE
     */
    if (editGoal) {
      const response =
        await updateGoal(
          editGoal.id,
          payload,
        );

      const updatedGoal =
        mapApiGoalToGoal(
          response.data,
        );

      setGoals(
        (
          currentGoals,
        ) =>
          currentGoals.map(
            (goal) =>
              goal.id ===
              updatedGoal.id
                ? updatedGoal
                : goal,
          ),
      );

      setEditGoal(
        updatedGoal,
      );

      return;
    }

    /*
     * CREATE
     */
    const response =
      await createGoal({
        ...payload,

        current: 0,
      });

    const createdGoal =
      mapApiGoalToGoal(
        response.data,
      );

    setGoals(
      (
        currentGoals,
      ) => [
        ...currentGoals,
        createdGoal,
      ],
    );
  }

  /* =====================================================
     DELETE GOAL
  ===================================================== */

  async function handleDeleteGoal(
    goal: Goal,
  ) {
    await deleteGoal(
      goal.id,
    );

    setGoals(
      (
        currentGoals,
      ) =>
        currentGoals.filter(
          (
            currentGoal,
          ) =>
            currentGoal.id !==
            goal.id,
        ),
    );

    if (
      editGoal?.id ===
      goal.id
    ) {
      setEditGoal(null);
    }
  }

  return (
    <M4Screen>
      {/* HEADER */}

      <View
        style={[
          styles.header,

          {
            borderBottomColor:
              c.border,
          },
        ]}
      >
        <ProfilePressable
          label="Go back"
          onPress={() => {
            if (
              router.canGoBack()
            ) {
              router.back();
            } else {
              router.replace(
                '/member4/progress',
              );
            }
          }}
          style={[
            styles.headerButton,

            {
              backgroundColor:
                c.cardBg,

              borderColor:
                c.cardBdr,
            },
          ]}
        >
          <FitnessIcon
            name="arrow-left"
            color={c.text}
            size={20}
          />
        </ProfilePressable>

        <View
          style={
            styles.headerCopy
          }
        >
          <Text
            style={[
              styles.headerEyebrow,

              {
                color:
                  c.muted,
              },
            ]}
          >
            FITTRACK / TARGETS
          </Text>

          <Text
            accessibilityRole="header"
            style={[
              styles.headerTitle,

              {
                color:
                  c.text,
              },
            ]}
          >
            My goals.
          </Text>
        </View>

        <ProfilePressable
          label="Create a new goal"
          onPress={
            handleAddGoal
          }
          style={[
            styles.addHeaderButton,

            {
              backgroundColor:
                c.teal,

              borderColor:
                c.teal,

              shadowColor:
                c.teal,
            },
          ]}
        >
          <FitnessIcon
            name="plus"
            color={N.ink}
            size={20}
          />
        </ProfilePressable>
      </View>

      {/* CONTENT */}

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}

        <ProfileReveal>
          <View
            style={[
              styles.hero,

              {
                backgroundColor:
                  N.surface,

                borderColor:
                  N.border,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroGlow,

                {
                  backgroundColor:
                    N.accentSoft,
                },
              ]}
            />

            <View
              style={
                styles.heroTop
              }
            >
              <View>
                <Text
                  style={
                    styles.heroEyebrow
                  }
                >
                  WEEKLY TARGET
                </Text>

                <Text
                  style={
                    styles.heroTitle
                  }
                >
                  Keep the promise
                  {'\n'}
                  you made to
                  yourself.
                </Text>
              </View>

              <View
                style={[
                  styles.heroIcon,

                  {
                    backgroundColor:
                      N.accentSoft,

                    borderColor:
                      N.border,
                  },
                ]}
              >
                <FitnessIcon
                  name="goal"
                  color={
                    N.accent
                  }
                  size={27}
                />
              </View>
            </View>

            <View
              style={[
                styles.heroMain,

                compact &&
                  styles.heroMainCompact,
              ]}
            >
              <View
                style={
                  styles.heroCopy
                }
              >
                <Text
                  style={
                    styles.heroProgressLabel
                  }
                >
                  WORKOUT PROGRESS
                </Text>

                <View
                  style={
                    styles.heroProgressValueRow
                  }
                >
                  <Text
                    style={
                      styles.heroProgressValue
                    }
                  >
                    {
                      stats.workoutsCompleted
                    }
                  </Text>

                  <Text
                    style={
                      styles.heroProgressTarget
                    }
                  >
                    /{' '}
                    {
                      stats.workoutsTarget
                    }
                  </Text>
                </View>

                <Text
                  style={
                    styles.heroProgressCaption
                  }
                >
                  workouts completed
                  this week
                </Text>
              </View>

              <View
                style={
                  styles.heroPercentWrap
                }
              >
                <Text
                  style={
                    styles.heroPercent
                  }
                >
                  {weeklyPct}

                  <Text
                    style={
                      styles.heroPercentSymbol
                    }
                  >
                    %
                  </Text>
                </Text>

                <Text
                  style={
                    styles.heroPercentCaption
                  }
                >
                  completed
                </Text>
              </View>
            </View>

            <View
              style={
                styles.heroProgressTrack
              }
            >
              <View
                style={[
                  styles.heroProgressFill,

                  {
                    width:
                      `${weeklyPct}%`,
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.heroBottom
              }
            >
              <View
                style={
                  styles.heroMessage
                }
              >
                <FitnessIcon
                  name={
                    weeklyPct >=
                    100
                      ? 'check'
                      : 'activity'
                  }
                  color={
                    N.accent
                  }
                  size={17}
                />

                <Text
                  style={
                    styles.heroMessageText
                  }
                >
                  {weeklyPct >=
                  100
                    ? 'Weekly target complete. Strong work.'
                    : `${Math.max(
                        stats.workoutsTarget -
                          stats.workoutsCompleted,
                        0,
                      )} more ${
                        stats.workoutsTarget -
                          stats.workoutsCompleted ===
                        1
                          ? 'session'
                          : 'sessions'
                      } to finish the week.`}
                </Text>
              </View>

              <ProfilePressable
                label="Edit weekly workout goal"
                onPress={
                  handleEditWeeklyGoal
                }
                style={
                  styles.heroEditButton
                }
              >
                <Text
                  style={
                    styles.heroEditText
                  }
                >
                  Edit target
                </Text>

                <FitnessIcon
                  name="chevron"
                  color={
                    N.ink
                  }
                  size={15}
                />
              </ProfilePressable>
            </View>
          </View>
        </ProfileReveal>

        {/* INSIGHTS */}

        <ProfileReveal
          delay={60}
        >
          <View
            style={
              styles.sectionHeading
            }
          >
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                AT A GLANCE
              </Text>

              <Text
                style={[
                  styles.sectionTitle,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                Goal momentum
              </Text>
            </View>

            <View
              style={[
                styles.livePill,

                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <View
                style={[
                  styles.liveDot,

                  {
                    backgroundColor:
                      c.teal,
                  },
                ]}
              />

              <Text
                style={[
                  styles.liveText,

                  {
                    color:
                      c.teal,
                  },
                ]}
              >
                Live
              </Text>
            </View>
          </View>

          <View
            style={
              styles.insightGrid
            }
          >
            {insights.map(
              (item) => (
                <View
                  key={
                    item.label
                  }
                  style={[
                    styles.insightCard,

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
                      styles.insightIcon,

                      {
                        backgroundColor:
                          c.tealDim,
                      },
                    ]}
                  >
                    <FitnessIcon
                      name={
                        item.icon
                      }
                      color={
                        c.teal
                      }
                      size={
                        18
                      }
                    />
                  </View>

                  <Text
                    style={[
                      styles.insightLabel,

                      {
                        color:
                          c.muted,
                      },
                    ]}
                  >
                    {
                      item.label
                    }
                  </Text>

                  <Text
                    style={[
                      styles.insightValue,

                      {
                        color:
                          c.text,
                      },
                    ]}
                  >
                    {
                      item.value
                    }
                  </Text>

                  <Text
                    numberOfLines={
                      2
                    }
                    style={[
                      styles.insightCaption,

                      {
                        color:
                          c.subtle,
                      },
                    ]}
                  >
                    {
                      item.caption
                    }
                  </Text>
                </View>
              ),
            )}
          </View>
        </ProfileReveal>

        {/* CLOSEST GOAL */}

        {closestGoal && (
          <ProfileReveal
            delay={100}
          >
            <View
              style={[
                styles.focusCard,

                {
                  backgroundColor:
                    c.cardBg,

                  borderColor:
                    c.cardBdr,
                },
              ]}
            >
              <View
                style={
                  styles.focusTop
                }
              >
                <View
                  style={
                    styles.focusTitleRow
                  }
                >
                  <View
                    style={[
                      styles.focusIcon,

                      {
                        backgroundColor:
                          c.tealDim,
                      },
                    ]}
                  >
                    <FitnessIcon
                      name="trend-up"
                      color={
                        c.teal
                      }
                      size={
                        20
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.focusCopy
                    }
                  >
                    <Text
                      style={[
                        styles.focusEyebrow,

                        {
                          color:
                            c.muted,
                        },
                      ]}
                    >
                      CLOSEST TO
                      COMPLETION
                    </Text>

                    <Text
                      numberOfLines={
                        2
                      }
                      style={[
                        styles.focusTitle,

                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {
                        closestGoal.label
                      }
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.focusPercent,

                    {
                      color:
                        c.teal,
                    },
                  ]}
                >
                  {
                    closestGoal.progressPct
                  }
                  %
                </Text>
              </View>

              <ProfileProgressBar
                value={
                  closestGoal.progressPct
                }
                color={
                  c.teal
                }
                trackColor={
                  c.border
                }
                label={`${closestGoal.label} progress`}
              />

              <View
                style={
                  styles.focusFooter
                }
              >
                <Text
                  style={[
                    styles.focusRemaining,

                    {
                      color:
                        c.muted,
                    },
                  ]}
                >
                  {
                    closestGoal.remainingLabel
                  }
                </Text>

                <ProfilePressable
                  label={`Edit ${closestGoal.label}`}
                  onPress={() =>
                    handleEditGoal(
                      closestGoal,
                    )
                  }
                  style={[
                    styles.smallEditButton,

                    {
                      backgroundColor:
                        c.tealDim,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.smallEditText,

                      {
                        color:
                          c.teal,
                      },
                    ]}
                  >
                    Adjust
                  </Text>
                </ProfilePressable>
              </View>
            </View>
          </ProfileReveal>
        )}

        {/* ACTIVE GOALS */}

        <ProfileReveal
          delay={140}
        >
          <View
            style={
              styles.activeHeader
            }
          >
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                YOUR TARGETS
              </Text>

              <Text
                style={[
                  styles.sectionTitle,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                Active goals
              </Text>
            </View>

            <View
              style={[
                styles.goalCount,

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
                  styles.goalCountText,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                {
                  goals.length
                }
              </Text>
            </View>
          </View>
        </ProfileReveal>

        {goals.map(
          (
            goal,
            index,
          ) => (
            <ProfileReveal
              key={
                goal.id
              }
              delay={
                170 +
                index * 45
              }
            >
              <GoalCard
                goal={
                  goal
                }
                onEdit={
                  handleEditGoal
                }
              />
            </ProfileReveal>
          ),
        )}

        {!loadingGoals &&
          goals.length ===
            0 && (
            <ProfileReveal
              delay={160}
            >
              <View
                style={[
                  styles.emptyCard,

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
                    styles.emptyIcon,

                    {
                      backgroundColor:
                        c.tealDim,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="goal"
                    color={
                      c.teal
                    }
                    size={
                      30
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.emptyTitle,

                    {
                      color:
                        c.text,
                    },
                  ]}
                >
                  Set your first
                  target
                </Text>

                <Text
                  style={[
                    styles.emptyText,

                    {
                      color:
                        c.muted,
                    },
                  ]}
                >
                  Small,
                  measurable goals
                  make your
                  progress easier
                  to see and
                  easier to repeat.
                </Text>

                <ProfilePressable
                  label="Create your first goal"
                  onPress={
                    handleAddGoal
                  }
                  style={[
                    styles.emptyButton,

                    {
                      backgroundColor:
                        c.teal,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="plus"
                    color={
                      N.ink
                    }
                    size={
                      17
                    }
                  />

                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    Create goal
                  </Text>
                </ProfilePressable>
              </View>
            </ProfileReveal>
          )}

        {/* ADD GOAL */}

        <ProfileReveal
          delay={220}
        >
          <ProfilePressable
            label="Add a new goal"
            onPress={
              handleAddGoal
            }
            style={[
              styles.addGoalCard,

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
                styles.addGoalIcon,

                {
                  backgroundColor:
                    c.teal,
                },
              ]}
            >
              <FitnessIcon
                name="plus"
                color={
                  N.ink
                }
                size={21}
              />
            </View>

            <View
              style={
                styles.addGoalCopy
              }
            >
              <Text
                style={[
                  styles.addGoalTitle,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                Add another
                goal
              </Text>

              <Text
                style={[
                  styles.addGoalDescription,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                Choose
                workouts,
                calories,
                minutes or a
                monthly target.
              </Text>
            </View>

            <FitnessIcon
              name="chevron"
              color={
                c.teal
              }
              size={18}
            />
          </ProfilePressable>
        </ProfileReveal>

        {/* MOTIVATION */}

        <ProfileReveal
          delay={260}
        >
          <View
            style={[
              styles.tipCard,

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
                styles.tipIcon,

                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="spark"
                color={
                  c.teal
                }
                size={22}
              />
            </View>

            <View
              style={
                styles.tipCopy
              }
            >
              <Text
                style={[
                  styles.tipTitle,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                Progress over
                perfection
              </Text>

              <Text
                style={[
                  styles.tipText,

                  {
                    color:
                      c.muted,
                  },
                ]}
              >
                Consistency
                matters more
                than one
                perfect workout.
                Keep building
                the habit.
              </Text>
            </View>
          </View>
        </ProfileReveal>
      </ScrollView>

      <GoalBottomSheet
        visible={
          sheetVisible
        }
        editGoal={
          editGoal
        }
        onClose={() => {
          setSheetVisible(
            false,
          );

          setEditGoal(
            null,
          );
        }}
        onSave={
          handleSaveGoal
        }
        onDelete={
          handleDeleteGoal
        }
      />
    </M4Screen>
  );
}

const styles =
  StyleSheet.create({
    header: {
      minHeight: 82,

      paddingHorizontal:
        18,

      paddingVertical:
        12,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,
    },

    headerButton: {
      width: 42,

      height: 42,

      borderRadius: 15,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    headerCopy: {
      flex: 1,
    },

    headerEyebrow: {
      fontSize: 9,

      fontWeight:
        '800',

      letterSpacing:
        1.3,

      marginBottom:
        3,
    },

    headerTitle: {
      fontSize: 24,

      fontWeight:
        '800',

      letterSpacing:
        -0.7,
    },

    addHeaderButton: {
      width: 42,

      height: 42,

      borderRadius: 15,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowOffset: {
        width: 0,

        height: 4,
      },

      shadowOpacity:
        0.24,

      shadowRadius:
        10,

      elevation: 4,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal:
        16,

      paddingTop: 16,

      paddingBottom:
        28,
    },

    hero: {
      position:
        'relative',

      overflow:
        'hidden',

      borderRadius:
        26,

      borderWidth: 1,

      padding: 20,

      marginBottom:
        24,
    },

    heroGlow: {
      position:
        'absolute',

      width: 210,

      height: 210,

      borderRadius:
        105,

      top: -110,

      right: -75,
    },

    heroTop: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      gap: 16,
    },

    heroEyebrow: {
      color:
        N.accent,

      fontSize: 9,

      fontWeight:
        '900',

      letterSpacing:
        1.5,

      marginBottom:
        8,
    },

    heroTitle: {
      color: N.text,

      fontSize: 24,

      lineHeight: 29,

      fontWeight:
        '800',

      letterSpacing:
        -0.8,
    },

    heroIcon: {
      width: 50,

      height: 50,

      borderRadius: 17,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    heroMain: {
      marginTop: 26,

      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      gap: 18,
    },

    heroMainCompact: {
      alignItems:
        'flex-start',
    },

    heroCopy: {
      flex: 1,
    },

    heroProgressLabel: {
      color: N.muted,

      fontSize: 9,

      fontWeight:
        '800',

      letterSpacing:
        1.2,
    },

    heroProgressValueRow: {
      flexDirection:
        'row',

      alignItems:
        'baseline',

      marginTop: 4,
    },

    heroProgressValue: {
      color: N.text,

      fontSize: 42,

      fontWeight:
        '900',

      letterSpacing:
        -1.5,
    },

    heroProgressTarget: {
      color: N.muted,

      fontSize: 18,

      fontWeight:
        '700',
    },

    heroProgressCaption: {
      color: N.muted,

      fontSize: 12,

      lineHeight: 17,
    },

    heroPercentWrap: {
      alignItems:
        'flex-end',
    },

    heroPercent: {
      color:
        N.accent,

      fontSize: 34,

      fontWeight:
        '900',

      letterSpacing:
        -1,
    },

    heroPercentSymbol: {
      fontSize: 17,
    },

    heroPercentCaption: {
      color: N.muted,

      fontSize: 10,

      fontWeight:
        '600',
    },

    heroProgressTrack: {
      height: 7,

      marginTop: 20,

      borderRadius:
        99,

      overflow:
        'hidden',

      backgroundColor:
        N.border,
    },

    heroProgressFill: {
      height: '100%',

      borderRadius:
        99,

      backgroundColor:
        N.accent,
    },

    heroBottom: {
      marginTop: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 12,
    },

    heroMessage: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 8,
    },

    heroMessageText: {
      flex: 1,

      color: N.muted,

      fontSize: 11,

      lineHeight: 16,
    },

    heroEditButton: {
      minHeight: 36,

      paddingHorizontal:
        12,

      borderRadius: 12,

      backgroundColor:
        N.accent,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,
    },

    heroEditText: {
      color: N.ink,

      fontSize: 11,

      fontWeight:
        '800',
    },

    sectionHeading: {
      flexDirection:
        'row',

      alignItems:
        'flex-end',

      justifyContent:
        'space-between',

      gap: 12,

      marginBottom:
        12,
    },

    sectionEyebrow: {
      fontSize: 9,

      fontWeight:
        '800',

      letterSpacing:
        1.2,

      marginBottom:
        3,
    },

    sectionTitle: {
      fontSize: 20,

      fontWeight:
        '800',

      letterSpacing:
        -0.5,
    },

    livePill: {
      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius:
        999,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 6,
    },

    liveDot: {
      width: 5,

      height: 5,

      borderRadius: 3,
    },

    liveText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    insightGrid: {
      flexDirection:
        'row',

      gap: 9,

      marginBottom:
        18,
    },

    insightCard: {
      flex: 1,

      minHeight: 136,

      padding: 12,

      borderRadius: 19,

      borderWidth: 1,
    },

    insightIcon: {
      width: 34,

      height: 34,

      borderRadius: 12,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        12,
    },

    insightLabel: {
      fontSize: 8,

      fontWeight:
        '800',

      letterSpacing:
        0.9,
    },

    insightValue: {
      fontSize: 23,

      fontWeight:
        '900',

      letterSpacing:
        -0.6,

      marginTop: 3,
    },

    insightCaption: {
      fontSize: 10,

      lineHeight: 14,

      marginTop: 3,
    },

    focusCard: {
      borderRadius: 22,

      borderWidth: 1,

      padding: 16,

      marginBottom:
        24,
    },

    focusTop: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

      gap: 12,

      marginBottom:
        14,
    },

    focusTitleRow: {
      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 11,
    },

    focusIcon: {
      width: 40,

      height: 40,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    focusCopy: {
      flex: 1,
    },

    focusEyebrow: {
      fontSize: 8,

      fontWeight:
        '800',

      letterSpacing:
        1,

      marginBottom:
        3,
    },

    focusTitle: {
      fontSize: 14,

      lineHeight: 19,

      fontWeight:
        '700',
    },

    focusPercent: {
      fontSize: 20,

      fontWeight:
        '900',
    },

    focusFooter: {
      marginTop: 11,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 10,
    },

    focusRemaining: {
      flex: 1,

      fontSize: 11,
    },

    smallEditButton: {
      paddingHorizontal:
        10,

      paddingVertical:
        6,

      borderRadius: 10,
    },

    smallEditText: {
      fontSize: 10,

      fontWeight:
        '800',
    },

    activeHeader: {
      marginTop: 2,

      marginBottom:
        12,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    goalCount: {
      minWidth: 32,

      height: 32,

      paddingHorizontal:
        9,

      borderRadius: 11,

      borderWidth: 1,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    goalCountText: {
      fontSize: 12,

      fontWeight:
        '800',
    },

    emptyCard: {
      padding: 24,

      borderWidth: 1,

      borderRadius: 22,

      alignItems:
        'center',

      marginBottom:
        14,
    },

    emptyIcon: {
      width: 58,

      height: 58,

      borderRadius: 20,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        14,
    },

    emptyTitle: {
      fontSize: 18,

      fontWeight:
        '800',
    },

    emptyText: {
      maxWidth: 280,

      marginTop: 6,

      textAlign:
        'center',

      fontSize: 12,

      lineHeight: 18,
    },

    emptyButton: {
      marginTop: 16,

      paddingHorizontal:
        16,

      minHeight: 42,

      borderRadius: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,
    },

    emptyButtonText: {
      color: N.ink,

      fontSize: 12,

      fontWeight:
        '800',
    },

    addGoalCard: {
      minHeight: 86,

      borderWidth: 1,

      borderRadius: 21,

      padding: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 12,

      marginTop: 4,
    },

    addGoalIcon: {
      width: 46,

      height: 46,

      borderRadius: 15,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    addGoalCopy: {
      flex: 1,
    },

    addGoalTitle: {
      fontSize: 14,

      fontWeight:
        '800',
    },

    addGoalDescription: {
      marginTop: 3,

      fontSize: 11,

      lineHeight: 16,
    },

    tipCard: {
      marginTop: 14,

      borderRadius: 20,

      borderWidth: 1,

      padding: 15,

      flexDirection:
        'row',

      gap: 12,

      alignItems:
        'flex-start',
    },

    tipIcon: {
      width: 42,

      height: 42,

      borderRadius: 14,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    tipCopy: {
      flex: 1,
    },

    tipTitle: {
      fontSize: 13,

      fontWeight:
        '800',
    },

    tipText: {
      marginTop: 4,

      fontSize: 11,

      lineHeight: 17,
    },
  });