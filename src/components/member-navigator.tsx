import { Stack } from "expo-router";
import { View } from "react-native";
import MemberBottomNav from "./member-bottom-nav";
import { useTheme } from "@/hooks/use-theme";

// Future members' file-based routes are discovered without an exclusive route list.
export default function MemberNavigator() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
      <MemberBottomNav />
    </View>
  );
}
