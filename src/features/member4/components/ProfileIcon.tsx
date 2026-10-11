import { StyleSheet, View } from 'react-native';

export type ProfileIconName = 'badge' | 'history' | 'arrow-left' | 'check' | 'spark' | 'appearance';

type Point = [number, number];
type Segment = [Point, Point];
type ProfileIconProps = { name: ProfileIconName; color: string; size?: number };

const STROKE = 1.8;
const paths: Record<Exclude<ProfileIconName, 'appearance'>, Segment[]> = {
  badge: [
    [[7, 14], [6, 22]], [[6, 22], [12, 19]], [[12, 19], [18, 22]], [[18, 22], [17, 14]],
    [[12, 5.5], [12, 11.5]], [[9, 8.5], [15, 8.5]],
  ],
  history: [
    [[3, 3], [3, 8]], [[3, 8], [8, 8]], [[12, 7], [12, 12]], [[12, 12], [15.5, 14]],
  ],
  'arrow-left': [
    [[20, 12], [4, 12]], [[4, 12], [11, 5]], [[4, 12], [11, 19]],
  ],
  check: [[[5, 12], [10, 17]], [[10, 17], [19, 7]]],
  spark: [
    [[14, 2], [4, 14]], [[4, 14], [11, 14]], [[11, 14], [10, 22]],
    [[10, 22], [20, 10]], [[20, 10], [13, 10]], [[13, 10], [14, 2]],
  ],
};

function Line({ color, from, to }: { color: string; from: Point; to: Point }) {
  const width = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);

  return (
    <View
      style={{
        position: 'absolute',
        left: (from[0] + to[0] - width) / 2,
        top: (from[1] + to[1] - STROKE) / 2,
        width,
        height: STROKE,
        borderRadius: STROKE / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

/** Decorative outlines matching the navigation icons without a font or SVG dependency. */
export function ProfileIcon({ name, color, size = 24 }: ProfileIconProps) {
  const outline = { borderColor: color, borderWidth: STROKE };

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.canvas, { transform: [{ scale: size / 24 }] }]}>
        {name === 'badge' && <View style={[styles.medal, outline]} />}
        {name === 'history' && (
          <View style={[styles.circle, outline, styles.history]} />
        )}
        {name === 'appearance' ? (
          <View style={[styles.circle, outline, styles.clipped]}>
            <View style={[styles.half, { backgroundColor: color }]} />
          </View>
        ) : (
          paths[name].map(([from, to], index) => (
            <Line key={index} color={color} from={from} to={to} />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  canvas: { width: 24, height: 24, flexShrink: 0 },
  circle: { position: 'absolute', left: 3, top: 3, width: 18, height: 18, borderRadius: 9 },
  medal: { position: 'absolute', left: 5, top: 1.5, width: 14, height: 14, borderRadius: 7 },
  history: { borderLeftColor: 'transparent', transform: [{ rotate: '20deg' }] },
  clipped: { overflow: 'hidden' },
  half: { position: 'absolute', left: '50%', top: 0, bottom: 0, right: 0 },
});
