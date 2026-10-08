import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert as NativeAlert, Platform, ScrollView, Text, View, type AlertButton } from 'react-native';
import { MobileModal } from '@/components/layout/mobile-viewport';
import { Button, c, s } from '@/features/workout/ui';
const Context = createContext<Pick<typeof NativeAlert, 'alert'>>(NativeAlert);
export const useMember4Alert = () => useContext(Context);
export function Member4Alerts({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<{ title: string; message?: string; buttons: AlertButton[] }[]>([]);
  const alert = useCallback<typeof NativeAlert.alert>((title, message, buttons) => {
    if (Platform.OS !== 'web') return NativeAlert.alert(title, message, buttons);
    setQueue(previous => [...previous, { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] }]);
  }, []);
  const current = queue[0];
  const value = useMemo(() => ({ alert }), [alert]);
  const close = () => setQueue(previous => previous.slice(1));
  return <Context.Provider value={value}>{children}
    <MobileModal visible={!!current} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0009', padding: 20 }}>
        <ScrollView style={{ maxHeight: '80%', flexGrow: 0, borderRadius: 22, backgroundColor: c.surface }} contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text accessibilityRole="header" style={s.heading}>{current?.title}</Text><Text style={s.body}>{current?.message}</Text>
          {current?.buttons.map((button, index) => <Button key={index} title={button.text || 'OK'} danger={button.style === 'destructive'} secondary={button.style === 'cancel'} onPress={() => { close(); button.onPress?.(); }} />)}
        </ScrollView>
      </View>
    </MobileModal>
  </Context.Provider>;
}
