import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert as NativeAlert, Pressable, StyleSheet, Text, View, type AlertButton } from 'react-native';
import { MobileModal } from '@/components/layout/mobile-viewport';

const Context = createContext<Pick<typeof NativeAlert, 'alert'>>(NativeAlert);
export const useMember4Alert = () => useContext(Context);

export function Member4Alerts({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<{ title: string; message?: string; buttons: AlertButton[] }[]>([]);
  const alert = useCallback<typeof NativeAlert.alert>((title, message, buttons) => {
    setQueue(previous => [...previous, { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] }]);
  }, []);
  const current = queue[0];
  const value = useMemo(() => ({ alert }), [alert]);
  const close = () => setQueue(previous => previous.slice(1));

  // Sort buttons so 'cancel' is displayed first (top) and 'destructive' / 'delete' is second (bottom)
  const orderedButtons = useMemo(() => {
    if (!current?.buttons) return [];
    const buttons = [...current.buttons];
    if (buttons.length === 2) {
      const cancelIdx = buttons.findIndex(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel');
      if (cancelIdx === 1) {
        return [buttons[1], buttons[0]];
      }
    }
    return buttons;
  }, [current]);

  return (
    <Context.Provider value={value}>
      {children}
      <MobileModal visible={!!current} transparent animationType="fade" onRequestClose={close}>
        <View style={alertStyles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={alertStyles.card}>
            <Text accessibilityRole="header" style={alertStyles.title}>
              {current?.title}
            </Text>
            {!!current?.message && (
              <Text style={alertStyles.message}>{current?.message}</Text>
            )}

            <View style={alertStyles.buttonStack}>
              {orderedButtons.map((button, index) => {
                const isDestructive = button.style === 'destructive' || button.text?.toLowerCase().includes('delete');

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      alertStyles.btnBase,
                      isDestructive ? alertStyles.btnDestructive : alertStyles.btnNeutral,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => {
                      close();
                      button.onPress?.();
                    }}
                  >
                    <Text
                      style={[
                        alertStyles.btnText,
                        isDestructive ? alertStyles.btnTextDestructive : alertStyles.btnTextNeutral,
                      ]}
                    >
                      {button.text || 'OK'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </MobileModal>
    </Context.Provider>
  );
}

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161C24',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4F7F6',
    marginBottom: 10,
  },
  message: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#8E9AA8',
    marginBottom: 22,
  },
  buttonStack: {
    gap: 12,
  },
  btnBase: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnNeutral: {
    backgroundColor: '#1E252E',
  },
  btnDestructive: {
    backgroundColor: '#2C1A20',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.28)',
  },
  btnText: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  btnTextNeutral: {
    color: '#F4F7F6',
  },
  btnTextDestructive: {
    color: '#FB7185',
  },
});
