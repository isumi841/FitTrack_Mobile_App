import { StyleSheet, Text, View } from 'react-native';

import { getPasswordRequirements } from '../utils/validation';
import { AUTH_COLORS } from './auth-theme';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const results = getPasswordRequirements(password);
  const passed = Object.values(results).filter(Boolean).length;
  const strong = passed === 5;

  return (
    <View accessible accessibilityLabel={strong ? 'Strong password' : `Password strength: ${passed} of 5 requirements met`} style={styles.container}>
      <Text style={[styles.message, strong && styles.strong]}>
        {strong ? 'Strong password' : 'Use 8+ characters with upper/lowercase, number & symbol'}
      </Text>
      <View style={styles.track} accessible={false}>
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} style={[styles.segment, index < Math.ceil(passed / 2) && (strong ? styles.strongSegment : styles.activeSegment)]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingHorizontal: 4 },
  message: { color: AUTH_COLORS.muted, fontSize: 11, lineHeight: 16 },
  strong: { color: AUTH_COLORS.primary },
  track: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: AUTH_COLORS.border },
  activeSegment: { backgroundColor: AUTH_COLORS.secondary },
  strongSegment: { backgroundColor: AUTH_COLORS.primary },
});
