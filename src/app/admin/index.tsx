import {
    StyleSheet,
    Text,
    View,
    useColorScheme,
    useWindowDimensions,
} from "react-native";

import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { ADMIN_COLORS } from "@/constants/admin-theme";

export default function AdminDashboardScreen() {
  const dark = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const isMobile = width <= 600;
  const isVerySmall = width < 360;
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  return (
    <AdminLayout>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Dashboard
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Manage your FitFlow system.
        </Text>

        <View style={styles.stats}>
          <AdminStatCard
            title="Total Users"
            value="1,248"
            subtitle="+12%"
            dark={dark}
            style={
              isMobile
                ? isVerySmall
                  ? styles.statCardSingle
                  : styles.statCardMobile
                : undefined
            }
          />

          <AdminStatCard
            title="Total Workouts"
            value="17"
            subtitle="Active workouts"
            dark={dark}
            style={
              isMobile
                ? isVerySmall
                  ? styles.statCardSingle
                  : styles.statCardMobile
                : undefined
            }
          />

          <AdminStatCard
            title="Total Exercises"
            value="320"
            subtitle="+5%"
            dark={dark}
            style={
              isMobile
                ? isVerySmall
                  ? styles.statCardSingle
                  : styles.statCardMobile
                : undefined
            }
          />

          <AdminStatCard
            title="Active Goals"
            value="892"
            subtitle="+10%"
            dark={dark}
            style={
              isMobile
                ? isVerySmall
                  ? styles.statCardSingle
                  : styles.statCardMobile
                : undefined
            }
          />
        </View>

        <View style={[styles.row, isMobile && styles.mobileRow]}>
          <View
            style={[
              styles.bigCard,
              isMobile && styles.mobilePanel,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              User Growth
            </Text>

            <Text style={[styles.cardText, { color: colors.muted }]}>
              Last 6 months
            </Text>

            <View
              style={[
                styles.chart,
                isMobile && styles.mobileChart,
              ]}
            >
              {[60, 90, 75, 110, 135, 160].map((height, index) => (
                <View
                  key={index}
                  style={[
                    styles.bar,
                    isMobile && styles.mobileBar,
                    {
                      height: isMobile ? height * 0.75 : height,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View
            style={[
              styles.sideCard,
              isMobile && styles.mobilePanel,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              System Summary
            </Text>

            <SummaryRow
              label="Workouts"
              value="17"
              color={colors.text}
              muted={colors.muted}
            />

            <SummaryRow
              label="Categories"
              value="6"
              color={colors.text}
              muted={colors.muted}
            />

            <SummaryRow
              label="Users"
              value="1,248"
              color={colors.text}
              muted={colors.muted}
            />

            <SummaryRow
              label="Active Goals"
              value="892"
              color={colors.text}
              muted={colors.muted}
            />
          </View>
        </View>

        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Recent Activity
          </Text>

          <Activity
            title="New workout added"
            description="A new workout was added to the library."
            accent={colors.accent}
            text={colors.text}
            muted={colors.muted}
          />

          <Activity
            title="New user registered"
            description="A new member joined FitFlow."
            accent={colors.accent}
            text={colors.text}
            muted={colors.muted}
          />

          <Activity
            title="Goal completed"
            description="A member completed a fitness goal."
            accent={colors.accent}
            text={colors.text}
            muted={colors.muted}
          />
        </View>
      </View>
    </AdminLayout>
  );
}

function SummaryRow({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: muted }}>{label}</Text>
      <Text style={{ color, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function Activity({
  title,
  description,
  accent,
  text,
  muted,
}: {
  title: string;
  description: string;
  accent: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={styles.activityRow}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: accent,
          },
        ]}
      />

      <View style={styles.activityCopy}>
        <Text
          style={{
            color: text,
            fontWeight: "700",
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: muted,
            marginTop: 3,
            fontSize: 12,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 22,
  },

  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statCardMobile: {
    flex: 0,
    flexBasis: "48%",
    minWidth: 0,
  },

  statCardSingle: {
    flex: 0,
    flexBasis: "100%",
    minWidth: 0,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 20,
  },

  mobileRow: {
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "stretch",
    width: "100%",
    gap: 14,
  },

  mobilePanel: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: "100%",
    minWidth: 0,
    padding: 16,
  },

  bigCard: {
    flex: 2,
    minWidth: 300,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },

  sideCard: {
    flex: 1,
    minWidth: 230,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },

  activityCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  cardText: {
    fontSize: 13,
    marginTop: 4,
  },

  chart: {
    width: "100%",
    minWidth: 0,
    height: 180,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    gap: 10,
  },

  mobileChart: {
    height: 140,
    gap: 4,
    overflow: "hidden",
  },

  bar: {
    flex: 1,
    maxWidth: 42,
    minWidth: 20,
    borderRadius: 8,
  },

  mobileBar: {
    minWidth: 0,
    maxWidth: 32,
    flexShrink: 1,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(120,120,120,0.12)",
  },

  activityRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 20,
  },

  activityCopy: {
    flex: 1,
    minWidth: 0,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
});