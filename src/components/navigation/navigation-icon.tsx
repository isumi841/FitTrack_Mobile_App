import Svg, { Circle, Path } from 'react-native-svg';

const paths = {
  home: 'M3 10 12 3 21 10 M5 9v12h5v-7h4v7h5V9',
  profile: 'M20 21v-2a8 8 0 0 0-16 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  workouts: 'M3 8v8 M6 5v14 M6 12h12 M18 5v14 M21 8v8',
  guide: 'M12 6C8 3 4 4 3 5v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-3-2-6-1-9 1Zm0 0v14',
  timer: 'M9 2h6 M12 2v3 M18 6l2-2 M12 9v5l3 2 M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  bell: 'M5 17l2-3V9a5 5 0 0 1 10 0v5l2 3H5Zm5 4h4',
  progress: 'M5 20v-6 M12 20V9 M19 20V4',
  goal: 'M12 12l4-4',
  plus: 'M12 5v14 M5 12h14',
  close: 'M6 6l12 12 M18 6 6 18',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  next: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4L19 6',
  play: 'm8 5 11 7-11 7Z',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6.1 7a7 7 0 0 1 11.5-1L20 9 M4 15l2.4 3A7 7 0 0 0 17.9 17',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
} as const;

export type NavigationIconName = keyof typeof paths;
export function NavigationIcon({ name, color, size = 23 }: { name: NavigationIconName; color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d={paths[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    {name === 'timer' && <Circle cx={12} cy={14} r={0.8} fill={color} />}
    {name === 'goal' && <>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
      <Circle cx={12} cy={12} r={1.2} fill={color} />
    </>}
  </Svg>;
}
