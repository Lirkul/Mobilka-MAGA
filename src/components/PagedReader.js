import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { pageForPercent, pageFragments, percentForPage, readingWords } from '../utils/readingPages';
import ReaderLoading from './ReaderLoading';
import Icon from './Icon';
import { colors } from '../theme';

// Real pages measured using the same native Text/StyleSheet content as the reader.
// No browser text metrics, CSS columns, duplicated chapter or clipped text lines.
export default function PagedReader({ text, layoutKey, padding, controlsVisible, viewportRef, initialPercent, onPosition, onPagination, onViewportHeight, onToggleControls, renderContent, theme }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const words = useMemo(() => readingWords(text), [text]);
  return <View style={styles.root} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    onViewportHeight(height);
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    {size.width > 0 && size.height > 0 && <PageSession key={`${layoutKey}:${size.width}:${size.height}`} width={size.width} height={Math.max(1, size.height - (controlsVisible ? 44 : 0))} words={words} padding={padding} controlsVisible={controlsVisible} viewportRef={viewportRef} initialPercent={initialPercent} onPosition={onPosition} onPagination={onPagination} onToggleControls={onToggleControls} renderContent={renderContent} theme={theme} />}
  </View>;
}

function PageSession({ width, height, words, padding, controlsVisible, viewportRef, initialPercent, onPosition, onPagination, onToggleControls, renderContent, theme }) {
  const [state, setState] = useState({ pages: [], start: 0, low: 0, high: words.length, trial: words.length, ready: false, index: 0 });
  const [offset] = useState(() => new Animated.Value(0));
  const anchor = useRef(initialPercent);
  const pendingSeek = useRef(false);
  const latest = useRef({ state, onPosition, onPagination });
  const dragOrigin = useRef(0);
  const dragged = useRef(false);
  const lastDragEnd = useRef(0);
  useLayoutEffect(() => { latest.current = { state, onPosition, onPagination }; }, [state, onPosition, onPagination]);
  useEffect(() => () => offset.stopAnimation(), [offset]);

  function animateTo(index, report = true) {
    const current = latest.current;
    if (!current.state.ready) return;
    const next = Math.max(0, Math.min(current.state.pages.length - 1, index));
    offset.stopAnimation();
    Animated.timing(offset, { toValue: -next * width, duration: 210, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    setState(previous => ({ ...previous, index: next }));
    current.onPagination(next + 1, current.state.pages.length);
    if (report) current.onPosition(percentForPage(next, current.state.pages.length));
  }
  useImperativeHandle(viewportRef, () => ({ seek(percent) {
    anchor.current = percent;
    if (latest.current.state.ready) animateTo(pageForPercent(percent, latest.current.state.pages.length));
    else pendingSeek.current = true;
  } }));

  // Responder callbacks run only during gestures; they do not read refs in render.
  // eslint-disable-next-line react-hooks/refs
  const [swipe] = useState(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => { dragged.current = false; return false; },
    onMoveShouldSetPanResponderCapture: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10) dragged.current = true;
      return latest.current.state.ready && Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3;
    },
    onPanResponderGrant: () => { dragged.current = true; offset.stopAnimation(value => { dragOrigin.current = value; }); },
    onPanResponderMove: (_event, gesture) => {
      const count = latest.current.state.pages.length;
      offset.setValue(Math.max(-(count - 1) * width, Math.min(0, dragOrigin.current + gesture.dx)));
    },
    onPanResponderRelease: (_event, gesture) => {
      lastDragEnd.current = Date.now();
      const turn = Math.abs(gesture.dx) > Math.min(80, width * 0.18) || (Math.abs(gesture.dx) > 15 && Math.abs(gesture.vx) > 0.45);
      animateTo(latest.current.state.index + (turn ? gesture.dx < 0 ? 1 : -1 : 0), turn);
    },
    onPanResponderTerminate: () => animateTo(latest.current.state.index, false),
    onPanResponderTerminationRequest: () => false,
  }));

  function measured(measuredHeight, probeStart, probeTrial) {
    const current = latest.current.state;
    if (current.ready || current.start !== probeStart || current.trial !== probeTrial) return;
    const fits = measuredHeight <= height - 16 + 0.5;
    const low = fits ? current.trial : current.low, high = fits ? current.high : current.trial - 1;
    if (low < high) { setState({ ...current, low, high, trial: Math.ceil((low + high) / 2) }); return; }
    const end = Math.min(words.length, current.start + Math.max(1, low));
    const pages = [...current.pages, { start: current.start, end }];
    if (end < words.length) { setState({ pages, start: end, low: 0, high: words.length - end, trial: words.length - end, ready: false, index: 0 }); return; }
    const index = pageForPercent(anchor.current, pages.length);
    offset.setValue(-index * width);
    setState({ ...current, pages, ready: true, index });
    onPagination(index + 1, pages.length);
    if (pendingSeek.current) onPosition(percentForPage(index, pages.length));
  }

  return <>
    <View testID="reader-pager" style={[styles.viewport, { width, height }]} {...swipe.panHandlers}>
      {/* The disabled native scroll host reserves touch gestures for the pager. */}
      <ScrollView scrollEnabled={false} contentContainerStyle={{ height }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      {!state.ready ? <ReaderLoading theme={theme} /> : <Animated.View style={{ width: width * state.pages.length, height, flexDirection: 'row', transform: [{ translateX: offset }] }}>
        {state.pages.map((range, index) => <View key={range.start} aria-hidden={index !== state.index} accessibilityElementsHidden={index !== state.index} importantForAccessibility={index === state.index ? 'auto' : 'no-hide-descendants'} style={{ width, height, paddingHorizontal: padding }}>
          <Pressable accessible={false} onPress={() => { if (!dragged.current && Date.now() - lastDragEnd.current > 350) onToggleControls(); }} style={styles.page}>
            <View testID={index === state.index ? 'reader-active-page-content' : undefined}>{renderContent(pageFragments(words, range.start, range.end), index === 0)}</View>
          </Pressable>
        </View>)}
      </Animated.View>}
      {!state.ready && <View key={`${state.start}:${state.trial}`} pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.probe, { width, paddingHorizontal: padding }]} onLayout={event => measured(event.nativeEvent.layout.height, state.start, state.trial)}>
        {renderContent(pageFragments(words, state.start, state.start + state.trial), state.start === 0)}
      </View>}
      </ScrollView>
    </View>
    {controlsVisible && <View style={styles.turns}>
      <Pressable accessibilityRole="button" accessibilityLabel="Предыдущая страница" disabled={!state.ready || state.index === 0} onPress={() => animateTo(state.index - 1)} style={[styles.turn, (!state.ready || state.index === 0) && styles.disabled]}><Icon name="left" size={22} color={colors.accent} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Следующая страница" disabled={!state.ready || state.index === state.pages.length - 1} onPress={() => animateTo(state.index + 1)} style={[styles.turn, (!state.ready || state.index === state.pages.length - 1) && styles.disabled]}><Icon name="right" size={22} color={colors.accent} /></Pressable>
    </View>}
  </>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, viewport: { overflow: 'hidden' }, page: { flex: 1 }, probe: { position: 'absolute', top: 0, left: 0, opacity: 0 },
  turns: { height: 44, flexDirection: 'row' }, turn: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.25 },
});
