/**
 * WeeklyActivityChart – bar chart for weekly/monthly/yearly activity.
 * Pure React Native, no chart library.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DailyActivityBar } from '../types';
import { useM4Theme } from '../hooks/useM4Theme';

interface WeeklyActivityChartProps {
  bars: DailyActivityBar[];
  onBarPress?: (bar: DailyActivityBar, index: number) => void;
  selectedIndex?: number;
  maxHeight?: number;
}

export function WeeklyActivityChart({
  bars,
  onBarPress,
  selectedIndex,
  maxHeight = 80,
}: WeeklyActivityChartProps) {
  const c = useM4Theme();
  const maxMinutes = Math.max(...bars.map((b) => b.minutes), 1);

  return (
    <View style={styles.container}>
      {bars.map((bar, i) => {
        const heightPct = bar.minutes > 0 ? (bar.minutes / maxMinutes) * maxHeight : 4;
        const isSelected = selectedIndex !== undefined ? i === selectedIndex : !!bar.isSelected;

        return (
          <Pressable
            key={i}
            onPress={() => onBarPress?.(bar, i)}
            style={styles.barWrapper}
            accessibilityRole="button"
            accessibilityLabel={`${bar.day}: ${bar.minutes} minutes`}
          >
            {/* Tooltip above selected bar */}
            {isSelected && bar.minutes > 0 && (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor: c.teal },
                ]}
              >
                <Text style={styles.tooltipText}>{bar.minutes}m</Text>
                <View style={[styles.tooltipArrow, { borderTopColor: c.teal }]} />
              </View>
            )}

            {/* Bar track */}
            <View style={[styles.track, { height: maxHeight, backgroundColor: c.border }]}>
              {/* Fill */}
              <View
                style={[
                  styles.fill,
                  {
                    height: heightPct,
                    backgroundColor: isSelected ? c.teal : c.tealDim,
                    borderColor: isSelected ? c.teal : 'transparent',
                  },
                ]}
              />
            </View>

            {/* Day label */}
            <Text
              style={[
                styles.dayLabel,
                { color: isSelected ? c.teal : c.muted },
              ]}
            >
              {bar.day}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingTop: 32,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  track: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
    borderWidth: 1,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tooltip: {
    position: 'absolute',
    top: -28,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
