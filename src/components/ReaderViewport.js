import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, ScrollView, StyleSheet, View } from 'react-native';

// CSS touch-action keeps Chrome's back gesture from taking a reader swipe.
const webGestures = /** @type {import('react-native').ViewStyle & { touchAction: string }} */ ({ touchAction: 'pan-y' });

// One text surface owns both free scrolling and screen-sized page turns.
export default function ReaderViewport({ children, previousContent, nextContent, canGoPrevious, canGoNext, onChapterBoundary, viewportRef, initialPercent, onPosition, onPagination, onViewportHeight, onToggleControls, onInteractionStart, padding, lineHeight }) {
  const scroll = useRef(null);
  const surface = useRef(null);
  const previous = useRef(null);
  const next = useRef(null);
  const [width, setWidth] = useState(0);
  const [edges, setEdges] = useState({ start: initialPercent <= 0, end: initialPercent >= 100 });
  const [shift] = useState(() => new Animated.Value(0));
  const busy = useRef(false);
  const geometry = useRef({ width: 0, height: 0, content: 0, offset: 0, ready: false });
  const anchor = useRef(initialPercent);
  const callbacks = useRef({ onPosition, onPagination, onViewportHeight, onToggleControls, onInteractionStart, onChapterBoundary, canGoPrevious, canGoNext, lineHeight });
  const touch = useRef(null);
  const scrolling = useRef(false);
  const lastScroll = useRef(0);
  const lastTap = useRef(0);
  const suppressClick = useRef(0);
  useLayoutEffect(() => { callbacks.current = { onPosition, onPagination, onViewportHeight, onToggleControls, onInteractionStart, onChapterBoundary, canGoPrevious, canGoNext, lineHeight }; }, [onPosition, onPagination, onViewportHeight, onToggleControls, onInteractionStart, onChapterBoundary, canGoPrevious, canGoNext, lineHeight]);
  useEffect(() => () => shift.stopAnimation(), [shift]);

  function updateEdges() {
    const g = geometry.current;
    const start = g.offset <= 1, end = g.offset >= g.content - g.height - 1;
    setEdges(old => old.start === start && old.end === end ? old : { start, end });
  }

  function syncPreviews() {
    const g = geometry.current, step = Math.max(1, g.height - callbacks.current.lineHeight);
    previous.current?.scrollTo({ y: g.offset <= 1 && callbacks.current.canGoPrevious ? 1e7 : Math.max(0, g.offset - step), animated: false });
    next.current?.scrollTo({ y: g.offset >= g.content - g.height - 1 && callbacks.current.canGoNext ? 0 : Math.min(Math.max(0, g.content - g.height), g.offset + step), animated: false });
  }

  function report() {
    const g = geometry.current;
    const distance = Math.max(0, g.content - g.height);
    const step = Math.max(1, g.height - callbacks.current.lineHeight);
    const count = Math.max(1, Math.ceil(distance / step) + 1);
    const number = g.offset >= distance ? count : Math.min(count, Math.floor(g.offset / step) + 1);
    callbacks.current.onPagination(number, count);
  }

  function moveTo(offset, animated = false) {
    const g = geometry.current;
    g.offset = Math.max(0, Math.min(Math.max(0, g.content - g.height), offset));
    scroll.current?.scrollTo({ y: g.offset, animated });
    report();
    if (!busy.current) { updateEdges(); syncPreviews(); }
  }

  function restore() {
    const g = geometry.current;
    if (!g.height || !g.content) return;
    g.ready = true;
    moveTo(Math.max(0, g.content - g.height) * anchor.current / 100);
  }

  function turnPage(direction) {
    const g = geometry.current;
    if (!g.ready || busy.current) return;
    callbacks.current.onInteractionStart();
    const distance = Math.max(0, g.content - g.height);
    const boundary = direction > 0 ? g.offset >= distance - 1 : g.offset <= 1;
    const canCross = direction > 0 ? callbacks.current.canGoNext : callbacks.current.canGoPrevious;
    if (boundary && !canCross) { settle(0); return; }
    const target = Math.max(0, Math.min(distance, g.offset + direction * Math.max(1, g.height - callbacks.current.lineHeight)));
    syncPreviews();
    busy.current = true;
    Animated.timing(shift, { toValue: -direction * g.width, duration: 190, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (!finished) { busy.current = false; return; }
      if (boundary) {
        callbacks.current.onPosition(direction > 0 ? 100 : 0);
        callbacks.current.onChapterBoundary(direction);
        return;
      }
      // Recenter on the same text shown by the incoming preview, with no vertical animation.
      moveTo(target);
      requestAnimationFrame(() => {
        shift.setValue(0);
        busy.current = false;
        updateEdges(); syncPreviews();
      });
    });
  }

  function settle(value) {
    Animated.timing(shift, { toValue: value, duration: 150, useNativeDriver: Platform.OS !== 'web' }).start();
  }

  useImperativeHandle(viewportRef, () => ({
    seek(percent) {
      anchor.current = Math.max(0, Math.min(100, percent));
      restore();
      callbacks.current.onPosition(anchor.current);
    },
    turnPage,
  }));

  // Capture horizontal drags only; vertical drags stay with the native ScrollView.
  const [swipe] = useState(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => { suppressClick.current = 0; return false; },
    onMoveShouldSetPanResponderCapture: (_event, gesture) => !busy.current && gesture.numberActiveTouches === 1 && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
    onPanResponderGrant: () => {
      if (touch.current) touch.current.moved = true;
      shift.stopAnimation(); syncPreviews(); callbacks.current.onInteractionStart();
    },
    onPanResponderMove: (_event, gesture) => {
      const g = geometry.current;
      const blocked = gesture.dx > 0 ? g.offset <= 1 && !callbacks.current.canGoPrevious : g.offset >= g.content - g.height - 1 && !callbacks.current.canGoNext;
      shift.setValue(Math.max(-g.width, Math.min(g.width, gesture.dx * (blocked ? 0.2 : 1))));
    },
    onPanResponderRelease: (_event, gesture) => {
      suppressClick.current = Date.now() + 350;
      if (Math.abs(gesture.dx) >= 40 || (Math.abs(gesture.dx) > 15 && Math.abs(gesture.vx) > 0.45)) turnPage(gesture.dx < 0 ? 1 : -1);
      else settle(0);
    },
    onPanResponderTerminate: () => { touch.current = null; suppressClick.current = Date.now() + 350; settle(0); },
    onPanResponderTerminationRequest: () => false,
  }));

  function tapAt(x, y) {
    const g = geometry.current;
    const now = Date.now();
    if (scrolling.current || now - lastScroll.current < 150 || now - lastTap.current < 250) return;
    if (x < g.width * 0.25 || x > g.width * 0.75 || y < g.height * 0.15 || y > g.height * 0.85) return;
    lastTap.current = now;
    callbacks.current.onToggleControls();
  }

  return <View ref={surface} style={[styles.root, Platform.OS === 'web' && webGestures]} {...swipe.panHandlers} onLayout={event => {
    geometry.current.width = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  }} onTouchStart={event => {
    const { pageX, pageY, touches } = event.nativeEvent;
    touch.current = { x: pageX, y: pageY, time: Date.now(), moved: touches.length !== 1 || scrolling.current };
  }} onTouchMove={event => {
    const start = touch.current;
    if (start && (Math.abs(event.nativeEvent.pageX - start.x) > 10 || Math.abs(event.nativeEvent.pageY - start.y) > 10 || event.nativeEvent.touches.length > 1)) {
      start.moved = true; callbacks.current.onInteractionStart();
    }
  }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={() => {
    const start = touch.current;
    touch.current = null;
    if (Platform.OS === 'web') {
      suppressClick.current = Date.now() + 350;
    }
    if (!start || start.moved || Date.now() - start.time > 350) return;
    // Measure the surface, rather than a paragraph's local touch coordinates.
    surface.current?.measureInWindow((pageX, pageY) => tapAt(start.x - pageX, start.y - pageY));
  }} {...(Platform.OS === 'web' ? { onClick: event => {
    if (Date.now() < suppressClick.current) return;
    const { pageX, pageY } = event.nativeEvent;
    surface.current?.measureInWindow((x, y) => tapAt(pageX - x, pageY - y));
  }, onWheel: () => callbacks.current.onInteractionStart() } : {})}>
    {width > 0 && <Animated.View testID="reader-page-track" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: width * 3, flexDirection: 'row', transform: [{ translateX: Animated.add(shift, -width) }] }}>
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: '100%', flexShrink: 0 }}>
    <ScrollView ref={previous} scrollEnabled={false} style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: padding }]} onContentSizeChange={syncPreviews}>
      {edges.start && previousContent ? previousContent : children}
    </ScrollView>
    </View>
    <View style={{ width, height: '100%', flexShrink: 0 }}>
    <ScrollView ref={scroll} testID="reader-scroll" style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: padding }]} scrollEventThrottle={32}
      contentInsetAdjustmentBehavior="never"
      onLayout={event => {
        geometry.current.height = event.nativeEvent.layout.height;
        callbacks.current.onViewportHeight(geometry.current.height);
        restore();
      }}
      onContentSizeChange={(_width, height) => { geometry.current.content = height; restore(); }}
      onScrollBeginDrag={() => { scrolling.current = true; if (touch.current) touch.current.moved = true; callbacks.current.onInteractionStart(); }}
      onScrollEndDrag={() => { scrolling.current = false; lastScroll.current = Date.now(); }}
      onMomentumScrollBegin={() => { scrolling.current = true; }}
      onMomentumScrollEnd={() => { scrolling.current = false; lastScroll.current = Date.now(); }}
      onScroll={event => {
        const g = geometry.current;
        if (!g.ready) return;
        g.offset = Math.max(0, event.nativeEvent.contentOffset.y);
        anchor.current = Math.max(0, Math.min(100, Math.round(g.offset / Math.max(1, g.content - g.height) * 100)));
        lastScroll.current = Date.now();
        report();
        if (!busy.current) { updateEdges(); syncPreviews(); }
        callbacks.current.onPosition(anchor.current);
      }}
    >{children}</ScrollView>
    </View>
    <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: '100%', flexShrink: 0 }}>
    <ScrollView ref={next} scrollEnabled={false} style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: padding }]} onContentSizeChange={syncPreviews}>
      {edges.end && nextContent ? nextContent : children}
    </ScrollView>
    </View>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' }, scroll: { flex: 1 },
  content: { paddingTop: 50, paddingBottom: 128 },
});
