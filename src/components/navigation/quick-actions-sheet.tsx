import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_QUICK_ACTIONS } from './navigation-config';
import { NavigationIcon } from './navigation-icon';
import { NAV_COLORS as C } from './navigation-theme';

export function QuickActionsSheet({ visible, onClose, reducedMotion, onBeforeNavigate }: {
  visible: boolean; onClose: () => void; reducedMotion: boolean; onBeforeNavigate: () => void;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24), marginTop: insets.top + 24 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.copy}><Text style={styles.eyebrow}>MAKE YOUR NEXT MOVE</Text><Text accessibilityRole="header" style={styles.title}>Quick actions</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close quick actions" onPress={onClose} style={styles.close}><NavigationIcon name="close" color={C.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.actions}>
          {APP_QUICK_ACTIONS.map(action => <Pressable key={action.id} accessibilityRole="button" onPress={() => { onBeforeNavigate(); onClose(); router.navigate(action.href); }} style={({ pressed }) => [styles.action, pressed && { backgroundColor: C.accentSoft }]}>
            <View style={styles.icon}><NavigationIcon name={action.icon} color={C.accent} /></View>
            <View style={styles.copy}><Text style={styles.label}>{action.label}</Text><Text style={styles.description}>{action.description}</Text></View>
            <NavigationIcon name="next" size={18} color={C.muted} />
          </Pressable>)}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: 600, alignSelf: 'center', flexShrink: 1, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.muted, opacity: 0.4, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 10, color: C.accent, letterSpacing: 1.5, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceRaised, borderRadius: 22 },
  actions: { gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, minHeight: 84, borderRadius: 18, backgroundColor: C.surfaceRaised, borderWidth: 1, borderColor: C.border },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.text, fontSize: 15, fontWeight: '700' },
  description: { color: C.muted, fontSize: 12, lineHeight: 18 },
});
