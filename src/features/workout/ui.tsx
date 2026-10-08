import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { NavigationIcon, type NavigationIconName } from '@/components/navigation/navigation-icon';
import { FITTRACK_COLORS } from '@/constants/fittrack-theme';
import { useWorkout } from './store';
import { formatTime } from './data';

export const c = FITTRACK_COLORS;

export function Button({ title, onPress, secondary = false, danger = false, disabled = false, icon }: {
  title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; icon?: NavigationIconName;
}) {
  const color = danger ? c.danger : secondary ? c.text : c.ink;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, danger && s.danger, pressed && { opacity: 0.75 }, disabled && { opacity: 0.45 }]}>
    {icon && <NavigationIcon name={icon} color={color} size={20} />}
    <Text style={[s.buttonText, { color }]}>{title}</Text>
  </Pressable>;
}

export function Card({ children, tinted = false }: { children: ReactNode; tinted?: boolean }) {
  return <View style={[s.card, tinted && s.tintedCard]}>{children}</View>;
}
export function Badge({ children }: { children: ReactNode }) { return <Text style={s.badge}>{children}</Text>; }
export function Row({ label, value }: { label: string; value: string }) {
  return <View style={s.row}><Text style={[s.body, { flex: 1 }]}>{label}</Text><Text style={[s.smallStrong, { flex: 1, textAlign: 'right' }]}>{value}</Text></View>;
}

