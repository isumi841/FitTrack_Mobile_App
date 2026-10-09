import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, Pressable, ScrollView } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '@/features/member1/components/PrimaryButton';
import { MobileScreenContainer } from '@/features/member1/components/MobileScreenContainer';

const WELCOME_IMAGE = require('@/assets/images/member1/welcome1.png');
const LOGO_IMAGE = require('@/assets/images/member1/logo-r.png');

export default function WelcomeScreen() {
  const focused = useIsFocused();

  const handleGetStarted = () => {
    router.push('/member1_onboarding_personalization/beginner-onboarding');
  };

  const handleLogin = () => {
    router.push('/member1_onboarding_personalization/login');
  };

  return (
    <MobileScreenContainer backgroundColor="#000">
      <ImageBackground
        source={WELCOME_IMAGE}
        style={styles.container}
        resizeMode="cover"
      >
        {focused && <StatusBar style="light" />}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topSection}>
            <Image
              source={LOGO_IMAGE}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.mainHeading}>
              Start Your Fitness Journey
            </Text>

            <Text style={styles.subText}>
              Train smarter. Build consistency. Become stronger.
              Personalized, Progress, Consistency
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.button}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
          </ScrollView>
          </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
    </MobileScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradientOverlay: {
    flex: 1,
  },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  logo: {
    width: '100%',
    maxWidth: 380,
    height: 160,
    marginBottom: 32,
  },
  mainHeading: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  subText: {
    color: '#AAA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bottomSection: {
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
  },
  loginContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#999',
    fontSize: 15,
  },
  loginLink: {
    color: '#00E676', // Bright neon green for the link
    fontSize: 15,
    fontWeight: '700',
  },
});
