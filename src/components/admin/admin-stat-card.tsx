import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { ADMIN_COLORS } from "@/constants/admin-theme";

type AdminStatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AdminStatCard({
  title,
  value,
  subtitle,
  dark = false,
  style,
}: AdminStatCardProps) {
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Text style={[styles.title, { color: colors.muted }]}>
        {title}
      </Text>

      <Text style={[styles.value, { color: colors.text }]}>
        {value}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            { color: dark ? colors.accent : "#52c4a8" },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  title: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },

  value: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#52c4a8",
  },

});
