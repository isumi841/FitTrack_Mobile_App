import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { AUTH_COLORS } from './auth-theme';

interface AuthPrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
}

export function AuthPrimaryButton({ title, onPress, style, disabled = false, loading = false }: AuthPrimaryButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      style={({ pressed }) => [styles.button, style, unavailable && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.title}>{title}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={AUTH_COLORS.buttonText} />
      ) : (
        <Ionicons name="arrow-forward" size={18} color={AUTH_COLORS.buttonText} accessible={false} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: AUTH_COLORS.primary,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: { opacity: 0.65 },
  title: {
    color: AUTH_COLORS.buttonText,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
