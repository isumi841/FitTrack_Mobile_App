import type { ReactNode } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useDiscoveryTheme as useTheme, WorkoutFonts, WorkoutFontWeights } from "@/features/discovery/theme";
import { useDiscovery } from "@/features/discovery/store";
import {
  categoryDetails,
  matchingWorkouts,
  type Member2Workout,
} from "@/data/member2-workouts";

export function WorkoutIcon({
  ios,
  material,
  size = 20,
  color,
}: {
  ios: SFSymbol;
  material: AndroidSymbol;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <SymbolView
      name={{ ios, android: material, web: material }}
      size={size}
      tintColor={color ?? theme.workoutAccent}
      accessible={false}
    />
  );
}
export function WorkoutText({
  children,
  weight = "regular",
  muted = false,
  style,
}: {
  children: ReactNode;
  weight?: keyof typeof WorkoutFonts;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: WorkoutFonts[weight],
          fontWeight: WorkoutFontWeights[weight],
          color: muted ? theme.workoutMuted : theme.workoutText,
          fontSize: 14,
          lineHeight: 22,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function WorkoutScreenFrame({
  title,
  subtitle,
  children,
  back = true,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  back?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: theme.workoutBackground }}
    >
      <ScrollView
        testID="member2-scroll"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={[
          workoutStyles.screen,
          { paddingBottom: 24 + insets.bottom },
        ]}
      >
        {title && (
          <View style={{ minHeight: 56, justifyContent: "center" }}>
            {back && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() =>
                  router.canGoBack()
                    ? router.back()
                    : router.replace("/member2/workout")
                }
                style={{
                  position: "absolute",
                  left: 0,
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: theme.workoutSurface,
                  borderWidth: 1,
                  borderColor: theme.workoutBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WorkoutIcon
                  ios="arrow.left"
                  material="arrow_back"
                  color={theme.workoutText}
                />
              </Pressable>
            )}
            <WorkoutText
              weight="bold"
              style={{
                fontSize: 22,
                lineHeight: 30,
                textAlign: "center",
                marginHorizontal: 50,
              }}
            >
              {title}
            </WorkoutText>
          </View>
        )}
        {subtitle && <WorkoutText muted>{subtitle}</WorkoutText>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function WorkoutSurface({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        workoutStyles.card,
        {
          backgroundColor: theme.workoutCard,
          borderColor: theme.workoutCardBorder,
        },
      ]}
    >
      {children}
    </View>
  );
}
export function WorkoutButton({
  title,
  onPress,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        workoutStyles.button,
        {
          backgroundColor: secondary
            ? theme.workoutSurface
            : theme.workoutAccent,
          borderColor: secondary ? theme.workoutBorder : theme.workoutAccent,
        },
        pressed && workoutStyles.pressed,
      ]}
    >
      <WorkoutText
        weight="semibold"
        style={{ color: secondary ? theme.workoutText : theme.workoutOnAccent }}
      >
        {title}
      </WorkoutText>
    </Pressable>
  );
}
export function FilterChip({
  title,
  selected = false,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      style={({ pressed }) => [
        workoutStyles.chip,
        {
          backgroundColor: selected ? theme.workoutDim : theme.workoutSurface,
          borderColor: selected
            ? theme.workoutActiveBorder
            : theme.workoutBorder,
        },
        pressed && workoutStyles.pressed,
      ]}
    >
      <WorkoutText
        weight="semibold"
        style={{
          color: selected ? theme.workoutAccent : theme.workoutMuted,
          fontSize: 12,
        }}
      >
        {title}
      </WorkoutText>
    </Pressable>
  );
}
export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={workoutStyles.row}>
      <WorkoutText weight="semibold" style={workoutStyles.sectionTitle}>
        {title}
      </WorkoutText>
      {action && onPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onPress}
          style={({ pressed }) => [
            workoutStyles.textButton,
            pressed && workoutStyles.pressed,
          ]}
        >
          <WorkoutText
            weight="semibold"
            style={{ color: theme.workoutAccent, fontSize: 12 }}
          >
            {action}
          </WorkoutText>
        </Pressable>
      )}
    </View>
  );
}
export function WorkoutSearch({
  value,
  onChange,
  onFilter,
}: {
  value: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        workoutStyles.search,
        {
          backgroundColor: theme.workoutSurface,
          borderColor: theme.workoutBorder,
        },
      ]}
    >
      <WorkoutIcon
        ios="magnifyingglass"
        material="search"
        color={theme.workoutSubtle}
      />
      <TextInput
        accessibilityLabel="Search workouts"
        placeholder="Search workouts, movement, muscle..."
        placeholderTextColor={theme.workoutSubtle}
        value={value}
        onChangeText={onChange}
        autoCorrect={false}
        returnKeyType="search"
        style={[
          workoutStyles.searchInput,
          { color: theme.workoutText, fontFamily: WorkoutFonts.regular },
        ]}
      />
      {onFilter && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter workouts"
          onPress={onFilter}
          style={({ pressed }) => [
            workoutStyles.filterButton,
            { backgroundColor: theme.workoutDim },
            pressed && workoutStyles.pressed,
          ]}
        >
          <WorkoutIcon ios="slider.horizontal.3" material="tune" />
        </Pressable>
      )}
    </View>
  );
}
export function CategoryCard({
  category,
  compact = false,
}: {
  category: (typeof categoryDetails)[number];
  compact?: boolean;
}) {
  const theme = useTheme();
  const count = matchingWorkouts("", { category: category.title }).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explore ${category.title}`}
      onPress={() =>
        router.push({
          pathname: "/member2/workout-library",
          params: { category: category.title },
        })
      }
      style={({ pressed }) => [
        workoutStyles.card,
        workoutStyles.categoryCard,
        {
          backgroundColor: theme.workoutCard,
          borderColor: theme.workoutCardBorder,
        },
        pressed && workoutStyles.pressed,
      ]}
    >
      <View style={workoutStyles.row}>
        <View
          style={[
            workoutStyles.iconTile,
            { backgroundColor: theme.workoutDim },
          ]}
        >
          <WorkoutIcon
            ios={category.ios}
            material={category.material}
            size={25}
          />
        </View>
        <WorkoutIcon
          ios="chevron.right"
          material="chevron_right"
          size={18}
          color={theme.workoutSubtle}
        />
      </View>
      <WorkoutText weight="semibold" style={{ fontSize: compact ? 15 : 16 }}>
        {category.title}
      </WorkoutText>
      {!compact && <WorkoutText muted>{category.description}</WorkoutText>}
      <WorkoutText muted style={workoutStyles.metadata}>
        {count} workouts
      </WorkoutText>
    </Pressable>
  );
}
export function WorkoutCard({
  workout,
  compact = false,
}: {
  workout: Member2Workout;
  compact?: boolean;
}) {
  const theme = useTheme();
  const { favorites, toggleFavorite } = useDiscovery();
  const saved = favorites.includes(workout.id);
  const icon = categoryDetails.find(
    (category) => category.title === workout.category,
  )!;
  const openWorkout = () => router.push({ pathname: "/workout/details", params: { workoutId: workout.id } });
  if (compact)
    return (
      <WorkoutSurface>
        <View
          style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}
        >
          <View
            style={[
              workoutStyles.iconTile,
              { backgroundColor: theme.workoutDim },
            ]}
          >
            <WorkoutIcon ios={icon.ios} material={icon.material} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${workout.title}`}
            onPress={openWorkout}
            style={{ flex: 1, gap: 4 }}
          >
            <WorkoutText weight="semibold">{workout.title}</WorkoutText>
            <WorkoutText muted style={workoutStyles.metadata}>
              {workout.description}
            </WorkoutText>
            <WorkoutText
              style={[workoutStyles.metadata, { color: theme.workoutAccent }]}
            >
              {workout.difficulty} · {workout.duration} min
            </WorkoutText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${saved ? "Unsave" : "Save"} ${workout.title}`}
            onPress={() => toggleFavorite(workout.id)}
            style={workoutStyles.iconButton}
          >
            <WorkoutIcon
              ios={saved ? "bookmark.fill" : "bookmark"}
              material={saved ? "bookmark" : "bookmark_border"}
              size={18}
            />
          </Pressable>
        </View>
        <View
          style={[
            workoutStyles.row,
            {
              borderTopWidth: 1,
              borderColor: theme.workoutBorder,
              paddingTop: 8,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${workout.title}`}
            onPress={openWorkout}
            style={{
              minWidth: 64,
              minHeight: 44,
              borderRadius: 22,
              backgroundColor: theme.workoutDim,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WorkoutText
              weight="semibold"
              style={{ fontSize: 12, color: theme.workoutAccent }}
            >
              View
            </WorkoutText>
          </Pressable>
        </View>
      </WorkoutSurface>
    );
  return (
    <View style={{ position: "relative" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${workout.title}`}
        onPress={openWorkout}
        style={({ pressed }) => [
          workoutStyles.card,
          {
            backgroundColor: theme.workoutCard,
            borderColor: theme.workoutCardBorder,
          },
          pressed && workoutStyles.pressed,
        ]}
      >
        <View style={workoutStyles.row}>
          <View
            style={[
              workoutStyles.iconTile,
              { backgroundColor: theme.workoutDim },
            ]}
          >
            <WorkoutIcon ios={icon.ios} material={icon.material} size={26} />
          </View>
          <View style={{ width: 44, height: 44 }} />
        </View>
        <WorkoutText
          weight="medium"
          style={[workoutStyles.metadata, { color: theme.workoutAccent }]}
        >
          {workout.difficulty} · {workout.duration} mins
        </WorkoutText>
        <WorkoutText weight="bold" style={workoutStyles.cardTitle}>
          {workout.title}
        </WorkoutText>
        <WorkoutText muted>{workout.description}</WorkoutText>
        <View style={workoutStyles.row}>
          <View style={{ width: 18, height: 18 }} />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${workout.title}`}
        onPress={openWorkout}
        hitSlop={12}
        style={{ position: "absolute", left: 16, bottom: 16, width: 18, height: 18 }}
      >
        <WorkoutIcon ios="arrow.right" material="arrow_forward" size={18} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${saved ? "Unsave" : "Save"} ${workout.title}`}
        onPress={(event) => {
          event.stopPropagation();
          toggleFavorite(workout.id);
        }}
        style={({ pressed }) => [
          workoutStyles.iconButton,
          { position: "absolute", top: 18, right: 18 },
          pressed && workoutStyles.pressed,
        ]}
      >
        <WorkoutIcon
          ios={saved ? "heart.fill" : "heart"}
          material={saved ? "favorite" : "favorite_border"}
        />
      </Pressable>
    </View>
  );
}
export function WorkoutList({ workouts }: { workouts: Member2Workout[] }) {
  return (
    <>
      {workouts.length ? (
        workouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} compact />
        ))
      ) : (
        <WorkoutSurface>
          <WorkoutText weight="semibold" style={workoutStyles.sectionTitle}>
            No workouts found
          </WorkoutText>
          <WorkoutText muted>
            Try another search or remove a filter.
          </WorkoutText>
        </WorkoutSurface>
      )}
    </>
  );
}
export const workoutStyles = StyleSheet.create({
  screen: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    alignSelf: "flex-start",
  },
  pageTitle: { fontSize: 28, lineHeight: 38, letterSpacing: -0.8 },
  sectionTitle: { fontSize: 18, lineHeight: 26, letterSpacing: -0.3 },
  cardTitle: { fontSize: 22, lineHeight: 30, letterSpacing: -0.6 },
  metadata: { fontSize: 11, lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  categoryCard: { flexBasis: "46%", flexGrow: 1, minHeight: 125 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 17,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 5,
    minHeight: 56,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    fontSize: 12,
    paddingVertical: 14,
    outlineWidth: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
