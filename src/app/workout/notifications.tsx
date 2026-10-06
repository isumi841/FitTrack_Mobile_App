import { router } from "expo-router";
import { Text, View } from "react-native";
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
  const { data, readNotice, deleteNotice } = useWorkout();
  const unread = data.notices.filter((n) => !n.read).length;
  return (
    <Page title="Notifications">
      <Text style={s.body}>Local-only inbox on this device. These are not push notifications or shared workout reminders.</Text>
      <View style={s.row}>
        <Text style={s.heading}>Inbox</Text>
        <Badge>{unread} unread</Badge>
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
            Finish or end a workout to receive a session notification.
          </Text>
        </Card>
      )}
      {data.notices.map((n) => (
        <Card key={n.id} tinted={!n.read}>
          <View style={s.row}>
            <Text style={[s.heading, { flex: 1 }]}>{n.title}</Text>
            <Badge>{n.read ? "READ" : "NEW"}</Badge>
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
          {!n.read && (
            <Button title="✓ Mark as read" onPress={() => readNotice(n.id)} />
          )}
          <Button
            title="Delete notification"
            danger
            onPress={() => deleteNotice(n.id)}
          />
        </Card>
      ))}
    </Page>
  );
}
