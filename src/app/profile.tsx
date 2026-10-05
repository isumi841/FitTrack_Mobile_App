import { useState } from "react";
import { Switch, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Chip, Label, Screen, ui } from "@/components/member-ui";
import { useMember } from "@/providers/member-state";
import { useTheme } from "@/hooks/use-theme";
import { confirmLogout, integrationRoutes, notify } from "@/utils/integration";

export default function UserProfileScreen() {
  const member = useMember();
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(member.name);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const toggle = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View style={ui.row}>
      <Label>{label}</Label>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
      />
    </View>
  );
  return (
    <Screen title="User Profile" subtitle="Your preferences. Your pace." back>
      <Card>
        <Label large>{member.signedOut ? "Guest" : member.name}</Label>
        <Label muted>{member.favorites.length} saved workouts</Label>
        {member.signedOut ? (
          <Button
            title="Continue with profile"
            onPress={() => member.setSignedOut(false)}
          />
        ) : (
          <Button
            title="Edit Profile"
            soft
            onPress={() => {
              setDraftName(member.name);
              setEditing(!editing);
            }}
          />
        )}
        {editing && (
          <>
            <TextInput
              accessibilityLabel="Profile name"
              value={draftName}
              onChangeText={setDraftName}
              maxLength={60}
              style={[
                ui.input,
                { color: theme.text, borderColor: theme.border },
              ]}
            />
            <Button
              title="Save Profile"
              onPress={() => {
                if (!draftName.trim()) {
                  notify("Profile", "Please enter your name.");
                  return;
                }
                member.setName(draftName.trim());
                setEditing(false);
              }}
            />
            <Button
              title="Cancel editing"
              soft
              onPress={() => setEditing(false)}
            />
          </>
        )}
      </Card>
      <Label large>Preferences</Label>
      <Card>
        {toggle("Workout reminders", member.reminders, member.setReminders)}
        <Label muted>
          {member.reminders
            ? "Workout reminder preference is on."
            : "Reminders are off."}
        </Label>
        <Button
          title="Notifications"
          soft
          onPress={() => setShowNotifications(!showNotifications)}
        />
        {showNotifications && (
          <>
            {toggle(
              "Allow notifications",
              member.notifications,
              member.setNotifications,
            )}
            <Label muted>
              Device notification delivery will be connected during integration.
            </Label>
          </>
        )}
        {toggle("Dark mode", member.dark, member.setDark)}
        <Button
          title={`Language: ${member.language}`}
          soft
          onPress={() => setShowLanguages(!showLanguages)}
        />
        {showLanguages && (
          <View style={ui.chips}>
            {["English", "Sinhala", "Tamil"].map((language) => (
              <Chip
                key={language}
                title={language}
                selected={member.language === language}
                onPress={() => {
                  member.setLanguage(language);
                  setShowLanguages(false);
                  notify(
                    "Language saved",
                    "Your preference is saved for this session. Translations will be connected during integration.",
                  );
                }}
              />
            ))}
          </View>
        )}
      </Card>
      <Card>
        <Label muted>
          Your preferences and favourites are kept for this session.
        </Label>
        <Button
          title="Log out"
          soft
          onPress={() =>
            confirmLogout(() => {
              member.setSignedOut(true);
              setEditing(false);
              if (integrationRoutes.login)
                router.replace(integrationRoutes.login);
              else {
                router.replace("/");
                notify(
                  "Logged out",
                  "You are now browsing as a guest. Authentication will be connected during integration.",
                );
              }
            })
          }
        />
      </Card>
    </Screen>
  );
}
