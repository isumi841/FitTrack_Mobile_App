import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openProgress, startWorkout } from "@/utils/integration";
import { WorkoutIcon } from "@/components/workouts/workout-ui";
import { WorkoutFonts } from "@/constants/theme";
import { isWorkoutRoute, WORKOUTS_TAB } from "@/constants/navigation-config";
import { NAV_COLORS, NAV_SPRING } from "@/constants/navigation-theme";
import { useTheme } from "@/hooks/use-theme";

export default function MemberBottomNav() {
  const path = usePathname();
  const theme = useTheme();
  const workoutRoute = path === "/" || isWorkoutRoute(path);
  const navColors = workoutRoute
    ? {
        ...NAV_COLORS,
        surface: theme.workoutCard,
        accent: theme.workoutAccent,
        accentSoft: theme.workoutDim,
        border: theme.workoutBorder,
        text: theme.workoutText,
        muted: theme.workoutMuted,
        ink: theme.workoutOnAccent,
      }
    : NAV_COLORS;
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [indicator] = useState(() => new Animated.Value(0));
  const active =
    path === "/"
      ? 0
      : path === "/profile"
        ? 4
        : WORKOUTS_TAB.matchPaths.some((matchPath) => matchPath === path)
          ? 1
          : -1;
  useEffect(() => {
    const animation = Animated.spring(indicator, {
      toValue: (Math.max(active, 0) * width) / 5,
      useNativeDriver: Platform.OS !== "web",
      ...NAV_SPRING,
    });
    animation.start();
    return () => animation.stop();
  }, [active, width, indicator]);
  const tabs = [
    {
      title: "Home",
      icon: "house",
      material: "home",
      action: () => router.navigate("/"),
    },
    {
      title: "Workouts",
      icon: "dumbbell",
      material: "fitness_center",
      action: () => router.navigate(WORKOUTS_TAB.href),
    },
    {
      title: "Quick Start",
      icon: "plus",
      material: "add",
      action: () => startWorkout("1"),
    },
    {
      title: "Progress",
      icon: "chart.bar.fill",
      material: "bar_chart",
      action: openProgress,
    },
    {
      title: "Profile",
      icon: "person",
      material: "person_outline",
      action: () => undefined,
    },
  ];
  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12),
          left: Math.max(insets.left, 12),
          right: Math.max(insets.right, 12),
        },
      ]}
    >
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[
          styles.bar,
          { backgroundColor: navColors.surface, borderColor: navColors.border },
        ]}
      >
        {active >= 0 && (
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: navColors.accentSoft },
              { pointerEvents: "none" },
              { width: width / 5, transform: [{ translateX: indicator }] },
            ]}
          />
        )}
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.title}
            accessibilityRole="button"
            accessibilityLabel={tab.title}
            accessibilityState={{ selected: active === index }}
            onPress={tab.action}
            style={({ pressed }) => [
              styles.tab,
              { minWidth: 0 },
              {
                opacity: pressed ? 0.6 : 1,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}
          >
            <View
              style={
                index === 2
                  ? [styles.plus, { backgroundColor: navColors.accent }]
                  : undefined
              }
            >
              <WorkoutIcon
                ios={tab.icon as Parameters<typeof WorkoutIcon>[0]["ios"]}
                material={
                  tab.material as Parameters<typeof WorkoutIcon>[0]["material"]
                }
                size={index === 2 ? 30 : 25}
                color={
                  index === 2
                    ? navColors.ink
                    : active === index
                      ? navColors.accent
                      : navColors.muted
                }
              />
            </View>
            {active === index && (
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: navColors.accent },
                ]}
              />
            )}
            {index !== 2 && (
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
                style={[
                  styles.label,
                  {
                    color:
                      active === index ? navColors.accent : navColors.muted,
                  },
                ]}
              >
                {tab.title}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { position: "absolute", alignItems: "center" },
  bar: {
    backgroundColor: NAV_COLORS.surface,
    borderColor: NAV_COLORS.border,
    borderWidth: 1,
    borderRadius: 30,
    flexDirection: "row",
    height: 80,
    width: "100%",
    maxWidth: 640,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    height: 78,
    borderRadius: 28,
    backgroundColor: NAV_COLORS.accentSoft,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  icon: { fontSize: 27, lineHeight: 32 },
  plus: {
    backgroundColor: NAV_COLORS.accent,
    borderRadius: 20,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 44,
    fontSize: 32,
  },
  activeDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: { fontSize: 10, fontFamily: WorkoutFonts.semibold },
});