export function Page({ title, children, onBack, back = true, scope = 'workout', showSessionFeedback = true, showSaving = true }: { title: string; children: ReactNode; onBack?: () => void; back?: boolean; scope?: 'workout' | 'admin'; showSessionFeedback?: boolean; showSaving?: boolean }) {
  const { error, retrySave, data, pause, busy, pending, conflict, discardConflict, recoveryFailed, retryRecovery } = useWorkout();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const unread = data.notices.filter(n => !n.read).length;
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <View style={s.header}>
      {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/workout/browse'))} style={s.iconButton}>
        <NavigationIcon name="back" color={c.accent} size={20} />
      </Pressable> : <View style={s.brandMark}><NavigationIcon name="workouts" color={c.accent} size={24} /></View>}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.eyebrow}>{scope === 'admin' ? 'FITTRACK / ADMIN' : 'FITTRACK / TRAINING'}</Text>
        <Text accessibilityRole="header" style={s.heading}>{title}</Text>
      </View>
      {scope === 'workout' && <Pressable accessibilityRole="button" accessibilityLabel={`Open notifications, ${unread} unread`} onPress={() => { pause(); router.navigate('/workout/notifications'); }} style={s.iconButton}>
        <NavigationIcon name="bell" color={c.text} size={21} />
        {unread > 0 && <View style={s.dot} />}
      </Pressable>}
    </View>
    <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      {scope === 'workout' && showSessionFeedback && showSaving && busy && <Text accessibilityLiveRegion="polite" style={s.body}>Updating your workout…</Text>}
      {scope === 'workout' && showSessionFeedback && !!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text>{pending && <Button title="Retry saving" disabled={busy} onPress={() => { void retrySave(); }} secondary />}
        {recoveryFailed && <Button title="Retry session recovery" secondary disabled={busy} onPress={retryRecovery} />}
        {conflict && <Button title="Use server version…" secondary onPress={() => setConfirmDiscard(true)} />}
        {confirmDiscard && <><Text style={s.body}>Discard this device’s unsaved changes and load the newer server record?</Text><Button title="Discard unsaved changes" danger onPress={() => { setConfirmDiscard(false); void discardConflict(); }} /><Button title="Keep pending changes" secondary onPress={() => setConfirmDiscard(false)} /></>}
      </Card>}
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export function Figure({ id = 'march', small = false }: { id?: string; small?: boolean }) {
  const wall = id === 'wall-push-ups'; const chair = id === 'chair';
  return <View accessibilityLabel={`${id.replaceAll('-', ' ')} illustration`} accessible style={[s.figure, small && { width: 62, height: 62, borderRadius: 16 }]}>
    <Svg width={small ? 56 : 230} height={small ? 56 : 175} viewBox="0 0 220 160">
      <Circle cx="110" cy="80" r="64" fill={c.accentSoft} />
      <Circle cx="110" cy="80" r="77" fill="none" stroke={c.border} strokeDasharray="3 7" />
      <Line x1="30" y1="144" x2="193" y2="144" stroke={c.muted} strokeOpacity={0.4} strokeWidth="2" />
      {wall ? <><Line x1="171" y1="12" x2="171" y2="144" stroke={c.muted} strokeWidth="5" /><Circle cx="137" cy="33" r="9" stroke={c.accent} strokeWidth="3" fill="none" /><Polyline points="134,46 110,93 82,141" fill="none" stroke={c.accent} strokeWidth="4" strokeLinecap="round" /><Polyline points="131,53 149,66 170,45" fill="none" stroke={c.accent} strokeWidth="4" strokeLinecap="round" /><Polyline points="110,93 123,117 115,141" fill="none" stroke={c.accent} strokeWidth="4" /></> : <>
        {chair && <Path d="M140 70 L140 109 L177 109 M144 110 L144 144 M174 110 L174 144" fill="none" stroke={c.muted} strokeWidth="4" />}
        <Circle cx="108" cy="29" r="9" fill="none" stroke={c.accent} strokeWidth="3" />
        <Path d={chair ? 'M108 43 L110 93 L140 105 L134 142 M110 93 L89 114 L78 142 M108 56 L137 74 M108 56 L81 76' : id === 'side-steps' ? 'M108 43 L108 94 M108 58 L70 72 M108 58 L147 72 M108 94 L70 143 M108 94 L147 143' : id === 'calf-raises' ? 'M108 43 L108 94 M108 58 L76 70 M108 58 L142 58 M108 94 L94 132 L87 142 M108 94 L121 132 L128 142' : 'M108 43 L108 94 M108 58 L77 72 M108 58 L143 47 M108 94 L83 111 L109 126 M108 94 L125 143'} fill="none" stroke={c.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </Svg>
  </View>;
}

export function Clock({ remaining, total }: { remaining: number; total: number }) {
  const radius = 87; const length = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return <View style={s.clock} accessible accessibilityLabel={`${Math.ceil(remaining)} seconds remaining`}>
    <Svg width="248" height="248" viewBox="0 0 220 220">
      <Circle cx="110" cy="110" r="103" fill={c.accentSoft} />
      <Circle cx="110" cy="110" r={radius} fill="none" stroke={c.surfaceRaised} strokeWidth="7" />
      <Circle cx="110" cy="110" r={radius} fill="none" stroke={c.accent} strokeWidth="7" strokeDasharray={`${length} ${length}`} strokeDashoffset={length * (1 - fraction)} transform="rotate(-90 110 110)" strokeLinecap="round" />
    </Svg>
    <View style={s.clockText}><Text maxFontSizeMultiplier={1.2} style={s.digits}>{formatTime(Math.ceil(remaining))}</Text><Text style={s.label}>SECONDS LEFT</Text></View>
  </View>;
}

export const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: c.bg },
  shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: c.bg },
  header: { minHeight: 78, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  brandMark: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: c.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.5 },
  heading: { fontSize: 17, fontWeight: '700', color: c.text },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7, color: c.text },
  content: { padding: 20, gap: 18, paddingBottom: 28 },
  card: { backgroundColor: c.surface, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: c.border, gap: 14 },
  tintedCard: { backgroundColor: c.accentSoft, borderColor: c.accentBorder },
  body: { fontSize: 14, lineHeight: 22, color: c.muted },
  smallStrong: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: c.text },
  label: { fontSize: 10, lineHeight: 16, fontWeight: '600', letterSpacing: 1.1, color: c.muted },
  badge: { alignSelf: 'flex-start', color: c.accent, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accentBorder, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, fontSize: 10, lineHeight: 15, letterSpacing: 0.5, fontWeight: '700', overflow: 'hidden' },
  button: { minHeight: 52, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  buttonText: { fontSize: 14, fontWeight: '700', color: c.ink, textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.border },
  danger: { backgroundColor: c.dangerSoft, borderWidth: 1, borderColor: c.dangerBorder },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  arrow: { color: c.accent, fontSize: 25 },
  dot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: c.accent, borderWidth: 1, borderColor: c.surface },
  figure: { height: 200, backgroundColor: c.bg, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, backgroundColor: c.surfaceRaised, color: c.text, fontSize: 15, minHeight: 52 },
  clock: { width: 248, height: 248, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  clockText: { position: 'absolute', alignItems: 'center', gap: 7 },
  digits: { color: c.accent, fontSize: 48, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  number: { width: 30, height: 30, borderRadius: 10, textAlign: 'center', lineHeight: 30, overflow: 'hidden', backgroundColor: c.accentSoft, color: c.accent, fontSize: 13, fontWeight: '700' },
});
