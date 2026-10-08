import { StyleSheet, Text, useColorScheme, View } from "react-native";

import { AdminLayout } from "@/components/admin/admin-layout";
import { ADMIN_COLORS } from "@/constants/admin-theme";

export default function AdminExercisesScreen() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <AdminLayout>
      <View>
        <Text style={[styles.title, { color: colors.text }]}>
          Exercise Management
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Exercise Management CRUD will be implemented here.
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