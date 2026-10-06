import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPrimaryButton } from '@/components/member1/AuthPrimaryButton';
import { AUTH_COLORS } from '@/components/member1/auth-theme';
import { MobileScreenContainer } from '@/components/member1/MobileScreenContainer';
import { OtpCodeInput, type OtpCodeInputHandle } from '@/components/member1/OtpCodeInput';
import { AuthApiError, resendOtp, verifyEmail } from '@/features/member1/auth/auth-api';
import { clearOtpCooldown, getOtpCooldown, startOtpCooldown } from '@/features/member1/auth/otp-cooldown';
import { isValidSliitEmail } from '@/features/member1/utils/validation';

const emptyCode = () => Array<string>(6).fill('');

export default function VerifyEmailScreen() {
  const focused = useIsFocused();
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  // This page can also be opened directly, so validate its optional URL parameter.
  const pendingEmail = isValidSliitEmail(email) ? email : undefined;
  const [otpDigits, setOtpDigits] = useState(emptyCode);
  const [otpError, setOtpError] = useState('');
  const [feedback, setFeedback] = useState<{ email: string; message: string } | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [action, setAction] = useState<'verify' | 'resend' | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState(() => pendingEmail ? getOtpCooldown(pendingEmail) : 0);
  const [now, setNow] = useState(Date.now);
  const otpRef = useRef<OtpCodeInputHandle>(null);
  const requestRef = useRef<AbortController | null>(null);
  const activeEmailRef = useRef(pendingEmail);
  const verified = !!pendingEmail && verifiedEmail === pendingEmail;
  const message = feedback && feedback.email === pendingEmail ? feedback.message : '';
  const otp = otpDigits.join('');
  const otpComplete = otpDigits.every((digit) => /^\d$/.test(digit));
  const resendSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1_000));

  useFocusEffect(useCallback(() => {
    if (activeEmailRef.current !== pendingEmail) {
      activeEmailRef.current = pendingEmail;
      setOtpDigits(emptyCode());
      setOtpError('');
      setFeedback(null);
      setVerifiedEmail(null);
    }
    setAction(null);
    setNow(Date.now());
    setResendAvailableAt(pendingEmail ? getOtpCooldown(pendingEmail) : 0);
    // Use the deadline rather than decrementing so app backgrounding cannot pause it.
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      clearInterval(timer);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [pendingEmail]));

  async function handleVerify() {
    if (!pendingEmail || verified || requestRef.current) return;
    setOtpError('');
    setFeedback(null);
    if (!otpComplete) {
      setOtpError('Enter the 6-digit verification code.');
      otpRef.current?.focus();
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setAction('verify');
    Keyboard.dismiss();
    try {
      await verifyEmail({ email: pendingEmail, otp }, { signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setVerifiedEmail(pendingEmail);
      setOtpDigits(emptyCode());
      setFeedback(null);
      clearOtpCooldown(pendingEmail);
    } catch (error) {
      if (!controller.signal.aborted && requestRef.current === controller) {
        setFeedback({ email: pendingEmail, message: error instanceof Error ? error.message : 'Unable to verify your email. Please try again.' });
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setAction(null);
      }
    }
  }

  async function handleResend() {
    if (!pendingEmail || verified || requestRef.current || getOtpCooldown(pendingEmail) > Date.now()) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setAction('resend');
    setFeedback(null);
    setOtpError('');
    try {
      const result = await resendOtp({ email: pendingEmail }, { signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setOtpDigits(emptyCode());
      setResendAvailableAt(startOtpCooldown(pendingEmail));
      setNow(Date.now());
      setFeedback({ email: pendingEmail, message: result.message });
    } catch (error) {
      if (!controller.signal.aborted && requestRef.current === controller) {
        if (error instanceof AuthApiError && error.status === 429) {
          setResendAvailableAt(startOtpCooldown(pendingEmail, error.retryAfterSeconds ?? 60));
          setNow(Date.now());
        }
        setFeedback({ email: pendingEmail, message: error instanceof Error ? error.message : 'Unable to resend your code. Please try again.' });
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setAction(null);
      }
    }
  }

  function returnToSignup() {
    // Preserve the existing form when possible, including after a warm deep link.
    router.dismissTo('/member1_onboarding_personalization/signup');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: 'Verify your email', contentStyle: { backgroundColor: AUTH_COLORS.background } }} />
      {focused && <StatusBar style="light" />}
      <MobileScreenContainer backgroundColor={AUTH_COLORS.background} previewForegroundColor={AUTH_COLORS.text}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.icon}>
              <Ionicons name={verified ? 'checkmark-circle-outline' : 'mail-outline'} size={36} color={AUTH_COLORS.primary} accessible={false} />
            </View>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>
              {verified ? 'Email verified successfully!' : 'Verify your email'}
            </Text>
            {pendingEmail ? (
              <>
                <Text style={styles.description}>{verified ? 'Your FitTrack account is ready.' : 'We sent a 6-digit verification code to'}</Text>
                <Text selectable style={styles.email}>{pendingEmail}</Text>
              </>
            ) : (
              <Text style={styles.description}>Return to Sign Up and enter a valid email address to continue.</Text>
            )}
            {verified ? (
              <>
                <View style={styles.successButton}>
                  <AuthPrimaryButton title="CONTINUE TO LOG IN" onPress={() => router.replace('/member1_onboarding_personalization/login')} />
                </View>
              </>
            ) : pendingEmail ? (
              <>
                <View style={styles.otpField}>
                  <OtpCodeInput
                    ref={otpRef}
                    digits={otpDigits}
                    onChange={(digits) => {
                      setOtpDigits(digits);
                      setOtpError('');
                      setFeedback(null);
                    }}
                    error={otpError}
                    editable={!action}
                    onSubmit={handleVerify}
                  />
                </View>
                <Text style={styles.expiryNotice}>This code expires in 5 minutes.</Text>
                <AuthPrimaryButton title={action === 'verify' ? 'Verifying...' : 'VERIFY CODE'} onPress={handleVerify} disabled={!!action || !otpComplete} loading={action === 'verify'} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!action || resendSeconds > 0, busy: action === 'resend' }}
                  disabled={!!action || resendSeconds > 0}
                  onPress={handleResend}
                  style={styles.textButton}>
                  <Text style={[styles.link, resendSeconds > 0 && styles.cooldown]}>
                    {action === 'resend' ? 'Resending...' : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : 'RESEND CODE'}
                  </Text>
                </Pressable>
                {!!message && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{message}</Text>}
                <Pressable accessibilityRole="link" onPress={returnToSignup} style={styles.textButton}>
                  <Text style={styles.backLink}>Back to Sign Up</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.otpField}>
                <AuthPrimaryButton title="Back to Sign Up" onPress={returnToSignup} />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </MobileScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AUTH_COLORS.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  icon: { alignSelf: 'center', padding: 20, borderRadius: 40, backgroundColor: AUTH_COLORS.surface, marginBottom: 24 },
  title: { color: AUTH_COLORS.text, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  description: { color: AUTH_COLORS.secondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  email: { color: AUTH_COLORS.primary, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 12 },
  successButton: { marginTop: 32 },
  expiryNotice: { color: AUTH_COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 20 },
  otpField: { marginTop: 24, marginBottom: 20 },
  textButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  link: { color: AUTH_COLORS.primary, fontSize: 14, fontWeight: '600' },
  cooldown: { color: AUTH_COLORS.muted },
  backLink: { color: AUTH_COLORS.secondary, fontSize: 13 },
  feedback: { color: AUTH_COLORS.secondary, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
});
