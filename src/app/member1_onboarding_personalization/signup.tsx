import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthInput } from '@/components/member1/AuthInput';
import { AuthFeedback, AuthScreenLayout, AuthSocialOptions } from '@/components/member1/AuthScreenLayout';
import { AuthPrimaryButton } from '@/components/member1/AuthPrimaryButton';
import { AUTH_COLORS } from '@/components/member1/auth-theme';
import { OtpCodeInput, type OtpCodeInputHandle } from '@/components/member1/OtpCodeInput';
import { PasswordRequirements } from '@/components/member1/PasswordRequirements';
import { type SocialProvider } from '@/components/member1/SocialAuthButton';
import { AuthApiError, resendOtp, signup, verifyEmail } from '@/features/member1/auth/auth-api';
import { clearOtpCooldown, getOtpCooldown, startOtpCooldown } from '@/features/member1/auth/otp-cooldown';
import { saveAuthSession } from '@/features/member1/auth/session';
import { useSocialLogin } from '@/features/member1/auth/social-login';
import { AUTH_VALIDATION_MESSAGES, getPasswordByteLength, isStrongPassword, isValidEmail, isValidSliitEmail, normalizeEmail } from '@/features/member1/utils/validation';

type FormErrors = { email?: string; password?: string; confirmPassword?: string };
const emptyCode = () => Array<string>(4).fill('');

