import { StyleSheet, Text, View } from "react-native";

import { ADMIN_COLORS } from "@/constants/admin-theme";

export default function AdminSettingsScreen() {
  const dark = true;
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <View style={{ flex: 1, paddingVertical: 16 }}>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>
          Settings
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Admin settings will be implemented here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
  },
});
