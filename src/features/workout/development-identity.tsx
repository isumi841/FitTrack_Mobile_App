import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useWorkout } from './store';
import { Button, Card, s } from './ui';
export function DevelopmentIdentity() {
  const { token, setToken, busy } = useWorkout();
  const [draft, setDraft] = useState('');
  if (!__DEV__) return null;
  return <Card><Text style={s.heading}>Local development identity</Text>
    <Text style={s.body}>Local web testing only. Enter your private backend token. It stays in memory and must be entered again after refresh.</Text>
    <TextInput accessibilityLabel="Development bearer token" secureTextEntry autoCapitalize="none" autoCorrect={false} value={draft} onChangeText={setDraft} style={s.input} />
    <Button title={token ? 'Replace token' : 'Use token'} disabled={busy || !draft.trim()} onPress={() => { setToken(draft.trim()); setDraft(''); }} />
    {!!token && <Text style={s.body}>Token entered. The API verifies it on each session request.</Text>}
  </Card>;
}
