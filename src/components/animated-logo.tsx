import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

interface AnimatedFitTrackLogoProps {
  size?: number;
  onFinished?: () => void;
}

export function AnimatedFitTrackLogo({ size = 260, onFinished }: AnimatedFitTrackLogoProps) {
  // Animation shared values
  const circleScale = useSharedValue(0.8);
  const circleOpacity = useSharedValue(0);

  const muscleScale = useSharedValue(0.5);
  const muscleOpacity = useSharedValue(0);
  const muscleTranslateX = useSharedValue(-20);
  const muscleTranslateY = useSharedValue(20);

  const glowScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0);

  const playAnimation = () => {
    // Reset initial values
    circleScale.value = 0.8;
    circleOpacity.value = 0;

    muscleScale.value = 0.5;
    muscleOpacity.value = 0;
    muscleTranslateX.value = -20;
    muscleTranslateY.value = 20;

    glowScale.value = 0.6;
    glowOpacity.value = 0;

    // 1. Circle & FitTrack typography reveal
    circleOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    circleScale.value = withSpring(1, {
      damping: 14,
      stiffness: 110,
    });

    // 2. Power muscle flex entry (starts after circle appears)
    muscleOpacity.value = withDelay(
      320,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
    );
    muscleScale.value = withDelay(
      320,
      withSpring(1, {
        damping: 11,
        stiffness: 120,
      })
    );
    muscleTranslateX.value = withDelay(
      320,
      withSpring(0, {
        damping: 12,
        stiffness: 110,
      })
    );
    muscleTranslateY.value = withDelay(
      320,
      withSpring(0, {
        damping: 12,
        stiffness: 110,
      })
    );

    // 3. Teal energy glow pulse behind the logo upon assembly
    glowOpacity.value = withDelay(
      650,
      withSequence(
        withTiming(0.45, { duration: 300 }),
        withTiming(0.12, { duration: 600 })
      )
    );
    glowScale.value = withDelay(
      650,
      withSequence(
        withTiming(1.15, { duration: 350 }),
        withTiming(1, { duration: 550 })
      )
    );

    if (onFinished) {
      setTimeout(onFinished, 1300);
    }
  };

  useEffect(() => {
    playAnimation();
  }, []);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const muscleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: muscleOpacity.value,
    transform: [
      { scale: muscleScale.value },
      { translateX: muscleTranslateX.value },
      { translateY: muscleTranslateY.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Pressable
      onPress={playAnimation}
      accessibilityRole="button"
      accessibilityLabel="FitTrack Logo - Tap to replay animation"
      style={[styles.container, { width: size, height: size }]}>
      {/* Background Energy Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderRadius: (size * 0.75) / 2,
          },
          glowAnimatedStyle,
        ]}
      />

      {/* Part 1: Outer Circle & FitTrack text */}
      <Animated.View style={[StyleSheet.absoluteFill, circleAnimatedStyle]}>
        <Image
          source={require('@/assets/images/fittrack_logo_circle.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Part 2: Inner Bicep Muscle & Dumbbell */}
      <Animated.View style={[StyleSheet.absoluteFill, muscleAnimatedStyle]}>
        <Image
          source={require('@/assets/images/fittrack_logo_muscle.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(54, 184, 158, 0.35)', // fallback teal glow
    shadowColor: '#36B89E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
