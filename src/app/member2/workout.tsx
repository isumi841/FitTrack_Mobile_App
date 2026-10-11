import { useCallback, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useDiscoveryTheme as useTheme } from "@/features/discovery/theme";
import { NavigationIcon } from '@/components/navigation/navigation-icon';
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
import { useMember4Profile } from '@/features/member4/context/Member4ProfileContext';

export default function WorkoutScreen() {
  const { session } = useAuth();
  const { profile, refreshProfile } = useMember4Profile();
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile])
  );

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
        <View style={{ flex: 1, minWidth: 0, gap: 1, marginRight: 12 }}>
          <WorkoutText
            muted
            weight="medium"
            style={{ fontSize: 9, lineHeight: 12 }}
          >
            Welcome to FitTrack
          </WorkoutText>
          <WorkoutText weight="bold" numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 15, lineHeight: 19 }}>
            {profile?.fullName || session?.user.email || 'Welcome'}
          </WorkoutText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => router.navigate('/member4/profile')}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: theme.workoutAccent,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: theme.workoutCard,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 22 }}
              resizeMode="cover"
            />
          ) : (
            <NavigationIcon name="profile" color={theme.workoutAccent} size={22} />
          )}
        </Pressable>
      </View>
      <WorkoutSearch value={query} onChange={setQuery} onFilter={openFilters} />
      {session?.user.role === 'admin' && <WorkoutButton title="Admin dashboard" secondary onPress={() => router.push('/admin')} />}

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
