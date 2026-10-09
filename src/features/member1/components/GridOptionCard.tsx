import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '@/features/member1/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface GridOptionCardProps {
  title: string;
  description: string;
  tag: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: () => void;
}

export function GridOptionCard({ title, description, tag, iconName, selected, onSelect }: GridOptionCardProps) {
  const t = useTheme();
  const [scale] = React.useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], width: '48%', marginBottom: 12 }}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={[
          styles.card,
          {
            backgroundColor: selected ? '#181C26' : '#101218', // Dark blue-grey
            borderColor: selected ? t.lime : '#242835',
            shadowColor: selected ? t.lime : '#000',
            shadowOpacity: selected ? 0.2 : 0.05,
          },
        ]}>
        {selected && <View pointerEvents="none" style={[styles.selectedAccent, { backgroundColor: t.lime }]} />}

        <View style={styles.topRow}>
          <View style={[styles.iconContainer, { backgroundColor: selected ? t.limeDim : t.surface }]}>
            <Ionicons name={iconName} size={20} color={selected ? t.lime : t.textHeading} />
          </View>
          {selected && (
            <View style={[styles.checkBadge, { backgroundColor: t.lime }]}>
              <Ionicons name="checkmark" size={10} color="#0A100C" />
            </View>
          )}
        </View>

        <Text style={[styles.title, { color: t.textHeading }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.description, { color: t.muted }]} numberOfLines={2}>{description}</Text>

        <View style={[styles.tagBadge, { backgroundColor: t.surface }]}>
          <Text style={[styles.tagText, { color: t.teal }]}>{tag}</Text>
        </View>

      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    height: 142,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 2,
  },
  selectedAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  description: {
    fontSize: 11.5,
    lineHeight: 14,
    marginBottom: 7,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
