import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: config.name ?? 'FitTrack',
  slug: config.slug ?? 'FitTrack_Mobile_App',

  ios: {
    ...config.ios,
    bundleIdentifier:
      process.env.FITTRACK_IOS_BUNDLE_IDENTIFIER ??
      'com.fittrack.mobileapp',
  },

  android: {
    ...config.android,
    package:
      process.env.FITTRACK_ANDROID_PACKAGE ??
      'com.fittrack.mobileapp',
  },
});