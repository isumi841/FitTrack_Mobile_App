import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { resetPassword } from '@/features/member1/auth/auth-api';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!code || code.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit code');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email, code, password });
      Alert.alert('Success', 'Password has been reset successfully. You can now log in.', [
        { text: 'OK', onPress: () => router.replace('/member1_onboarding_personalization/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileScreenContainer backgroundColor="#111">
      <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <TouchableOpacity onPress={() => router.replace('/member1_onboarding_personalization/login')} style={styles.backButton}>
          <Text style={styles.backText}>{'< Back to Login'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a 4-digit verification code to {email || 'your email'}.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="4-Digit Code"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={4}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 12, marginBottom: 20 },
  backText: { color: '#C0F312', fontSize: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#AAA', marginBottom: 32, lineHeight: 24 },
  input: { backgroundColor: '#222', color: '#FFF', padding: 16, borderRadius: 12, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#222', borderRadius: 12, borderWidth: 1, borderColor: '#333',
    marginBottom: 16,
  },
  passwordInput: { flex: 1, color: '#FFF', padding: 16, fontSize: 16 },
  eyeIcon: { padding: 16 },
  button: { backgroundColor: '#C0F312', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
