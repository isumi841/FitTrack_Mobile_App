import React from 'react';
import { StyleSheet, Pressable, Text, Animated, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/features/member1/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  icon,
}: PrimaryButtonProps) {
  const t = useTheme();
  const [scale] = React.useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const buttonBg = disabled
    ? (t.isDark ? '#141A18' : '#EDF3ED')
    : (t.isDark ? t.primaryLime : t.primaryGreen);

  const textColor = disabled
    ? t.textMuted
    : (t.isDark ? '#080D0B' : '#FFFFFF');

  return (
    <Animated.View style={[{ transform: [{ scale }], width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        style={[
          styles.button,
          {
            backgroundColor: buttonBg,
            shadowColor: t.isDark ? t.primaryLime : t.primaryGreen,
          },
        ]}>
        {icon}
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
