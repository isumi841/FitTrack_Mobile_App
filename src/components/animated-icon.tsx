import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import Animated, {
  Easing,
  Keyframe,
} from 'react-native-reanimated';

import {
  scheduleOnRN,
} from 'react-native-worklets';

const DURATION = 1800;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] =
    useState(false);

  const [visible, setVisible] =
    useState(true);

  if (!visible) {
    return null;
  }

  const splashKeyframe =
    new Keyframe({
      0: {
        opacity: 1,

        transform: [
          {
            scale: 0.7,
          },
        ],
      },

      30: {
        opacity: 1,

        transform: [
          {
            scale: 1.05,
          },
        ],

        easing:
          Easing.out(
            Easing.cubic,
          ),
      },

      55: {
        opacity: 1,

        transform: [
          {
            scale: 1,
          },
        ],
      },

      82: {
        opacity: 1,

        transform: [
          {
            scale: 1,
          },
        ],
      },

      100: {
        opacity: 0,

        transform: [
          {
            scale: 1.18,
          },
        ],

        easing:
          Easing.inOut(
            Easing.cubic,
          ),
      },
    });

  const image = (
    <View style={styles.logoArea}>
      <View
        style={styles.outerGlow}
      />

      <View
        style={styles.innerGlow}
      />

      <Image
        source={require(
          '../../assets/images/fittrack_app_icon.png'
        )}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe
        .duration(DURATION)
        .withCallback(
          (finished) => {
            'worklet';

            if (finished) {
              scheduleOnRN(
                setVisible,
                false,
              );
            }
          },
        )}
      style={styles.splashOverlay}
    >
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen
          .hideAsync()
          .finally(() => {
            setAnimate(true);
          });
      }}
      style={styles.splashOverlay}
    >
      {image}
    </View>
  );
}

const styles =
  StyleSheet.create({
    splashOverlay: {
      ...StyleSheet.absoluteFill,

      backgroundColor:
        '#050806',

      alignItems: 'center',

      justifyContent:
        'center',

      zIndex: 1000,
    },

    logoArea: {
      width: 240,

      height: 240,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    outerGlow: {
      position: 'absolute',

      width: 215,

      height: 215,

      borderRadius: 108,

      backgroundColor:
        'rgba(201, 255, 51, 0.06)',
    },

    innerGlow: {
      position: 'absolute',

      width: 175,

      height: 175,

      borderRadius: 88,

      backgroundColor:
        'rgba(201, 255, 51, 0.10)',
    },

    image: {
      width: 180,

      height: 180,
    },
  });