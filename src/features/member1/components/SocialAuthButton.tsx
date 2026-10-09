import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AUTH_COLORS } from './auth-theme';

export type SocialProvider = 'Google' | 'Apple' | 'Facebook';

interface SocialAuthButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const providerIcons: Record<SocialProvider, ImageSourcePropType> = {
  Google: require('@/assets/images/member1/google.png'),
  Apple: require('@/assets/images/member1/apple.png'),
  Facebook: require('@/assets/images/member1/facebook.png'),
};

export function SocialAuthButton({ provider, onPress, disabled = false, style }: SocialAuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`Continue with ${provider}`}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed, disabled && { opacity: 0.5 }]}>
      <View style={styles.iconContainer}>
        <Image source={providerIcons[provider]} style={styles.icon} resizeMode="contain" accessible={false} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.surface,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.text,
    borderRadius: 12,
    overflow: 'hidden',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
