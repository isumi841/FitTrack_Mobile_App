import { MobileModal, useAppViewport } from '@/components/layout/mobile-viewport';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_QUICK_ACTIONS } from './navigation-config';
import { NavigationIcon } from './navigation-icon';
import { NAV_COLORS as C, NAV_THEME as T } from './navigation-theme';

export function QuickActionsSheet({ visible, onClose, reducedMotion, onBeforeNavigate }: {
  visible: boolean; onClose: () => void; reducedMotion: boolean; onBeforeNavigate: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useAppViewport();
  const sheetHeight = Math.min(height * 0.8, height - insets.top - Math.max(insets.bottom, 8) - 72, 620);
  return <MobileModal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheetGroup, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View accessibilityViewIsModal style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.eyebrow}>A LITTLE EVERY DAY</Text>
            <Text accessibilityRole="header" style={styles.title}>Make your next move.</Text>
            <Text style={styles.subtitle}>Small steps. Stronger you.</Text>
          </View>
          <ScrollView style={styles.actionList} contentContainerStyle={styles.actions}>
            {APP_QUICK_ACTIONS.map(action => <Pressable key={action.id} accessibilityRole="button" onPress={() => { onBeforeNavigate(); onClose(); router.navigate(action.href); }} style={({ pressed }) => [styles.action, pressed && { backgroundColor: C.accentSoft }]}>
              <View style={styles.icon}><NavigationIcon name={action.icon} color={C.accent} /></View>
              <View style={styles.copy}><Text style={styles.label}>{action.label}</Text><Text style={styles.description}>{action.description}</Text></View>
              <NavigationIcon name="next" size={18} color={C.muted} />
            </Pressable>)}
          </ScrollView>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" onPress={onClose} style={styles.close}>
          <NavigationIcon name="close" color={C.ink} size={22} />
        </Pressable>
      </View>
    </View>
  </MobileModal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheetGroup: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 12, gap: 8 },
  sheet: { width: '100%', flexShrink: 1, backgroundColor: T.dock, borderColor: C.border, borderWidth: 1, borderRadius: 28, padding: 16, gap: 12 },
  actionList: { flex: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.muted, opacity: 0.4, alignSelf: 'center' },
  header: { gap: 5 },
  copy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 10, color: C.accent, letterSpacing: 1.5, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 12, color: C.muted },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, borderRadius: 15 },
  actions: { gap: 8, paddingBottom: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 70, borderRadius: 18, backgroundColor: T.dockRaised, borderWidth: 1, borderColor: C.border },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.text, fontSize: 14, fontWeight: '700' },
  description: { color: C.muted, fontSize: 12, lineHeight: 18 },
});
