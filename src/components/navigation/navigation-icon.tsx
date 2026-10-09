import { StyleSheet, View } from 'react-native';

export type NavigationIconName =
  | 'home'
  | 'workouts'
  | 'progress'
  | 'profile'
  | 'plus'
  | 'goal'
  | 'reminder'
  | 'chevron';

type NavigationIconProps = {
  name: NavigationIconName;
  color: string;
  size?: number;
};

const STROKE = 1.8;

function Line({
  color,
  from,
  to,
}: {
  color: string;
  from: [number, number];
  to: [number, number];
}) {
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

/** A small, shared icon set that renders consistently without a native font or SVG dependency. */
export function NavigationIcon({ name, color, size = 24 }: NavigationIconProps) {
  const outline = { borderColor: color, borderWidth: STROKE };
  const fill = { backgroundColor: color };
  let glyph;

  switch (name) {
    case 'home':
      glyph = (
        <>
          <View style={[styles.homeBody, outline]} />
          <View style={[styles.homeDoor, outline]} />
          <Line color={color} from={[2.5, 10]} to={[12, 2.5]} />
          <Line color={color} from={[12, 2.5]} to={[21.5, 10]} />
        </>
      );
      break;
    case 'workouts':
      glyph = (
        <>
          <Line color={color} from={[8, 12]} to={[16, 12]} />
          <View style={[styles.weight, styles.weightLeft, outline]} />
          <View style={[styles.weight, styles.weightRight, outline]} />
          <Line color={color} from={[2, 9]} to={[2, 15]} />
          <Line color={color} from={[22, 9]} to={[22, 15]} />
          <Line color={color} from={[2, 12]} to={[5, 12]} />
          <Line color={color} from={[19, 12]} to={[22, 12]} />
        </>
      );
      break;
    case 'progress':
      glyph = (
        <>
          <View style={[styles.bar, styles.barFirst, fill]} />
          <View style={[styles.bar, styles.barSecond, fill]} />
          <View style={[styles.bar, styles.barThird, fill]} />
        </>
      );
      break;
    case 'profile':
      glyph = (
        <>
          <View style={[styles.profileHead, outline]} />
          <View style={[styles.profileBody, outline]} />
        </>
      );
      break;
    case 'plus':
      glyph = (
        <>
          <Line color={color} from={[5, 12]} to={[19, 12]} />
          <Line color={color} from={[12, 5]} to={[12, 19]} />
        </>
      );
      break;
    case 'goal':
      glyph = (
        <>
          <View style={[styles.targetOuter, outline]} />
          <View style={[styles.targetInner, outline]} />
          <View style={[styles.targetCenter, fill]} />
        </>
      );
      break;
    case 'reminder':
      glyph = (
        <>
          <View style={[styles.bell, outline]} />
          <Line color={color} from={[12, 3]} to={[12, 5]} />
          <Line color={color} from={[4, 18]} to={[20, 18]} />
          <View style={[styles.bellClapper, fill]} />
        </>
      );
      break;
    case 'chevron':
      glyph = (
        <>
          <Line color={color} from={[9, 6]} to={[15, 12]} />
          <Line color={color} from={[15, 12]} to={[9, 18]} />
        </>
      );
      break;
  }

  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.canvas, { transform: [{ scale: size / 24 }] }]}>{glyph}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  canvas: {
    width: 24,
    height: 24,
    flexShrink: 0,
  },
  homeBody: {
    position: 'absolute',
    left: 5,
    top: 9,
    width: 14,
    height: 12,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  homeDoor: {
    position: 'absolute',
    left: 9.5,
    top: 14,
    width: 5,
    height: 7,
    borderBottomWidth: 0,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  weight: {
    position: 'absolute',
    top: 5,
    width: 4,
    height: 14,
    borderRadius: 1.2,
  },
  weightLeft: { left: 5 },
  weightRight: { left: 15 },
  bar: {
    position: 'absolute',
    bottom: 3,
    width: 3.5,
    borderRadius: 1.5,
  },
  barFirst: { left: 4, height: 7 },
  barSecond: { left: 10.25, height: 12 },
  barThird: { left: 16.5, height: 18 },
  profileHead: {
    position: 'absolute',
    left: 8,
    top: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileBody: {
    position: 'absolute',
    left: 4.5,
    top: 14,
    width: 15,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 0,
  },
  targetOuter: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  targetInner: {
    position: 'absolute',
    left: 7,
    top: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  targetCenter: {
    position: 'absolute',
    left: 10.5,
    top: 10.5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  bell: {
    position: 'absolute',
    left: 5.5,
    top: 5,
    width: 13,
    height: 13,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomWidth: 0,
  },
  bellClapper: {
    position: 'absolute',
    left: 10,
    top: 20,
    width: 4,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
