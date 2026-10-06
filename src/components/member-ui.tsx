import { WorkoutFonts } from "@/constants/theme";
import { WorkoutIcon } from "@/components/workouts/workout-ui";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { useMember } from "@/providers/member-state";
import type { Workout } from "@/data/workouts";

export function Label({
  children,
  large = false,
  muted = false,
}: {
  children: ReactNode;
  large?: boolean;
  muted?: boolean;
}) {
  const theme = useTheme();
  return (
    <Text
      style={{
        color: muted ? theme.textSecondary : theme.text,
        fontSize: large ? 25 : 15,
        fontFamily: large ? WorkoutFonts.bold : WorkoutFonts.regular,
        lineHeight: large ? 32 : 23,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  soft = false,
  icon,
}: {
  title: string;
  onPress: () => void;
  soft?: boolean;
  icon?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        {
          backgroundColor: soft ? theme.backgroundSelected : theme.accent,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: soft ? theme.text : theme.workoutOnAccent,
          fontFamily: WorkoutFonts.semibold,
          fontSize: 15,
        }}
      >
        {icon ? `${icon}  ` : ""}
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
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
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        ui.chip,
        {
          backgroundColor: selected
            ? theme.backgroundSelected
            : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: theme.text,
          fontFamily: selected ? WorkoutFonts.semibold : WorkoutFonts.regular,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        ui.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Search({
  value,
  onChangeText,
  placeholder = "Search workouts",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  const theme = useTheme();
  return (
    <TextInput
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      returnKeyType="search"
      style={[
        ui.input,
        {
          color: theme.text,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    />
  );
}
export function Screen({
  title,
  subtitle,
  back = true,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        ui.screen,
        { paddingTop: insets.top + 18, paddingBottom: 120 + insets.bottom },
      ]}
    >
      <View
        style={{ minHeight: 56, justifyContent: "center", marginBottom: 8 }}
      >
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={{
              position: "absolute",
              left: 0,
              width: 44,
              height: 44,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.backgroundElement,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <WorkoutIcon
              ios="arrow.left"
              material="arrow_back"
              color={theme.text}
            />
          </Pressable>
        )}
        <Text
          style={{
            fontFamily: WorkoutFonts.bold,
            fontSize: 22,
            lineHeight: 30,
            color: theme.text,
            textAlign: "center",
            marginHorizontal: 50,
          }}
        >
          {title}
        </Text>
      </View>
      {subtitle && <Label muted>{subtitle}</Label>}
      {children}
    </ScrollView>
  );
}
export function WorkoutCard({ workout }: { workout: Workout }) {
  const { favorites, toggleFavorite } = useMember();
  const saved = favorites.includes(workout.id);
  return (
    <Card>
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <Label muted>
            {workout.category} · {workout.duration} min
          </Label>
          <Label large>{workout.title}</Label>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${saved ? "Remove" : "Save"} ${workout.title}`}
          accessibilityState={{ selected: saved }}
          onPress={() => toggleFavorite(workout.id)}
          style={{ padding: 12 }}
        >
          <Label>{saved ? "♥" : "♡"}</Label>
        </Pressable>
      </View>
      <Label muted>
        {workout.level} · {workout.focus}
      </Label>
      <Label muted>{workout.equipment}</Label>
      <Button
        title={`View ${workout.title}`}
        soft
        onPress={() =>
          router.push({
            pathname: "/workout-overview",
            params: { id: workout.id },
          })
        }
      />
    </Card>
  );
}
export function WorkoutList({ items }: { items: Workout[] }) {
  return (
    <>
      {items.length ? (
        items.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))
      ) : (
        <Card>
          <Label large>No workouts found</Label>
          <Label muted>Try another search or remove a filter.</Label>
        </Card>
      )}
    </>
  );
}
export const ui = StyleSheet.create({
  screen: {
    paddingHorizontal: 22,
    gap: 16,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  categoryCell: { flexGrow: 1, flexBasis: 200 },
  card: { padding: 20, borderRadius: 22, borderWidth: 1, gap: 12 },
  button: {
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    minHeight: 48,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 44,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: WorkoutFonts.regular,
  },
});
