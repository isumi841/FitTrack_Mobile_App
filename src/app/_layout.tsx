import { DarkTheme, DefaultTheme, ThemeProvider, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { isWorkoutRoute } from "@/constants/navigation-config";
import { MemberProvider, useMember } from "@/providers/member-state";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <MemberProvider>
      <MemberLayout />
    </MemberProvider>
  );
}

function MemberLayout() {
  const { dark } = useMember();
  const pathname = usePathname();
  const homeRoute = pathname === "/" || isWorkoutRoute(pathname);

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <StatusBar style={homeRoute || dark ? "light" : "dark"} />

      <AnimatedSplashOverlay />

      <AppTabs />
    </ThemeProvider>
  );
}
