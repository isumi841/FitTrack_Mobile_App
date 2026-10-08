import {
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useMember4Profile,
} from '@/features/member4/context/Member4ProfileContext';

import {
    useM4Theme,
} from '@/features/member4/hooks/useM4Theme';

type Props = {
  size?: number;
};

export function Member4Avatar({
  size = 44,
}: Props) {
  const c = useM4Theme();

  const {
    profile,
  } = useMember4Profile();

  const initials = (() => {
    const name =
      profile?.fullName?.trim();

    if (!name) {
      return 'FT';
    }

    const parts =
      name
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${parts[0][0]}${
      parts[
        parts.length - 1
      ][0]
    }`.toUpperCase();
  })();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius:
            size / 2,

          backgroundColor:
            c.tealDim,

          borderColor:
            c.teal,
        },
      ]}
    >
      {profile?.avatarUrl ? (
  <Image
    source={{
      uri: profile.avatarUrl,
    }}
    style={{
      width: '100%',
      height: '100%',
      borderRadius:
        size / 2,
    }}
    resizeMode="cover"
  />
) : (
  <Text style={[styles.initials, { color: c.teal, fontSize: size * 0.3 }]}>
    {initials}
  </Text>
)}
    </View>
  );
}

const styles =
  StyleSheet.create({
    avatar: {
      borderWidth: 1,
      overflow:
        'hidden',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    initials: {
      fontWeight:
        '800',
    },
  });