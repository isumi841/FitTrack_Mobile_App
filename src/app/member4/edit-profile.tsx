import { router } from 'expo-router';

import {
  useMember4Profile,
} from '@/features/member4/context/Member4ProfileContext';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FitnessIcon } from '@/features/member4/components/FitnessIcon';
import { M4Screen } from '@/features/member4/components/M4Screen';
import {
  ProfilePressable,
  ProfileReveal,
} from '@/features/member4/components/ProfileMotion';
import { useM4Theme } from '@/features/member4/hooks/useM4Theme';

import {
  createProfile,
  deleteProfile,
  deleteProfileAvatar,
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  type ApiUserProfile,
  type ProfilePayload,
} from '@/features/member4/services/member4Service';

import DateTimePicker, {
  type DateTimePickerChangeEvent as DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import * as ImagePicker from 'expo-image-picker';

const BIO_LIMIT = 150;

const FITNESS_FOCUS_OPTIONS = [
  'Stronger Every Day',
  'Endurance',
  'Fat Loss',
  'Mobility',
  'Consistency',
  'Core Strength',
];

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Prefer not to say',
];

type ProfileForm = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
  focus: string[];

  avatarUrl: string;
};

const EMPTY_PROFILE: ProfileForm = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bio: '',
  focus: [],

  avatarUrl: '',
};

function formatDateForForm(
  value?: string,
) {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );
}

function mapApiProfileToForm(
  apiProfile: ApiUserProfile,
): ProfileForm {
  return {
    fullName:
      apiProfile.fullName ??
      '',

    username:
      apiProfile.username ??
      '',

    email:
      apiProfile.email ??
      '',

    phone:
      apiProfile.phone ??
      '',

    dateOfBirth:
  apiProfile.dateOfBirth
    ? apiProfile.dateOfBirth.slice(
        0,
        10,
      )
    : '',

    gender:
      apiProfile.gender ??
      '',

    bio:
      apiProfile.bio ??
      '',

    focus:
      apiProfile.focus ??
      [],

    avatarUrl:
      apiProfile.avatarUrl ?? '',
  };
}

export default function EditProfileScreen() {
const c = useM4Theme();

const {
  setSharedProfile,
} = useMember4Profile();

const [
  uploadingPhoto,
  setUploadingPhoto,
] = useState(false);

const [
  showDatePicker,
  setShowDatePicker,
] = useState(false);

const [profile, setProfile] =
  useState<ProfileForm>(
    EMPTY_PROFILE,
  );

const [
  savedProfile,
  setSavedProfile,
] =
  useState<ProfileForm>(
    EMPTY_PROFILE,
  );

const [
  profileExists,
  setProfileExists,
] =
  useState(false);

const [
  loadingProfile,
  setLoadingProfile,
] =
  useState(true);

const [
  saving,
  setSaving,
] =
  useState(false);

const [
  deleting,
  setDeleting,
] =
  useState(false);

useEffect(() => {
  void loadProfile();
}, []);

function getDatePickerValue() {
  if (!profile.dateOfBirth) {
    return new Date(2000, 0, 1);
  }

  const parsed =
    new Date(
      profile.dateOfBirth,
    );

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return new Date(
      2000,
      0,
      1,
    );
  }

  return parsed;
}

function handleDateValueChange(
  _event: DateTimePickerEvent,
  selectedDate?: Date,
) {
  if (!selectedDate) {
    return;
  }

  const year =
    selectedDate.getFullYear();

  const month = String(
    selectedDate.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    selectedDate.getDate(),
  ).padStart(2, '0');

  const dateValue =
    `${year}-${month}-${day}`;

  updateField(
    'dateOfBirth',
    dateValue,
  );

  if (Platform.OS === 'android') {
    setShowDatePicker(false);
  }
}

function handleDateDismiss() {
  setShowDatePicker(false);
}

