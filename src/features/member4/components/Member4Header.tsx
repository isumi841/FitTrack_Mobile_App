/**
 * Member4Header – shared screen header for Member 4 screens.
 * Next-level dark fitness UI.
 */
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useM4Theme } from '../hooks/useM4Theme';

interface Member4HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Member4Header({
  title,
  showBack = true,
  rightElement,
  style,
}: Member4HeaderProps) {
  const c = useM4Theme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === 'web' ? 12 : 8),
          backgroundColor: c.bg,
          borderBottomColor: c.border,
        },
        style,
      ]}
    >
      {/* Left – back button */}
      <View style={styles.side}>
        {showBack && (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/member4/progress');
              }
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: pressed ? c.tealDim : c.cardBg,
                borderColor: c.border,
              },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[styles.iconText, { color: c.teal }]}>←</Text>
          </Pressable>
        )}
      </View>

      {/* Center – title */}
      <Text
        style={[styles.title, { color: c.text }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {/* Right – custom element */}
      <View style={[styles.side, styles.sideRight]}>
        {rightElement ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
