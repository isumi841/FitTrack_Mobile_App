import { MobileModal } from '@/components/layout/mobile-viewport';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '@/features/exercises/admin-store';
import { fetchUsers } from '@/features/member1/auth/users-api';
import { type AuthUser } from '@/features/member1/auth/auth-api';
import {
  type AdminGoalItem,
  type GoalCategory,
  type GoalStatus,
  type GoalDuration,
  CATEGORY_COLORS,
  STATUS_COLORS,
  INITIAL_DEMO_GOALS,
  fetchAdminDbGoals,
  createAdminDbGoal,
  deleteAdminDbGoal,
} from '@/features/member4/services/admin-goals-api';
import { ADMIN_COLORS } from '@/constants/admin-theme';

export default function AdminGoalsScreen() {
  const { token } = useAdmin();
  const colors = ADMIN_COLORS.dark;

  // Goals & Members state
  const [goals, setGoals] = useState<AdminGoalItem[]>(INITIAL_DEMO_GOALS);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string>('Live admin authentication active');

  // Filter & Search states (matching user reference mockup)
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | GoalStatus>('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | GoalCategory>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'Name' | 'Recently updated'>('Newest');

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalGoal, setDetailModalGoal] = useState<AdminGoalItem | null>(null);
  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<AdminGoalItem | null>(null);

  // Add/Edit Goal form state (matching Screenshot 1)
  const [formName, setFormName] = useState('');
  const [formMember, setFormMember] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<GoalCategory>('Consistency');
  const [formStatus, setFormStatus] = useState<GoalStatus>('On track');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formTarget, setFormTarget] = useState('10');
  const [formDuration, setFormDuration] = useState<GoalDuration>('Weekly');
  const [formError, setFormError] = useState('');

  // Load real users and sync
  const loadData = useCallback(() => {
    if (!token) return Promise.resolve();
    return fetchUsers(token)
      .catch(() => ({ success: false, users: [] }))
      .then(async (userRes) => {
        if (userRes.success && userRes.users?.length) {
          setUsers(userRes.users);
          setSyncStatus(`Synced with ${userRes.users.length} registered member accounts`);
        }

        const dbGoals = await fetchAdminDbGoals(token);
        if (dbGoals?.length) {
          const mappedDbGoals: AdminGoalItem[] = dbGoals.map((g: any, index: number) => {
            const memberObj = userRes.users?.find((u) => u.id === String(g.userId));
            const categoryMapped: GoalCategory =
              g.goalType === 'workoutMinutes'
                ? 'Endurance'
                : g.goalType === 'workoutsPerWeek'
                ? 'Strength'
                : g.goalType === 'caloriesPerWeek'
                ? 'Consistency'
                : 'Mobility';

            const statusMapped: GoalStatus =
              g.status === 'completed' || (g.current >= g.target && g.target > 0)
                ? 'Completed'
                : g.current / Math.max(g.target, 1) < 0.35
                ? 'At risk'
                : 'On track';

            return {
              id: g._id || `db-goal-${index}`,
              userId: g.userId || 'system',
              userName: memberObj?.displayName || memberObj?.email?.split('@')[0] || 'Member',
              userEmail: memberObj?.email || 'member@fittrack.com',
              userRole: memberObj?.role || 'user',
              title: g.title || 'Fitness Milestone',
              description: `Targeting ${g.target} ${g.duration.toLowerCase()}`,
              category: categoryMapped,
              current: Number(g.current) || 0,
              target: Number(g.target) || 1,
              unit: g.goalType === 'workoutMinutes' ? 'min' : 'times',
              duration: g.duration || 'Weekly',
              status: statusMapped,
              createdAt: g.createdAt || new Date().toISOString(),
              updatedAt: g.updatedAt || new Date().toISOString(),
            };
          });

          // Merge DB goals with demo goals ensuring unique IDs
          setGoals((prev) => {
            const existingIds = new Set(mappedDbGoals.map((d) => d.id));
            const remaining = prev.filter((p) => !existingIds.has(p.id));
            return [...mappedDbGoals, ...remaining];
          });
        }
      })
      .catch(() => {
        // Keep existing sample records gracefully
      });
  }, [token]);

  useEffect(() => {
    void loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Reset/Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatus('All');
    setSelectedCategory('All');
    setSortBy('Newest');
  };

  // Filter & sort goals
  const filteredGoals = useMemo(() => {
    return goals
      .filter((item) => {
        if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchName = item.userName.toLowerCase().includes(q);
          const matchEmail = item.userEmail.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchName && !matchEmail && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Name') return a.title.localeCompare(b.title);
        if (sortBy === 'Recently updated') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [goals, selectedStatus, selectedCategory, search, sortBy]);

  // Metrics for charts and KPI cards
  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'Completed').length;
    const onTrack = goals.filter((g) => g.status === 'On track').length;
    const atRisk = goals.filter((g) => g.status === 'At risk').length;

    const totalProgressPct =
      total > 0
        ? Math.round(
            goals.reduce((acc, g) => acc + Math.min(100, (g.current / Math.max(g.target, 1)) * 100), 0) /
              total
          )
        : 0;

    // Categories breakdown
    const categories: GoalCategory[] = ['Consistency', 'Strength', 'Endurance', 'Mobility'];
    const categoryStats = categories.map((cat) => {
      const catGoals = goals.filter((g) => g.category === cat);
      const count = catGoals.length;
      const avgPct =
        count > 0
          ? Math.round(
              catGoals.reduce((acc, g) => acc + Math.min(100, (g.current / Math.max(g.target, 1)) * 100), 0) /
                count
            )
          : 0;
      return { category: cat, count, avgPct };
    });

    return { total, completed, onTrack, atRisk, totalProgressPct, categoryStats };
  }, [goals]);

  // Handle saving a new goal
  const handleSaveGoal = async (createdAt: number) => {
    if (!formName.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }
    const targetNum = Number(formTarget);
    const currentNum = Number(formCurrent);
    if (isNaN(targetNum) || targetNum <= 0) {
      setFormError('Target must be a number greater than 0.');
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      setFormError('Current progress cannot be negative.');
      return;
    }

    const memberName = formMember.trim() || 'Alex Rivera';
    const matchedUser = users.find(
      (u) =>
        u.displayName?.toLowerCase() === memberName.toLowerCase() ||
        u.email?.toLowerCase().includes(memberName.toLowerCase())
    );

    const calculatedStatus: GoalStatus =
      currentNum >= targetNum ? 'Completed' : formStatus;

    const newGoal: AdminGoalItem = {
      id: `local-goal-${createdAt}`,
      userId: matchedUser ? matchedUser.id : `user-${createdAt}`,
      userName: matchedUser?.displayName || memberName,
      userEmail: matchedUser?.email || `${memberName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      userRole: matchedUser?.role || 'user',
      title: formName.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      current: currentNum,
      target: targetNum,
      unit: formCategory === 'Endurance' ? 'km' : formCategory === 'Strength' ? 'reps' : 'days',
      duration: formDuration,
      status: calculatedStatus,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(createdAt).toISOString(),
    };

    // Optionally sync with backend if admin token is present
    if (token) {
      try {
        await createAdminDbGoal(token, {
          userId: newGoal.userId,
          title: newGoal.title,
          target: newGoal.target,
          current: newGoal.current,
          duration: newGoal.duration,
          category: newGoal.category,
        });
      } catch {
        // Fall back gracefully to local session update
      }
    }

    setGoals((prev) => [newGoal, ...prev]);
    setAddModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormMember('');
    setFormDescription('');
    setFormCategory('Consistency');
    setFormStatus('On track');
    setFormCurrent('0');
    setFormTarget('10');
    setFormDuration('Weekly');
    setFormError('');
  };

  // Quick progress increment / status update from detail modal
  const handleUpdateProgress = (delta: number) => {
    if (!detailModalGoal) return;
    const nextCurrent = Math.max(0, detailModalGoal.current + delta);
    const nextStatus: GoalStatus =
      nextCurrent >= detailModalGoal.target
        ? 'Completed'
        : detailModalGoal.status === 'Completed'
        ? 'On track'
        : detailModalGoal.status;

    const updated: AdminGoalItem = {
      ...detailModalGoal,
      current: nextCurrent,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setDetailModalGoal(updated);
  };

  const handleDeleteGoal = async (id: string) => {
    if (token && id.startsWith('6')) {
      try {
        await deleteAdminDbGoal(token, id);
      } catch {
        // ignore
      }
    }
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setDetailModalGoal(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Title & Subtitle */}
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Goals & progress</Text>
          <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
            Review, search and manage member goals and activity progress.
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Refresh goals"
          style={styles.refreshBtn}
          onPress={() => {
            setLoading(true);
            void loadData().finally(() => setLoading(false));
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="refresh" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Workspace & Live Authentication Banner (as in Reference Screenshot) */}
      <View style={styles.bannerBox}>
        <View style={styles.bannerHeaderRow}>
          <View style={styles.statusLiveDot} />
          <Text style={styles.bannerTitle}>Demo workspace · Live admin authentication</Text>
        </View>
        <Text style={styles.bannerBody}>
          These sample records are local to this app session. Changes are shared across admin pages
          and reset when the app reloads. No member data is changed.
        </Text>
        <Text style={styles.bannerSyncNotice}>
          <Ionicons name="cloud-done-outline" size={13} color="#C6FF3D" /> {syncStatus}
        </Text>
      </View>

      {/* 3. Primary Top Actions (Add demo goal & Clear filters) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.addGoalBtn}
          onPress={() => {
            resetForm();
            setAddModalVisible(true);
          }}
        >
          <Ionicons name="add" size={18} color="#171D23" />
          <Text style={styles.addGoalBtnText}>Add demo goal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearFilters}>
          <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
        </TouchableOpacity>
      </View>

      {/* 4. KPI Metrics Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Goals</Text>
          <Text style={styles.kpiValue}>{stats.total}</Text>
          <Text style={styles.kpiSub}>Tracked in system</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>On Track</Text>
          <Text style={[styles.kpiValue, { color: STATUS_COLORS['On track'].text }]}>
            {stats.onTrack}
          </Text>
          <Text style={styles.kpiSub}>Good trajectory</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>At Risk</Text>
          <Text style={[styles.kpiValue, { color: STATUS_COLORS['At risk'].text }]}>
            {stats.atRisk}
          </Text>
          <Text style={styles.kpiSub}>Needs attention</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Completed</Text>
          <Text style={[styles.kpiValue, { color: STATUS_COLORS.Completed.text }]}>
            {stats.completed}
          </Text>
          <Text style={styles.kpiSub}>Targets reached</Text>
        </View>
      </View>

      {/* 5. Recommended Analytics Charts Section */}
      <View style={styles.chartsCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartCardTitle}>Performance & Distribution</Text>
            <Text style={styles.chartCardSub}>Category breakdown & milestone status</Text>
          </View>
          <View style={styles.avgProgressBadge}>
            <Text style={styles.avgProgressText}>{stats.totalProgressPct}% Avg Progress</Text>
          </View>
        </View>

        {/* Status Distribution Segment Bar */}
        <View style={styles.statusSegmentContainer}>
          <View style={styles.statusSegmentBar}>
            {stats.total > 0 && (
              <>
                <View
                  style={[
                    styles.segmentPart,
                    {
                      flex: Math.max(stats.completed, 0.01),
                      backgroundColor: STATUS_COLORS.Completed.dot,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.segmentPart,
                    {
                      flex: Math.max(stats.onTrack, 0.01),
                      backgroundColor: STATUS_COLORS['On track'].dot,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.segmentPart,
                    {
                      flex: Math.max(stats.atRisk, 0.01),
                      backgroundColor: STATUS_COLORS['At risk'].dot,
                    },
                  ]}
                />
              </>
            )}
          </View>
          <View style={styles.statusLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.Completed.dot }]} />
              <Text style={styles.legendText}>Completed ({stats.completed})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS['On track'].dot }]} />
              <Text style={styles.legendText}>On track ({stats.onTrack})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS['At risk'].dot }]} />
              <Text style={styles.legendText}>At risk ({stats.atRisk})</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown Horizontal Bars */}
        <View style={styles.categoryChartContainer}>
          <Text style={styles.categoryChartLabel}>Breakdown by Fitness Category</Text>
          {stats.categoryStats.map((item) => {
            const catColor = CATEGORY_COLORS[item.category];
            return (
              <View key={item.category} style={styles.catBarRow}>
                <View style={styles.catBarHeader}>
                  <Text style={[styles.catName, { color: catColor.text }]}>{item.category}</Text>
                  <Text style={styles.catMeta}>
                    {item.count} {item.count === 1 ? 'goal' : 'goals'} · {item.avgPct}% avg
                  </Text>
                </View>
                <View style={styles.catTrack}>
                  <View
                    style={[
                      styles.catFill,
                      {
                        width: `${Math.min(100, Math.max(6, item.avgPct))}%`,
                        backgroundColor: catColor.text,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 6. Filter & Search Card (Exact Match to Screenshot 2) */}
      <View style={styles.filterCard}>
        <Text style={styles.filterSectionTitle}>Search goals</Text>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#8F9A97" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, details or owner"
            placeholderTextColor="#8F9A97"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#8F9A97" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.filterSectionTitle}>Status</Text>
        <View style={styles.pillsRow}>
          {(['All', 'On track', 'At risk', 'Completed'] as const).map((st) => {
            const active = selectedStatus === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedStatus(st)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{st}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.filterSectionTitle}>Category</Text>
        <View style={styles.pillsRow}>
          {(['All', 'Consistency', 'Strength', 'Endurance', 'Mobility'] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.filterSectionTitle}>Sort by</Text>
        <View style={styles.pillsRow}>
          {(['Newest', 'Name', 'Recently updated'] as const).map((sortOpt) => {
            const active = sortBy === sortOpt;
            return (
              <TouchableOpacity
                key={sortOpt}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSortBy(sortOpt)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{sortOpt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.recordCounterRow}>
          <Text style={styles.recordCounterText}>
            Showing {filteredGoals.length} of {goals.length} records
          </Text>
        </View>
      </View>

      {/* 7. Comprehensive Goals & Progress Data Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderSection}>
          <View>
            <Text style={styles.tableCardTitle}>Member Goals Table</Text>
            <Text style={styles.tableCardSub}>Tap any row to view details & update milestones</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={{ minWidth: 700 }}>
            {/* Table Header Row */}
            <View style={styles.tblHeaderRow}>
              <Text style={[styles.tblHeadCell, { width: 170 }]}>MEMBER</Text>
              <Text style={[styles.tblHeadCell, { width: 180 }]}>GOAL & CATEGORY</Text>
              <Text style={[styles.tblHeadCell, { width: 150 }]}>PROGRESS</Text>
              <Text style={[styles.tblHeadCell, { width: 90 }]}>CADENCE</Text>
              <Text style={[styles.tblHeadCell, { width: 100 }]}>STATUS</Text>
              <Text style={[styles.tblHeadCell, { width: 80, textAlign: 'right' }]}>ACTIONS</Text>
            </View>

            {/* Empty state */}
            {filteredGoals.length === 0 ? (
              <View style={styles.emptyTable}>
                <Ionicons name="filter-outline" size={32} color="#8F9A97" />
                <Text style={styles.emptyTableText}>No goals match the selected criteria.</Text>
                <TouchableOpacity style={styles.emptyClearBtn} onPress={handleClearFilters}>
                  <Text style={styles.emptyClearBtnText}>Reset filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredGoals.map((item) => {
                const pct = Math.min(100, Math.round((item.current / Math.max(item.target, 1)) * 100));
                const catColor = CATEGORY_COLORS[item.category];
                const statusColor = STATUS_COLORS[item.status];

                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.tblRow, pressed && styles.tblRowPressed]}
                    onPress={() => setDetailModalGoal(item)}
                  >
                    {/* Column 1: Member Info */}
                    <View style={[styles.tblCell, { width: 170, flexDirection: 'row', alignItems: 'center' }]}>
                      <View style={[styles.avatarCircle, { backgroundColor: catColor.bg, borderColor: catColor.border }]}>
                        <Text style={[styles.avatarInitial, { color: catColor.text }]}>
                          {item.userName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {item.userName}
                        </Text>
                        <Text style={styles.memberEmail} numberOfLines={1}>
                          {item.userEmail}
                        </Text>
                      </View>
                    </View>

                    {/* Column 2: Goal Title & Category */}
                    <View style={[styles.tblCell, { width: 180 }]}>
                      <Text style={styles.goalTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={[styles.catBadge, { backgroundColor: catColor.bg, borderColor: catColor.border }]}>
                        <Text style={[styles.catBadgeText, { color: catColor.text }]}>{item.category}</Text>
                      </View>
                    </View>

                    {/* Column 3: Progress Bar & Numbers */}
                    <View style={[styles.tblCell, { width: 150 }]}>
                      <View style={styles.progressNumRow}>
                        <Text style={styles.progressNums}>
                          {item.current} / {item.target} {item.unit}
                        </Text>
                        <Text style={[styles.progressPct, { color: pct >= 100 ? '#4ADE80' : '#F4F7F6' }]}>
                          {pct}%
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor:
                                item.status === 'Completed'
                                  ? '#4ADE80'
                                  : item.status === 'At risk'
                                  ? '#FB923C'
                                  : '#C6FF3D',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Column 4: Cadence */}
                    <View style={[styles.tblCell, { width: 90 }]}>
                      <View style={styles.cadenceBadge}>
                        <Text style={styles.cadenceBadgeText}>{item.duration}</Text>
                      </View>
                    </View>

                    {/* Column 5: Status Pill */}
                    <View style={[styles.tblCell, { width: 100 }]}>
                      <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
                        <Text style={[styles.statusPillText, { color: statusColor.text }]}>{item.status}</Text>
                      </View>
                    </View>

                    {/* Column 6: Actions */}
                    <View style={[styles.tblCell, { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                      <TouchableOpacity
                        accessibilityLabel="Inspect goal details"
                        style={styles.actionIconBtn}
                        onPress={() => setDetailModalGoal(item)}
                      >
                        <Ionicons name="eye-outline" size={17} color="#C6FF3D" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityLabel="Delete goal"
                        style={styles.actionIconBtn}
                        onPress={() => setDeleteConfirmGoal(item)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FB923C" />
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>

      {/* 8. Add Demo Goal Modal (Matches Reference Screenshot 1) */}
      <MobileModal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Add demo goal</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDisclaimer}>Changes affect local sample records only.</Text>

            {!!formError && <Text style={styles.formErrorText}>{formError}</Text>}

            {/* Field: Name */}
            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 5 Morning runs"
              placeholderTextColor="#8F9A97"
              value={formName}
              onChangeText={setFormName}
            />

            {/* Field: Member */}
            <Text style={styles.formLabel}>Member</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Sarah Jenkins"
              placeholderTextColor="#8F9A97"
              value={formMember}
              onChangeText={setFormMember}
            />

            {/* Field: Description */}
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
              placeholder="Goal description and motivation"
              placeholderTextColor="#8F9A97"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
            />

            {/* Field: Category */}
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.pillsRow}>
              {(['Consistency', 'Strength', 'Endurance', 'Mobility'] as const).map((cat) => {
                const active = formCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.formPill, active && styles.formPillActive]}
                    onPress={() => setFormCategory(cat)}
                  >
                    <Text style={[styles.formPillText, active && styles.formPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Field: Status */}
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.pillsRow}>
              {(['On track', 'At risk', 'Completed'] as const).map((st) => {
                const active = formStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.formPill, active && styles.formPillActive]}
                    onPress={() => setFormStatus(st)}
                  >
                    <Text style={[styles.formPillText, active && styles.formPillTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Field: Current progress */}
            <Text style={styles.formLabel}>Current progress</Text>
            <TextInput
              style={styles.formInput}
              placeholder="0"
              placeholderTextColor="#8F9A97"
              value={formCurrent}
              onChangeText={setFormCurrent}
              keyboardType="numeric"
            />

            {/* Field: Target */}
            <Text style={styles.formLabel}>Target</Text>
            <TextInput
              style={styles.formInput}
              placeholder="10"
              placeholderTextColor="#8F9A97"
              value={formTarget}
              onChangeText={setFormTarget}
              keyboardType="numeric"
            />

            {/* Field: Duration */}
            <Text style={styles.formLabel}>Duration Cadence</Text>
            <View style={styles.pillsRow}>
              {(['Weekly', 'Monthly'] as const).map((dur) => {
                const active = formDuration === dur;
                return (
                  <TouchableOpacity
                    key={dur}
                    style={[styles.formPill, active && styles.formPillActive]}
                    onPress={() => setFormDuration(dur)}
                  >
                    <Text style={[styles.formPillText, active && styles.formPillTextActive]}>
                      {dur}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit */}
            <TouchableOpacity style={styles.formSubmitBtn} onPress={() => void handleSaveGoal(Date.now())}>
              <Text style={styles.formSubmitBtnText}>Create Goal Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </MobileModal>

      {/* 9. Member Goal Detail Deep-Dive Modal */}
      {detailModalGoal && (
        <MobileModal
          visible={!!detailModalGoal}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModalGoal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailMemberName}>{detailModalGoal.userName}</Text>
                  <Text style={styles.detailMemberEmail}>{detailModalGoal.userEmail}</Text>
                </View>
                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setDetailModalGoal(null)}
                >
                  <Ionicons name="close" size={20} color="#F4F7F6" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailDivider} />

              <Text style={styles.detailGoalTitle}>{detailModalGoal.title}</Text>
              {detailModalGoal.description && (
                <Text style={styles.detailGoalDesc}>{detailModalGoal.description}</Text>
              )}

              {/* Badges */}
              <View style={styles.detailBadgesRow}>
                <View
                  style={[
                    styles.catBadge,
                    {
                      backgroundColor: CATEGORY_COLORS[detailModalGoal.category].bg,
                      borderColor: CATEGORY_COLORS[detailModalGoal.category].border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catBadgeText,
                      { color: CATEGORY_COLORS[detailModalGoal.category].text },
                    ]}
                  >
                    {detailModalGoal.category}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: STATUS_COLORS[detailModalGoal.status].bg },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[detailModalGoal.status].dot },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: STATUS_COLORS[detailModalGoal.status].text },
                    ]}
                  >
                    {detailModalGoal.status}
                  </Text>
                </View>

                <View style={styles.cadenceBadge}>
                  <Text style={styles.cadenceBadgeText}>{detailModalGoal.duration}</Text>
                </View>
              </View>

              {/* Detailed Progress Section */}
              <View style={styles.detailProgressBox}>
                <View style={styles.detailProgressHeader}>
                  <Text style={styles.detailProgressLabel}>Progress Achievement</Text>
                  <Text style={styles.detailProgressValues}>
                    {detailModalGoal.current} / {detailModalGoal.target} {detailModalGoal.unit} (
                    {Math.min(
                      100,
                      Math.round(
                        (detailModalGoal.current / Math.max(detailModalGoal.target, 1)) * 100
                      )
                    )}
                    %)
                  </Text>
                </View>

                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.round(
                            (detailModalGoal.current / Math.max(detailModalGoal.target, 1)) * 100
                          )
                        )}%`,
                        backgroundColor:
                          detailModalGoal.status === 'Completed'
                            ? '#4ADE80'
                            : detailModalGoal.status === 'At risk'
                            ? '#FB923C'
                            : '#C6FF3D',
                      },
                    ]}
                  />
                </View>

                {/* Quick Increment Controls */}
                <Text style={styles.detailAdjustLabel}>Adjust Progress Count:</Text>
                <View style={styles.adjustButtonsRow}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => handleUpdateProgress(-1)}
                  >
                    <Text style={styles.adjustBtnText}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => handleUpdateProgress(1)}
                  >
                    <Text style={styles.adjustBtnText}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => handleUpdateProgress(5)}
                  >
                    <Text style={styles.adjustBtnText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.adjustBtn, { backgroundColor: '#4ADE8025', borderColor: '#4ADE8040' }]}
                    onPress={() => handleUpdateProgress(detailModalGoal.target - detailModalGoal.current)}
                  >
                    <Text style={[styles.adjustBtnText, { color: '#4ADE80' }]}>Mark Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delete / Actions */}
              <View style={styles.detailFooterRow}>
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => setDeleteConfirmGoal(detailModalGoal)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FB923C" />
                  <Text style={styles.detailDeleteBtnText}>Remove Goal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailDoneBtn}
                  onPress={() => setDetailModalGoal(null)}
                >
                  <Text style={styles.detailDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MobileModal>
      )}

      {/* Delete Goal Confirmation Dialog (Matches screenshot) */}
      <MobileModal
        visible={!!deleteConfirmGoal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmGoal(null)}
      >
        <View style={styles.confirmBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss confirmation"
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteConfirmGoal(null)}
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Delete goal?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete &ldquo;{deleteConfirmGoal?.title}&rdquo;?
            </Text>

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={() => setDeleteConfirmGoal(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={() => {
                if (deleteConfirmGoal) {
                  const targetId = deleteConfirmGoal.id;
                  setDeleteConfirmGoal(null);
                  void handleDeleteGoal(targetId);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </MobileModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  bannerBox: {
    backgroundColor: '#141D17',
    borderWidth: 1,
    borderColor: '#263B2A',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C6FF3D',
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4E8B0',
  },
  bannerBody: {
    fontSize: 13,
    color: '#9EAD9B',
    lineHeight: 18,
  },
  bannerSyncNotice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C6FF3D',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C6FF3D',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  addGoalBtnText: {
    color: '#171D23',
    fontWeight: '700',
    fontSize: 14,
  },
  clearFiltersBtn: {
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearFiltersBtnText: {
    color: '#F4F7F6',
    fontWeight: '600',
    fontSize: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 14,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F9A97',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F4F7F6',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#8F9A97',
    marginTop: 2,
  },
  chartsCard: {
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4F7F6',
  },
  chartCardSub: {
    fontSize: 12,
    color: '#8F9A97',
    marginTop: 2,
  },
  avgProgressBadge: {
    backgroundColor: 'rgba(198, 255, 61, 0.12)',
    borderColor: 'rgba(198, 255, 61, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  avgProgressText: {
    color: '#C6FF3D',
    fontSize: 12,
    fontWeight: '700',
  },
  statusSegmentContainer: {
    marginBottom: 20,
  },
  statusSegmentBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A3230',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentPart: {
    height: '100%',
  },
  statusLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#8F9A97',
  },
  categoryChartContainer: {
    borderTopWidth: 1,
    borderTopColor: '#2A3230',
    paddingTop: 16,
  },
  categoryChartLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4F7F6',
    marginBottom: 12,
  },
  catBarRow: {
    marginBottom: 12,
  },
  catBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catMeta: {
    fontSize: 12,
    color: '#8F9A97',
  },
  catTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20262C',
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 3,
  },
  filterCard: {
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F7F6',
    marginTop: 12,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11151A',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F4F7F6',
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#20262C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3230',
  },
  pillActive: {
    borderColor: '#C6FF3D',
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
  },
  pillText: {
    fontSize: 13,
    color: '#8F9A97',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#C6FF3D',
    fontWeight: '700',
  },
  recordCounterRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#20262C',
  },
  recordCounterText: {
    fontSize: 12,
    color: '#8F9A97',
  },
  tableCard: {
    backgroundColor: '#171B21',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 18,
    paddingVertical: 16,
    marginVertical: 12,
  },
  tableHeaderSection: {
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  tableCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F4F7F6',
  },
  tableCardSub: {
    fontSize: 12,
    color: '#8F9A97',
    marginTop: 2,
  },
  tblHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3230',
    backgroundColor: '#13171D',
  },
  tblHeadCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F9A97',
    letterSpacing: 0.5,
  },
  tblRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#20262C',
    alignItems: 'center',
  },
  tblRowPressed: {
    backgroundColor: '#1D242C',
  },
  tblCell: {
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4F7F6',
  },
  memberEmail: {
    fontSize: 11,
    color: '#8F9A97',
    marginTop: 1,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F4F7F6',
    marginBottom: 4,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressNumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressNums: {
    fontSize: 11,
    color: '#8F9A97',
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#20262C',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cadenceBadge: {
    backgroundColor: '#20262C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cadenceBadgeText: {
    fontSize: 11,
    color: '#DDE2E7',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#20262C',
  },
  emptyTable: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    color: '#8F9A97',
    fontSize: 14,
    marginTop: 8,
  },
  emptyClearBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#20262C',
  },
  emptyClearBtnText: {
    color: '#C6FF3D',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#171B21',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3230',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F4F7F6',
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#20262C',
  },
  modalCloseBtnText: {
    color: '#F4F7F6',
    fontSize: 12,
    fontWeight: '600',
  },
  modalDisclaimer: {
    fontSize: 12,
    color: '#8F9A97',
    marginBottom: 16,
  },
  formErrorText: {
    color: '#FB923C',
    fontSize: 12,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F7F6',
    marginTop: 10,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#11151A',
    borderWidth: 1,
    borderColor: '#2A3230',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F4F7F6',
    fontSize: 14,
  },
  formPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formPill: {
    backgroundColor: '#1E252D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A3230',
  },
  formPillActive: {
    borderColor: '#C6FF3D',
    backgroundColor: 'rgba(198, 255, 61, 0.1)',
  },
  formPillText: {
    fontSize: 12,
    color: '#8F9A97',
    fontWeight: '500',
  },
  formPillTextActive: {
    color: '#C6FF3D',
    fontWeight: '700',
  },
  formSubmitBtn: {
    backgroundColor: '#C6FF3D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  formSubmitBtnText: {
    color: '#171D23',
    fontWeight: '700',
    fontSize: 15,
  },
  detailCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#171B21',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A3230',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailMemberName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F7F6',
  },
  detailMemberEmail: {
    fontSize: 12,
    color: '#8F9A97',
    marginTop: 2,
  },
  detailCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#20262C',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#2A3230',
    marginVertical: 14,
  },
  detailGoalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F4F7F6',
  },
  detailGoalDesc: {
    fontSize: 13,
    color: '#8F9A97',
    marginTop: 4,
    lineHeight: 18,
  },
  detailBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  detailProgressBox: {
    backgroundColor: '#11151A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#20262C',
    marginVertical: 8,
  },
  detailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F9A97',
  },
  detailProgressValues: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F4F7F6',
  },
  detailAdjustLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F9A97',
    marginTop: 12,
    marginBottom: 8,
  },
  adjustButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    backgroundColor: '#20262C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3230',
  },
  adjustBtnText: {
    color: '#F4F7F6',
    fontWeight: '700',
    fontSize: 12,
  },
  detailFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  detailDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  detailDeleteBtnText: {
    color: '#FB923C',
    fontSize: 13,
    fontWeight: '600',
  },
  detailDoneBtn: {
    backgroundColor: '#C6FF3D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  detailDoneBtnText: {
    color: '#171D23',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161C24',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F4F7F6',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#8E9AA8',
    marginBottom: 22,
  },
  confirmCancelBtn: {
    backgroundColor: '#1E252E',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmCancelText: {
    color: '#F4F7F6',
    fontSize: 15.5,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    backgroundColor: '#2C1A20',
    borderColor: 'rgba(244, 63, 94, 0.28)',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#FB7185',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
