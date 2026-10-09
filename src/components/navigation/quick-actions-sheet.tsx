import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_QUICK_ACTIONS } from './navigation-config';
import { NavigationIcon } from './navigation-icon';
import { NAV_COLORS as C } from './navigation-theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  reducedMotion: boolean;
}

export function QuickActionsSheet({ visible, onClose, reducedMotion }: Props) {
  const insets = useSafeAreaInsets();
  const pendingHref = useRef<Href | null>(null);

  function completeNavigation() {
    const href = pendingHref.current;
    pendingHref.current = null;
    if (href) router.navigate(href);
  }

  // iOS must dismiss this native modal before the goal editor presents its own.
  useEffect(() => {
    if (!visible && Platform.OS !== 'ios') completeNavigation();
  }, [visible]);

  function dismiss() {
    pendingHref.current = null;
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={dismiss} onDismiss={completeNavigation} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}
          accessibilityRole="button" accessibilityLabel="Dismiss quick actions" />
        <View style={[styles.content, {
          paddingBottom: Math.max(insets.bottom, 12) + 12, paddingTop: insets.top + 16,
        }]} pointerEvents="box-none">
          <Animated.View
            entering={FadeInDown.duration(280).springify().damping(22).reduceMotion(ReduceMotion.System)}
            style={styles.panel} accessibilityViewIsModal onAccessibilityEscape={dismiss}>
            <View style={styles.handle} />
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>A LITTLE EVERY DAY</Text>
                <Text accessibilityRole="header" style={styles.title}>Make your next move.</Text>
              </View>
              <View style={styles.headingIcon}><NavigationIcon name="plus" color={C.accent} size={20} /></View>
            </View>
            <Text style={styles.subtitle}>Small steps. Stronger you.</Text>
            <ScrollView style={styles.actions} contentContainerStyle={styles.actionContent} bounces={false}>
              {APP_QUICK_ACTIONS.map((action, index) => (
                <Animated.View key={action.id}
                  entering={FadeInDown.delay(70 + index * 55).duration(240).reduceMotion(ReduceMotion.System)}>
                  <Pressable accessibilityRole="button" accessibilityLabel={action.label}
                    accessibilityHint={action.description} testID={`quick-action-${action.id}`}
                    onPress={() => { pendingHref.current = action.href; onClose(); }}
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                    <View style={styles.actionIcon}><NavigationIcon name={action.icon} color={C.accent} /></View>
                    <View style={styles.actionCopy}>
                      <Text style={styles.actionTitle}>{action.label}</Text>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    </View>
                    <NavigationIcon name="chevron" color={C.muted} size={18} />
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" testID="quick-actions-close"
            onPress={dismiss} style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
            <View style={styles.closeIcon}><NavigationIcon name="plus" color={C.ink} size={26} /></View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5, 8, 5, 0.72)', justifyContent: 'flex-end', alignItems: 'center' },
  content: { width: '100%', maxWidth: 440, paddingHorizontal: 16, maxHeight: '100%', alignItems: 'center', gap: 16 },
  panel: { width: '100%', flexShrink: 1, backgroundColor: C.surface, borderRadius: 28, borderWidth: 1, borderColor: C.border, padding: 20 },
  handle: { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, backgroundColor: '#404639', marginBottom: 22 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1 },
  eyebrow: { color: C.accent, fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginBottom: 8 },
  title: { color: C.text, fontSize: 23, fontWeight: '700', letterSpacing: -0.7 },
  headingIcon: { height: 36, width: 36, borderRadius: 18, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 22 },
  actions: { flexShrink: 1 },
  actionContent: { gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 78, borderRadius: 18, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  actionPressed: { backgroundColor: '#303927', borderColor: C.border },
  actionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, gap: 5 },
  actionTitle: { color: C.text, fontSize: 14, fontWeight: '600' },
  actionDescription: { color: C.muted, fontSize: 11, lineHeight: 16 },
  closeButton: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  closePressed: { opacity: 0.8 },
  closeIcon: { transform: [{ rotate: '45deg' }] },
});
