import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Animated, StyleSheet } from 'react-native';

const images = [require('../../../assets/images/P(1).png'), require('../../../assets/images/P(2).png'),
  require('../../../assets/images/P(6).png'), require('../../../assets/images/png3.png')];

export function PlanImages() {
  const [index, setIndex] = useState(0);
  const [opacity] = useState(() => new Animated.Value(1));
  useFocusEffect(useCallback(() => {
    let active = true;
    opacity.setValue(1);
    const timer = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(({ finished }) => {
        if (!active || !finished) return;
        setIndex(value => (value + 1) % images.length);
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => { active = false; clearInterval(timer); opacity.stopAnimation(); };
  }, [opacity]));
  return <Animated.Image accessible={false} source={images[index]} resizeMode="cover" style={[styles.image, { opacity }]} />;
}
const styles = StyleSheet.create({ image: { width: '100%', height: 200, borderRadius: 20 } });
