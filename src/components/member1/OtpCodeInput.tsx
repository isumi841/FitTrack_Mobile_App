import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { AUTH_COLORS } from './auth-theme';

export interface OtpCodeInputHandle {
  focus: () => void;
}

interface OtpCodeInputProps {
  digits: string[];
  onChange: (digits: string[]) => void;
  editable?: boolean;
  error?: string;
  onSubmit: () => void;
  ref?: Ref<OtpCodeInputHandle>;
}

export function OtpCodeInput({ digits, onChange, editable = true, error, onSubmit, ref }: OtpCodeInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputs.current[Math.max(0, digits.findIndex((digit) => !digit))]?.focus(),
  }), [digits]);

  function updateDigit(index: number, text: string) {
    if (!editable || text === digits[index]) return;
    const entered = text.replace(/\D/g, '').slice(0, 4);
    const next = [...digits];
    if (!entered) {
      next[index] = '';
      onChange(next);
      return;
    }

    // A full pasted/autofilled code replaces the complete code from any box.
    const start = entered.length === 4 ? 0 : index;
    entered.split('').forEach((digit, offset) => {
      if (start + offset < 4) next[start + offset] = digit;
    });
    onChange(next);
    const nextIndex = Math.min(start + entered.length, 3);
    if (next.every((digit) => /^\d$/.test(digit))) inputs.current[index]?.blur();
    else inputs.current[nextIndex]?.focus();
  }

  return (
    <View>
      <Text style={styles.label}>Verification code</Text>
      <View style={styles.row}>
        {Array.from({ length: 4 }, (_, index) => (
          <TextInput
            key={index}
            ref={(input) => { inputs.current[index] = input; }}
            accessibilityLabel={`Verification code digit ${index + 1} of 4`}
            accessibilityHint={error || 'Enter one digit, or paste the full four-digit code.'}
            value={digits[index] ?? ''}
            onChangeText={(text) => updateDigit(index, text)}
            onKeyPress={({ nativeEvent: { key } }) => {
              if (editable && key === 'Backspace' && !digits[index] && index > 0) {
                const next = [...digits];
                next[index - 1] = '';
                onChange(next);
                inputs.current[index - 1]?.focus();
              }
            }}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((current) => current === index ? null : current)}
            onSubmitEditing={onSubmit}
            editable={editable}
            keyboardType="number-pad"
            inputMode="numeric"
            keyboardAppearance="dark"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            textContentType="oneTimeCode"
            autoCapitalize="none"
            autoCorrect={false}
            selectTextOnFocus
            // Allow all four digits through native paste/autofill before distributing.
            maxLength={4}
            returnKeyType="done"
            selectionColor={AUTH_COLORS.primary}
            underlineColorAndroid="transparent"
            style={[styles.input, focusedIndex === index && styles.focused, !!error && styles.invalid]}
          />
        ))}
      </View>
      {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: AUTH_COLORS.secondary, fontSize: 12, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  input: {
    width: 48, height: 48, borderRadius: 10, borderWidth: 1,
    borderColor: AUTH_COLORS.border, backgroundColor: AUTH_COLORS.input,
    color: AUTH_COLORS.text, textAlign: 'center', fontSize: 18, fontWeight: '600', padding: 0,
  },
  focused: { borderColor: AUTH_COLORS.primary },
  invalid: { borderColor: AUTH_COLORS.error },
  error: { color: AUTH_COLORS.error, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
