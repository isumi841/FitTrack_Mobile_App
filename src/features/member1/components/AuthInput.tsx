import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AUTH_COLORS } from './auth-theme';

interface AuthInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  value: string;
  onChangeText: (text: string) => void;
  password?: boolean;
  error?: string;
  ref?: Ref<TextInput>;
}

export function AuthInput({
  label,
  icon,
  value,
  onChangeText,
  password = false,
  error,
  ref,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  accessibilityLabel = label,
  accessibilityHint,
  placeholder = label,
  ...inputProps
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.field}>
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.invalid]}>
        <Ionicons
          name={icon}
          size={18}
          color={error ? AUTH_COLORS.error : AUTH_COLORS.secondary}
          accessible={false}
        />
        <TextInput
          {...inputProps}
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={AUTH_COLORS.secondary}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={error || accessibilityHint}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          autoCorrect={inputProps.autoCorrect ?? false}
          secureTextEntry={password ? !showPassword : secureTextEntry}
          keyboardAppearance={inputProps.keyboardAppearance ?? 'dark'}
          selectionColor={AUTH_COLORS.primary}
          underlineColorAndroid="transparent"
          style={[styles.input, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${showPassword ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            accessibilityState={{ checked: showPassword }}
            onPress={() => setShowPassword((visible) => !visible)}
            style={({ pressed }) => [styles.visibilityButton, pressed && styles.pressed]}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={AUTH_COLORS.secondary}
              accessible={false}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: '100%',
  },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: AUTH_COLORS.border,
    backgroundColor: AUTH_COLORS.input,
  },
  focused: {
    borderColor: AUTH_COLORS.primary,
  },
  invalid: {
    borderColor: AUTH_COLORS.error,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    paddingVertical: 13,
    paddingRight: 11,
    color: AUTH_COLORS.text,
    fontSize: 14,
  },
  visibilityButton: {
    width: 44,
    minHeight: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  error: {
    marginTop: 6,
    marginHorizontal: 14,
    color: AUTH_COLORS.error,
    fontSize: 12,
    lineHeight: 17,
  },
});
