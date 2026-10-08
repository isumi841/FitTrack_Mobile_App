import { ReactNode, useEffect, useState } from "react";
import {
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    useColorScheme,
    View,
    useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import { ADMIN_COLORS } from "@/constants/admin-theme";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

type AdminLayoutProps = {
  children: ReactNode;
};

const MOBILE_BREAKPOINT = 600;

export function AdminLayout({
  children,
}: AdminLayoutProps) {
  const colorScheme = useColorScheme();
  const dark = colorScheme === "dark";
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;
  const drawerWidth = Math.min(width * 0.82, 320);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTranslateX] = useState(
    () => new Animated.Value(-drawerWidth),
  );

  const colors = dark
    ? ADMIN_COLORS.dark
    : ADMIN_COLORS.light;

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    drawerTranslateX.setValue(-drawerWidth);
    const animation = Animated.timing(drawerTranslateX, {
      toValue: 0,
      duration: 220,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();

    return () => animation.stop();
  }, [drawerOpen, drawerTranslateX, drawerWidth]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={["top", "right", "bottom", "left"]}
        style={[
          styles.safeArea,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.container}>
          {!isMobile && <AdminSidebar dark={dark} />}

          <View
            style={[
              styles.content,
              isMobile && styles.contentMobile,
              { backgroundColor: colors.background },
            ]}
          >
            <AdminHeader
              dark={dark}
              showMenu={isMobile}
              onMenuPress={() => setDrawerOpen(true)}
            />
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>

          {isMobile && drawerOpen && (
            <View style={styles.drawerOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close admin menu"
                style={styles.backdrop}
                onPress={() => setDrawerOpen(false)}
              />
              <Animated.View
                style={[
                  styles.drawer,
                  {
                    width: drawerWidth,
                    backgroundColor: colors.surface,
                    transform: [{ translateX: drawerTranslateX }],
                  },
                ]}
              >
                <AdminSidebar
                  dark={dark}
                  drawer
                  onNavigate={() => setDrawerOpen(false)}
                />
              </Animated.View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
  },

  content: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  contentMobile: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  drawerOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    flexDirection: "row",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },

  drawer: {
    height: "100%",
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
});