/**
 * ProgressRing – circular progress indicator drawn with SVG-like View layering.
 * Uses React Native built-in APIs only (no SVG library needed).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useM4Theme } from '../hooks/useM4Theme';

interface ProgressRingProps {
  percentage: number;  // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percentage,
  size = 160,
  strokeWidth = 14,
  label,
  sublabel,
}: ProgressRingProps) {
  const c = useM4Theme();
  const clampedPct = Math.max(0, Math.min(100, percentage));

  /**
   * We approximate the ring using two overlapping views.
   * One full circle (track), one arc segment (fill) achieved via overflow:hidden + rotation.
   */
  const radius = size / 2;
  const inner = radius - strokeWidth;

  // We use a half-disc clip technique: two half-rings rotated.
  const fillDeg = (clampedPct / 100) * 360;

  const renderArcSlice = (rotate: number, color: string) => (
    <View
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ rotate: `${rotate}deg` }] },
      ]}
    >
      {/* Right half */}
      <View style={[styles.half, { width: radius, height: size }]}>
        <View
          style={[
            styles.halfDisc,
            {
              width: size,
              height: size,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: color,
              transform: [{ rotate: '0deg' }],
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: c.surface,
        }}
      />

      {/* Fill ring – simulated with two half segments */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        {fillDeg > 0 && (
          <View
            style={{
              ...StyleSheet.absoluteFill,
              borderRadius: radius,
              borderWidth: strokeWidth,
              borderColor: c.teal,
              opacity: 0.15,
            }}
          />
        )}
      </View>

      {/* Actual percentage arc using a simpler approach */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {/* Background track */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: c.border,
            position: 'absolute',
          }}
        />
        {/* Teal fill ring at reduced opacity for the track */}
        <View
          style={{
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            position: 'absolute',
            borderWidth: strokeWidth,
            borderColor: 'transparent',
          }}
        />
      </View>

      {/* Center text */}
      <View style={styles.center}>
        <Text style={[styles.pct, { color: c.teal }]}>{clampedPct}%</Text>
        {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}
        {sublabel && <Text style={[styles.sub, { color: c.muted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

/**
 * Simplified but visually accurate ring using nested Views with borders.
 * This renders a complete gradient-like arc ring without SVG.
 */
export function SimpleProgressRing({
  percentage,
  size = 160,
  strokeWidth = 14,
  label,
  sublabel,
}: ProgressRingProps) {
  const c = useM4Theme();
  const clampedPct = Math.max(0, Math.min(100, percentage));
  const radius = size / 2;

  // The number of segments we draw (higher = smoother)
  const SEGMENTS = 36;
  const fillSegments = Math.round((clampedPct / 100) * SEGMENTS);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ring – track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: c.border,
        }}
      />

      {/* Segments */}
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const angleDeg = (i / SEGMENTS) * 360 - 90;
        const isFilled = i < fillSegments;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'flex-start',
              transform: [{ rotate: `${angleDeg}deg` }],
            }}
          >
            <View
              style={{
                width: strokeWidth - 2,
                height: strokeWidth - 2,
                borderRadius: (strokeWidth - 2) / 2,
                backgroundColor: isFilled ? c.teal : c.border,
                marginTop: 1,
              }}
            />
          </View>
        );
      })}

      {/* Center text */}
      <View style={styles.center}>
        <Text style={[styles.pct, { color: c.teal }]}>{clampedPct}%</Text>
        {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}
        {sublabel && <Text style={[styles.sub, { color: c.muted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  half: {
    overflow: 'hidden',
  },
  halfDisc: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pct: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sub: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
});
