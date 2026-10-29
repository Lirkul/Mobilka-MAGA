import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import ChapterPickerModal from '../../components/ChapterPickerModal';
import ScreenFrame from '../../components/ScreenFrame';
import ReaderSettingsModal from '../../components/ReaderSettingsModal';
import ReaderLoading from '../../components/ReaderLoading';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getBookById, getChapter, getChapters, getReadingProgress, getSettings, updateSettings, saveReadingProgress } from '../../services/mockApi';
import { colors } from '../../theme';
import Icon from '../../components/Icon';
import NavigationMenu from '../../components/NavigationMenu';
import { StatusBar } from 'expo-status-bar';
import Slider from '../../components/Slider';
import { defaultReaderSettings, readerPalette } from '../../data/readerOptions';
import { getBookPercent } from '../../utils/bookProgress';
import ReaderViewport from '../../components/ReaderViewport';

export default function ReaderScreen() {
  const { id: routeId, chapterId: routeChapter } = useLocalSearchParams();
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const chapterId = Array.isArray(routeChapter) ? routeChapter[0] : routeChapter;
  const loader = useCallback(async () => {
    const [book, chapters, progress, settings] = await Promise.all([getBookById(id), getChapters(id), getReadingProgress(id), getSettings()]);
    return { book, chapters, progress, settings };
  }, [id]);
  const { data, loading, error, reload } = useAsyncResource(loader);
  if (loading) return <ScreenFrame title="Чтение" lightHeader headerHidden><StatusBar style="dark" /><ReaderLoading /></ScreenFrame>;
  if (!data || loading || error) return <ScreenFrame title="Чтение" lightHeader accentBack><AsyncState loading={loading} error={error} onRetry={reload} /></ScreenFrame>;
  return <ReaderSession key={data.book.id} data={data} requestedChapterId={chapterId} />;
}

function ReaderSession({ data, requestedChapterId }) {
  const [chaptersVisible, setChaptersVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [focused, setFocused] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [notice, setNotice] = useState(null);
  const [preferences, setPreferences] = useState(() => ({ ...defaultReaderSettings, ...data.settings.reader }));
  const [settingsError, setSettingsError] = useState('');
  const toggleControls = useCallback(() => setControlsVisible(visible => !visible), []);
  const hideControls = useCallback(() => setControlsVisible(false), []);
  const showControls = useCallback(() => setControlsVisible(true), []);
  const palette = readerPalette(preferences.theme);
  async function changePreferences(value) {
    setSettingsError(''); setPreferences(value);
    try { await updateSettings({ reader: value }); }
    catch (failure) { setSettingsError(failure.message); }
  }
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  return (
    <ScreenFrame title="Чтение" overlayHeader headerTitle={<View style={{ flex: 1 }} />} lightHeader={!palette.dark} headerHidden={!controlsVisible} accentBack headerActions={<>
      <Pressable accessibilityRole="button" accessibilityLabel="Информация о произведении" onPress={() => setNotice(`${data.book.title}\n${data.book.authorNames.join(', ')}`)} style={styles.headerAction}><Icon name="graduation" color={colors.accent} size={23} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Аудиоверсия" onPress={() => setNotice('Для этой книги аудиозапись пока недоступна.')} style={styles.headerAction}><Icon name="speaker" color={colors.accent} size={23} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Настройки чтения" onPress={() => setSettingsVisible(true)} style={styles.headerAction}><Icon name="settings" color={colors.accent} size={23} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Переключить ночной режим" onPress={() => changePreferences({ ...preferences, theme: palette.dark ? 'light' : 'dark' })} style={styles.headerAction}><Icon name="moon" color={colors.accent} size={23} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Открыть меню" onPress={() => setMenuVisible(true)} style={styles.headerAction}><Icon name="more" color={colors.accent} size={23} /></Pressable>
    </>}>
      <StatusBar style={focused && !palette.dark ? 'dark' : 'light'} />
      <ReaderContent book={data.book} chapters={data.chapters} progress={data.progress} requestedChapterId={requestedChapterId} preferences={preferences} onPreferences={changePreferences} controlsVisible={controlsVisible} onToggleControls={toggleControls} onInteractionStart={hideControls} onShowControls={showControls} chaptersVisible={chaptersVisible} setChaptersVisible={setChaptersVisible} />
      <ReaderSettingsModal visible={settingsVisible} value={preferences} onChange={changePreferences} error={settingsError} onClose={() => setSettingsVisible(false)} />
      <NavigationMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <Modal transparent visible={!!notice} animationType="fade" onRequestClose={() => setNotice(null)}><View style={styles.noticeOverlay}><Pressable accessibilityRole="button" accessibilityLabel="Закрыть информацию" onPress={() => setNotice(null)} style={StyleSheet.absoluteFill} /><View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text><Pressable accessibilityRole="button" onPress={() => setNotice(null)} style={styles.headerAction}><Text style={styles.navigationLabel}>ЗАКРЫТЬ</Text></Pressable></View></View></Modal>
    </ScreenFrame>
  );
}

// Register writes with the API immediately; its per-book queue also protects resume reads.
function useProgressWriter(bookId) {
  const latest = useRef(null);
  const timer = useRef(null);
  const lastRequest = useRef(Promise.resolve());
  const lastQueued = useRef(null);
  const mounted = useRef(true);
  const [saveError, setSaveError] = useState('');

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const position = latest.current;
    if (!position) return Promise.resolve();
    if (position === lastQueued.current) return lastRequest.current;
    lastQueued.current = position;
    const request = saveReadingProgress(bookId, position.chapterId, position.percent);
    lastRequest.current = request;
    request.then(
      () => { if (mounted.current) setSaveError(''); },
      () => {
        if (lastQueued.current === position) lastQueued.current = null;
        if (mounted.current) setSaveError('Не удалось сохранить место чтения.');
      },
    );
    return request;
  }, [bookId]);

  const record = useCallback((chapterId, percent) => {
    if (latest.current?.chapterId === chapterId && latest.current?.percent === percent) return;
    latest.current = { chapterId, percent };
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => {}); }, 500);
  }, [flush]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void flush().catch(() => {});
    };
  }, [flush]);

  useFocusEffect(useCallback(() => () => {
    void flush().catch(() => {});
  }, [flush]));

  return { record, flush, saveError };
}