export default function SignupScreen() {
  const { handleSocialLogin } = useSocialLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState(emptyCode);
  const [otpError, setOtpError] = useState('');
  const [verified, setVerified] = useState(false);
  const [action, setAction] = useState<'signup' | 'verify' | 'resend' | null>(null);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [reveal] = useState(() => new Animated.Value(0));
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const otpRef = useRef<OtpCodeInputHandle>(null);
  const requestRef = useRef<AbortController | null>(null);
  const otpComplete = otpDigits.every((digit) => /^\d$/.test(digit));
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1_000));
  const busy = !!action || isSocialSubmitting;

  useEffect(() => {
    if (!pendingEmail) return;
    Animated.timing(reveal, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [pendingEmail, reveal]);

  useFocusEffect(useCallback(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
  }, []));

  async function handleSignup() {
    if (busy) return;
    const nextErrors: FormErrors = {};
    if (!isValidSliitEmail(email)) nextErrors.email = AUTH_VALIDATION_MESSAGES.email;
    if (!isStrongPassword(password)) nextErrors.password = AUTH_VALIDATION_MESSAGES.password;
    else if (getPasswordByteLength(password) > 72) nextErrors.password = AUTH_VALIDATION_MESSAGES.passwordMaxLength;
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (confirmPassword !== password) nextErrors.confirmPassword = AUTH_VALIDATION_MESSAGES.confirmPassword;
    setErrors(nextErrors);
    setMessage('');
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();
    if (nextErrors.confirmPassword) return confirmPasswordRef.current?.focus();

    const controller = new AbortController();
    requestRef.current = controller;
    setAction('signup');
    Keyboard.dismiss();
    try {
      const result = await signup({ email, password, confirmPassword }, { signal: controller.signal });
      if ('session' in result) {
        if (controller.signal.aborted || requestRef.current !== controller) return;
        await saveAuthSession(result);
        if (controller.signal.aborted || requestRef.current !== controller) return;
        router.replace('/member1_onboarding_personalization/personalized-plan');
        return;
      }
      if (controller.signal.aborted || requestRef.current !== controller) return;
      const canonicalEmail = normalizeEmail(result.email);
      setPendingEmail(canonicalEmail);
      setEmail(canonicalEmail);
      setResendAvailableAt(startOtpCooldown(canonicalEmail));
      setNow(Date.now());
      requestAnimationFrame(() => otpRef.current?.focus());
    } catch (error) {
      if (!controller.signal.aborted) {
        const msg = error instanceof Error ? error.message : 'Unable to sign up. Please try again.';
        setMessage(msg);
        if (msg.includes('already pending')) {
          const canonicalEmail = normalizeEmail(email);
          setPendingEmail(canonicalEmail);
          setEmail(canonicalEmail);
          requestAnimationFrame(() => otpRef.current?.focus());
        }
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setAction(null);
      }
    }
  }

  async function handleVerify() {
    if (!pendingEmail || busy || verified) return;
    if (!otpComplete) {
      setOtpError('Enter the 4-digit verification code.');
      return otpRef.current?.focus();
    }
    const controller = new AbortController();
    requestRef.current = controller;
    setAction('verify');
    setOtpError('');
    setMessage('');
    Keyboard.dismiss();
    try {
      await verifyEmail({ email: pendingEmail, otp: otpDigits.join('') }, { signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setVerified(true);
      setOtpDigits(emptyCode());
      clearOtpCooldown(pendingEmail);
      router.replace('/member1_onboarding_personalization/login');
    } catch (error) {
      if (!controller.signal.aborted) setOtpError(error instanceof Error ? error.message : 'Unable to verify your email. Please try again.');
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setAction(null);
      }
    }
  }

  async function handleResend() {
    if (!pendingEmail || busy || verified || getOtpCooldown(pendingEmail) > Date.now()) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setAction('resend');
    setOtpError('');
    try {
      const result = await resendOtp({ email: pendingEmail }, { signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setOtpDigits(emptyCode());
      setResendAvailableAt(startOtpCooldown(pendingEmail));
      setNow(Date.now());
      setMessage(result.message);
      otpRef.current?.focus();
    } catch (error) {
      if (!controller.signal.aborted) {
        if (error instanceof AuthApiError && error.status === 429) setResendAvailableAt(startOtpCooldown(pendingEmail, error.retryAfterSeconds ?? 60));
        setMessage(error instanceof Error ? error.message : 'Unable to resend your code. Please try again.');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setAction(null);
      }
    }
  }

  async function handleSocialSelection(provider: SocialProvider) {
    if (busy) return;
    setIsSocialSubmitting(true);
    setMessage('');
    try {
      if (provider === 'Google') {
        // Google on signup: just fetch the verified email, don't save a session
        const result = await handleSocialLogin(provider, { saveSession: false });
        if (result.status === 'success' && result.user?.email) {
          setEmail(result.user.email);
          setPassword('');
          setConfirmPassword('');
          setErrors({});
          setMessage('');
          requestAnimationFrame(() => passwordRef.current?.focus());
        } else if (result.status !== 'cancelled') {
          setMessage(result.message);
        }
      } else {
        // Apple/Facebook: keep existing behavior
        const result = await handleSocialLogin(provider);
        if (result.status === 'success') router.replace('/member1_onboarding_personalization/personalized-plan');
        else setMessage(result.message);
      }
    } finally {
      setIsSocialSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout title="Sign Up" subtitle="Create your FitTrack account and start your fitness journey." image={require('../../../assets/images/png4.png')}>
      <View style={styles.fields}>
        <AuthInput ref={emailRef} label="Email" icon="mail-outline" value={email} editable={!busy} onChangeText={(value) => { setEmail(value); setErrors((previous) => ({ ...previous, email: undefined })); setMessage(''); }} error={errors.email} placeholder="Email" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
        <AuthInput ref={passwordRef} label="Password" icon="lock-closed-outline" password value={password} editable={!busy} onChangeText={(value) => { setPassword(value); setErrors((previous) => ({ ...previous, password: undefined, confirmPassword: undefined })); setMessage(''); }} error={errors.password} autoComplete="new-password" textContentType="newPassword" returnKeyType="next" onSubmitEditing={() => confirmPasswordRef.current?.focus()} />
        {password.length > 0 && <PasswordRequirements password={password} />}
        <AuthInput ref={confirmPasswordRef} label="Confirm Password" icon="shield-checkmark-outline" password value={confirmPassword} editable={!busy} onChangeText={(value) => { setConfirmPassword(value); setErrors((previous) => ({ ...previous, confirmPassword: undefined })); setMessage(''); }} error={errors.confirmPassword} autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={handleSignup} />
        {confirmPassword.length > 0 && confirmPassword === password && <Text style={styles.matchIndicator}>Passwords match</Text>}
        <View style={styles.primaryButton}><AuthPrimaryButton title={action === 'signup' ? 'Signing Up...' : 'SIGN UP'} onPress={handleSignup} loading={action === 'signup'} disabled={busy} /></View>
      </View>
      {!!pendingEmail && <Animated.View style={[styles.otpCard, { opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          <Text style={styles.otpTitle}>Verify your email</Text>
          <Text style={styles.otpDescription}>We sent a verification code to {pendingEmail.replace(/^IT(\d{6})\d{2}@/i, 'IT$1**@')}</Text>
          <OtpCodeInput ref={otpRef} digits={otpDigits} onChange={(digits) => { setOtpDigits(digits); setOtpError(''); setMessage(''); }} error={otpError} editable={!busy} onSubmit={handleVerify} />
          <Text style={styles.expiry}>This code expires in 5 minutes.</Text>
          <AuthPrimaryButton title={action === 'verify' ? 'Verifying...' : 'VERIFY CODE'} onPress={handleVerify} loading={action === 'verify'} disabled={busy || !otpComplete} />
          <Pressable disabled={busy || resendSeconds > 0} onPress={handleResend} style={styles.resend}><Text style={[styles.resendText, (busy || resendSeconds > 0) && styles.disabled]}>{action === 'resend' ? 'Resending...' : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'Resend code'}</Text></Pressable>
      </Animated.View>}
      <AuthFeedback message={message} />
      {!pendingEmail && <><AuthSocialOptions signup onSelect={handleSocialSelection} disabled={busy} /><View style={styles.footer}><Text style={styles.footerText}>Already have an account?</Text><Pressable onPress={() => router.push('/member1_onboarding_personalization/login')} style={styles.textButton}><Text style={styles.link}>Log in</Text></Pressable></View></>}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 12 }, primaryButton: { marginTop: 12 }, matchIndicator: { color: AUTH_COLORS.primary, fontSize: 12, marginHorizontal: 14 },
  otpCard: { gap: 14, padding: 16, borderRadius: 16, backgroundColor: AUTH_COLORS.surface, borderWidth: 1, borderColor: AUTH_COLORS.border },
  otpTitle: { color: AUTH_COLORS.text, fontSize: 19, fontWeight: '700' }, successTitle: { color: AUTH_COLORS.primary, fontSize: 18, fontWeight: '700' }, otpDescription: { color: AUTH_COLORS.secondary, fontSize: 12, lineHeight: 18 }, expiry: { color: AUTH_COLORS.muted, fontSize: 11 },
  resend: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' }, resendText: { color: AUTH_COLORS.primary, fontSize: 13, fontWeight: '600' }, disabled: { color: AUTH_COLORS.muted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 8 }, footerText: { color: AUTH_COLORS.secondary, fontSize: 12 }, textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, link: { color: AUTH_COLORS.primary, fontSize: 12, fontWeight: '600' },
});
