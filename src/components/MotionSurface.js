import { useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

export default function MotionSurface({ children, style, visible = true, motion = 'sheet', testID = undefined }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: visible ? 1 : 0, duration: visible ? 220 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    return () => animation.stop();
  }, [progress, visible]);
  const transform = motion === 'left' || motion === 'right'
    ? [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [motion === 'left' ? -320 : 320, 0] }) }]
    : motion === 'dialog' ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }]
      : [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height || 480, 0] }) }];
  return <Animated.View onLayout={event => setHeight(event.nativeEvent.layout.height)} testID={testID} style={[style, { opacity: progress, transform }]}>{children}</Animated.View>;
}
