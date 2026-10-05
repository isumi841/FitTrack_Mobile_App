import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SelectableOptionCardProps {
  title: string;
  description?: string;
  tag?: string;
  rightData?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: () => void;
  rightAction?: React.ReactNode;
}

export function SelectableOptionCard({
  title,
  description,
  tag,
  rightData,
  iconName,
  selected,
  onSelect,
  rightAction,
}: SelectableOptionCardProps) {
  const t = useTheme();
  const accent = t.secondaryTeal;
  const [scale] = React.useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
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
    <Animated.View style={{ transform: [{ scale }], width: '100%', marginBottom: 12 }}>
      <Pressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={[
          styles.card,
          {
            backgroundColor: selected ? t.tealDim : t.cardBg,
            borderColor: selected ? accent : t.cardBorder,
            shadowColor: selected ? accent : '#000',
            shadowOpacity: selected ? 0.15 : 0.05,
          },
        ]}>
        {selected && <View pointerEvents="none" style={[styles.selectedAccent, { backgroundColor: accent }]} />}
        <View style={styles.contentRow}>
          <View style={[styles.iconContainer, { backgroundColor: selected ? t.tealDim : t.surfaceElevated }]}>
            <Ionicons name={iconName} size={20} color={selected ? accent : t.textHeading} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: t.textHeading }]}>{title}</Text>
              {tag && (
                <View style={[styles.tagBadge, { backgroundColor: t.surface }]}>
                  <Text style={[styles.tagText, { color: accent }]}>{tag}</Text>
                </View>
              )}
            </View>
            {description && (
              <Text style={[styles.description, { color: t.muted }]}>{description}</Text>
            )}
          </View>
          {rightAction ? (
            rightAction
          ) : rightData ? (
            <Text style={[styles.rightData, { color: t.muted }]}>{rightData}</Text>
          ) : (
            <View
              style={[
                styles.radio,
                {
                  borderColor: selected ? accent : t.border,
                  backgroundColor: selected ? accent : 'transparent',
                },
              ]}>
              {selected && <Ionicons name="checkmark" size={12} color="#0A100C" />}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 2,
  },
  selectedAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    marginRight: 8,
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 12.5,
  },
  rightData: {
    fontSize: 12,
    fontWeight: '600',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