function ReaderContent({ book, chapters, progress, requestedChapterId, preferences, onPreferences, controlsVisible, onToggleControls, onInteractionStart, onShowControls, chaptersVisible, setChaptersVisible }) {
  const [chapterId, setChapterId] = useState(() => {
    if (chapters.some((chapter) => chapter.id === requestedChapterId)) return requestedChapterId;
    if (chapters.some((chapter) => chapter.id === progress.chapterId)) return progress.chapterId;
    return chapters[0]?.id || null;
  });
  const [initialPercent, setInitialPercent] = useState(chapterId === progress.chapterId ? progress.percent : 0);
  const { record, flush, saveError } = useProgressWriter(book.id);
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);

  function chooseChapter(nextId, entryPercent = 0) {
    setChaptersVisible(false);
    if (nextId === chapterId) return;
    void flush().catch(() => {});
    setInitialPercent(entryPercent);
    setChapterId(nextId);
    // Keep the explicit chapter current when this screen reloads on focus or refresh.
    router.setParams({ chapterId: nextId });
  }

  return (
    <View style={[styles.reader, { backgroundColor: readerPalette(preferences.theme).paper }]}>
      {!!saveError && <View style={styles.saveError}>
        <Text accessibilityRole="alert" style={styles.saveErrorText}>{saveError}</Text>
        <Pressable onPress={() => { void flush().catch(() => {}); }} accessibilityRole="button" style={styles.retrySave}><Text style={styles.retrySaveText}>ПОВТОРИТЬ</Text></Pressable>
      </View>}
      {chapterId ? <ReaderChapter key={chapterId} book={book} chapters={chapters} chapterId={chapterId} initialPercent={initialPercent} onProgress={record} preferences={preferences} onPreferences={onPreferences} controlsVisible={controlsVisible} onToggleControls={onToggleControls} onInteractionStart={onInteractionStart} onShowControls={onShowControls} onChapterBoundary={direction => {
        const target = chapters[chapterIndex + direction];
        if (target) chooseChapter(target.id, direction > 0 ? 0 : 100);
      }} onContents={() => setChaptersVisible(true)} chapterNumber={chapterIndex + 1} /> : <Text style={styles.empty}>Главы пока не опубликованы.</Text>}
      {controlsVisible && <View style={[styles.navigation, readerPalette(preferences.theme).dark && styles.darkFooter]}>
        <Pressable disabled={chapterIndex <= 0} onPress={() => chooseChapter(chapters[chapterIndex - 1].id)} accessibilityRole="button" accessibilityLabel="Предыдущая глава" style={[styles.navigationButton, chapterIndex <= 0 && styles.disabled]}>
          <Icon name="left" color={colors.accent} size={16} /><Text style={styles.navigationLabel}>Предыдущая глава</Text>
        </Pressable>
        <Pressable disabled={chapterIndex < 0 || chapterIndex >= chapters.length - 1} onPress={() => chooseChapter(chapters[chapterIndex + 1].id)} accessibilityRole="button" accessibilityLabel="Следующая глава" style={[styles.navigationButton, (chapterIndex < 0 || chapterIndex >= chapters.length - 1) && styles.disabled]}>
          <Text style={styles.navigationLabel}>Следующая глава</Text><Icon name="right" color={colors.accent} size={16} />
        </Pressable>
      </View>}
      <ChapterPickerModal visible={chaptersVisible} chapters={chapters} selectedId={chapterId} onSelect={chooseChapter} onClose={() => setChaptersVisible(false)} />
    </View>
  );
}

