import { StyleSheet } from 'react-native';
import { c } from '@/features/workout/ui';

export const adminStyles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', gap: 24 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' },
  intro: { flex: 1, minWidth: 220, gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, alignItems: 'stretch' },
  tile: { flexBasis: '46%', flexGrow: 1, minWidth: 240, backgroundColor: c.surface, borderColor: c.border,
    borderWidth: 1, borderRadius: 22, padding: 22, gap: 16 },
  tileBody: { flex: 1, gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: c.accentSoft, color: c.accent, fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: c.border },
  section: { gap: 18 },
  error: { color: c.danger, fontSize: 13, lineHeight: 19 },
  invalid: { borderColor: c.danger },
  hint: { color: c.muted, fontSize: 12, lineHeight: 18 },
});
