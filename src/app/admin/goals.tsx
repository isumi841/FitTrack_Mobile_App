import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { AdminLayout } from "@/components/admin/admin-layout";
import { ADMIN_COLORS } from "@/constants/admin-theme";

export default function AdminGoalsScreen() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <AdminLayout>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>
          Goal & Progress Management
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Goal & Progress CRUD will be implemented here.
        </Text>
      </View>
    </AdminLayout>
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