function ReaderChapter({ book, chapters, chapterId, initialPercent, onProgress, preferences, onPreferences, controlsVisible, onToggleControls, onInteractionStart, onShowControls, onChapterBoundary, onContents, chapterNumber }) {
  const loader = useCallback(() => getChapter(book.id, chapterId), [book.id, chapterId]);
  const { data: chapter, loading, error, reload } = useAsyncResource(loader);
  const viewport = useRef(null);
  const viewportHeight = useRef(0);
  const progressInitialized = useRef(false);
  const [percent, setPercent] = useState(initialPercent);
  const bookPercent = getBookPercent(chapters, chapterId, percent);
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [brightnessPreview, setBrightnessPreview] = useState(null);
  const [neighbors, setNeighbors] = useState({ previous: null, next: null });
  const previousChapterId = chapters[chapterNumber - 2]?.id;
  const nextChapterId = chapters[chapterNumber]?.id;
  useEffect(() => {
    let active = true;
    const load = id => id ? getChapter(book.id, id).catch(() => null) : Promise.resolve(null);
    Promise.all([load(previousChapterId), load(nextChapterId)]).then(([previous, next]) => {
      if (active) setNeighbors({ previous, next });
    });
    return () => { active = false; };
  }, [book.id, previousChapterId, nextChapterId]);
  const palette = readerPalette(preferences.theme);
  const textColor = { color: palette.ink };
  const fontFamily = preferences.font === 'serif' ? (Platform.OS === 'android' ? 'serif' : 'Georgia')
    : preferences.font === 'mono' ? (Platform.OS === 'ios' ? 'Menlo' : 'monospace')
      : preferences.font === 'system' ? (Platform.OS === 'android' ? 'sans-serif' : Platform.OS === 'ios' ? 'System' : 'system-ui') : undefined;
  const gestureValues = useRef({ preferences, onPreferences });
  const gestureStart = useRef(85);
  const gestureBrightness = useRef(85);
  useLayoutEffect(() => { gestureValues.current = { preferences, onPreferences }; }, [preferences, onPreferences]);
  const onPosition = useCallback(value => {
    setPercent(value); onProgress(chapterId, value);
  }, [chapterId, onProgress]);
  const onPagination = useCallback((number, count) => { setPageNumber(number); setPageCount(count); }, []);
  const onViewportHeight = useCallback(height => { viewportHeight.current = height; }, []);
  // PanResponder registers callbacks, without reading refs during render.
  // eslint-disable-next-line react-hooks/refs
  const [brightnessGesture] = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { gestureStart.current = gestureValues.current.preferences.brightness; gestureBrightness.current = gestureStart.current; },
    onPanResponderMove: (_event, gesture) => { gestureBrightness.current = Math.max(0, Math.min(100, Math.round(gestureStart.current - gesture.dy / Math.max(1, viewportHeight.current) * 150))); setBrightnessPreview(gestureBrightness.current); },
    onPanResponderRelease: () => { const value = gestureValues.current; value.onPreferences({ ...value.preferences, brightness: gestureBrightness.current, autoBrightness: false }); setBrightnessPreview(null); },
    onPanResponderTerminate: () => setBrightnessPreview(null),
  }));

  useEffect(() => {
    if (chapter?.requiresPayment) onShowControls();
    if (chapter && !chapter.requiresPayment && !progressInitialized.current) {
      progressInitialized.current = true;
      onProgress(chapterId, initialPercent);
    }
  }, [chapter, chapterId, initialPercent, onProgress, onShowControls]);

  function seek(value) {
    viewport.current?.seek(value);
  }

  function renderText(content) {
    if (!content) return null;
    if (content.requiresPayment) return <View style={styles.paywall}><Text style={[styles.paywallTitle, textColor]}>{content.title}</Text><Text style={styles.paywallLabel}>Платная глава</Text></View>;
    const fragments = content.text.split('\n\n');
    return <>
      <View style={styles.fullscreenByline}><Text style={[styles.bookTitle, textColor]}>{book.title}</Text><Text style={[styles.byline, textColor]}>{book.authorNames.join(', ')}</Text></View>
      <Text accessibilityRole="header" style={[styles.chapterTitle, textColor]}>{content.title}</Text>
      {fragments.map((text, index) => <Text key={index} testID="reader-page-paragraph" selectable style={[styles.paragraph, textColor, { fontSize: preferences.fontSize, lineHeight: Math.round(preferences.fontSize * preferences.lineHeight), fontFamily, textAlign: preferences.alignment, marginBottom: preferences.paragraphSpacing }]}>    {text}</Text>)}
    </>;
  }

  return (
    <View style={styles.chapterBody}>
      {loading ? <ReaderLoading theme={preferences.theme} /> : <AsyncState loading={false} error={error} onRetry={reload} />}
      {!!chapter && !loading && !error && (chapter.requiresPayment ? (
        <View style={styles.paywall}>
          <Text accessibilityRole="header" style={[styles.paywallTitle, textColor]}>{chapter.title}</Text>
          <Text style={styles.paywallLabel}>Платная глава</Text>
          <Text style={[styles.paywallText, textColor]}>Бесплатный фрагмент закончился. {book.access === 'series_subscription' ? 'Продолжение доступно по подписке на серию.' : 'Продолжение доступно после покупки книги.'}</Text>
          <Text style={styles.paywallHint}>В учебной версии покупка недоступна. Можно вернуться к бесплатным главам через оглавление.</Text>
        </View>
      ) : (
        <>
          <View testID="reader-paper" style={[styles.paper, { backgroundColor: palette.paper }]}>
          <ReaderViewport viewportRef={viewport} initialPercent={initialPercent} padding={preferences.horizontalPadding} lineHeight={Math.round(preferences.fontSize * preferences.lineHeight)} onPosition={onPosition} onPagination={onPagination} onViewportHeight={onViewportHeight} onToggleControls={onToggleControls} onInteractionStart={onInteractionStart} onChapterBoundary={onChapterBoundary} canGoPrevious={!!previousChapterId} canGoNext={!!nextChapterId} previousContent={renderText(neighbors.previous)} nextContent={renderText(neighbors.next)}>
            {renderText(chapter)}
          </ReaderViewport>
          {preferences.brightnessGestures && <View testID="reader-brightness-gesture" style={styles.brightnessGesture} {...brightnessGesture.panHandlers} />}
          <View pointerEvents="none" testID="reader-dimmer" style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: brightnessPreview === null && preferences.autoBrightness ? 0 : (100 - (brightnessPreview ?? preferences.brightness)) / 100 * 0.65 }]} />
          </View>
          {controlsVisible && <View style={[styles.progressFooter, palette.dark && styles.darkFooter]}>
            <View style={styles.progressLine}>
              <Pressable accessibilityRole="button" accessibilityLabel="Открыть оглавление" onPress={onContents} style={styles.contentsIcon}><Icon name="documents" size={22} color={colors.accent} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Предыдущая страница" disabled={percent <= 0 && !previousChapterId} onPress={() => viewport.current?.turnPage(-1)} style={[styles.pageTurn, percent <= 0 && !previousChapterId && styles.disabled]}><Icon name="left" size={18} color={colors.accent} /></Pressable>
              <Slider value={percent} onChange={seek} label="Позиция в главе" testID="reader-position" disabled={pageCount <= 1} />
              <Pressable accessibilityRole="button" accessibilityLabel="Следующая страница" disabled={(percent >= 100 || pageCount <= 1) && !nextChapterId} onPress={() => viewport.current?.turnPage(1)} style={[styles.pageTurn, (percent >= 100 || pageCount <= 1) && !nextChapterId && styles.disabled]}><Icon name="right" size={18} color={colors.accent} /></Pressable>
              <Text style={styles.pageNumber}>{pageNumber} из {pageCount}</Text>
            </View>
            <View style={styles.progressCaption}><Text style={styles.pageNumber}>Глава {chapterNumber}</Text><Text accessibilityLabel={`Прочитано ${bookPercent} процентов книги`} style={styles.progress}>{bookPercent}% книги</Text></View>
          </View>}
        </>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  reader: { flex: 1, backgroundColor: '#f9f8f2' },
  headerAction: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tocAction: { flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 46, paddingHorizontal: 4 },
  tocButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#eeede7', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#c9c8c2' },
  tocLabel: { color: '#3b718f', fontSize: 14 },
  chapterCount: { color: '#65655f', fontSize: 12 },
  chapterBody: { flex: 1 },
  paper: { flex: 1 }, brightnessGesture: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 22 }, fullscreenByline: { paddingTop: 16, paddingBottom: 2 },
  bookTitle: { textAlign: 'center', color: '#484844', fontSize: 18, lineHeight: 25 },
  byline: { textAlign: 'center', color: '#484844', fontSize: 16, lineHeight: 24, marginTop: 3 },
  chapterTitle: { textAlign: 'center', color: '#484844', fontSize: 21, lineHeight: 28, fontWeight: '700', marginTop: 18, marginBottom: 22 },
  paragraph: { color: '#484844', fontSize: 18, lineHeight: 26, textAlign: 'justify', marginBottom: 12 },
  progressFooter: { position: 'absolute', bottom: 44, left: 0, right: 0, backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#d8d8d4', paddingHorizontal: 14, paddingTop: 10 },
  progressLine: { flexDirection: 'row', gap: 4, alignItems: 'center' }, pageTurn: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, pageNumber: { color: '#969a9d', fontSize: 11 },
  darkFooter: { backgroundColor: '#252525' }, contentsIcon: { width: 30, minHeight: 40, alignItems: 'center', justifyContent: 'center' }, progressCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 48, paddingRight: 44 },
  progress: { color: '#74746e', fontSize: 11, textAlign: 'center', paddingVertical: 5 },
  navigation: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e1e1df', backgroundColor: '#ffffff' },
  navigationButton: { flex: 1, flexDirection: 'row', gap: 4, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  navigationLabel: { color: '#3b718f', fontSize: 11 },
  disabled: { opacity: 0.35 },
  empty: { color: '#484844', fontSize: 16, padding: 24, flex: 1 },
  saveError: { backgroundColor: '#fff0de', paddingHorizontal: 14, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveErrorText: { color: '#7b4d2c', fontSize: 12, lineHeight: 17, flex: 1 },
  retrySave: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  retrySaveText: { color: '#3b718f', fontSize: 11, fontWeight: '700' },
  paywall: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  paywallTitle: { color: '#484844', textAlign: 'center', fontSize: 21, fontWeight: '700' },
  paywallLabel: { color: colors.accent, textAlign: 'center', fontSize: 18, fontWeight: '500' },
  paywallText: { color: '#484844', textAlign: 'center', fontSize: 16, lineHeight: 24 },
  paywallHint: { color: '#74746e', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  noticeOverlay: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 24 }, notice: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 380, gap: 16 }, noticeText: { color: '#484844', fontSize: 16, lineHeight: 24 },
});