async function loadProfile() {
  try {
    setLoadingProfile(
      true,
    );

    const response =
      await getProfile();

    /*
     * No profile exists yet.
     * Keep the form empty.
     */
    if (!response) {
      setProfileExists(
        false,
      );

      setProfile(
        EMPTY_PROFILE,
      );

      setSavedProfile(
        EMPTY_PROFILE,
      );

      return;
    }

    const loadedProfile =
      mapApiProfileToForm(
        response.data,
      );

    setProfile(
      loadedProfile,
    );

    setSavedProfile(
      loadedProfile,
    );

    setProfileExists(
      true,
    );
  } catch (error) {
    console.error(
      'Load profile error:',
      error,
    );

    Alert.alert(
      'Unable to load profile',

      error instanceof Error
        ? error.message
        : 'Please check your backend connection.',
    );
  } finally {
    setLoadingProfile(
      false,
    );
  }
}

  const pulse = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const avatarPulseStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.22, 0.05],
    }),

    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.16],
        }),
      },
    ],
  };

  const initials = useMemo(() => {
    const parts = profile.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) {
      return 'FT';
    }

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }, [profile.fullName]);

  const hasChanges =
  useMemo(
    () =>
      !loadingProfile &&
      JSON.stringify(
        profile,
      ) !==
        JSON.stringify(
          savedProfile,
        ),

    [
      profile,
      savedProfile,
      loadingProfile,
    ],
  );

  const bioCount = profile.bio.length;

  function updateField<K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleFocus(focus: string) {
    setProfile((current) => {
      const selected =
        current.focus.includes(focus);

      return {
        ...current,
        focus: selected
          ? current.focus.filter(
              (item) => item !== focus,
            )
          : [...current.focus, focus],
      };
    });
  }

  function handleBack() {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved profile changes.',
        [
          {
            text: 'Keep Editing',
            style: 'cancel',
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(
                  '/member4/progress',
                );
              }
            },
          },
        ],
      );

      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/member4/progress');
    }
  }

  function validateProfile() {
    if (!profile.fullName.trim()) {
      Alert.alert(
        'Full name required',
        'Please enter your full name.',
      );

      return false;
    }

    if (!profile.username.trim()) {
      Alert.alert(
        'Username required',
        'Please enter your username.',
      );

      return false;
    }

    if (
      profile.email.trim() &&
      !profile.email.includes('@')
    ) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.',
      );

      return false;
    }

        if (
      profile.dateOfBirth.trim()
    ) {
      const date =
        new Date(
          profile.dateOfBirth,
        );

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        Alert.alert(
          'Invalid date of birth',

        );

        return false;
      }
    }
    return true;
  }

  async function handleSave() {
  if (
    !validateProfile() ||
    saving ||
    deleting
  ) {
    return;
  }

  try {
    setSaving(true);

    const payload:
      ProfilePayload = {
      fullName:
        profile.fullName.trim(),

      username:
        profile.username.trim(),

      email:
        profile.email.trim(),

      phone:
        profile.phone.trim(),

      gender:
        profile.gender
          ? (profile.gender as
              | 'Male'
              | 'Female'
              | 'Prefer not to say')
          : undefined,

      bio:
        profile.bio.trim(),

      focus:
        profile.focus,
    };

    /*
     * Convert the display date:
     * Oct 14, 1992
     *
     * into an ISO date for MongoDB.
     */
    if (
      profile.dateOfBirth.trim()
    ) {
      const parsedDate =
        new Date(
          profile.dateOfBirth,
        );

      payload.dateOfBirth =
        parsedDate.toISOString();
    }

    /*
     * CREATE
     *
     * Used the first time this
     * user creates a profile.
     */
    const response =
      profileExists
        ? await updateProfile(
            payload,
          )
        : await createProfile(
            payload,
          );

    const saved =
      mapApiProfileToForm(
        response.data,
      );

    setProfile(saved);

    setSavedProfile(saved);

    setProfileExists(
      true,
    );

    Alert.alert(
      'Profile updated',

      'Your FitTrack profile has been saved successfully.',
    );
  } catch (error) {
    console.error(
      'Save profile error:',
      error,
    );

    Alert.alert(
      'Unable to save profile',

      error instanceof Error
        ? error.message
        : 'Please try again.',
    );
  } finally {
    setSaving(false);
  }
}

function handleDeleteProfile() {
  if (
    !profileExists ||
    saving ||
    deleting
  ) {
    return;
  }

  Alert.alert(
    'Delete profile?',

    'This will permanently delete your saved Member 4 profile information.',

    [
      {
        text:
          'Cancel',

        style:
          'cancel',
      },

      {
        text:
          'Delete',

        style:
          'destructive',

        onPress:
          async () => {
            try {
              setDeleting(
                true,
              );

              await deleteProfile();

              setProfile(
                EMPTY_PROFILE,
              );

              setSavedProfile(
                EMPTY_PROFILE,
              );

              setProfileExists(
                false,
              );

              Alert.alert(
                'Profile deleted',

                'Your saved profile information has been removed.',
              );
            } catch (
              error
            ) {
              console.error(
                'Delete profile error:',
                error,
              );

              Alert.alert(
                'Unable to delete profile',

                error instanceof
                Error
                  ? error.message
                  : 'Please try again.',
              );
            } finally {
              setDeleting(
                false,
              );
            }
          },
      },
    ],
  );
}

  function handleCancel() {
    if (!hasChanges) {
      handleBack();
      return;
    }

    Alert.alert(
      'Cancel editing?',
      'Your current changes will be discarded.',
      [
        {
          text: 'Continue Editing',
          style: 'cancel',
        },
        {
          text: 'Discard Changes',
          style: 'destructive',
          onPress: () => {
            setProfile(savedProfile);
          },
        },
      ],
    );
  }

