import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { useWorkout } from './store';
import { formatTime } from './data';
export const c = { bg: '#F5F8FC', white: '#FFFFFF', ink: '#203543', muted: '#667A88', teal: '#107E78', pale: '#E5F5F0', border: '#E1E8EF', red: '#BA393D', pink: '#FFE8E6' };
export function Button({ title, onPress, secondary = false, danger = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, danger && s.danger, (pressed || disabled) && { opacity: 0.55 }]}><Text style={[s.buttonText, secondary && { color: c.teal }, danger && { color: c.red }]}>{title}</Text></Pressable>;
}
export function Card({ children, tinted = false }: { children: ReactNode; tinted?: boolean }) { return <View style={[s.card, tinted && { backgroundColor: c.pale }]}>{children}</View>; }
export function Badge({ children }: { children: ReactNode }) { return <Text style={s.badge}>{children}</Text>; }
export function Row({ label, value }: { label: string; value: string }) { return <View style={s.row}><Text style={[s.body, { flex: 1 }]}>{label}</Text><Text style={[s.smallStrong, { flex: 1, textAlign: 'right' }]}>{value}</Text></View>; }
export function Page({ title, children, onBack, back = true }: { title: string; children: ReactNode; onBack?: () => void; back?: boolean }) {
  const { error, retrySave, data, pause } = useWorkout();
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}><View style={s.shell}>
    <View style={s.header}>
      {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/workout/details'))} style={s.iconButton}><Text style={s.arrow}>←</Text></Pressable>}
      <Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Open notifications" onPress={() => { pause(); router.push('/workout/notifications'); }} style={s.iconButton}><Svg width="21" height="23" viewBox="0 0 24 24"><Path d="M5 17 L7 14 L7 9 A5 5 0 0 1 17 9 L17 14 L19 17 Z M10 20 L14 20" stroke={c.teal} strokeWidth="1.8" fill="none" strokeLinecap="round" /></Svg>{data.notices.some(n => !n.read) && <View style={s.dot} />}</Pressable>
    </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {!!error && <Card><Text accessibilityRole="alert" style={s.body}>{error}</Text>{!error.startsWith('Saved data') && <Button title="Retry saving" onPress={retrySave} secondary />}</Card>}
      {children}
    </ScrollView>
    <SafeAreaView edges={['bottom']} style={s.footer}><View style={s.footerRow}>
      <Text style={s.inactiveTab}>Home</Text>
      <Pressable accessibilityRole="button" onPress={() => { pause(); router.replace('/workout/details'); }} style={s.tab}><Text style={s.tabText}>Workouts</Text></Pressable>
      <Text style={s.inactiveTab}>Progress</Text><Text style={s.inactiveTab}>Profile</Text>
    </View></SafeAreaView>
  </View></SafeAreaView>;
}
export function Figure({ id = 'march', small = false }: { id?: string; small?: boolean }) {
  const wall = id === 'wall-push-ups'; const chair = id === 'chair';
  return <View accessibilityLabel={`${id.replaceAll('-', ' ')} illustration`} accessible style={[s.figure, small && { width: 74, height: 74 }]}>
    <Svg width={small ? 62 : 210} height={small ? 62 : 155} viewBox="0 0 220 160">
      <Line x1="30" y1="144" x2="193" y2="144" stroke="#BBDBD4" strokeWidth="2" />
      {wall ? <><Line x1="171" y1="12" x2="171" y2="144" stroke="#A7CDC5" strokeWidth="5" /><Circle cx="137" cy="33" r="9" stroke={c.teal} strokeWidth="3" fill="none" /><Polyline points="134,46 110,93 82,141" fill="none" stroke={c.teal} strokeWidth="4" strokeLinecap="round" /><Polyline points="131,53 149,66 170,45" fill="none" stroke={c.teal} strokeWidth="4" strokeLinecap="round" /><Polyline points="110,93 123,117 115,141" fill="none" stroke={c.teal} strokeWidth="4" /></> : <>
      {chair && <Path d="M140 70 L140 109 L177 109 M144 110 L144 144 M174 110 L174 144" fill="none" stroke="#9DBEB6" strokeWidth="4" />}
      <Circle cx="108" cy="29" r="9" fill="none" stroke={c.teal} strokeWidth="3" />
      <Path d={chair ? 'M108 43 L110 93 L140 105 L134 142 M110 93 L89 114 L78 142 M108 56 L137 74 M108 56 L81 76' : id === 'side-steps' ? 'M108 43 L108 94 M108 58 L70 72 M108 58 L147 72 M108 94 L70 143 M108 94 L147 143' : id === 'calf-raises' ? 'M108 43 L108 94 M108 58 L76 70 M108 58 L142 58 M108 94 L94 132 L87 142 M108 94 L121 132 L128 142' : 'M108 43 L108 94 M108 58 L77 72 M108 58 L143 47 M108 94 L83 111 L109 126 M108 94 L125 143'} fill="none" stroke={c.teal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </Svg>
  </View>;
}
export function Clock({ remaining, total }: { remaining: number; total: number }) {
  const radius = 87; const length = 2 * Math.PI * radius; const fraction = Math.max(0, Math.min(1, remaining / total));
  return <View style={s.clock} accessible accessibilityLabel={`${Math.ceil(remaining)} seconds remaining`}>
    <Svg width="220" height="220" viewBox="0 0 220 220"><Circle cx="110" cy="110" r={radius} fill="none" stroke={c.border} strokeWidth="9" /><Circle cx="110" cy="110" r={radius} fill="none" stroke={c.teal} strokeWidth="9" strokeDasharray={`${length} ${length}`} strokeDashoffset={length * (1 - fraction)} rotation="-90" origin="110,110" strokeLinecap="round" /></Svg>
    <View style={s.clockText}><Text style={s.digits}>{formatTime(Math.ceil(remaining))}</Text><Text style={s.label}>SECONDS LEFT</Text></View>
  </View>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg }, shell: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', backgroundColor: c.bg },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  heading: { fontSize: 17, fontWeight: '700', color: c.ink }, title: { fontSize: 24, fontWeight: '800', color: c.ink },
  content: { padding: 18, gap: 14, paddingBottom: 32 }, card: { backgroundColor: c.white, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.border, gap: 12 },
  body: { fontSize: 14, lineHeight: 21, color: c.muted }, smallStrong: { fontSize: 13, lineHeight: 20, fontWeight: '600', color: c.ink }, label: { fontSize: 11, letterSpacing: 0.8, color: c.muted },
  badge: { alignSelf: 'flex-start', color: c.teal, backgroundColor: c.pale, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, fontSize: 10, fontWeight: '700' },
  button: { minHeight: 48, borderRadius: 25, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700', color: c.white, textAlign: 'center' }, secondary: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border }, danger: { backgroundColor: c.pink, borderWidth: 1, borderColor: '#F4BABC' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, arrow: { color: c.teal, fontSize: 25 },
  dot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: c.red },
  figure: { height: 180, backgroundColor: c.pale, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border }, footerRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', minHeight: 58 },
  tab: { padding: 14 }, tabText: { fontSize: 12, fontWeight: '700', color: c.teal }, inactiveTab: { fontSize: 12, color: '#7C8790' },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, backgroundColor: c.white, color: c.ink, fontSize: 14, minHeight: 48 },
  clock: { width: 220, height: 220, alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }, clockText: { position: 'absolute', alignItems: 'center', gap: 7 }, digits: { color: c.ink, fontSize: 46, fontWeight: '800', fontVariant: ['tabular-nums'] },
  number: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, overflow: 'hidden', backgroundColor: c.pale, color: c.teal, fontSize: 13, fontWeight: '700' },
});
