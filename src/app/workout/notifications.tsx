import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { NavigationIcon } from '@/components/navigation/navigation-icon';
import { useWorkout } from "../../features/workout/store";
import {
    Badge,
    Button,
    Card,
    Page,
    c,
    s,
} from "../../features/workout/ui";

export default function NotificationsScreen() {
  const { data, readNotice, deleteNotice, refreshNotices } = useWorkout();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotices?.();
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotices]);

  useFocusEffect(useCallback(() => { void refreshNotices?.(); }, [refreshNotices]));
  const unread = data.notices.filter((n) => !n.read).length;

  return (
    <Page title="Notifications">
      <Text style={s.body}>Stay updated on your workouts, new exercises, and training milestones.</Text>
      <View style={[s.row, { alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.heading}>Inbox</Text>
          <Badge>{unread} unread</Badge>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh notifications"
          onPress={handleRefresh}
          disabled={refreshing}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingVertical: 7,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: pressed ? c.accentSoft : 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            opacity: refreshing ? 0.6 : 1,
          })}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <NavigationIcon name="refresh" size={16} color={c.accent} />
          )}
          <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Text>
        </Pressable>
      </View>
      {!!unread && (
        <Button
          title="Mark all as read"
          secondary
          onPress={() => readNotice()}
        />
      )}
      {data.notices.length === 0 && (
        <Card>
          <View style={{ alignSelf: 'center', padding: 20, backgroundColor: c.accentSoft, borderRadius: 28 }}><NavigationIcon name="bell" size={32} color={c.accent} /></View>
          <Text style={s.heading}>You’re all caught up</Text>
          <Text style={s.body}>
            Notifications for new workouts, exercises, and completed sessions will appear here.
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button
              title={refreshing ? "Checking for notifications…" : "Refresh notifications"}
              secondary
              disabled={refreshing}
              onPress={handleRefresh}
            />
          </View>
        </Card>
      )}
      {data.notices.map((n) => (
        <Card key={n.id} tinted={!n.read}>
          <View style={s.row}>
            <Text style={[s.heading, { flex: 1, paddingRight: 8 }]}>{n.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Badge>{n.read ? "READ" : "NEW"}</Badge>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete notification: ${n.title}`}
                onPress={() => deleteNotice(n.id)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: pressed ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <NavigationIcon name="trash" size={16} color="#ef4444" />
              </Pressable>
            </View>
          </View>
          <Text style={s.body}>{n.message}</Text>
          <Text style={s.label}>{new Date(n.createdAt).toLocaleString()}</Text>
          {!!n.sessionId && (
            <Button
              title="View session summary"
              secondary
              onPress={() => {
                readNotice(n.id);
                router.push({
                  pathname: "/workout/completed",
                  params: { session: n.sessionId! },
                });
              }}
            />
          )}
          {!!n.workoutId && !n.sessionId && (
            <Button
              title="View workout"
              secondary
              onPress={() => {
                readNotice(n.id);
                router.push({
                  pathname: "/workout/details",
                  params: { workoutId: n.workoutId! },
                });
              }}
            />
          )}
          {!n.read && (
            <Button title="✓ Mark as read" onPress={() => readNotice(n.id)} />
          )}
        </Card>
      ))}
    </Page>
  );
}
