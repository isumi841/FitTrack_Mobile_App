/**
 * Edit Profile Screen – Member 4.
 * Route: /member4/edit-profile
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useM4Theme } from '@/features/member4/hooks/useM4Theme';
import { mockUserProfile } from '@/features/member4/data/mockData';
import type { UserProfile } from '@/features/member4/types';

const FITNESS_TAGS = [
  'Stronger Every Day',
  'Endurance',
  'Flexibility',
  'Weight Loss',
  'Cardio',
  'Core Strength',
];

export default function EditProfileScreen() {
  const c = useM4Theme();

  const [profile, setProfile] = useState<UserProfile>({ ...mockUserProfile });
  const [hasChanges, setHasChanges] = useState(false);

  function update<K extends keyof UserProfile>(field: K, value: UserProfile[K]) {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }

  function toggleTag(tag: string) {
    const tags = profile.fitnessFocusTags;
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    update('fitnessFocusTags', next);
  }

  function handleSave() {
    setHasChanges(false);
    Alert.alert('Saved!', 'Your profile changes have been saved locally.');
  }

  function leaveProfile() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/member4/progress');
    }
  }

  function handleCancel() {
    if (hasChanges) {
      Alert.alert('Discard Changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setProfile({ ...mockUserProfile });
            setHasChanges(false);
            leaveProfile();
          },
        },
      ]);
    } else {
      leaveProfile();
    }
  }

  function handleCameraPress() {
    Alert.alert('Change Photo', 'Photo upload will be available after API integration.');
  }

  const bioLength = profile.bio.length;
  const BIO_MAX = 150;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      {/* ── Custom Header ── */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Pressable
          onPress={handleCancel}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? c.tealDim : c.surface, borderColor: c.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cancel editing"
        >
          <Text style={[styles.iconBtnText, { color: c.teal }]}>←</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: pressed ? c.tealDim : c.teal, borderColor: c.teal },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save profile changes"
        >
          <Text style={styles.saveIconText}>✓</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { backgroundColor: c.bg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar Section ── */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: c.teal }]}>
              <View style={[styles.avatar, { backgroundColor: c.tealDim }]}>
                <Text style={[styles.avatarText, { color: c.teal }]}>
                  {profile.avatarInitials}
                </Text>
              </View>
              {/* Camera button */}
              <Pressable
                onPress={handleCameraPress}
                style={[styles.cameraBtn, { backgroundColor: c.teal, borderColor: c.bg }]}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <Text style={styles.cameraIcon}>📷</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleCameraPress} accessibilityRole="button">
              <Text style={[styles.changePhotoText, { color: c.teal }]}>
                Change profile photo
              </Text>
            </Pressable>
          </View>

          {/* ── Personal Info ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>PERSONAL INFO</Text>

            <FieldRow
              label="Full Name"
              value={profile.fullName}
              onChangeText={(v) => update('fullName', v)}
              c={c}
            />
            <FieldDivider c={c} />
            <FieldRow
              label="Username"
              value={profile.username}
              onChangeText={(v) => update('username', v)}
              c={c}
              prefix="@"
            />
            <FieldDivider c={c} />
            <FieldRow
              label="Email Address"
              value={profile.email}
              onChangeText={(v) => update('email', v)}
              c={c}
              keyboardType="email-address"
              badge={profile.emailVerified ? 'Verified' : undefined}
              badgeColor={c.teal}
            />
            <FieldDivider c={c} />
            <FieldRow
              label="Phone Number"
              value={profile.phone}
              onChangeText={(v) => update('phone', v)}
              c={c}
              keyboardType="phone-pad"
            />
            <FieldDivider c={c} />
            <FieldRow
              label="Date of Birth"
              value={profile.dateOfBirth}
              onChangeText={(v) => update('dateOfBirth', v)}
              c={c}
            />
            <FieldDivider c={c} />
            <FieldRow
              label="Gender"
              value={profile.gender}
              onChangeText={(v) => update('gender', v)}
              c={c}
            />
          </View>

          {/* ── Fitness Focus ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <Text style={[styles.cardLabel, { color: c.muted }]}>PRIMARY FITNESS FOCUS</Text>
            <View style={styles.tagsRow}>
              {FITNESS_TAGS.map((tag) => {
                const selected = profile.fitnessFocusTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: selected ? c.teal : c.surface,
                        borderColor: selected ? c.teal : c.border,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: selected ? '#fff' : c.muted },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Bio ── */}
          <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBdr }]}>
            <View style={styles.bioHeader}>
              <Text style={[styles.cardLabel, { color: c.muted }]}>BIO & MOTIVATION</Text>
              <Text
                style={[
                  styles.charCount,
                  { color: bioLength > BIO_MAX * 0.9 ? c.warning : c.subtle },
                ]}
              >
                {bioLength}/{BIO_MAX}
              </Text>
            </View>
            <TextInput
              value={profile.bio}
              onChangeText={(v) => v.length <= BIO_MAX && update('bio', v)}
              style={[
                styles.bioInput,
                { color: c.text, backgroundColor: c.surface, borderColor: c.border },
              ]}
              multiline
              maxLength={BIO_MAX}
              placeholder="Tell us about your fitness journey..."
              placeholderTextColor={c.subtle}
              accessibilityLabel="Bio and motivation"
              textAlignVertical="top"
            />
          </View>

          {/* ── Actions ── */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: pressed ? c.tealDim : c.teal,
                shadowColor: c.teal,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Pressable>

          <Pressable
            onPress={handleCancel}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={[styles.cancelBtnText, { color: c.muted }]}>Cancel</Text>
          </Pressable>

          <View style={{ height: 16 }} />
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  c: ReturnType<typeof useM4Theme>;
  prefix?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  badge?: string;
  badgeColor?: string;
}

function FieldRow({
  label,
  value,
  onChangeText,
  c,
  prefix,
  keyboardType = 'default',
  badge,
  badgeColor,
}: FieldRowProps) {
  return (
    <View style={fieldStyles.row}>
      <Text style={[fieldStyles.label, { color: c.subtle }]}>{label}</Text>
      <View style={fieldStyles.inputRow}>
        {prefix && (
          <Text style={[fieldStyles.prefix, { color: c.muted }]}>{prefix}</Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[fieldStyles.input, { color: c.text }]}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
          returnKeyType="done"
        />
        {badge && (
          <View style={[fieldStyles.badge, { borderColor: badgeColor, backgroundColor: `${badgeColor}22` }]}>
            <Text style={[fieldStyles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function FieldDivider({ c }: { c: ReturnType<typeof useM4Theme> }) {
  return <View style={[fieldStyles.divider, { backgroundColor: c.border }]} />;
}

const fieldStyles = StyleSheet.create({
  row: { gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: { fontSize: 15, fontWeight: '400' },
  input: { flex: 1, fontSize: 15, paddingVertical: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingTop: Platform.OS === 'web' ? 12 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16, fontWeight: '600' },
  saveIconText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  cameraIcon: { fontSize: 12 },
  changePhotoText: { fontSize: 13, fontWeight: '600' },

  // Cards
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  // Bio
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: { fontSize: 11, fontWeight: '500' },
  bioInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
  },

  // Buttons
  saveBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 10,
  },
  saveBtnText: { color: '#0D1117', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '500' },
});
