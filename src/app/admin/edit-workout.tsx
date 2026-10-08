import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

import {
  WorkoutCategoryIcon,
  WorkoutFormModal,
  type WorkoutFormColors,
} from "@/components/admin/workout-form-ui";
import { ADMIN_COLORS } from "@/constants/admin-theme";

const API_URL = "http://localhost:5000/api/member2/workouts";

const CATEGORY_OPTIONS = [
  "Full Body",
  "Strength",
  "Cardio",
  "Stretching",
  "Mobility",
  "Core",
  "Other",
];

const DIFFICULTY_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Other",
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

export default function EditWorkoutScreen() {
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : "";

  const dark = useColorScheme() === "dark";
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [modal, setModal] = useState<"confirm" | "success" | null>(null);

  const loadWorkout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/${id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load workout");
      }

      const workout = result.data;

      setTitle(workout.title ?? "");
      setDescription(workout.description ?? "");

      if (CATEGORY_OPTIONS.includes(workout.category)) {
        setCategory(workout.category);
      } else {
        setCategory("Other");
        setCustomCategory(workout.category ?? "");
      }

      if (DIFFICULTY_OPTIONS.includes(workout.difficulty)) {
        setDifficulty(workout.difficulty);
      } else {
        setDifficulty("Other");
        setCustomDifficulty(workout.difficulty ?? "");
      }

      const durationValue = String(workout.duration ?? "");

      if (DURATION_OPTIONS.includes(durationValue)) {
        setDuration(durationValue);
      } else {
        setDuration("Other");
        setCustomDuration(durationValue);
      }

      if (EQUIPMENT_OPTIONS.includes(workout.equipment)) {
        setEquipment(workout.equipment);
      } else {
        setEquipment("Other");
        setCustomEquipment(workout.equipment ?? "");
      }

      setLowImpact(workout.lowImpact ?? false);
      setActive(workout.active !== false);
    } catch (error) {
      console.error("Load workout error:", error);

      Alert.alert("Error", "Unable to load workout.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Workout ID is missing.");
      router.back();
      return;
    }

    void Promise.resolve().then(loadWorkout);
  }, [id, loadWorkout]);

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
      Alert.alert("Validation", "Workout title is required.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Validation", "Description is required.");
      return;
    }

    if (!finalCategory) {
      Alert.alert("Validation", "Category is required.");
      return;
    }

    if (!finalDifficulty) {
      Alert.alert("Validation", "Difficulty is required.");
      return;
    }

    if (
      !finalDuration ||
      Number.isNaN(Number(finalDuration)) ||
      Number(finalDuration) <= 0
    ) {
      Alert.alert("Validation", "Enter a valid duration.");
      return;
    }

    if (!finalEquipment) {
      Alert.alert("Validation", "Equipment is required.");
      return;
    }

    setModal("confirm");
  };

  const updateWorkout = async () => {
    const finalCategory =
      category === "Other" ? customCategory.trim() : category;
    const finalDifficulty =
      difficulty === "Other" ? customDifficulty.trim() : difficulty;
    const finalDuration =
      duration === "Other" ? customDuration.trim() : duration;
    const finalEquipment =
      equipment === "Other" ? customEquipment.trim() : equipment;

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
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
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update workout");
      }

      setModal("success");
    } catch (error) {
      console.error("Update workout error:", error);
      setModal(null);

      Alert.alert("Error", "Unable to update workout.");
    } finally {
      setSaving(false);
    }
  };

  const handleModalConfirm = () => {
    if (modal === "confirm") {
      void updateWorkout();
    } else if (modal === "success") {
      setModal(null);
      router.replace("/admin/workouts" as never);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>
            Loading workout...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontSize: 22 }}>←</Text>
          </Pressable>

          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Edit Workout
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Update workout information.
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
            colors={colors}
          />

          <FormInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            colors={colors}
            multiline
          />

          <DropdownField
            label="Category"
            value={category}
            options={CATEGORY_OPTIONS}
            onSelect={setCategory}
            colors={colors}
          />

          {category === "Other" && (
            <FormInput
              label="Other Category"
              value={customCategory}
              onChangeText={setCustomCategory}
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
            options={DIFFICULTY_OPTIONS}
            onSelect={setDifficulty}
            colors={colors}
          />

          {difficulty === "Other" && (
            <FormInput
              label="Other Difficulty"
              value={customDifficulty}
              onChangeText={setCustomDifficulty}
              colors={colors}
            />
          )}

          <DropdownField
            label="Duration"
            value={duration}
            options={DURATION_OPTIONS}
            displayOption={(item) =>
              item === "Other" ? "Other" : `${item} min`
            }
            onSelect={setDuration}
            colors={colors}
          />

          {duration === "Other" && (
            <FormInput
              label="Other Duration"
              value={customDuration}
              onChangeText={setCustomDuration}
              colors={colors}
            />
          )}

          <DropdownField
            label="Equipment"
            value={equipment}
            options={EQUIPMENT_OPTIONS}
            onSelect={setEquipment}
            colors={colors}
          />

          {equipment === "Other" && (
            <FormInput
              label="Other Equipment"
              value={customEquipment}
              onChangeText={setCustomEquipment}
              colors={colors}
            />
          )}

          <View style={styles.settingRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Low Impact
            </Text>

            <Switch
              value={lowImpact}
              onValueChange={setLowImpact}
              thumbColor={lowImpact ? colors.accent : colors.muted}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Active
            </Text>

            <Switch
              value={active}
              onValueChange={setActive}
              thumbColor={active ? colors.accent : colors.muted}
            />
          </View>

          <Pressable
            disabled={saving}
            onPress={validateWorkout}
            style={[
              styles.saveButton,
              {
                backgroundColor: dark ? "#C6FF3D" : colors.accent,
                opacity: saving ? 0.6 : 1,
              },
            ]}
          >
            <Text style={styles.saveText}>
              {saving ? "Updating..." : "Update Workout"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <WorkoutFormModal
        visible={modal !== null}
        success={modal === "success"}
        saving={saving}
        title={modal === "success" ? "Success" : "Update Workout?"}
        message={
          modal === "success"
            ? "Workout updated successfully!"
            : "Are you sure you want to update this workout?"
        }
        colors={colors}
        dark={dark}
        onCancel={() => setModal(null)}
        onConfirm={handleModalConfirm}
      />
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  colors,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: WorkoutFormColors;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            color: colors.text,
            backgroundColor: colors.surfaceAlt,
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
  options,
  onSelect,
  colors,
  displayOption,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  colors: WorkoutFormColors;
  displayOption?: (value: string) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          styles.dropdown,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: open ? colors.accent : colors.border,
          },
        ]}
      >
        <Text style={{ color: colors.text }}>
          {displayOption ? displayOption(value) : value}
        </Text>

        <Text style={{ color: colors.accent }}>
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
          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.option}
              onPress={() => {
                onSelect(option);
                setOpen(false);
              }}
            >
              <Text
                style={{
                  color:
                    value === option
                      ? colors.accent
                      : colors.text,
                }}
              >
                {displayOption ? displayOption(option) : option}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
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
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  dropdown: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },

  option: {
    padding: 14,
  },

  settingRow: {
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  categoryIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },

  helper: {
    flex: 1,
    fontSize: 12,
  },

  saveButton: {
    minHeight: 54,
    borderRadius: 14,
    marginTop: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  saveText: {
    color: "#080e0e",
    fontSize: 15,
    fontWeight: "800",
  },
});