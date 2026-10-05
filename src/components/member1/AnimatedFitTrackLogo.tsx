/**
 * AnimatedFitTrackLogo
 * Member 1 — Onboarding & Personalization
 *
 * Renders the two-part FitTrack logo with a smooth entrance animation:
 *   1. Circle + FitTrack text layer fades in and scales up
 *   2. Muscle/dumbbell layer slides in slightly from below, fading in
 *   3. A continuous gentle floating effect runs after the entrance
 *
 * Both PNG layers have transparent backgrounds (RGBA), so they
 * composite cleanly over any background color.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

interface AnimatedFitTrackLogoProps {
  /** Outer container size in logical pixels (default 200) */
  size?: number;
}

export function AnimatedFitTrackLogo({ size = 200 }: AnimatedFitTrackLogoProps) {
  // --- Entrance animation values ---
  const [circleOpacity] = React.useState(() => new Animated.Value(0));
  const [circleScale] = React.useState(() => new Animated.Value(0.82));

  const [muscleOpacity] = React.useState(() => new Animated.Value(0));
  const [muscleTranslateY] = React.useState(() => new Animated.Value(14));
  const [muscleScale] = React.useState(() => new Animated.Value(0.88));

  // --- Continuous floating animation ---
  const [floatY] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    // 1. Circle reveal
    Animated.parallel([
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Muscle/dumbbell reveal — slight delay after circle
    Animated.sequence([
      Animated.delay(280),
      Animated.parallel([
        Animated.timing(muscleOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(muscleTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.spring(muscleScale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 3. Soft continuous float after entrance completes
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -6,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const circleStyle = {
    opacity: circleOpacity,
    transform: [{ scale: circleScale }, { translateY: floatY }],
  };

  const muscleStyle = {
    opacity: muscleOpacity,
    transform: [
      { scale: muscleScale },
      { translateY: Animated.add(muscleTranslateY, floatY) },
    ],
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Layer 1 — Outer teal circle + "FitTrack" text */}
      <Animated.View style={[StyleSheet.absoluteFill, circleStyle]}>
        <Image
          source={require('@/assets/images/fittrack_logo_circle.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Layer 2 — Bicep + dumbbell inside the circle */}
      <Animated.View style={[StyleSheet.absoluteFill, muscleStyle]}>
        <Image
          source={require('@/assets/images/fittrack_logo_muscle.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
