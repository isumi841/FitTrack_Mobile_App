import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAV_ITEMS, getActiveNavigationId, type NavigationItem } from './navigation-config';
import { NavigationIcon } from './navigation-icon';
import { NAV_COLORS as C, NAV_SPRING } from './navigation-theme';
import { QuickActionsSheet } from './quick-actions-sheet';

function NavItem({ item, active, onNavigate }: { item: NavigationItem; active: boolean; onNavigate: () => void }) {
  const focus = useSharedValue(active ? 1 : 0);
  const press = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    focus.set(reducedMotion ? Number(active) : withSpring(active ? 1 : 0, NAV_SPRING));
  }, [active, focus, reducedMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : -3 * focus.get() },
      { scale: press.get() * (1 + (reducedMotion ? 0 : 0.08 * focus.get())) },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      testID={`nav-${item.id}`}
      onPress={onNavigate}
      onPressIn={() => { if (!reducedMotion) press.set(withSpring(0.92, NAV_SPRING)); }}
      onPressOut={() => { press.set(reducedMotion ? 1 : withSpring(1, NAV_SPRING)); }}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Animated.View style={iconStyle}>
        <NavigationIcon name={item.icon} color={active ? C.accent : C.muted} />
      </Animated.View>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>
        {item.label}
      </Text>
      <View style={[styles.dot, { opacity: active ? 1 : 0 }]} />
    </Pressable>
  );
}

export function AppBottomNav({ onBeforeNavigate }: { onBeforeNavigate: () => void }) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeId = getActiveNavigationId(pathname);
  const activeIndex = APP_NAV_ITEMS.findIndex((item) => item.id === activeId);
  const activeSlot = activeIndex < 2 ? activeIndex : activeIndex + 1;
  const [rowWidth, setRowWidth] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const indicatorX = useSharedValue(0);
  const plusRotation = useSharedValue(0);
  const plusScale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const slotWidth = rowWidth / (APP_NAV_ITEMS.length + 1);

  useEffect(() => {
    const target = Math.max(0, activeSlot) * slotWidth;
    indicatorX.set(reducedMotion ? target : withSpring(target, NAV_SPRING));
  }, [activeSlot, slotWidth, indicatorX, reducedMotion]);

  useEffect(() => {
    plusRotation.set(reducedMotion ? (actionsOpen ? 45 : 0) : withSpring(actionsOpen ? 45 : 0, NAV_SPRING));
  }, [actionsOpen, plusRotation, reducedMotion]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.get() }] }));
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ scale: plusScale.get() }] }));
  const rotationStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${plusRotation.get()}deg` }] }));

  const navigate = (item: NavigationItem) => {
    if (pathname === item.href) return;
    // Switching between the guided and timer views keeps the session running.
    if (!(pathname === '/workout/active' && item.href === '/workout/timer')) onBeforeNavigate();
    router.navigate(item.href);
  };

  return (
    <>
      <View style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, 10), paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12) },
        keyboardVisible && styles.hidden,
      ]}>
        <View style={styles.dock}>
          <View style={styles.topShine} />
          <View style={styles.row} onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}>
            {rowWidth > 0 && activeIndex >= 0 && (
              <Animated.View style={[styles.indicatorTrack, { width: slotWidth }, indicatorStyle]}>
                <View style={styles.activeWash} />
                <View style={styles.activeLine} />
              </Animated.View>
            )}
            {APP_NAV_ITEMS.slice(0, 2).map((item) => <NavItem key={item.id} item={item} active={activeId === item.id} onNavigate={() => navigate(item)} />)}
            <View style={styles.addSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open quick actions"
                accessibilityHint="Open your workout, adjust the timer, or review your latest session"
                accessibilityState={{ expanded: actionsOpen }}
                testID="nav-add"
                onPress={() => { Keyboard.dismiss(); onBeforeNavigate(); setActionsOpen(true); }}
                onPressIn={() => { if (!reducedMotion) plusScale.set(withTiming(0.9, { duration: 100 })); }}
                onPressOut={() => { plusScale.set(reducedMotion ? 1 : withSpring(1, NAV_SPRING)); }}
                style={styles.addTouchTarget}
              >
                <Animated.View style={[styles.addButton, plusStyle]}>
                  <View style={styles.addShine} />
                  <Animated.View style={rotationStyle}>
                    <NavigationIcon name="plus" color={C.ink} size={26} />
                  </Animated.View>
                </Animated.View>
              </Pressable>
            </View>
            {APP_NAV_ITEMS.slice(2).map((item) => <NavItem key={item.id} item={item} active={activeId === item.id} onNavigate={() => navigate(item)} />)}
          </View>
        </View>
      </View>
      <QuickActionsSheet visible={actionsOpen} onClose={() => setActionsOpen(false)} reducedMotion={reducedMotion} onBeforeNavigate={onBeforeNavigate} />
    </>
  );
}

const styles = StyleSheet.create({
  footer: { paddingTop: 8, backgroundColor: 'transparent' },
  hidden: { display: 'none' },
  dock: {
    borderRadius: 28, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 5,
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.25)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12 },
    }),
  },
  topShine: { pointerEvents: 'none', position: 'absolute', top: 0, left: 28, right: 28, height: 1, backgroundColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 76 },
  item: { flex: 1, minHeight: 68, paddingTop: 12, paddingBottom: 6, gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  itemPressed: { backgroundColor: 'rgba(255,255,255,0.04)' },
  label: { color: C.muted, fontSize: 10, fontWeight: '500', letterSpacing: 0.1 },
  activeLabel: { color: C.accent, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.accent },
  indicatorTrack: { pointerEvents: 'none', position: 'absolute', top: 0, bottom: 0, left: 0, alignItems: 'center' },
  activeWash: { position: 'absolute', left: 3, right: 3, top: 7, bottom: 7, borderRadius: 20, backgroundColor: C.accentSoft },
  activeLine: { width: 20, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: C.accent },
  addSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addTouchTarget: { minWidth: 56, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.accent, borderWidth: 1, borderColor: C.accent,
    ...Platform.select({
      web: { boxShadow: `0 3px 12px ${C.accentGlow}` },
      default: { shadowColor: C.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
    }),
  },
  addShine: { pointerEvents: 'none', position: 'absolute', left: 9, right: 9, top: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.5)' },
});
