import { router } from 'expo-router';
import {
  useEffect,
  useRef,
} from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function Index() {
  const opacity = useRef(
    new Animated.Value(0),
  ).current;

  const scale = useRef(
    new Animated.Value(0.75),
  ).current;

  const translateY = useRef(
    new Animated.Value(10),
  ).current;

  const glowScale = useRef(
    new Animated.Value(0.9),
  ).current;

  const glowOpacity = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const glowAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(
              glowScale,
              {
                toValue: 1.2,
                duration: 1200,
                useNativeDriver: true,
              },
            ),

            Animated.timing(
              glowOpacity,
              {
                toValue: 0.35,
                duration: 1200,
                useNativeDriver: true,
              },
            ),
          ]),

          Animated.parallel([
            Animated.timing(
              glowScale,
              {
                toValue: 0.95,
                duration: 1200,
                useNativeDriver: true,
              },
            ),

            Animated.timing(
              glowOpacity,
              {
                toValue: 0.12,
                duration: 1200,
                useNativeDriver: true,
              },
            ),
          ]),
        ]),
      );

    glowAnimation.start();

    const timer = setTimeout(() => {
      // Temporary route until Login is connected.
      router.replace(
        '/member4/progress',
      );
    }, 2800);

    return () => {
      clearTimeout(timer);
      glowAnimation.stop();
    };
  }, [
    glowOpacity,
    glowScale,
    opacity,
    scale,
    translateY,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Animated.View
          style={[
            styles.glow,
            {
              opacity: glowOpacity,
              transform: [
                {
                  scale: glowScale,
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={{
            opacity,
            transform: [
              {
                scale,
              },
              {
                translateY,
              },
            ],
          }}
        >
          <Image
            source={require(
              '../../assets/images/fittrack_app_icon.png'
            )}
            resizeMode="contain"
            style={styles.logo}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.brandArea,
          {
            opacity,
          },
        ]}
      >
        <Text style={styles.brandName}>
          Fit
          <Text
            style={styles.brandAccent}
          >
            Track
          </Text>
        </Text>

        <Text style={styles.tagline}>
          Your fitness. Your progress.
        </Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.footer,
          {
            opacity,
          },
        ]}
      >
        BUILT FOR YOUR NEXT REP
      </Animated.Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#07130F',
      justifyContent: 'center',
      alignItems: 'center',
    },

    logoArea: {
      width: 210,
      height: 210,
      alignItems: 'center',
      justifyContent: 'center',
    },

    glow: {
      position: 'absolute',
      width: 165,
      height: 165,
      borderRadius: 83,
      backgroundColor: '#20E8A4',
    },

    logo: {
      width: 145,
      height: 145,
    },

    brandArea: {
      alignItems: 'center',
      marginTop: 10,
    },

    brandName: {
      color: '#FFFFFF',
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1.5,
    },

    brandAccent: {
      color: '#20E8A4',
    },

    tagline: {
      color: '#829C93',
      fontSize: 13,
      marginTop: 7,
      letterSpacing: 0.25,
    },

    footer: {
      position: 'absolute',
      bottom: 55,
      color: '#526A61',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 2.2,
    },
  });