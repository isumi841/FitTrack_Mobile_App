import { Stack } from 'expo-router';
import { ThemeProvider } from '@/features/member1/constants/theme';

export default function AdminLayout() {
  return <ThemeProvider><Stack screenOptions={{ headerShown: false }} /></ThemeProvider>;
}
