import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useDiscoveryTheme as useTheme, WorkoutFonts, WorkoutFontWeights } from "@/features/discovery/theme";
import {
  categoryDetails,
  durations,
} from "@/data/member2-workouts";
import {
  CategoryCard,
  FilterChip,
  SectionHeader,
  WorkoutButton,
  WorkoutCard,
  WorkoutScreenFrame,
  WorkoutSearch,
  WorkoutText,
  workoutStyles,
} from "@/components/workouts/workout-ui";
import { useWorkouts } from '@/features/discovery/use-workouts';
import { WorkoutLoadState } from '@/features/discovery/workout-load-state';
import { useAuth } from '@/features/member1/auth/provider';

export default function WorkoutScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [duration, setDuration] = useState("15");
  const resource = useWorkouts(query, { duration });
  const { items: recommended, loading, error } = resource;
  const quickWorkout = recommended[0];
  const openFilters = () =>
    router.push({
      pathname: "/member2/workout-filter",
      params: { duration, query },
    });

  return (
    <WorkoutScreenFrame back={false}>
      <View
        style={[
          workoutStyles.row,
          {
            flexWrap: "nowrap",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: theme.workoutBorder,
            paddingBottom: 8,
          },
        ]}
      >
        <View style={{ flex: 1, gap: 1 }}>
          <WorkoutText
            muted
            weight="medium"
            style={{ fontSize: 9, lineHeight: 12 }}
          >
            Welcome to FitTrack
          </WorkoutText>
          <WorkoutText weight="bold" style={{ fontSize: 15, lineHeight: 19 }}>
            Let’s move
          </WorkoutText>
        </View>
        <View
          accessibilityLabel="FitTrack"
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.workoutAccent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: theme.workoutAccent,
              fontFamily: WorkoutFonts.semibold,
              fontWeight: WorkoutFontWeights.semibold,
              fontSize: 9,
            }}
          >
            F
          </Text>
        </View>
      </View>
      <WorkoutSearch value={query} onChange={setQuery} onFilter={openFilters} />
      {(!session || session.user.role === 'admin') && <WorkoutButton title={session ? 'Admin dashboard' : 'Log in / Sign up'} secondary onPress={() => router.push(session ? '/admin' : '/member1_onboarding_personalization/login')} />}

      <View style={{ gap: 12 }}>
        <View style={workoutStyles.row}>
          <WorkoutText
            weight="semibold"
            muted
            style={{ fontSize: 11, letterSpacing: 1.4 }}
          >
            Session length
          </WorkoutText>
          <WorkoutText muted style={{ fontSize: 10 }}>
            Flexible time
          </WorkoutText>
        </View>
        <View style={workoutStyles.chips}>
          {durations.map((value) => (
            <FilterChip
              key={value}
              title={`${value} min`}
              selected={duration === value}
              onPress={() => setDuration(value)}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <SectionHeader
          title="Categories"
          action="Explore"
          onPress={() => router.push("/member2/workout-categories")}
        />
        <View style={workoutStyles.grid}>
          {categoryDetails.map((category) => (
            <CategoryCard key={category.title} category={category} compact />
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <SectionHeader
          title={query ? "Your matches" : "Recommended For You"}
          action="See All"
          onPress={() =>
            router.push({
              pathname: "/member2/workout-library",
              params: { duration, query },
            })
          }
        />
        <WorkoutLoadState {...resource} />
        {!loading && !error && (recommended.length ? (
          recommended
            .slice(0, 3)
            .map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))
        ) : (
          <WorkoutText muted>
            No workouts found. Try another duration or search.
          </WorkoutText>
        ))}
        {!loading && !error && quickWorkout && <WorkoutButton
          title="View Quick Workout"
          onPress={() => router.push({ pathname: "/workout/details", params: { workoutId: quickWorkout.id } })}
        />}
      </View>
    </WorkoutScreenFrame>
  );
}