async function uploadPickedPhoto(
  asset:
    ImagePicker.ImagePickerAsset,
) {
  if (uploadingPhoto) {
    return;
  }

  try {
    setUploadingPhoto(true);

    const response =
      await uploadProfileAvatar({
        uri: asset.uri,

        fileName:
          asset.fileName,

        mimeType:
          asset.mimeType,
      });

      setSharedProfile(
        response.data,
      );

    const avatarUrl =
      response.data.avatarUrl ??
      '';

    /*
     * Keep any unsaved text
     * edits while updating the
     * avatar.
     */
    setProfile(
      (current) => ({
        ...current,
        avatarUrl,
      }),
    );

    setSavedProfile(
      (current) => ({
        ...current,
        avatarUrl,
      }),
    );

    Alert.alert(
      'Photo updated',
      'Your profile photo has been uploaded successfully.',
    );
  } catch (error) {
    console.error(
      'Profile photo upload error:',
      error,
    );

    Alert.alert(
      'Unable to upload photo',
      error instanceof Error
        ? error.message
        : 'Please try again.',
    );
  } finally {
    setUploadingPhoto(false);
  }
}

async function chooseProfilePhoto() {
  try {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Photo permission required',
        'Allow FitTrack to access your photos to choose a profile picture.',
      );

      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            ['images'],

          allowsEditing:
            true,

          aspect:
            [1, 1],

          quality:
            0.8,
        });

    if (
      result.canceled ||
      !result.assets?.length
    ) {
      return;
    }

    await uploadPickedPhoto(
      result.assets[0],
    );
  } catch (error) {
    console.error(
      'Image picker error:',
      error,
    );

    Alert.alert(
      'Unable to open photos',
      'Please try again.',
    );
  }
}

async function takeProfilePhoto() {
  try {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'Allow FitTrack to use your camera to take a profile picture.',
      );

      return;
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          mediaTypes:
            ['images'],

          allowsEditing:
            true,

          aspect:
            [1, 1],

          quality:
            0.8,
        });

    if (
      result.canceled ||
      !result.assets?.length
    ) {
      return;
    }

    await uploadPickedPhoto(
      result.assets[0],
    );
  } catch (error) {
    console.error(
      'Camera error:',
      error,
    );

    Alert.alert(
      'Unable to open camera',
      'Please try again.',
    );
  }
}

function removeProfilePhoto() {
  Alert.alert(
    'Remove profile photo?',
    'Your current profile photo will be removed.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },

      {
        text: 'Remove',
        style:
          'destructive',

        onPress:
          async () => {
            try {
              setUploadingPhoto(
                true,
              );

              await deleteProfileAvatar();

              setProfile(
                (current) => ({
                  ...current,
                  avatarUrl: '',
                }),
              );

              setSavedProfile(
                (current) => ({
                  ...current,
                  avatarUrl: '',
                }),
              );
            } catch (
              error
            ) {
              Alert.alert(
                'Unable to remove photo',

                error instanceof
                Error
                  ? error.message
                  : 'Please try again.',
              );
            } finally {
              setUploadingPhoto(
                false,
              );
            }
          },
      },
    ],
  );
}

