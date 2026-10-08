import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ADMIN_COLORS } from "@/constants/admin-theme";

type AdminHeaderProps = {
  dark?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
};

export function AdminHeader({
  dark = false,
  showMenu = false,
  onMenuPress,
}: AdminHeaderProps) {
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <View style={styles.container}>
      <View style={styles.leading}>
        {showMenu && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open admin menu"
            hitSlop={8}
            onPress={onMenuPress}
            style={[
              styles.menuButton,
              {
                backgroundColor: dark
                  ? colors.surfaceAlt
                  : "#f0f2f5",
              },
            ]}
          >
            <View
              style={[
                styles.menuLine,
                { backgroundColor: colors.text },
              ]}
            />
            <View
              style={[
                styles.menuLine,
                { backgroundColor: colors.text },
              ]}
            />
            <View
              style={[
                styles.menuLine,
                { backgroundColor: colors.text },
              ]}
            />
          </Pressable>
        )}

        <View>
          <Text
            style={[
              styles.greeting,
              { color: colors.muted },
            ]}
          >
            Good Morning 👋
          </Text>

          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Admin
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.avatar,
          {
            backgroundColor: dark ? colors.accentSoft : "#3a9e88",
          },
        ]}
      >
        <Text style={styles.avatarText}>
          A
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  menuLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#111827",
  },

  greeting: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3a9e88",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});