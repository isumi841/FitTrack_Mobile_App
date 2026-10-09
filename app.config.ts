import type { ConfigContext, ExpoConfig } from 'expo/config';

export default function configureApp({ config }: ConfigContext): ExpoConfig {
  // Keep team app configuration intact. Set registered identifiers for EAS.
  return {
    ...config,
    name: config.name || 'FitTrack',
    slug: config.slug || 'FitTrack',
    ios: {
      ...config.ios,
      ...(process.env.FITTRACK_IOS_BUNDLE_IDENTIFIER ? { bundleIdentifier: process.env.FITTRACK_IOS_BUNDLE_IDENTIFIER } : {}),
    },
    android: {
      ...config.android,
      ...(process.env.FITTRACK_ANDROID_PACKAGE ? { package: process.env.FITTRACK_ANDROID_PACKAGE } : {}),
    },
  };
}
