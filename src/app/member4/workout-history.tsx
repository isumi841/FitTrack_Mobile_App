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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

import {
  getWorkouts,
  type ApiWorkout,
} from '@/features/member4/services/member4Service';



import {
  FitnessIcon,
  type FitnessIconName,
} from '@/features/member4/components/FitnessIcon';

import { M4Screen } from '@/features/member4/components/M4Screen';

import {
  ProfilePressable,
  ProfileProgressBar,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';


type WorkoutCategory =
  | 'All'
  | 'Strength'
  | 'Cardio'
  | 'Core'
  | 'Mobility';

type WorkoutRecord = {
  id: string;
  title: string;
  category: Exclude<WorkoutCategory, 'All'>;
  date: string;
  time: string;
  duration: number;
  calories: number;
  exercises: number;
  sets: number;
  intensity: 'Low' | 'Moderate' | 'High';
  completion: number;
  icon: FitnessIconName;
  note: string;
};

const FILTERS: WorkoutCategory[] = [
  'All',
  'Strength',
  'Cardio',
  'Core',
  'Mobility',
];

function getWorkoutIcon(
  category: ApiWorkout['category'],
): FitnessIconName {
  switch (category) {
    case 'Strength':
      return 'workouts';

    case 'Cardio':
      return 'flame';

    case 'Core':
      return 'activity';

    case 'Mobility':
      return 'spark';

    default:
      return 'workouts';
  }
}

function mapApiWorkoutToRecord(
  workout: ApiWorkout,
): WorkoutRecord {
  const performedAt =
    new Date(workout.performedAt);

  return {
    id: workout._id,

    title: workout.title,

    category: workout.category,

    date:
      performedAt.toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        },
      ),

    time:
      performedAt.toLocaleTimeString(
        'en-US',
        {
          hour: 'numeric',
          minute: '2-digit',
        },
      ),

    duration:
      workout.durationMinutes,

    calories:
      workout.calories,

    exercises:
      workout.exercisesCount,

    sets:
      workout.setsCount,

    intensity:
      workout.intensity,

    completion:
      workout.completion,

    icon:
      getWorkoutIcon(
        workout.category,
      ),

    note:
      workout.note,
  };
}

function LivePulse() {
  const c = useM4Theme();

  const pulse = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const ringStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.45, 0],
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
    <View style={styles.livePulseWrap}>
      <Animated.View
        style={[
          styles.livePulseRing,
          {
            borderColor: c.teal,
          },
          ringStyle,
        ]}
      />

      <View
        style={[
          styles.livePulseDot,
          {
            backgroundColor: c.teal,
          },
        ]}
      />
    </View>
  );
}

