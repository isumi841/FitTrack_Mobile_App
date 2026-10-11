import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { MobileModal as Modal } from "@/components/layout/mobile-viewport";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type WorkoutFormColors = {
  background: string;
  text: string;
  muted: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  accent: string;
  accentSoft: string;
};

const CATEGORY_ICONS: Record<
  string,
  { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }
> = {
  "Full Body": {
    ios: "figure.stand",
    android: "accessibility_new",
    web: "accessibility_new",
  },
  Strength: {
    ios: "dumbbell",
    android: "fitness_center",
    web: "fitness_center",
  },
  Cardio: {
    ios: "heart.fill",
    android: "favorite",
    web: "favorite",
  },
  Stretching: {
    ios: "figure.cooldown",
    android: "self_improvement",
    web: "self_improvement",
  },
  Mobility: {
    ios: "figure.walk",
    android: "directions_walk",
    web: "directions_walk",
  },
  Core: {
    ios: "figure.core.training",
    android: "exercise",
    web: "exercise",
  },
};

export function getWorkoutIcon(category: string) {
  return (
    CATEGORY_ICONS[category] ?? {
      ios: "figure.run",
      android: "exercise",
      web: "exercise",
    }
  );
}

export function WorkoutCategoryIcon({
  category,
  colors,
}: {
  category: string;
  colors: WorkoutFormColors;
}) {
  return (
    <View
      accessibilityLabel={`${category || "Workout"} icon`}
      style={[
        styles.iconPreview,
        {
          backgroundColor: colors.accentSoft,
          borderColor: colors.border,
        },
      ]}
    >
      <SymbolView
        name={getWorkoutIcon(category)}
        size={28}
        tintColor={colors.accent}
      />
    </View>
  );
}

export function WorkoutFormModal({
  visible,
  success,
  saving,
  title,
  message,
  colors,
  dark,
  confirmColor,
  dismissOnly = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  success: boolean;
  saving: boolean;
  title: string;
  message: string;
  colors: WorkoutFormColors;
  dark: boolean;
  confirmColor?: string;
  dismissOnly?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const actionColor = confirmColor ?? (dark ? "#C6FF3D" : colors.accent);
  const closeOnRequest = () => {
    if (!success && !saving) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeOnRequest}
    >
      <View style={styles.overlay}>
        <View
          accessibilityViewIsModal
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {success && (
            <View style={[styles.successMark, { backgroundColor: actionColor }]}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
          )}

          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.muted }]}>
            {message}
          </Text>

          <View style={styles.modalActions}>
            {!success && !dismissOnly && (
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                    opacity: saving ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalButton,
                styles.confirmButton,
                {
                  backgroundColor: actionColor,
                  opacity: saving ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.confirmText}>
                {saving ? "Saving..." : "OK"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  modalMessage: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    minHeight: 48,
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  confirmButton: {
    borderColor: "transparent",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  confirmText: {
    color: "#080e0e",
    fontSize: 14,
    fontWeight: "800",
  },
  successMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successCheck: {
    color: "#080e0e",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 36,
  },
  iconPreview: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
