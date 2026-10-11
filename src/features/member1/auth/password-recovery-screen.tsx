import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthInput } from '@/components/member1/AuthInput';
import { AuthPrimaryButton } from '@/components/member1/AuthPrimaryButton';
import { AuthFeedback, AuthScreenLayout } from '@/components/member1/AuthScreenLayout';
import { AUTH_COLORS } from '@/components/member1/auth-theme';
import { AuthApiError, requestPasswordReset, resetPassword } from './auth-api';
import { AUTH_VALIDATION_MESSAGES, getPasswordByteLength, isStrongPassword, isValidEmail } from '../utils/validation';

export default function PasswordRecoveryScreen({ initialStep = 'email' }: { initialStep?: 'email' | 'reset' }) {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>(initialStep);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  useFocusEffect(useCallback(() => {
    setBusy(false);
    return () => { request.current?.abort(); request.current = null; };
  }, []));
  const seconds = Math.max(0, Math.ceil((cooldown - tick) / 1000));

  async function submit(sendCode: boolean) {
    if (request.current) return;
    if (!isValidEmail(email)) return setMessage(AUTH_VALIDATION_MESSAGES.email);
    if (!sendCode) {
      if (!/^\d{4}$/.test(otp)) return setMessage('Enter the 4-digit code from your email.');
      if (!isStrongPassword(password)) return setMessage(AUTH_VALIDATION_MESSAGES.password);
      if (getPasswordByteLength(password) > 72) return setMessage(AUTH_VALIDATION_MESSAGES.passwordMaxLength);
      if (password !== confirm) return setMessage(AUTH_VALIDATION_MESSAGES.confirmPassword);
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage('');
    try {
      const result = sendCode
        ? await requestPasswordReset({ email }, { signal: controller.signal })
        : await resetPassword({ email, otp, newPassword: password }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setMessage(result.message);
      if (sendCode) { setStep('reset'); setCooldown(Date.now() + 60000); setTick(Date.now()); }
      else { setPassword(''); setConfirm(''); setOtp(''); setStep('done'); }
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessage(error instanceof Error ? error.message : 'Unable to reset your password. Try again.');
        if (error instanceof AuthApiError && error.retryAfterSeconds) {
          setCooldown(Date.now() + error.retryAfterSeconds * 1000); setTick(Date.now());
        }
      }
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }

  return <AuthScreenLayout title={step === 'done' ? 'Password updated' : 'Reset password'}
    subtitle={step === 'email' ? 'Enter your account email to receive a reset code.' : step === 'reset' ? 'Enter the code from your email and choose a new password.' : 'You can now log in with your new password.'}
    image={require('../../../../assets/images/png5.png')}>
    {step !== 'done' && <View style={styles.fields}>
      <AuthInput label="Email" icon="mail-outline" value={email} editable={!busy && step === 'email'} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
      {step === 'reset' && <>
        <AuthInput label="Reset code" icon="key-outline" placeholder="4-digit code" value={otp} editable={!busy} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} autoComplete="one-time-code" textContentType="oneTimeCode" />
        <AuthInput label="New password" icon="lock-closed-outline" password value={password} editable={!busy} onChangeText={setPassword} autoComplete="new-password" textContentType="newPassword" />
        <Text style={styles.hint}>{AUTH_VALIDATION_MESSAGES.password}</Text>
        <AuthInput label="Confirm password" icon="lock-closed-outline" password value={confirm} editable={!busy} onChangeText={setConfirm} autoComplete="new-password" textContentType="newPassword" />
      </>}
      <AuthPrimaryButton title={step === 'email' ? 'Send reset code' : 'Update password'} loading={busy} disabled={busy || (step === 'email' && seconds > 0)} onPress={() => { void submit(step === 'email'); }} />
      {seconds > 0 && <Text style={styles.hint}>You can request another code in {seconds}s.</Text>}
      {step === 'reset' && <>
        <Pressable accessibilityRole="button" disabled={busy || seconds > 0} onPress={() => { void submit(true); }} style={styles.linkButton}><Text style={styles.link}>{seconds ? `Resend code in ${seconds}s` : 'Resend code'}</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setStep('email'); setMessage(''); setOtp(''); setCooldown(0); }} style={styles.linkButton}><Text style={styles.link}>Use a different email</Text></Pressable>
      </>}
    </View>}
    <AuthFeedback message={message} />
    <Pressable accessibilityRole="link" disabled={busy} onPress={() => router.replace('/member1_onboarding_personalization/login')} style={styles.linkButton}><Text style={styles.link}>Return to login</Text></Pressable>
  </AuthScreenLayout>;
}

const styles = StyleSheet.create({
  fields: { gap: 12 },
  hint: { color: AUTH_COLORS.secondary, fontSize: 12, lineHeight: 18 },
  linkButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  link: { color: AUTH_COLORS.primary, fontSize: 14, fontWeight: '600' },
});
