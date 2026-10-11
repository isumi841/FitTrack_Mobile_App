import { Children, useState, type ReactNode } from 'react';
import { View } from 'react-native';

export function AdminCardGrid({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)}
    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, alignItems: 'stretch' }}>
    {Children.map(children, child => child && <View style={{ width: width >= 620 ? (width - 18) / 2 : '100%' }}>{child}</View>)}
  </View>;
}