export default function WorkoutHistoryScreen() {
  const c = useM4Theme();

    const [
    workouts,
    setWorkouts,
  ] =
    useState<WorkoutRecord[]>([]);

  const [
    loadingWorkouts,
    setLoadingWorkouts,
  ] =
    useState(true);

  const [selectedFilter, setSelectedFilter] =
    useState<WorkoutCategory>('All');

  const [search, setSearch] = useState('');

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const totalWorkouts = workouts.length;

  useEffect(() => {
  let mounted = true;

  async function loadWorkouts() {
    try {
      setLoadingWorkouts(true);

      const response =
        await getWorkouts();

      if (!mounted) {
        return;
      }

      const records =
        response.data.map(
          mapApiWorkoutToRecord,
        );

      setWorkouts(records);
    } catch (error) {
      console.error(
        'Workout history load error:',
        error,
      );

      if (mounted) {
        Alert.alert(
          'Unable to load workout history',
          error instanceof Error
            ? error.message
            : 'Please try again.',
        );
      }
    } finally {
      if (mounted) {
        setLoadingWorkouts(false);
      }
    }
  }

  void loadWorkouts();

  return () => {
    mounted = false;
  };
}, []);

  const totalMinutes = useMemo(
    () =>
      workouts.reduce(
        (total, workout) =>
          total + workout.duration,
        0,
      ),
    [workouts],
  );

  const totalCalories = useMemo(
    () =>
      workouts.reduce(
        (total, workout) =>
          total + workout.calories,
        0,
      ),
    [workouts],
  );

  const averageDuration = useMemo(
    () =>
      Math.round(
        totalMinutes /
          Math.max(totalWorkouts, 1),
      ),
    [totalMinutes, totalWorkouts],
  );

  const highIntensityCount = useMemo(
  () =>
    workouts.filter(
      (workout) =>
        workout.intensity === 'High',
    ).length,
  [workouts],
);

  const averageCompletion = useMemo(
  () =>
    Math.round(
      workouts.reduce(
        (total, workout) =>
          total + workout.completion,
        0,
      ) /
        Math.max(
          workouts.length,
          1,
        ),
    ),
  [workouts],
);

  const filteredWorkouts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workouts.filter((workout) => {
      const matchesCategory =
        selectedFilter === 'All' ||
        workout.category === selectedFilter;

      const matchesSearch =
        !query ||
        workout.title
          .toLowerCase()
          .includes(query) ||
        workout.category
          .toLowerCase()
          .includes(query) ||
        workout.date
          .toLowerCase()
          .includes(query);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
      }, [
      workouts,
      search,
      selectedFilter,
    ]);

  const latestWorkout = workouts[0];

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/member4/progress');
    }
  }

  function clearSearch() {
    setSearch('');
    setSelectedFilter('All');
  }

  function getIntensityColor(
    intensity: WorkoutRecord['intensity'],
  ) {
    switch (intensity) {
      case 'High':
        return c.teal;

      case 'Moderate':
        return c.text;

      case 'Low':
        return c.muted;

      default:
        return c.muted;
    }
  }

    if (loadingWorkouts) {
      return (
        <M4Screen>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Text
              style={{
                color: c.text,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              Loading workout history...
            </Text>
          </View>
        </M4Screen>
      );
    }

    if (!latestWorkout) {
      return (
        <M4Screen>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <FitnessIcon
              name="workouts"
              size={42}
              color={c.teal}
            />

            <Text
              style={{
                color: c.text,
                fontSize: 18,
                fontWeight: '800',
                marginTop: 14,
              }}
            >
              No workouts yet
            </Text>

            <Text
              style={{
                color: c.muted,
                fontSize: 14,
                marginTop: 6,
                textAlign: 'center',
              }}
            >
              Your completed workouts
              will appear here.
            </Text>
          </View>
        </M4Screen>
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
              backgroundColor: c.cardBg,
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
            FITTRACK / ACTIVITY
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
            Workout history.
          </Text>
        </View>

        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: c.tealDim,
              borderColor: c.teal,
            },
          ]}
        >
          <FitnessIcon
            name="calendar"
            size={21}
            color={c.teal}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}

        <ProfileReveal>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.heroGlow,
                {
                  backgroundColor: c.tealDim,
                },
              ]}
            />

            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text
                  style={[
                    styles.heroEyebrow,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  TRAINING LOG
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  Every workout{'\n'}
                  builds the next one.
                </Text>

                <Text
                  style={[
                    styles.heroDescription,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  Review your sessions, track
                  consistency and see how your
                  training adds up over time.
                </Text>
              </View>

              <View
                style={[
                  styles.heroIcon,
                  {
                    backgroundColor:
                      c.tealDim,
                    borderColor: c.teal,
                  },
                ]}
              >
                <LivePulse />

                <FitnessIcon
                  name="workouts"
                  size={30}
                  color={c.teal}
                />
              </View>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text
                  style={[
                    styles.heroStatLabel,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  WORKOUTS
                </Text>

                <Text
                  style={[
                    styles.heroStatValue,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {totalWorkouts}
                </Text>

                <Text
                  style={[
                    styles.heroStatCaption,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  logged sessions
                </Text>
              </View>

              <View
                style={[
                  styles.heroDivider,
                  {
                    backgroundColor:
                      c.border,
                  },
                ]}
              />

              <View style={styles.heroStat}>
                <Text
                  style={[
                    styles.heroStatLabel,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  TIME
                </Text>

                <Text
                  style={[
                    styles.heroStatValue,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {totalMinutes}
                </Text>

                <Text
                  style={[
                    styles.heroStatCaption,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  total minutes
                </Text>
              </View>

              <View
                style={[
                  styles.heroDivider,
                  {
                    backgroundColor:
                      c.border,
                  },
                ]}
              />

              <View style={styles.heroStat}>
                <Text
                  style={[
                    styles.heroStatLabel,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  CALORIES
                </Text>

                <Text
                  style={[
                    styles.heroStatValue,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {totalCalories}
                </Text>

                <Text
                  style={[
                    styles.heroStatCaption,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  kcal burned
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.heroFooter,
                {
                  borderTopColor: c.border,
                },
              ]}
            >
              <View style={styles.liveRow}>
                <LivePulse />

                <Text
                  style={[
                    styles.liveText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  History updates as workouts are
                  completed
                </Text>
              </View>

              <View
                style={[
                  styles.completionPill,
                  {
                    backgroundColor:
                      c.tealDim,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.completionPillText,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {averageCompletion}% avg
                </Text>
              </View>
            </View>
          </View>
        </ProfileReveal>

        {/* INSIGHTS */}

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
                PERFORMANCE SNAPSHOT
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Training insights
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
              <LivePulse />

              <Text
                style={[
                  styles.livePillText,
                  {
                    color: c.teal,
                  },
                ]}
              >
                LIVE
              </Text>
            </View>
          </View>

          <View style={styles.insightGrid}>
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
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
                  name="clock"
                  size={18}
                  color={c.teal}
                />
              </View>

              <Text
                style={[
                  styles.insightLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                AVG SESSION
              </Text>

              <Text
                style={[
                  styles.insightValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {averageDuration}
                <Text
                  style={[
                    styles.insightUnit,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {' '}
                  min
                </Text>
              </Text>

              <Text
                style={[
                  styles.insightCaption,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                training duration
              </Text>
            </View>

            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
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
                  name="flame"
                  size={18}
                  color={c.teal}
                />
              </View>

              <Text
                style={[
                  styles.insightLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                INTENSE
              </Text>

              <Text
                style={[
                  styles.insightValue,
                  {
                    color: c.text,
                  },
                ]}
              >
                {highIntensityCount}
              </Text>

              <Text
                style={[
                  styles.insightCaption,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                high sessions
              </Text>
            </View>

            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
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
                  name="trend-up"
                  size={18}
                  color={c.teal}
                />
              </View>

              <Text
                style={[
                  styles.insightLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                COMPLETE
              </Text>

              <Text
                style={[
                  styles.insightValue,
                  {
                    color: c.teal,
                  },
                ]}
              >
                {averageCompletion}%
              </Text>

              <Text
                style={[
                  styles.insightCaption,
                  {
                    color: c.subtle,
                  },
                ]}
              >
                avg completion
              </Text>
            </View>
          </View>
        </ProfileReveal>

        {/* LATEST WORKOUT */}

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
                MOST RECENT
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Latest workout
              </Text>
            </View>

            <View
              style={[
                styles.recentPill,
                {
                  backgroundColor:
                    c.tealDim,
                },
              ]}
            >
              <FitnessIcon
                name="check"
                size={12}
                color={c.teal}
              />

              <Text
                style={[
                  styles.recentPillText,
                  {
                    color: c.teal,
                  },
                ]}
              >
                COMPLETED
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.latestCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.teal,
              },
            ]}
          >
            <View style={styles.latestTop}>
              <View
                style={[
                  styles.latestIcon,
                  {
                    backgroundColor:
                      c.tealDim,
                  },
                ]}
              >
                <FitnessIcon
                  name={latestWorkout.icon}
                  size={27}
                  color={c.teal}
                />
              </View>

              <View style={styles.latestCopy}>
                <Text
                  style={[
                    styles.latestCategory,
                    {
                      color: c.teal,
                    },
                  ]}
                >
                  {latestWorkout.category.toUpperCase()}
                </Text>

                <Text
                  style={[
                    styles.latestTitle,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {latestWorkout.title}
                </Text>

                <Text
                  style={[
                    styles.latestDate,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {latestWorkout.date} •{' '}
                  {latestWorkout.time}
                </Text>
              </View>

              <View
                style={[
                  styles.latestStatus,
                  {
                    backgroundColor:
                      c.tealDim,
                  },
                ]}
              >
                <FitnessIcon
                  name="check"
                  size={16}
                  color={c.teal}
                />
              </View>
            </View>

            <View style={styles.latestStats}>
              <View style={styles.latestStat}>
                <FitnessIcon
                  name="clock"
                  size={14}
                  color={c.muted}
                />

                <Text
                  style={[
                    styles.latestStatValue,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {latestWorkout.duration} min
                </Text>
              </View>

              <View style={styles.latestStat}>
                <FitnessIcon
                  name="flame"
                  size={14}
                  color={c.muted}
                />

                <Text
                  style={[
                    styles.latestStatValue,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {latestWorkout.calories} kcal
                </Text>
              </View>

              <View style={styles.latestStat}>
                <FitnessIcon
                  name="workouts"
                  size={14}
                  color={c.muted}
                />

                <Text
                  style={[
                    styles.latestStatValue,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {latestWorkout.exercises} exercises
                </Text>
              </View>
            </View>

            <View style={styles.latestProgressTop}>
              <Text
                style={[
                  styles.latestProgressLabel,
                  {
                    color: c.muted,
                  },
                ]}
              >
                SESSION COMPLETION
              </Text>

              <Text
                style={[
                  styles.latestProgressValue,
                  {
                    color: c.teal,
                  },
                ]}
              >
                {latestWorkout.completion}%
              </Text>
            </View>

            <ProfileProgressBar
              value={latestWorkout.completion}
              color={c.teal}
              trackColor={c.border}
              label="Latest workout completion"
            />
          </View>
        </ProfileReveal>

        {/* SEARCH */}

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
                TRAINING ARCHIVE
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Previous sessions
              </Text>
            </View>

            <View
              style={[
                styles.countPill,
                {
                  backgroundColor:
                    c.surface,
                  borderColor: c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                {filteredWorkouts.length}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
              },
            ]}
          >
            <FitnessIcon
              name="activity"
              size={18}
              color={c.muted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search workout history..."
              placeholderTextColor={c.subtle}
              selectionColor={c.teal}
              style={[
                styles.searchInput,
                {
                  color: c.text,
                },
              ]}
            />

            {!!search && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch('')}
                style={[
                  styles.clearSearchButton,
                  {
                    backgroundColor:
                      c.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.clearSearchText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  ×
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.filterRow
            }
          >
            {FILTERS.map((filter) => {
              const selected =
                selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() =>
                    setSelectedFilter(
                      filter,
                    )
                  }
                  style={({ pressed }) => [
                    styles.filterChip,
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
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: selected
                          ? '#07130F'
                          : c.muted,
                      },
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ProfileReveal>

        {/* WORKOUT LIST */}

        {filteredWorkouts.map(
          (workout, index) => {
            const expanded =
              expandedId === workout.id;

            const intensityColor =
              getIntensityColor(
                workout.intensity,
              );

            return (
              <ProfileReveal
                key={workout.id}
                delay={160 + index * 35}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${workout.title} details`}
                  onPress={() =>
                    setExpandedId(
                      expanded
                        ? null
                        : workout.id,
                    )
                  }
                  style={({ pressed }) => [
                    styles.workoutCard,
                    {
                      backgroundColor:
                        c.cardBg,

                      borderColor:
                        expanded
                          ? c.teal
                          : c.cardBdr,

                      opacity: pressed
                        ? 0.88
                        : 1,
                    },
                  ]}
                >
                  <View
                    style={styles.workoutTop}
                  >
                    <View
                      style={[
                        styles.workoutIcon,
                        {
                          backgroundColor:
                            c.tealDim,
                        },
                      ]}
                    >
                      <FitnessIcon
                        name={workout.icon}
                        size={22}
                        color={c.teal}
                      />
                    </View>

                    <View
                      style={styles.workoutCopy}
                    >
                      <Text
                        style={[
                          styles.workoutCategory,
                          {
                            color: c.teal,
                          },
                        ]}
                      >
                        {workout.category.toUpperCase()}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.workoutTitle,
                          {
                            color: c.text,
                          },
                        ]}
                      >
                        {workout.title}
                      </Text>

                      <Text
                        style={[
                          styles.workoutDate,
                          {
                            color: c.muted,
                          },
                        ]}
                      >
                        {workout.date} •{' '}
                        {workout.time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.chevronButton,
                        {
                          backgroundColor:
                            expanded
                              ? c.tealDim
                              : c.surface,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <FitnessIcon
                        name="chevron"
                        size={16}
                        color={
                          expanded
                            ? c.teal
                            : c.muted
                        }
                      />
                    </View>
                  </View>

                  <View
                    style={styles.workoutMeta}
                  >
                    <View
                      style={styles.metaItem}
                    >
                      <FitnessIcon
                        name="clock"
                        size={13}
                        color={c.muted}
                      />

                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color: c.text,
                          },
                        ]}
                      >
                        {workout.duration} min
                      </Text>
                    </View>

                    <View
                      style={styles.metaItem}
                    >
                      <FitnessIcon
                        name="flame"
                        size={13}
                        color={c.muted}
                      />

                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color: c.text,
                          },
                        ]}
                      >
                        {workout.calories} kcal
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.intensityPill,
                        {
                          backgroundColor:
                            c.surface,

                          borderColor:
                            c.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.intensityDot,
                          {
                            backgroundColor:
                              intensityColor,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.intensityText,
                          {
                            color:
                              intensityColor,
                          },
                        ]}
                      >
                        {workout.intensity}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.progressHeader
                    }
                  >
                    <Text
                      style={[
                        styles.progressLabel,
                        {
                          color: c.subtle,
                        },
                      ]}
                    >
                      COMPLETION
                    </Text>

                    <Text
                      style={[
                        styles.progressValue,
                        {
                          color:
                            workout.completion >=
                            100
                              ? c.teal
                              : c.text,
                        },
                      ]}
                    >
                      {workout.completion}%
                    </Text>
                  </View>

                  <ProfileProgressBar
                    value={
                      workout.completion
                    }
                    color={c.teal}
                    trackColor={c.border}
                    label={`${workout.title} completion`}
                  />

                  {expanded && (
                    <View
                      style={[
                        styles.expandedArea,
                        {
                          borderTopColor:
                            c.border,
                        },
                      ]}
                    >
                      <View
                        style={
                          styles.detailGrid
                        }
                      >
                        <View
                          style={[
                            styles.detailCard,
                            {
                              backgroundColor:
                                c.surface,
                            },
                          ]}
                        >
                          <FitnessIcon
                            name="workouts"
                            size={17}
                            color={c.teal}
                          />

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color: c.text,
                              },
                            ]}
                          >
                            {workout.exercises}
                          </Text>

                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color: c.muted,
                              },
                            ]}
                          >
                            Exercises
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.detailCard,
                            {
                              backgroundColor:
                                c.surface,
                            },
                          ]}
                        >
                          <FitnessIcon
                            name="activity"
                            size={17}
                            color={c.teal}
                          />

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color: c.text,
                              },
                            ]}
                          >
                            {workout.sets}
                          </Text>

                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color: c.muted,
                              },
                            ]}
                          >
                            Sets
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.detailCard,
                            {
                              backgroundColor:
                                c.surface,
                            },
                          ]}
                        >
                          <FitnessIcon
                            name="flame"
                            size={17}
                            color={c.teal}
                          />

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color: c.text,
                              },
                            ]}
                          >
                            {workout.calories}
                          </Text>

                          <Text
                            style={[
                              styles.detailLabel,
                              {
                                color: c.muted,
                              },
                            ]}
                          >
                            Calories
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.noteCard,
                          {
                            backgroundColor:
                              c.tealDim,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.noteIcon,
                            {
                              backgroundColor:
                                c.teal,
                            },
                          ]}
                        >
                          <FitnessIcon
                            name="spark"
                            size={14}
                            color="#07130F"
                          />
                        </View>

                        <View
                          style={
                            styles.noteCopy
                          }
                        >
                          <Text
                            style={[
                              styles.noteLabel,
                              {
                                color: c.teal,
                              },
                            ]}
                          >
                            SESSION NOTE
                          </Text>

                          <Text
                            style={[
                              styles.noteText,
                              {
                                color: c.muted,
                              },
                            ]}
                          >
                            {workout.note}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </Pressable>
              </ProfileReveal>
            );
          },
        )}

        {/* EMPTY STATE */}

        {filteredWorkouts.length === 0 && (
          <ProfileReveal delay={180}>
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
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
                  name="calendar"
                  size={30}
                  color={c.teal}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                No workouts found
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  {
                    color: c.muted,
                  },
                ]}
              >
                Try another category or clear
                your search to view more
                workout history.
              </Text>

              <ProfilePressable
                label="Clear workout history filters"
                onPress={clearSearch}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor:
                      c.teal,
                  },
                ]}
              >
                <FitnessIcon
                  name="activity"
                  size={16}
                  color="#07130F"
                />

                <Text
                  style={
                    styles.clearButtonText
                  }
                >
                  Clear Filters
                </Text>
              </ProfilePressable>
            </View>
          </ProfileReveal>
        )}

        {/* MOTIVATION */}

        <ProfileReveal delay={260}>
          <View
            style={[
              styles.motivationCard,
              {
                backgroundColor: c.cardBg,
                borderColor: c.cardBdr,
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
                size={22}
                color={c.teal}
              />
            </View>

            <View
              style={styles.motivationCopy}
            >
              <Text
                style={[
                  styles.motivationTitle,
                  {
                    color: c.text,
                  },
                ]}
              >
                Consistency leaves evidence.
              </Text>

              <Text
                style={[
                  styles.motivationText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                Your workout history is more
                than a list. It shows every
                session that moved you closer
                to your goals.
              </Text>
            </View>
          </View>
        </ProfileReveal>
      </ScrollView>
    </M4Screen>
  );
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

  headerIcon: {
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
    padding: 20,
    marginBottom: 24,
  },

  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -130,
    right: -70,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    gap: 15,
  },

  heroCopy: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  heroTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  heroDescription: {
    marginTop: 9,
    maxWidth: 290,
    fontSize: 11,
    lineHeight: 17,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroStatsRow: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  heroStat: {
    flex: 1,
  },

  heroStatLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  heroStatValue: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  heroStatCaption: {
    marginTop: 2,
    fontSize: 8,
  },

  heroDivider: {
    width: 1,
    marginHorizontal: 10,
  },

  heroFooter: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 10,
  },

  liveRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  liveText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 13,
  },

  completionPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  completionPillText: {
    fontSize: 9,
    fontWeight: '800',
  },

  livePulseWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  livePulseRing: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1,
  },

  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  sectionHeader: {
    marginBottom: 12,
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

  livePill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  livePillText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  insightGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 24,
  },

  insightCard: {
    flex: 1,
    minHeight: 132,
    padding: 12,
    borderWidth: 1,
    borderRadius: 19,
  },

  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  insightLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  insightValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  insightUnit: {
    fontSize: 10,
    fontWeight: '600',
  },

  insightCaption: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
  },

  recentPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  recentPillText: {
    fontSize: 8,
    fontWeight: '900',
  },

  latestCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginBottom: 24,
  },

  latestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  latestIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  latestCopy: {
    flex: 1,
  },

  latestCategory: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  latestTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '800',
  },

  latestDate: {
    marginTop: 3,
    fontSize: 9,
  },

  latestStatus: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  latestStats: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },

  latestStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  latestStatValue: {
    fontSize: 9,
    fontWeight: '700',
  },

  latestProgressTop: {
    marginTop: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  latestProgressLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  latestProgressValue: {
    fontSize: 11,
    fontWeight: '900',
  },

  countPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    fontSize: 11,
    fontWeight: '800',
  },

  searchBox: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  searchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 11,
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearSearchText: {
    fontSize: 19,
    lineHeight: 21,
  },

  filterRow: {
    gap: 7,
    paddingTop: 10,
    paddingBottom: 15,
  },

  filterChip: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    fontSize: 9,
    fontWeight: '800',
  },

  workoutCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    marginBottom: 11,
  },

  workoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  workoutIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutCopy: {
    flex: 1,
  },

  workoutCategory: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  workoutTitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
  },

  workoutDate: {
    marginTop: 3,
    fontSize: 9,
  },

  chevronButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutMeta: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 11,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaValue: {
    fontSize: 9,
    fontWeight: '700',
  },

  intensityPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  intensityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  intensityText: {
    fontSize: 8,
    fontWeight: '800',
  },

  progressHeader: {
    marginTop: 14,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  progressLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  progressValue: {
    fontSize: 10,
    fontWeight: '900',
  },

  expandedArea: {
    marginTop: 15,
    paddingTop: 14,
    borderTopWidth:
      StyleSheet.hairlineWidth,
  },

  detailGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  detailCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 15,
    padding: 10,
    justifyContent: 'center',
  },

  detailValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '900',
  },

  detailLabel: {
    marginTop: 2,
    fontSize: 8,
  },

  noteCard: {
    marginTop: 10,
    borderRadius: 15,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  noteIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteCopy: {
    flex: 1,
  },

  noteLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  noteText: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 14,
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    marginTop: 5,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '900',
  },

  emptyDescription: {
    marginTop: 6,
    maxWidth: 280,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },

  clearButton: {
    marginTop: 15,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  clearButtonText: {
    color: '#07130F',
    fontSize: 10,
    fontWeight: '900',
  },

  motivationCard: {
    marginTop: 16,
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
});