import { memo, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { NAV_COLORS } from '@/components/navigation/navigation-theme';
import { useM4Theme } from '../hooks/useM4Theme';

const RING_SEGMENTS = 40;
const CHART_HEIGHT = 140;

export interface DashboardRingProps {
  percentage: number;
  size?: number;
  label?: string;
}

export interface DashboardChartBar {
  id: string;
  label: string;
  fullLabel: string;
  value: number;
}

export interface DashboardChartProps {
  bars: DashboardChartBar[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  unit: string;
  color?: string;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** A segmented ring for the charcoal summary card, with one animated layer. */
export const DashboardRing = memo(function DashboardRing({
  percentage,
  size = 152,
  label = 'of your goal',
}: DashboardRingProps) {
  const value = Math.min(100, nonNegative(percentage));
  const diameter = Number.isFinite(size) ? Math.max(100, size) : 152;
  const filledSegments = Math.round((value / 100) * RING_SEGMENTS);
  const reduceMotion = useReducedMotion();
  const entrance = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    entrance.set(withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    }));
  }, [entrance]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.get(),
    transform: [{ scale: 0.92 + entrance.get() * 0.08 }],
  }));

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value, text: `${Math.round(value)} percent` }}
      style={[styles.ring, { width: diameter, height: diameter }, animatedStyle]}>
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}>
        {Array.from({ length: RING_SEGMENTS }, (_, index) => (
          <View
            key={index}
            style={[styles.segmentOrbit, { transform: [{ rotate: `${index * 9}deg` }] }]}>
            <View
              style={[
                styles.segment,
                {
                  width: diameter * 0.027,
                  height: diameter * 0.084,
                  backgroundColor: index < filledSegments ? NAV_COLORS.accent : NAV_COLORS.border,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={[styles.ringCenter, { maxWidth: diameter * 0.7 }]}>
        <Text style={[styles.ringValue, { fontSize: diameter * 0.225 }]}>
          {Math.round(value)}<Text style={styles.percentSign}>%</Text>
        </Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
});

interface ChartColumnProps {
  bar: DashboardChartBar;
  ceiling: number;
  selected: boolean;
  onSelect: (id: string) => void;
  unit: string;
  color: string;
  compact: boolean;
}

const ChartColumn = memo(function ChartColumn({
  bar, ceiling, selected, onSelect, unit, color, compact,
}: ChartColumnProps) {
  const c = useM4Theme();
  const value = nonNegative(bar.value);
  const targetHeight = Math.max(3, (value / ceiling) * CHART_HEIGHT);
  const reduceMotion = useReducedMotion();
  const barHeight = useSharedValue(reduceMotion ? targetHeight : 3);

  useEffect(() => {
    barHeight.set(withTiming(targetHeight, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    }));
  }, [barHeight, targetHeight]);

  const animatedStyle = useAnimatedStyle(() => ({ height: barHeight.get() }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${bar.fullLabel}: ${value.toLocaleString()} ${unit}`}
      accessibilityHint="Shows the summary for this period"
      accessibilityState={{ selected }}
      onPress={() => onSelect(bar.id)}
      hitSlop={compact ? { left: 6, right: 6 } : undefined}
      style={({ pressed }) => [styles.column, pressed && styles.pressed]}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: value === 0 ? c.border : color,
              opacity: selected || value === 0 ? 1 : 0.46,
            },
            animatedStyle,
          ]}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.axisLabel,
          { color: selected ? c.text : c.muted },
          selected && styles.selectedLabel,
        ]}>
        {bar.label}
      </Text>
      <View style={[styles.selectionDot, { backgroundColor: selected ? color : 'transparent' }]} />
    </Pressable>
  );
});

/** A selectable chart with roomy month columns and a compact seven-day view. */
export function DashboardChart({ bars, selectedId, onSelect, unit, color }: DashboardChartProps) {
  const c = useM4Theme();
  const [viewportWidth, setViewportWidth] = useState(0);
  const maximum = Math.max(1, ...bars.map((bar) => nonNegative(bar.value)));
  const magnitude = 10 ** Math.floor(Math.log10(maximum));
  const ceiling = Math.ceil(maximum / magnitude) * magnitude;
  const compact = bars.length <= 7;
  const minimumColumnWidth = compact ? 32 : 48;
  const chartWidth = Math.max(viewportWidth, bars.length * minimumColumnWidth);
  const chartColor = color ?? c.teal;

  if (bars.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: c.surface }]}>
        <Text style={[styles.emptyText, { color: c.muted }]}>Activity will appear here.</Text>
      </View>
    );
  }

  return (
    <View onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}>
      <View style={styles.scaleRow}>
        <Text style={[styles.scaleLabel, { color: c.subtle }]}>0</Text>
        <Text style={[styles.scaleLabel, { color: c.subtle }]}>
          {ceiling.toLocaleString()} {unit}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={!compact}
        alwaysBounceHorizontal={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.plot, { width: chartWidth }]}>
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.grid}>
            {[0, 0.5, 1].map((fraction) => (
              <View
                key={fraction}
                style={[styles.gridLine, { top: fraction * CHART_HEIGHT, backgroundColor: c.border }]}
              />
            ))}
          </View>
          {bars.map((bar) => (
            <ChartColumn
              key={bar.id}
              bar={bar}
              ceiling={ceiling}
              selected={bar.id === selectedId}
              onSelect={onSelect}
              unit={unit}
              color={chartColor}
              compact={compact}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  segmentOrbit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  segment: {
    marginTop: 2,
    borderRadius: 4,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    color: NAV_COLORS.text,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  percentSign: {
    fontSize: 18,
    color: NAV_COLORS.muted,
    fontWeight: '600',
  },
  ringLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: NAV_COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  scaleLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    paddingBottom: 4,
  },
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  pressed: {
    opacity: 0.72,
  },
  barTrack: {
    height: CHART_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '68%',
    maxWidth: 32,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  axisLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  selectedLabel: {
    fontWeight: '800',
  },
  selectionDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    marginTop: 5,
  },
  emptyChart: {
    minHeight: CHART_HEIGHT,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
