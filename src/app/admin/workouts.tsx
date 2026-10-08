// Adapted from admin_workout_management 8cebec0. Shared layout and authenticated API.
import { ADMIN_WORKOUT_API as API_URL, adminWorkoutRequest } from "@/features/exercises/admin-workout-api";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { WorkoutFormModal } from "@/components/admin/workout-form-ui";
import { ADMIN_COLORS } from "@/constants/admin-theme";

type Workout = {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  duration: number;
  equipment?: string;
  description?: string;
  lowImpact?: boolean;
  active?: boolean;
};


const ADMIN_API_URL = `${API_URL}/admin/all`;

function isWorkoutApiResponse(
  value: unknown,
): value is { success: true; data: Workout[] } {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return response.success === true && Array.isArray(response.data);
}

export default function AdminWorkoutsScreen() {
  const dark = true;
  const colors = dark ? ADMIN_COLORS.dark : ADMIN_COLORS.light;

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Inactive">("All");

  const [error, setError] = useState("");
  const loadGeneration = useRef(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [deleteModal, setDeleteModal] = useState<"confirm" | "success" | null>(
    null,
  );

  /* =========================
     LOAD WORKOUTS - READ
  ========================= */

  const loadWorkouts = useCallback(async () => {
    const generation = ++loadGeneration.current;
    try {
      setLoading(true);

      const response = await adminWorkoutRequest(ADMIN_API_URL);
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      if (!isWorkoutApiResponse(result)) {
        throw new Error("Workout API returned an invalid response.");
      }

      if (generation !== loadGeneration.current) return;
      setWorkouts(result.data);
      setError("");
    } catch (error) {
      if (generation === loadGeneration.current) setError(error instanceof Error ? error.message : "Unable to load workouts.");
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadWorkouts(); return () => { loadGeneration.current++; }; }, [loadWorkouts]));

  /* =========================
     FILTER + SEARCH
  ========================= */

  const filteredWorkouts = useMemo(() => {
    const search = query.trim().toLowerCase();

    return workouts.filter((workout) => {
      const matchesSearch =
        !search ||
        `${workout.title} ${workout.category} ${workout.difficulty}`
          .toLowerCase()
          .includes(search);

      const isActive = workout.active === true;

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && isActive) ||
        (filter === "Inactive" && !isActive);

      return matchesSearch && matchesFilter;
    });
  }, [query, filter, workouts]);

  const activeCount = workouts.filter(
    (workout) => workout.active === true,
  ).length;

  const inactiveCount = workouts.filter(
    (workout) => workout.active === false,
  ).length;

  /* =========================
     DELETE WORKOUT
  ========================= */

  const deleteWorkout = async (id: string) => {
    try {
      setDeletingId(id);

      const response = await adminWorkoutRequest(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete workout");
      }

      setWorkouts((current) =>
        current.filter((workout) => workout._id !== id),
      );

      await loadWorkouts();
      setDeleteModal("success");
    } catch (error) {
      console.error("Delete workout error:", error);
      setDeleteModal(null);
      setSelectedWorkout(null);

      setError(error instanceof Error ? error.message : "Unable to delete workout.");
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================
     DELETE CONFIRMATION
  ========================= */

  const confirmDelete = (workout: Workout) => {
    setSelectedWorkout(workout);
    setDeleteModal("confirm");
  };

  const handleDeleteModalConfirm = () => {
    if (deleteModal === "confirm" && selectedWorkout) {
      void deleteWorkout(selectedWorkout._id);
    } else if (deleteModal === "success") {
      setDeleteModal(null);
      setSelectedWorkout(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              Workout Management
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Add, edit and manage FitFlow workouts.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.addButton,
              {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() =>
              router.push("/admin/add-workout")
            }
          >
            <Text style={styles.addButtonText}>
              + Add Workout
            </Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Refresh workouts" disabled={loading} onPress={() => { void loadWorkouts(); }} style={{ alignSelf: 'flex-end', padding: 12 }}><Text style={{ color: colors.accent }}>{loading ? 'Refreshing...' : 'Refresh workouts'}</Text></Pressable>
        {!!error && <Text accessibilityRole="alert" style={{ color: '#ef7373', paddingVertical: 12 }}>{error}</Text>}
        {/* =========================
            SEARCH
        ========================= */}

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            accessibilityLabel="Search workouts"
            value={query}
            onChangeText={setQuery}
            placeholder="Search workouts..."
            placeholderTextColor={colors.muted}
            style={[
              styles.searchInput,
              {
                color: colors.text,
              },
            ]}
          />
        </View>

        {/* =========================
            FILTER TABS
        ========================= */}

        <View style={styles.tabs}>
          <FilterTab
            label={`All (${workouts.length})`}
            active={filter === "All"}
            onPress={() => setFilter("All")}
            colors={colors}
          />

          <FilterTab
            label={`Active (${activeCount})`}
            active={filter === "Active"}
            onPress={() => setFilter("Active")}
            colors={colors}
          />

          <FilterTab
            label={`Inactive (${inactiveCount})`}
            active={filter === "Inactive"}
            onPress={() => setFilter("Inactive")}
            colors={colors}
          />
        </View>

        {/* =========================
            LOADING
        ========================= */}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color={colors.accent}
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.muted,
                },
              ]}
            >
              Loading workouts...
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {/* =========================
                WORKOUT CARDS
            ========================= */}

            {filteredWorkouts.map((workout) => {
              const isActive = workout.active === true;

              return (
                <View
                  key={workout._id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardContent}>
                      <Text
                        style={[
                          styles.workoutTitle,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        {workout.title}
                      </Text>

                      <Text
                        style={[
                          styles.meta,
                          {
                            color: colors.muted,
                          },
                        ]}
                      >
                        {workout.category} · {workout.difficulty} ·{" "}
                        {workout.duration} min
                      </Text>

                      {workout.equipment ? (
                        <Text
                          style={[
                            styles.equipment,
                            {
                              color: colors.muted,
                            },
                          ]}
                        >
                          Equipment: {workout.equipment}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isActive
                            ? colors.accentSoft
                            : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: isActive
                              ? colors.accent
                              : colors.muted,
                          },
                        ]}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* =========================
                      ACTION BUTTONS
                  ========================= */}

                  <View style={styles.actions}>
                    <Pressable
            accessibilityRole="button"
                      style={[
                        styles.editButton,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/admin/edit-workout",
                          params: {
                            id: workout._id,
                          },
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.editText,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
            accessibilityRole="button"
                      disabled={deletingId === workout._id}
                      style={[
                        styles.deleteButton,
                        deletingId === workout._id && {
                          opacity: 0.5,
                        },
                      ]}
                      accessibilityLabel={`Delete ${workout.title}`}
                      onPress={() => confirmDelete(workout)}
                    >
                      <Text style={styles.deleteText}>
                        {deletingId === workout._id
                          ? "Deleting..."
                          : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {/* =========================
                EMPTY RESULT
            ========================= */}

            {!error && !filteredWorkouts.length && (
              <View style={styles.emptyContainer}>
                <Text
                  style={[
                    styles.emptyTitle,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  No workouts found
                </Text>

                <Text
                  style={[
                    styles.emptyText,
                    {
                      color: colors.muted,
                    },
                  ]}
                >
                  Try another search or filter.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <WorkoutFormModal
        visible={deleteModal !== null}
        success={deleteModal === "success"}
        saving={deletingId !== null}
        title={deleteModal === "success" ? "Success" : "Delete Workout?"}
        message={
          deleteModal === "success"
            ? "Workout deleted successfully!"
            : `Delete ${selectedWorkout?.title ?? "this workout"}? It will be removed from the workout catalog. Saved workout sessions will remain available.`
        }
        colors={colors}
        dark={dark}
        onCancel={() => {
          if (deletingId) return;
          setDeleteModal(null);
          setSelectedWorkout(null);
        }}
        onConfirm={handleDeleteModalConfirm}
      />
    </View>
  );
}

/* =====================================================
   FILTER TAB
===================================================== */

function FilterTab({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: typeof ADMIN_COLORS.dark;
}) {
  return (
    <Pressable
            accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.tab,
        active && {
          borderColor: colors.accent,
          backgroundColor: colors.accentSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.tabText,
          {
            color: active ? colors.accent : colors.muted,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  page: {
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
  },

  headerText: {
    flex: 1,
    minWidth: 200,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
  },

  addButton: {
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  addButtonText: {
    color: "#080e0e",
    fontSize: 14,
    fontWeight: "800",
  },

  searchBox: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },

  searchInput: {
    minHeight: 50,
    fontSize: 14,
  },

  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },

  tab: {
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
  },

  loading: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },

  list: {
    marginTop: 16,
    gap: 14,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  cardContent: {
    flex: 1,
  },

  workoutTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  meta: {
    marginTop: 5,
    fontSize: 12,
  },

  equipment: {
    marginTop: 5,
    fontSize: 11,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    minWidth: 54,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 9,
    alignItems: "center",
  },

  editText: {
    fontSize: 13,
    fontWeight: "600",
  },

  deleteButton: {
    minWidth: 64,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 9,
    alignItems: "center",
  },

  deleteText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
  },
});