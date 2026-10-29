import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

export default function Expandable({ expanded, children, style = null, testID = undefined }) {
  const [height, setHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(expanded ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: expanded ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [expanded, progress]);
  return <Animated.View testID={testID} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'} aria-hidden={!expanded} pointerEvents={expanded ? 'auto' : 'none'} style={{ height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }), opacity: progress, overflow: 'hidden' }}>
    <View onLayout={event => setHeight(event.nativeEvent.layout.height)} style={style}>{children}</View>
  </Animated.View>;
}
