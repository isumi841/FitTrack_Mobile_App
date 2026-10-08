import type { ReactNode } from 'react';
import { Modal, Platform, StyleSheet, View, useWindowDimensions, type ModalProps } from 'react-native';

export const MOBILE_VIEWPORT = { width: 430, height: 932 } as const;

// Web screens and their overlays share the same content dimensions. Native
// screens keep the real device dimensions, safe areas and keyboard behavior.
export function useAppViewport() {
  const window = useWindowDimensions();
  return Platform.OS === 'web' ? { ...window,
    width: Math.min(window.width, MOBILE_VIEWPORT.width),
    height: Math.min(window.height, MOBILE_VIEWPORT.height),
  } : window;
}

export function MobileViewport({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  const { width, height } = useAppViewport();
  if (Platform.OS !== 'web') return children;
  return <View style={[styles.stage, overlay && styles.transparent]}>
    <View testID={overlay ? 'mobile-overlay' : 'mobile-viewport'} style={[styles.screen, { width, height }]}>{children}</View>
  </View>;
}

export function MobileModal({ children, ...props }: ModalProps) {
  return <Modal {...props}><MobileViewport overlay>{children}</MobileViewport></Modal>;
}

const styles = StyleSheet.create({
  stage: { flex: 1, minWidth: 0, minHeight: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#202020' },
  transparent: { backgroundColor: 'transparent' },
  screen: { minWidth: 0, minHeight: 0, overflow: 'hidden' },
});
