import { StyleSheet, View } from 'react-native';

import { NavigationIcon, type NavigationIconName } from '@/components/navigation/navigation-icon';

import { ProfileIcon, type ProfileIconName } from './ProfileIcon';

type FitnessGlyph =
  | 'clock'
  | 'calendar'
  | 'trend-up'
  | 'arrow-up-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'info'
  | 'activity'
  | 'flame'
  | 'filter'
  | 'mobility';

export type FitnessIconName = NavigationIconName | ProfileIconName | FitnessGlyph | 'strength' | 'cardio' | 'reminder' | 'chevron';

type FitnessIconProps = { name: FitnessIconName; color: string; size?: number };
type Point = [number, number];
type Segment = [Point, Point];

const STROKE = 1.8;
const paths: Record<FitnessGlyph, Segment[]> = {
  clock: [[[12, 6], [12, 12]], [[12, 12], [16, 14]]],
  calendar: [[[7, 2], [7, 6]], [[17, 2], [17, 6]], [[3, 9], [21, 9]]],
  'trend-up': [
    [[3, 17], [9, 11]], [[9, 11], [13, 15]], [[13, 15], [21, 6]],
    [[14, 6], [21, 6]], [[21, 6], [21, 13]],
  ],
  'arrow-up-right': [[[5, 19], [19, 5]], [[8, 5], [19, 5]], [[19, 5], [19, 16]]],
  'chevron-down': [[[5, 9], [12, 16]], [[12, 16], [19, 9]]],
  'chevron-up': [[[5, 15], [12, 8]], [[12, 8], [19, 15]]],
  info: [[[12, 11], [12, 17]]],
  activity: [
    [[2, 12], [6, 12]], [[6, 12], [9, 4]], [[9, 4], [14, 20]],
    [[14, 20], [17, 12]], [[17, 12], [22, 12]],
  ],
  flame: [],
  filter: [
    [[3, 5], [5, 5]], [[9, 5], [21, 5]], [[3, 12], [15, 12]],
    [[19, 12], [21, 12]], [[3, 19], [8, 19]], [[12, 19], [21, 19]],
  ],
  mobility: [
    [[12, 8], [12, 14]], [[5, 7], [12, 10]], [[12, 10], [19, 6]],
    [[12, 14], [6, 21]], [[12, 14], [19, 21]],
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

/** Decorative outlines using the same geometry as Profile and the bottom navigation. */
export function FitnessIcon({ name, color, size = 24 }: FitnessIconProps) {
  switch (name) {
    case 'strength':
      return <NavigationIcon name="workouts" color={color} size={size} />;
    case 'reminder': return <NavigationIcon name="bell" color={color} size={size} />;
    case 'chevron': return <NavigationIcon name="next" color={color} size={size} />;
    case 'guide': case 'timer': case 'bell': case 'close': case 'back': case 'next': case 'play': case 'bookmark': case 'refresh': case 'trash':
    case 'home':
    case 'workouts':
    case 'progress':
    case 'profile':
    case 'plus':
    case 'goal':
      return <NavigationIcon name={name} color={color} size={size} />;
    case 'badge':
    case 'history':
    case 'arrow-left':
    case 'check':
    case 'spark':
    case 'appearance':
      return <ProfileIcon name={name} color={color} size={size} />;
  }

  const glyph = name === 'cardio' ? 'activity' : name;
  const outline = { borderColor: color, borderWidth: STROKE };
  const fill = { backgroundColor: color };

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.canvas, { transform: [{ scale: size / 24 }] }]}>
        {(glyph === 'clock' || glyph === 'info') && <View style={[styles.circle, outline]} />}
        {glyph === 'info' && <View style={[styles.infoDot, fill]} />}
        {glyph === 'calendar' && (
          <>
            <View style={[styles.calendar, outline]} />
            {[7, 12, 17].map((left) => (
              <View key={left} style={[styles.calendarDot, { left }, fill]} />
            ))}
          </>
        )}
        {glyph === 'flame' && (
          <>
            <View style={[styles.flame, outline]} />
            <View style={[styles.flameInner, outline]} />
          </>
        )}
        {glyph === 'filter' && (
          <>
            <View style={[styles.filterKnob, styles.filterFirst, outline]} />
            <View style={[styles.filterKnob, styles.filterSecond, outline]} />
            <View style={[styles.filterKnob, styles.filterThird, outline]} />
          </>
        )}
        {glyph === 'mobility' && <View style={[styles.head, outline]} />}
        {paths[glyph].map(([from, to], index) => (
          <Line key={index} color={color} from={from} to={to} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  canvas: { width: 24, height: 24, flexShrink: 0 },
  circle: { position: 'absolute', left: 2.5, top: 2.5, width: 19, height: 19, borderRadius: 9.5 },
  infoDot: { position: 'absolute', left: 11, top: 6.5, width: 2, height: 2, borderRadius: 1 },
  calendar: { position: 'absolute', left: 3, top: 4, width: 18, height: 17, borderRadius: 3 },
  calendarDot: { position: 'absolute', top: 13, width: 2, height: 2, borderRadius: 1 },
  flame: {
    position: 'absolute', left: 5, top: 6, width: 14, height: 14,
    borderTopLeftRadius: 9, borderTopRightRadius: 1,
    borderBottomLeftRadius: 9, borderBottomRightRadius: 9,
    transform: [{ rotate: '-45deg' }],
  },
  flameInner: {
    position: 'absolute', left: 9.5, top: 13, width: 5, height: 6,
    borderTopLeftRadius: 4, borderTopRightRadius: 0,
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
    transform: [{ rotate: '-35deg' }],
  },
  filterKnob: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5 },
  filterFirst: { left: 4.5, top: 2.5 },
  filterSecond: { left: 14.5, top: 9.5 },
  filterThird: { left: 7.5, top: 16.5 },
  head: { position: 'absolute', left: 9.5, top: 1.5, width: 5, height: 5, borderRadius: 2.5 },
});
