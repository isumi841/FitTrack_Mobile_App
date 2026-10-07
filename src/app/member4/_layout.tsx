import { Stack } from 'expo-router';

import {
  Member4ProfileProvider,
} from '@/features/member4/context/Member4ProfileContext';

export default function Member4Layout() {
  return (
    <Member4ProfileProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Member4ProfileProvider>
  );
}