function handlePhotoChange() {
  if (uploadingPhoto) {
    return;
  }

  /*
   * The avatar belongs to an
   * existing MongoDB profile.
   */
  if (!profileExists) {
    Alert.alert(
      'Save profile first',
      'Enter your profile details and tap Save Changes before adding a profile photo.',
    );

    return;
  }

  Alert.alert(
    'Profile photo',
    'Choose how you want to update your photo.',
    [
      {
        text:
          'Choose from Photos',

        onPress:
          () => {
            void chooseProfilePhoto();
          },
      },

      {
        text:
          'Take Photo',

        onPress:
          () => {
            void takeProfilePhoto();
          },
      },

      ...(profile.avatarUrl
        ? [
            {
              text:
                'Remove Photo',

              style:
                'destructive' as const,

              onPress:
                () => {
                  removeProfilePhoto();
                },
            },
          ]
        : []),

      {
        text: 'Cancel',
        style:
          'cancel' as const,
      },
    ],
  );
}

  return (
    <M4Screen>
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            borderBottomColor: c.border,
          },
        ]}
      >
        <ProfilePressable
          label="Go back"
          onPress={handleBack}
          style={[
            styles.headerButton,
            {
              backgroundColor: c.cardBg,
              borderColor: c.cardBdr,
            },
          ]}
        >
          <FitnessIcon
            name="arrow-left"
            size={20}
            color={c.text}
          />
        </ProfilePressable>

        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.headerEyebrow,
              {
                color: c.muted,
              },
            ]}
          >
            FITTRACK / ACCOUNT
          </Text>

          <Text
            accessibilityRole="header"
            style={[
              styles.headerTitle,
              {
                color: c.text,
              },
            ]}
          >
            Edit profile.
          </Text>
        </View>

        <ProfilePressable
          label="Save profile"
          onPress={() => {
            if (!hasChanges || saving) {
              return;
            }

            handleSave();
          }}
          style={[
            styles.saveHeaderButton,
            {
              backgroundColor:
                hasChanges && !saving
                  ? c.teal
                  : c.surface,

              borderColor:
                hasChanges && !saving
                  ? c.teal
                  : c.border,

              opacity:
                hasChanges && !saving
                  ? 1
                  : 0.55,
            },
          ]}
        >
          <FitnessIcon
            name="check"
            size={19}
            color={
              hasChanges && !saving
                ? '#07130F'
                : c.muted
            }
          />
        </ProfilePressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* PROFILE HERO */}

          <ProfileReveal>
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.heroGlow,
                  {
                    backgroundColor: c.tealDim,
                  },
                ]}
              />

              <View style={styles.avatarArea}>
                <View
                  style={styles.avatarAnimationWrap}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.avatarPulse,
                      {
                        backgroundColor: c.teal,
                      },
                      avatarPulseStyle,
                    ]}
                  />

                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: c.tealDim,
                        borderColor: c.teal,
                      },
                    ]}
                  >
                    {profile.avatarUrl ? (
                    <Image
                      source={{
                        uri:
                          profile.avatarUrl,
                      }}
                      style={
                        styles.avatarImage
                      }
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      style={[
                        styles.avatarText,
                        {
                          color:
                            c.teal,
                        },
                      ]}
                    >
                      {initials}
                    </Text>
                  )}
                  </View>

                  <ProfilePressable
                    label="Change profile photo"
                    onPress={handlePhotoChange}
                    style={[
                      styles.photoButton,
                      {
                        backgroundColor: c.teal,
                        borderColor: c.cardBg,
                      },
                    ]}
                  >
                    <FitnessIcon
                      name="plus"
                      size={15}
                      color="#07130F"
                    />
                  </ProfilePressable>
                </View>

                <View style={styles.heroCopy}>
                  <Text
                    style={[
                      styles.heroName,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    {profile.fullName ||
                      'Your Name'}
                  </Text>

                  <Text
                    style={[
                      styles.heroUsername,
                      {
                        color: c.muted,
                      },
                    ]}
                  >
                    {profile.username ||
                      '@username'}
                  </Text>

                  <ProfilePressable
                    label="Change profile photo"
                    onPress={handlePhotoChange}
                    style={[
                      styles.changePhotoButton,
                      {
                        backgroundColor:
                          c.tealDim,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.changePhotoText,
                        {
                          color: c.teal,
                        },
                      ]}
                    >
                      Change profile photo
                    </Text>
                  </ProfilePressable>
                </View>
              </View>

              <View
                style={[
                  styles.profileStatus,
                  {
                    borderTopColor: c.border,
                  },
                ]}
              >
                <View
                  style={styles.statusItem}
                >
                  <FitnessIcon
                    name="check"
                    size={16}
                    color={c.teal}
                  />

                  <View>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color: c.text,
                        },
                      ]}
                    >
                      Verified
                    </Text>

                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: c.muted,
                        },
                      ]}
                    >
                      Email
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusDivider,
                    {
                      backgroundColor:
                        c.border,
                    },
                  ]}
                />

                <View
                  style={styles.statusItem}
                >
                  <FitnessIcon
                    name="goal"
                    size={16}
                    color={c.teal}
                  />

                  <View>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color: c.text,
                        },
                      ]}
                    >
                      {profile.focus.length}
                    </Text>

                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: c.muted,
                        },
                      ]}
                    >
                      Focus areas
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusDivider,
                    {
                      backgroundColor:
                        c.border,
                    },
                  ]}
                />

                <View
                  style={styles.statusItem}
                >
                  <FitnessIcon
                    name="spark"
                    size={16}
                    color={c.teal}
                  />

                  <View>
                    <Text
                      style={[
                        styles.statusValue,
                        {
                          color: c.text,
                        },
                      ]}
                    >
                      Active
                    </Text>

                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: c.muted,
                        },
                      ]}
                    >
                      Member
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ProfileReveal>

          {/* PERSONAL INFORMATION */}

          <ProfileReveal delay={60}>
            <SectionHeader
              eyebrow="PERSONAL DETAILS"
              title="Basic information"
            />

            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <ProfileField
                label="FULL NAME"
                value={profile.fullName}
                placeholder="Enter your full name"
                onChangeText={(value) =>
                  updateField(
                    'fullName',
                    value,
                  )
                }
              />

              <FieldDivider />

              <ProfileField
                label="USERNAME"
                value={profile.username}
                placeholder="@username"
                autoCapitalize="none"
                onChangeText={(value) => {
                  let next = value;

                  if (
                    next &&
                    !next.startsWith('@')
                  ) {
                    next = `@${next}`;
                  }

                  updateField(
                    'username',
                    next,
                  );
                }}
              />

              <FieldDivider />

              <ProfileField
                label="EMAIL ADDRESS"
                value={profile.email}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(value) =>
                  updateField(
                    'email',
                    value,
                  )
                }
                accessory={
                  <View
                    style={[
                      styles.verifiedPill,
                      {
                        backgroundColor:
                          c.tealDim,
                      },
                    ]}
                  >
                    <FitnessIcon
                      name="check"
                      size={11}
                      color={c.teal}
                    />

                    <Text
                      style={[
                        styles.verifiedText,
                        {
                          color: c.teal,
                        },
                      ]}
                    >
                      Verified
                    </Text>
                  </View>
                }
              />

              <FieldDivider />

              <ProfileField
                label="PHONE NUMBER"
                value={profile.phone}
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
                onChangeText={(value) =>
                  updateField(
                    'phone',
                    value,
                  )
                }
              />

              <FieldDivider />

              <ProfilePressable
                label="Select date of birth"
                onPress={() =>
                  setShowDatePicker(
                    true,
                  )
                }
                style={styles.datePickerField}
              >
                <View style={styles.datePickerCopy}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      {
                        color:
                          c.muted,
                      },
                    ]}
                  >
                    DATE OF BIRTH
                  </Text>

                  <Text
                    style={[
                      styles.datePickerValue,
                      {
                        color:
                          profile.dateOfBirth
                            ? c.text
                            : c.subtle,
                      },
                    ]}
                  >
                    {profile.dateOfBirth
                      ? formatDateForForm(
                          profile.dateOfBirth,
                        )
                      : 'Select your date of birth'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.datePickerIcon,
                    {
                      backgroundColor:
                        c.tealDim,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="calendar"
                    size={18}
                    color={c.teal}
                  />
                </View>
              </ProfilePressable>

              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={getDatePickerValue()}
                    mode="date"
                    display={
                      Platform.OS === 'ios'
                        ? 'spinner'
                        : 'default'
                    }
                    maximumDate={new Date()}
                    minimumDate={
                      new Date(1900, 0, 1)
                    }
                    onValueChange={
                      handleDateValueChange
                    }
                    onDismiss={
                      handleDateDismiss
                    }
                  />

                  {Platform.OS === 'ios' && (
                    <ProfilePressable
                      label="Done selecting date"
                      onPress={() =>
                        setShowDatePicker(false)
                      }
                      style={[
                        styles.dateDoneButton,
                        {
                          backgroundColor:
                            c.teal,
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.dateDoneButtonText
                        }
                      >
                        Done
                      </Text>
                    </ProfilePressable>
                  )}
                </View>
              )}           
            </View>
          </ProfileReveal>


          {/* GENDER */}

          <ProfileReveal delay={100}>
            <SectionHeader
              eyebrow="ABOUT YOU"
              title="Gender"
            />

            <View style={styles.chipRow}>
              {GENDER_OPTIONS.map(
                (gender) => {
                  const selected =
                    profile.gender === gender;

                  return (
                    <ProfilePressable
                      key={gender}
                      label={`Select ${gender}`}
                      onPress={() =>
                        updateField(
                          'gender',
                          gender,
                        )
                      }
                      style={[
                        styles.genderChip,
                        {
                          backgroundColor:
                            selected
                              ? c.teal
                              : c.cardBg,

                          borderColor:
                            selected
                              ? c.teal
                              : c.cardBdr,
                        },
                      ]}
                    >
                      {selected && (
                        <FitnessIcon
                          name="check"
                          size={13}
                          color="#07130F"
                        />
                      )}

                      <Text
                        style={[
                          styles.genderText,
                          {
                            color: selected
                              ? '#07130F'
                              : c.text,
                          },
                        ]}
                      >
                        {gender}
                      </Text>
                    </ProfilePressable>

                    
                  );
                },
              )}
            </View>
          </ProfileReveal>

          {/* FITNESS FOCUS */}

          <ProfileReveal delay={140}>
            <SectionHeader
              eyebrow="PERSONALIZATION"
              title="Primary fitness focus"
              subtitle="Choose the goals that best describe what you want from FitTrack."
            />

            <View
              style={[
                styles.focusCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <View style={styles.focusGrid}>
                {FITNESS_FOCUS_OPTIONS.map(
                  (focus) => {
                    const selected =
                      profile.focus.includes(
                        focus,
                      );

                    return (
                      <ProfilePressable
                        key={focus}
                        label={`Toggle ${focus}`}
                        onPress={() =>
                          toggleFocus(focus)
                        }
                        style={[
                          styles.focusChip,
                          {
                            backgroundColor:
                              selected
                                ? c.tealDim
                                : c.surface,

                            borderColor:
                              selected
                                ? c.teal
                                : c.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.focusIndicator,
                            {
                              backgroundColor:
                                selected
                                  ? c.teal
                                  : c.border,
                            },
                          ]}
                        >
                          {selected && (
                            <FitnessIcon
                              name="check"
                              size={10}
                              color="#07130F"
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            styles.focusText,
                            {
                              color: selected
                                ? c.teal
                                : c.text,
                            },
                          ]}
                        >
                          {focus}
                        </Text>
                      </ProfilePressable>
                    );
                  },
                )}
              </View>

              <View
                style={[
                  styles.focusSummary,
                  {
                    borderTopColor:
                      c.border,
                  },
                ]}
              >
                <FitnessIcon
                  name="goal"
                  size={16}
                  color={c.teal}
                />

                <Text
                  style={[
                    styles.focusSummaryText,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {profile.focus.length}{' '}
                  {profile.focus.length === 1
                    ? 'focus area'
                    : 'focus areas'}{' '}
                  selected
                </Text>
              </View>
            </View>
          </ProfileReveal>

          {/* BIO */}

          <ProfileReveal delay={180}>
            <SectionHeader
              eyebrow="MOTIVATION"
              title="Bio & motivation"
              subtitle="Tell FitTrack what keeps you moving."
            />

            <View
              style={[
                styles.bioCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <View style={styles.bioTop}>
                <View
                  style={[
                    styles.bioIcon,
                    {
                      backgroundColor:
                        c.tealDim,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="spark"
                    size={19}
                    color={c.teal}
                  />
                </View>

                <View style={styles.bioHeading}>
                  <Text
                    style={[
                      styles.bioLabel,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    Your motivation
                  </Text>

                  <Text
                    style={[
                      styles.bioHint,
                      {
                        color: c.muted,
                      },
                    ]}
                  >
                    Keep it short and personal.
                  </Text>
                </View>
              </View>

              <TextInput
                value={profile.bio}
                onChangeText={(value) =>
                  updateField(
                    'bio',
                    value.slice(
                      0,
                      BIO_LIMIT,
                    ),
                  )
                }
                placeholder="What motivates you to keep training?"
                placeholderTextColor={
                  c.subtle
                }
                multiline
                maxLength={BIO_LIMIT}
                textAlignVertical="top"
                style={[
                  styles.bioInput,
                  {
                    color: c.text,
                    backgroundColor:
                      c.surface,
                    borderColor:
                      c.border,
                  },
                ]}
              />

              <View style={styles.bioFooter}>
                <Text
                  style={[
                    styles.bioTip,
                    {
                      color: c.subtle,
                    },
                  ]}
                >
                  Visible on your FitTrack profile
                </Text>

                <Text
                  style={[
                    styles.characterCount,
                    {
                      color:
                        bioCount >
                        BIO_LIMIT * 0.9
                          ? c.teal
                          : c.muted,
                    },
                  ]}
                >
                  {bioCount}/{BIO_LIMIT}
                </Text>
              </View>
            </View>
          </ProfileReveal>

          {/* PROFILE PREVIEW */}

          <ProfileReveal delay={220}>
            <SectionHeader
              eyebrow="PREVIEW"
              title="How you appear"
            />

            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <View
                style={[
                  styles.previewAvatar,
                  {
                    backgroundColor:
                      c.tealDim,
                    borderColor: c.teal,
                  },
                ]}
              >
                {profile.avatarUrl ? (
                <Image
                  source={{
                    uri:
                      profile.avatarUrl,
                  }}
                  style={
                    styles.previewAvatarImage
                  }
                  resizeMode="cover"
                />
              ) : (
                <Text
                  style={[
                    styles.previewInitials,
                    {
                      color:
                        c.teal,
                    },
                  ]}
                >
                  {initials}
                </Text>
              )}
              </View>

              <View style={styles.previewCopy}>
                <Text
                  style={[
                    styles.previewName,
                    {
                      color: c.text,
                    },
                  ]}
                >
                  {profile.fullName ||
                    'Your Name'}
                </Text>

                <Text
                  style={[
                    styles.previewUsername,
                    {
                      color: c.muted,
                    },
                  ]}
                >
                  {profile.username ||
                    '@username'}
                </Text>

                {!!profile.focus.length && (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.previewFocus,
                      {
                        color: c.teal,
                      },
                    ]}
                  >
                    {profile.focus.join(' • ')}
                  </Text>
                )}
              </View>

              <FitnessIcon
                name="check"
                size={18}
                color={c.teal}
              />
            </View>
          </ProfileReveal>

          {/* UNSAVED CHANGES */}

          {hasChanges && (
            <ProfileReveal delay={240}>
              <View
                style={[
                  styles.unsavedCard,
                  {
                    backgroundColor:
                      c.tealDim,
                    borderColor: c.teal,
                  },
                ]}
              >
                <View
                  style={[
                    styles.unsavedIcon,
                    {
                      backgroundColor:
                        c.teal,
                    },
                  ]}
                >
                  <FitnessIcon
                    name="activity"
                    size={17}
                    color="#07130F"
                  />
                </View>

                <View
                  style={styles.unsavedCopy}
                >
                  <Text
                    style={[
                      styles.unsavedTitle,
                      {
                        color: c.text,
                      },
                    ]}
                  >
                    Unsaved changes
                  </Text>

                  <Text
                    style={[
                      styles.unsavedText,
                      {
                        color: c.muted,
                      },
                    ]}
                  >
                    Save your profile before leaving
                    this screen.
                  </Text>
                </View>
              </View>
            </ProfileReveal>
          )}

          {/* ACTIONS */}

          <ProfileReveal delay={260}>
            <ProfilePressable
              label="Save profile changes"
              onPress={() => {
                if (!hasChanges || saving) {
                  return;
                }

                handleSave();
              }}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    hasChanges && !saving
                      ? c.teal
                      : c.surface,

                  borderColor:
                    hasChanges && !saving
                      ? c.teal
                      : c.border,

                  opacity:
                    hasChanges && !saving
                      ? 1
                      : 0.55,

                  shadowColor: c.teal,
                },
              ]}
            >
              <FitnessIcon
                name="check"
                size={19}
                color={
                  hasChanges && !saving
                    ? '#07130F'
                    : c.muted
                }
              />

              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color:
                      hasChanges && !saving
                        ? '#07130F'
                        : c.muted,
                  },
                ]}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Text>
            </ProfilePressable>

            <ProfilePressable
              label="Cancel profile editing"
              onPress={handleCancel}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                },
              ]}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: c.muted,
                  },
                ]}
              >
                Cancel
              </Text>
            </ProfilePressable>

            {profileExists && (
            <ProfilePressable
              label="Delete saved profile"
              onPress={handleDeleteProfile}
              style={[
                styles.cancelButton,
                {
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBdr,
                  opacity:
                    deleting || saving
                      ? 0.55
                      : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: '#ff6b6b',
                  },
                ]}
              >
                {deleting
                  ? 'Deleting...'
                  : 'Delete Profile'}
              </Text>
            </ProfilePressable>
          )}
          </ProfileReveal>
          <Text
            style={[
              styles.footerNote,
              {
                color: c.subtle,
              },
            ]}
          >
            Your profile information is saved
            to your FitTrack account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </M4Screen>
  );
}
/* -----------------------------------------------
   SMALL LOCAL COMPONENTS
------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const c = useM4Theme();

  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          styles.sectionEyebrow,
          {
            color: c.muted,
          },
        ]}
      >
        {eyebrow}
      </Text>

      <Text
        style={[
          styles.sectionTitle,
          {
            color: c.text,
          },
        ]}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={[
            styles.sectionSubtitle,
            {
              color: c.muted,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function FieldDivider() {
  const c = useM4Theme();

  return (
    <View
      style={[
        styles.fieldDivider,
        {
          backgroundColor:
            c.border,
        },
      ]}
    />
  );
}

type ProfileFieldProps = {
  label: string;

  value: string;

  placeholder: string;

  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad';

  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words'
    | 'characters';

  onChangeText: (
    value: string,
  ) => void;

  accessory?: ReactNode;
};

function ProfileField({
  label,
  value,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onChangeText,
  accessory,
}: ProfileFieldProps) {
  const c = useM4Theme();

  return (
    <View style={styles.field}>
      <View
        style={styles.fieldLabelRow}
      >
        <Text
          style={[
            styles.fieldLabel,
            {
              color:
                c.muted,
            },
          ]}
        >
          {label}
        </Text>

        {accessory}
      </View>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          c.subtle
        }
        keyboardType={
          keyboardType
        }
        autoCapitalize={
          autoCapitalize
        }
        autoCorrect={false}
        selectionColor={
          c.teal
        }
        style={[
          styles.input,
          {
            color:
              c.text,
          },
        ]}
      />
    </View>
  );
}


const styles = StyleSheet.create({

      dateDoneButton: {
        minHeight: 44,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
      },

      dateDoneButtonText: {
        color: '#07130F',
        fontSize: 13,
        fontWeight: '800',
      },

        datePickerField: {
        minHeight: 70,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      },

      datePickerCopy: {
        flex: 1,
      },

      datePickerValue: {
        marginTop: 7,
        fontSize: 14,
        fontWeight: '600',
      },

      datePickerIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
      },

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCopy: {
    flex: 1,
  },

  headerEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.25,
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },

  saveHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
  },

  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    marginBottom: 25,
  },

  heroGlow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    top: -130,
    right: -60,
  },

  avatarArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  avatarAnimationWrap: {
    width: 94,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarPulse: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
  width: '100%',
  height: '100%',
  borderRadius: 27,
  overflow: 'hidden',
},

previewAvatarImage: {
  width: '100%',
  height: '100%',
  borderRadius: 18,
},

  avatarText: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -1,
  },

  photoButton: {
    position: 'absolute',
    right: 3,
    bottom: 5,
    width: 31,
    height: 31,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCopy: {
    flex: 1,
  },

  heroName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  heroUsername: {
    marginTop: 3,
    fontSize: 11,
  },

  changePhotoButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  changePhotoText: {
    fontSize: 9,
    fontWeight: '800',
  },

  profileStatus: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  statusValue: {
    fontSize: 10,
    fontWeight: '800',
  },

  statusLabel: {
    marginTop: 1,
    fontSize: 8,
  },

  statusDivider: {
    width: 1,
    height: 26,
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    maxWidth: 340,
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
  },

  formCard: {
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  field: {
    paddingVertical: 14,
  },

  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 10,
  },

  fieldLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  input: {
    marginTop: 7,
    padding: 0,
    minHeight: 25,
    fontSize: 14,
    fontWeight: '600',
  },

  fieldDivider: {
    height:
      StyleSheet.hairlineWidth,
  },

  verifiedPill: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 25,
  },

  genderChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  genderText: {
    fontSize: 10,
    fontWeight: '800',
  },

  focusCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 25,
  },

  focusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  focusChip: {
    minHeight: 40,
    maxWidth: '100%',
    paddingHorizontal: 11,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  focusIndicator: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  focusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  focusSummary: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth:
      StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  focusSummaryText: {
    fontSize: 9,
    fontWeight: '600',
  },

  bioCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    marginBottom: 25,
  },

  bioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  bioIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bioHeading: {
    flex: 1,
  },

  bioLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  bioHint: {
    marginTop: 2,
    fontSize: 9,
  },

  bioInput: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 12,
    lineHeight: 18,
  },

  bioFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 12,
  },

  bioTip: {
    flex: 1,
    fontSize: 8,
  },

  characterCount: {
    fontSize: 9,
    fontWeight: '800',
  },

  previewCard: {
    minHeight: 84,
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },

  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewInitials: {
    fontSize: 16,
    fontWeight: '900',
  },

  previewCopy: {
    flex: 1,
  },

  previewName: {
    fontSize: 13,
    fontWeight: '800',
  },

  previewUsername: {
    marginTop: 2,
    fontSize: 9,
  },

  previewFocus: {
    marginTop: 5,
    fontSize: 8,
    fontWeight: '700',
  },

  unsavedCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  unsavedIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unsavedCopy: {
    flex: 1,
  },

  unsavedTitle: {
    fontSize: 11,
    fontWeight: '800',
  },

  unsavedText: {
    marginTop: 2,
    fontSize: 9,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },

  cancelButton: {
    minHeight: 46,
    marginTop: 9,
    borderWidth: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },

  footerNote: {
    maxWidth: 330,
    alignSelf: 'center',
    marginTop: 18,
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 13,
  },
});