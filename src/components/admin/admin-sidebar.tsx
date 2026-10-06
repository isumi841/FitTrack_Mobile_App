import { router, usePathname } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAdmin } from "@/features/exercises/admin-store";
import { ADMIN_COLORS } from "@/constants/admin-theme";

type AdminSidebarProps = {
  dark?: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
};

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin",
  },
  {
    label: "User Management",
    path: "/admin/users",
  },
  {
    label: "Workouts",
    path: "/admin/workouts",
  },
  {
    label: "Exercises",
    path: "/admin/exercises",
  },
  {
    label: "Goals & Progress",
    path: "/admin/goals",
  },
  {
    label: "Settings",
    path: "/admin/settings",
  },
] as const;

export function AdminSidebar({
  dark = false,
  drawer = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAdmin();
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <View
      style={[
        styles.sidebar,
        drawer && styles.drawerSidebar,
        {
          backgroundColor: colors.surface,
          borderRightColor: colors.border,
        },
      ]}
    >
      <View>
        <Text
          style={[
            styles.logo,
            { color: colors.text },
          ]}
        >
          FitFlow
        </Text>

        <Text style={[styles.adminLabel, { color: colors.accent }]}>
          Admin
        </Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const active = pathname === item.path || (item.path === "/admin/exercises" && pathname === "/admin/exercise");

          return (
            <Pressable
              key={item.path}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={[
                styles.menuItem,
                active && {
                  backgroundColor: dark
                    ? colors.accentSoft
                    : colors.accent,
                },
              ]}
              onPress={() => {
                router.navigate(item.path);
                onNavigate?.();
              }}
            >
              <Text
                style={[
                  styles.menuText,
                  { color: colors.text },
                  active && {
                    color: dark ? colors.accent : "#ffffff",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out of admin dashboard"
        style={styles.logoutButton}
        onPress={() => {
          void logout();
          router.replace("/member2/workout");
          onNavigate?.();
        }}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    minHeight: "100%",
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },

  drawerSidebar: {
    width: "100%",
    flex: 1,
    borderRightWidth: 0,
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  adminLabel: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "600",
    color: "#3a9e88",
  },

  menu: {
    marginTop: 34,
    gap: 10,
  },

  menuItem: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  menuText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  logoutButton: {
    marginTop: "auto",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
