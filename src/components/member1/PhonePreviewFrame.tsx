import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

type PhonePreviewFrameProps = {
  children: ReactNode;
  backgroundColor?: string;
  foregroundColor?: string;
};

// Keep the desktop preview close to a modern handset while leaving a little
// more breathing room around it in narrower browser windows.
const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 932;

export function PhonePreviewFrame({
  children,
  backgroundColor = '#F7F9FC',
  foregroundColor = '#222222',
}: PhonePreviewFrameProps) {
  // Native keeps the original screen tree, safe areas, and keyboard behavior.
  if (Platform.OS !== 'web') return children;

  return (
    <ScrollView
      horizontal
      style={styles.desktop}
      contentContainerStyle={styles.desktopHorizontal}
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}>
      <ScrollView
        style={styles.desktopViewport}
        contentContainerStyle={styles.desktopContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.shell}>
          <View aria-hidden style={styles.hardware}>
            <View style={[styles.sideButton, styles.silentSwitch]} />
            <View style={[styles.sideButton, styles.volumeUp]} />
            <View style={[styles.sideButton, styles.volumeDown]} />
            <View style={[styles.sideButton, styles.powerButton]} />
          </View>

          <View style={[styles.screen, { backgroundColor }]}>


            {/* Chrome stays outside the existing scroll and keyboard containers. */}
            <View style={styles.content}>{children}</View>

            <View aria-hidden style={styles.homeArea}>
              <View style={[styles.homeIndicator, { backgroundColor: foregroundColor }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: '#202020',
  },
  desktopContent: {
    flexGrow: 1,
    // Keep the phone at its fixed height; short browsers scroll around it.
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopHorizontal: { flexGrow: 1 },
  desktopViewport: {
    flex: 1,
    minWidth: PHONE_WIDTH + 32,
    minHeight: 0,
  },
  shell: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    flexShrink: 0,
    padding: 10,
    borderWidth: 2,
    borderColor: '#2F2F2F',
    borderRadius: 46,
    backgroundColor: '#111111',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45), inset 0 0 0 1px #29292C',
  },
  hardware: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  sideButton: {
    position: 'absolute',
    left: -3,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#454548',
  },
  silentSwitch: { top: 110, height: 24 },
  volumeUp: { top: 156, height: 46 },
  volumeDown: { top: 216, height: 46 },
  powerButton: { left: undefined, right: -3, top: 176, height: 74 },
  screen: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    borderRadius: 36,
    overflow: 'hidden',
  },
  statusBar: {
    height: 44,
    flexShrink: 0,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  time: { fontSize: 13, fontWeight: '700' },
  islandSlot: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  island: {
    width: 92,
    height: 24,
    borderRadius: 14,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  speaker: { width: 30, height: 3, borderRadius: 2, backgroundColor: '#26262A' },
  camera: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E2738',
    borderWidth: 1,
    borderColor: '#30384A',
  },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  content: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  homeArea: {
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  homeIndicator: { width: 120, height: 4, borderRadius: 4 },
});
