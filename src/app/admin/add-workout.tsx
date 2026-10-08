// Adapted from admin_workout_management 8cebec0. Shared layout and authenticated API.
import { ADMIN_WORKOUT_API as API_URL, adminWorkoutRequest } from "@/features/exercises/admin-workout-api";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import {
  WorkoutCategoryIcon,
  WorkoutFormModal,
  type WorkoutFormColors,
} from "@/components/admin/workout-form-ui";
import { ADMIN_COLORS } from "@/constants/admin-theme";



const CATEGORY_OPTIONS = [
  "Full Body",
  "Strength",
  "Cardio",
  "Stretching",
  "Mobility",
  "Core",
];

const DIFFICULTY_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const DURATION_OPTIONS = [
  "5",
  "15",
  "30",
  "45",
  "Other",
];

const EQUIPMENT_OPTIONS = [
  "No equipment",
  "Dumbbells",
  "Yoga mat",
  "Resistance bands",
  "Other",
];

export default function AddWorkoutScreen() {
  const dark = true;
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");
  const [equipment, setEquipment] = useState("");

  const [customCategory, setCustomCategory] = useState("");
  const [customDifficulty, setCustomDifficulty] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [customEquipment, setCustomEquipment] = useState("");

  const [lowImpact, setLowImpact] = useState(false);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [modal, setModal] = useState<"confirm" | "success" | "error" | null>(
    null,
  );
  const [modalMessage, setModalMessage] = useState("");

  const showFormError = (message: string) => {
    setModalMessage(message);
    setModal("error");
  };

  const validateWorkout = () => {
    const finalCategory =
      category === "Other" ? customCategory.trim() : category;

    const finalDifficulty =
      difficulty === "Other" ? customDifficulty.trim() : difficulty;

    const finalDuration =
      duration === "Other" ? customDuration.trim() : duration;

    const finalEquipment =
      equipment === "Other" ? customEquipment.trim() : equipment;

    if (!title.trim()) {
      showFormError("Please enter a workout title.");
      return;
    }

    if (!description.trim()) {
      showFormError("Please enter a workout description.");
      return;
    }

    if (!category) {
      showFormError("Please select a category.");
      return;
    }

    if (!finalCategory) {
      showFormError("Please enter the custom category.");
      return;
    }

    if (!difficulty) {
      showFormError("Please select a difficulty level.");
      return;
    }

    if (!finalDifficulty) {
      showFormError("Please enter the custom difficulty.");
      return;
    }

    if (!duration) {
      showFormError("Please select a duration.");
      return;
    }

    if (
      !finalDuration ||
      !Number.isSafeInteger(Number(finalDuration)) ||
      Number(finalDuration) <= 0 || Number(finalDuration) > 1440
    ) {
      showFormError("Please enter a valid duration in minutes.");
      return;
    }

    if (!equipment) {
      showFormError("Please select equipment.");
      return;
    }

    if (!finalEquipment) {
      showFormError("Please enter the custom equipment.");
      return;
    }

    setModal("confirm");
  };

  const createWorkout = async () => {
    if (savingRef.current) {
      return;
    }

    const finalCategory =
      category === "Other" ? customCategory.trim() : category;
    const finalDifficulty =
      difficulty === "Other" ? customDifficulty.trim() : difficulty;
    const finalDuration =
      duration === "Other" ? customDuration.trim() : duration;
    const finalEquipment =
      equipment === "Other" ? customEquipment.trim() : equipment;

    try {
      savingRef.current = true;
      setSaving(true);

      const response = await adminWorkoutRequest(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: finalCategory,
          difficulty: finalDifficulty,
          duration: Number(finalDuration),
          equipment: finalEquipment,
          lowImpact,
          active,
          exercises: [],
        }),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : `Unable to create workout (${response.status})`;
        console.error("Create workout API response:", {
          status: response.status,
          body: result,
        });
        throw new Error(message);
      }

      setModalMessage("Workout created successfully!");
      setModal("success");
    } catch (error) {
      console.error("Create workout error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred while creating the workout.";
      setModalMessage(`Unable to create workout: ${message}`);
      setModal("error");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleModalConfirm = () => {
    if (modal === "confirm") {
      void createWorkout();
    } else if (modal === "success") {
      setModal(null);
      router.replace("/admin/workouts");
    } else if (modal === "error") {
      setModal(null);
    }
  };

  const closeModal = () => {
    if (!saving) {
      setModal(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/admin/workouts")}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.backText, { color: colors.text }]}>
              ←
            </Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Add Workout
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Create a new workout for FitFlow users.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <FormInput
            label="Workout Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter workout title"
            colors={colors}
          />

          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter workout description"
            colors={colors}
            multiline
          />

          <DropdownField
            label="Category"
            value={category}
            placeholder="Select category"
            options={CATEGORY_OPTIONS}
            onSelect={(value) => {
              setCategory(value);

              if (value !== "Other") {
                setCustomCategory("");
              }
            }}
            colors={colors}
          />

          {category === "Other" && (
            <FormInput
              label="Other Category"
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="Enter custom category"
              colors={colors}
            />
          )}

          {!!category && (
            <View style={styles.categoryIconRow}>
              <WorkoutCategoryIcon
                category={category === "Other" ? customCategory : category}
                colors={colors}
              />
              <Text style={[styles.helper, { color: colors.muted }]}>
                Workout icon is selected automatically.
              </Text>
            </View>
          )}

          <DropdownField
            label="Difficulty Level"
            value={difficulty}
            placeholder="Select difficulty"
            options={DIFFICULTY_OPTIONS}
            onSelect={(value) => {
              setDifficulty(value);

              if (value !== "Other") {
                setCustomDifficulty("");
              }
            }}
            colors={colors}
          />

          {difficulty === "Other" && (
            <FormInput
              label="Other Difficulty"
              value={customDifficulty}
              onChangeText={setCustomDifficulty}
              placeholder="Enter custom difficulty"
              colors={colors}
            />
          )}

          <DropdownField
            label="Duration"
            value={duration}
            placeholder="Select duration"
            options={DURATION_OPTIONS}
            displayOption={(item) =>
              item === "Other" ? "Other" : `${item} min`
            }
            onSelect={(value) => {
              setDuration(value);

              if (value !== "Other") {
                setCustomDuration("");
              }
            }}
            colors={colors}
          />

          {duration === "Other" && (
            <FormInput
              label="Other Duration"
              value={customDuration}
              onChangeText={setCustomDuration}
              placeholder="Enter duration in minutes"
              colors={colors}
              keyboardType="numeric"
            />
          )}

          <DropdownField
            label="Equipment"
            value={equipment}
            placeholder="Select equipment"
            options={EQUIPMENT_OPTIONS}
            onSelect={(value) => {
              setEquipment(value);

              if (value !== "Other") {
                setCustomEquipment("");
              }
            }}
            colors={colors}
          />

          {equipment === "Other" && (
            <FormInput
              label="Other Equipment"
              value={customEquipment}
              onChangeText={setCustomEquipment}
              placeholder="Enter custom equipment"
              colors={colors}
            />
          )}

          <View
            style={[
              styles.settingRow,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Low Impact
              </Text>

              <Text style={[styles.helper, { color: colors.muted }]}>
                Suitable for gentle workouts
              </Text>
            </View>

            <Switch
              value={lowImpact}
              onValueChange={setLowImpact}
              trackColor={{
                false: colors.border,
                true: colors.accentSoft,
              }}
              thumbColor={lowImpact ? colors.accent : colors.muted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Workout Status
              </Text>

              <Text style={[styles.helper, { color: colors.muted }]}>
                {active
                  ? "Active - visible to users"
                  : "Inactive - hidden from users"}
              </Text>
            </View>

            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{
                false: colors.border,
                true: colors.accentSoft,
              }}
              thumbColor={active ? colors.accent : colors.muted}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={validateWorkout}
            style={[
              styles.createButton,
              {
                backgroundColor: dark ? "#C6FF3D" : colors.accent,
                opacity: saving ? 0.6 : 1,
              },
            ]}
          >
            <Text style={styles.createButtonText}>
              {saving ? "Creating Workout..." : "Create Workout"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <WorkoutFormModal
        visible={modal !== null}
        success={modal === "success"}
        dismissOnly={modal !== "confirm"}
        saving={saving}
        title={
          modal === "confirm"
            ? "Create Workout?"
            : modal === "success"
              ? "Success"
              : "Unable to Create Workout"
        }
        message={
          modal === "confirm"
            ? "Are you sure you want to create this workout?"
            : modalMessage
        }
        colors={colors}
        dark={dark}
        confirmColor="#D5FF69"
        onCancel={closeModal}
        onConfirm={handleModalConfirm}
      />
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  multiline = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: WorkoutFormColors;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            backgroundColor: colors.surfaceAlt,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
      />
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  colors,
  displayOption,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  colors: WorkoutFormColors;
  displayOption?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);

  const displayedValue = value
    ? displayOption
      ? displayOption(value)
      : value
    : placeholder;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>

      <Pressable
            accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={[
          styles.dropdownButton,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: open ? colors.accent : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.dropdownValue,
            {
              color: value ? colors.text : colors.muted,
            },
          ]}
        >
          {displayedValue}
        </Text>

        <Text style={[styles.arrow, { color: colors.accent }]}>
          {open ? "▲" : "▼"}
        </Text>
      </Pressable>

      {open && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
            },
          ]}
        >
          {options.map((option) => {
            const selected = value === option;

            return (
              <Pressable
            accessibilityRole="button"
                key={option}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  selected && {
                    backgroundColor: colors.accentSoft,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.accent : colors.text,
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {displayOption ? displayOption(option) : option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 22,
    fontWeight: "700",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },

  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },

  field: {
    marginTop: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  textArea: {
    minHeight: 105,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  dropdownButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownValue: {
    flex: 1,
    fontSize: 14,
  },

  arrow: {
    fontSize: 11,
    marginLeft: 10,
  },

  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150,150,150,0.12)",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    marginTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  helper: {
    fontSize: 11,
    marginTop: 4,
  },

  categoryIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },

  createButton: {
    minHeight: 54,
    marginTop: 26,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  createButtonText: {
    color: "#080e0e",
    fontSize: 15,
    fontWeight: "800",
  },
});