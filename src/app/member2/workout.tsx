import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useMember } from "@/providers/member-state";
import { useTheme } from "@/hooks/use-theme";
import { WorkoutFonts } from "@/constants/theme";
import {
  categoryDetails,
  durations,
  matchingWorkouts,
  recommendedWorkout,
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

export default function WorkoutScreen() {
  const theme = useTheme();
  const { name, signedOut } = useMember();
  const [query, setQuery] = useState("");
  const [duration, setDuration] = useState("15");
  const matching = matchingWorkouts(query, { duration });
  const recommended =
    !query && duration === "15" ? [recommendedWorkout] : matching;
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
            Good Morning 🌟
          </WorkoutText>
          <WorkoutText weight="bold" style={{ fontSize: 15, lineHeight: 19 }}>
            {signedOut ? "Guest" : name.split(" ")[0]}
          </WorkoutText>
        </View>
        <View
          accessibilityLabel="Nimal profile"
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
              fontSize: 9,
            }}
          >
            {signedOut ? "G" : name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <WorkoutSearch value={query} onChange={setQuery} onFilter={openFilters} />
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
        {recommended.length ? (
          recommended
            .slice(0, 3)
            .map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))
        ) : (
          <WorkoutText muted>
            No workouts found. Try another duration or search.
          </WorkoutText>
        )}
        <WorkoutButton
          title="Start Quick Workout"
          onPress={() => {
            // Member 2 does not open another member's workout/session screens.
          }}
        />
      </View>
    </WorkoutScreenFrame>
  );
}
