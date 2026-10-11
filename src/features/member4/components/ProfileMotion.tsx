import { useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { NAV_SPRING } from '@/components/navigation/navigation-theme';

export function ProfileReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const entering = useMemo(
    () => FadeInDown.duration(360).delay(delay).reduceMotion(ReduceMotion.System),
    [delay],
  );
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

export function ProfilePressable({
  children, onPress, label, hint, testID, style,
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  hint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        testID={testID}
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.98, { ...NAV_SPRING, reduceMotion: ReduceMotion.System }))}
        onPressOut={() => scale.set(withSpring(1, { ...NAV_SPRING, reduceMotion: ReduceMotion.System }))}
        style={({ pressed }) => [style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function ProfileProgressBar({ value, color, trackColor, label }: {
  value: number;
  color: string;
  trackColor: string;
  label: string;
}) {
  const percentage = Math.max(0, Math.min(100, value));
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(percentage, { duration: 700, reduceMotion: ReduceMotion.System }));
  }, [percentage, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ width: `${progress.get()}%` }));

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.86 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
