import { useLayoutEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// A native responder-based track shared by reading position and brightness.
export default function Slider({ value, onChange, minimum = 0, maximum = 100, step = 1, label, disabled = false, testID = undefined }) {
  const track = useRef(null);
  const origin = useRef(0);
  const [width, setWidth] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(value);
  const latest = useRef({ value, onChange, minimum, maximum, step, disabled, width });
  useLayoutEffect(() => { latest.current = { value, onChange, minimum, maximum, step, disabled, width }; }, [value, onChange, minimum, maximum, step, disabled, width]);
  const clamp = (number, props) => Math.max(props.minimum, Math.min(props.maximum, Math.round((number - props.minimum) / props.step) * props.step + props.minimum));
  const move = (event, commit = false) => {
    const props = latest.current;
    if (props.disabled) return;
    const position = Math.max(0, Math.min(1, (event.nativeEvent.pageX - origin.current) / props.width));
    const next = clamp(props.minimum + (props.maximum - props.minimum) * position, props);
    setDragValue(next);
    if (commit) props.onChange(next);
  };
  // PanResponder.create stores these callbacks; refs are read only during gestures.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.disabled,
    onMoveShouldSetPanResponder: () => !latest.current.disabled,
    onPanResponderGrant: event => {
      setDragging(true);
      const pageX = event.nativeEvent.pageX;
      track.current?.measureInWindow(x => { origin.current = x; move({ nativeEvent: { pageX } }); });
    },
    onPanResponderMove: event => move(event),
    onPanResponderRelease: event => { move(event, true); setDragging(false); },
    onPanResponderTerminate: () => setDragging(false),
    onPanResponderTerminationRequest: () => false,
  }));
  const fraction = Math.max(0, Math.min(1, ((dragging ? dragValue : value) - minimum) / (maximum - minimum || 1)));
  return <View ref={track} testID={testID} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: minimum, max: maximum, now: value }} accessibilityState={{ disabled }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={event => {
    if (!disabled) onChange(clamp(value + (event.nativeEvent.actionName === 'increment' ? step : -step), latest.current));
  }} onLayout={event => { setWidth(event.nativeEvent.layout.width); track.current?.measureInWindow(x => { origin.current = x; }); }} style={[styles.touch, disabled && styles.disabled]} {...responder.panHandlers}>
    <View pointerEvents="none" style={styles.track}><View style={[styles.fill, { width: `${fraction * 100}%` }]} /></View>
    <View pointerEvents="none" style={[styles.thumb, { left: `${fraction * 100}%` }]}><View style={styles.center} /></View>
  </View>;
}
const styles = StyleSheet.create({
  touch: { flex: 1, minWidth: 60, height: 40, justifyContent: 'center', marginHorizontal: 10 },
  track: { height: 3, borderRadius: 2, backgroundColor: '#c5c5c5', overflow: 'hidden' }, fill: { height: 3, backgroundColor: colors.accent },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, marginLeft: -11, position: 'absolute', top: 9, alignItems: 'center', justifyContent: 'center', elevation: 2, boxShadow: '0px 1px 4px #00000055' },
  center: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }, disabled: { opacity: 0.45 },
});
