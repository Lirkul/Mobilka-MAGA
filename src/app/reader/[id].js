import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import ChapterPickerModal from '../../components/ChapterPickerModal';
import ScreenFrame from '../../components/ScreenFrame';
import ReaderSettingsModal from '../../components/ReaderSettingsModal';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getBookById, getChapter, getChapters, getReadingProgress, getSettings, updateSettings, saveReadingProgress } from '../../services/mockApi';
import { colors } from '../../theme';

export default function ReaderScreen() {
  const { id: routeId, chapterId: routeChapter } = useLocalSearchParams();
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const chapterId = Array.isArray(routeChapter) ? routeChapter[0] : routeChapter;
  const loader = useCallback(async () => {
    const [book, chapters, progress, settings] = await Promise.all([getBookById(id), getChapters(id), getReadingProgress(id), getSettings()]);
    return { book, chapters, progress, settings };
  }, [id]);
  const { data, loading, error, reload } = useAsyncResource(loader);

  return (
    <ScreenFrame title="Чтение">
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!!data && !loading && !error && <ReaderContent key={data.book.id} book={data.book} chapters={data.chapters} progress={data.progress} requestedChapterId={chapterId} settings={data.settings.reader} />}
    </ScreenFrame>
  );
}

// Keep all writes in one queue so an earlier scroll cannot overwrite a later chapter.
function useProgressWriter(bookId) {
  const latest = useRef(null);
  const timer = useRef(null);
  const queue = useRef(Promise.resolve());
  const lastQueued = useRef(null);
  const mounted = useRef(true);
  const [saveError, setSaveError] = useState('');

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const position = latest.current;
    if (!position) return Promise.resolve();
    if (position === lastQueued.current) return queue.current;
    lastQueued.current = position;
    const request = queue.current.catch(() => {}).then(async () => {
      await saveReadingProgress(bookId, position.chapterId, position.percent);
    });
    queue.current = request;
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

function ReaderContent({ book, chapters, progress, requestedChapterId, settings }) {
  const [chapterId, setChapterId] = useState(() => {
    if (chapters.some((chapter) => chapter.id === requestedChapterId)) return requestedChapterId;
    if (chapters.some((chapter) => chapter.id === progress.chapterId)) return progress.chapterId;
    return chapters[0]?.id || null;
  });
  const [initialPercent, setInitialPercent] = useState(chapterId === progress.chapterId ? progress.percent : 0);
  const [chaptersVisible, setChaptersVisible] = useState(false);
  const [preferences, setPreferences] = useState(settings);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const { record, flush, saveError } = useProgressWriter(book.id);
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  async function changePreferences(value) {
    setSettingsError('');
    try { await updateSettings({ reader: value }); setPreferences(value); }
    catch (failure) { setSettingsError(failure.message); }
  }

  function chooseChapter(nextId) {
    setChaptersVisible(false);
    if (nextId === chapterId) return;
    void flush().catch(() => {});
    setInitialPercent(0);
    setChapterId(nextId);
  }

  return (
    <View style={[styles.reader, preferences.theme === 'dark' && { backgroundColor: colors.background }]}>
      <View style={styles.tocButton}><Pressable onPress={() => setChaptersVisible(true)} accessibilityRole="button" accessibilityLabel="Открыть оглавление" style={styles.tocAction}>
        <Text style={styles.tocLabel}>☰  Оглавление</Text>
        <Text style={styles.chapterCount}>{Math.max(0, chapterIndex + 1)} / {chapters.length}</Text>
      </Pressable><Pressable accessibilityRole="button" accessibilityLabel="Настройки чтения" onPress={() => setSettingsVisible(true)} style={styles.tocAction}><Text style={styles.tocLabel}>Aa</Text></Pressable></View>
      {!!saveError && <View style={styles.saveError}>
        <Text accessibilityRole="alert" style={styles.saveErrorText}>{saveError}</Text>
        <Pressable onPress={() => { void flush().catch(() => {}); }} accessibilityRole="button" style={styles.retrySave}><Text style={styles.retrySaveText}>ПОВТОРИТЬ</Text></Pressable>
      </View>}
      {chapterId ? <ReaderChapter key={chapterId} book={book} chapterId={chapterId} initialPercent={initialPercent} onProgress={record} preferences={preferences} /> : <Text style={styles.empty}>Главы пока не опубликованы.</Text>}
      <View style={styles.navigation}>
        <Pressable disabled={chapterIndex <= 0} onPress={() => chooseChapter(chapters[chapterIndex - 1].id)} accessibilityRole="button" accessibilityLabel="Предыдущая глава" style={[styles.navigationButton, chapterIndex <= 0 && styles.disabled]}>
          <Text style={styles.navigationLabel}>‹ Предыдущая</Text>
        </Pressable>
        <Pressable disabled={chapterIndex < 0 || chapterIndex >= chapters.length - 1} onPress={() => chooseChapter(chapters[chapterIndex + 1].id)} accessibilityRole="button" accessibilityLabel="Следующая глава" style={[styles.navigationButton, (chapterIndex < 0 || chapterIndex >= chapters.length - 1) && styles.disabled]}>
          <Text style={styles.navigationLabel}>Следующая ›</Text>
        </Pressable>
      </View>
      <ChapterPickerModal visible={chaptersVisible} chapters={chapters} selectedId={chapterId} onSelect={chooseChapter} onClose={() => setChaptersVisible(false)} />
      <ReaderSettingsModal visible={settingsVisible} value={preferences} onChange={changePreferences} error={settingsError} onClose={() => setSettingsVisible(false)} />
    </View>
  );
}

function ReaderChapter({ book, chapterId, initialPercent, onProgress, preferences }) {
  const loader = useCallback(() => getChapter(book.id, chapterId), [book.id, chapterId]);
  const { data: chapter, loading, error, reload } = useAsyncResource(loader);
  const scroll = useRef(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const positionPercent = useRef(initialPercent);
  const restored = useRef(false);
  const progressInitialized = useRef(false);
  const [percent, setPercent] = useState(initialPercent);
  const textColor = { color: preferences.theme === 'dark' ? colors.secondary : '#484844' };

  useEffect(() => {
    if (chapter && !chapter.requiresPayment && !progressInitialized.current) {
      progressInitialized.current = true;
      onProgress(chapterId, initialPercent);
    }
  }, [chapter, chapterId, initialPercent, onProgress]);

  function restorePosition() {
    if (restored.current || !viewportHeight.current || !contentHeight.current) return;
    restored.current = true;
    const maxOffset = Math.max(0, contentHeight.current - viewportHeight.current);
    scroll.current?.scrollTo({ y: maxOffset * initialPercent / 100, animated: false });
  }

  function trackPosition(event) {
    if (!restored.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxOffset = contentSize.height - layoutMeasurement.height;
    if (maxOffset <= 0) return;
    const current = Math.max(0, Math.min(100, Math.round(contentOffset.y / maxOffset * 100)));
    setPercent(current);
    positionPercent.current = current;
    onProgress(chapterId, current);
  }

  return (
    <View style={styles.chapterBody}>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!!chapter && !loading && !error && (chapter.requiresPayment ? (
        <View style={styles.paywall}>
          <Text accessibilityRole="header" style={styles.paywallTitle}>{chapter.title}</Text>
          <Text style={styles.paywallLabel}>Платная глава</Text>
          <Text style={styles.paywallText}>Бесплатный фрагмент закончился. {book.access === 'series_subscription' ? 'Продолжение доступно по подписке на серию.' : 'Продолжение доступно после покупки книги.'}</Text>
          <Text style={styles.paywallHint}>В учебной версии покупка недоступна. Можно вернуться к бесплатным главам через оглавление.</Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scroll}
            testID="reader-scroll"
            style={styles.pages}
            contentContainerStyle={styles.pageContent}
            onLayout={(event) => { viewportHeight.current = event.nativeEvent.layout.height; restorePosition(); }}
            onContentSizeChange={(_width, height) => {
              const previousHeight = contentHeight.current;
              contentHeight.current = height;
              if (restored.current && previousHeight !== height) scroll.current?.scrollTo({ y: Math.max(0, height - viewportHeight.current) * positionPercent.current / 100, animated: false });
              else restorePosition();
            }}
            onScroll={trackPosition}
            scrollEventThrottle={100}
          >
            <Text style={[styles.bookTitle, textColor]}>{book.title}</Text>
            <Text style={[styles.byline, textColor]}>{book.authorNames.join(', ')}</Text>
            <Text accessibilityRole="header" style={[styles.chapterTitle, textColor]}>{chapter.title}</Text>
            {chapter.text.split('\n\n').map((paragraph, index) => <Text key={index} selectable style={[styles.paragraph, textColor, { fontSize: preferences.fontSize, lineHeight: preferences.fontSize + 8 }]}>{'    '}{paragraph}</Text>)}
          </ScrollView>
          <Text accessibilityLabel={`Прочитано ${percent} процентов главы`} style={styles.progress}>{percent}% главы</Text>
        </>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  reader: { flex: 1, backgroundColor: '#f9f8f2' },
  tocAction: { flexDirection: 'row', gap: 16, alignItems: 'center', minHeight: 46, paddingHorizontal: 4 },
  tocButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#eeede7', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#c9c8c2' },
  tocLabel: { color: '#3b718f', fontSize: 14 },
  chapterCount: { color: '#65655f', fontSize: 12 },
  chapterBody: { flex: 1 },
  pages: { flex: 1 },
  pageContent: { paddingHorizontal: 13, paddingTop: 18, paddingBottom: 20 },
  bookTitle: { textAlign: 'center', color: '#484844', fontSize: 18, lineHeight: 25 },
  byline: { textAlign: 'center', color: '#484844', fontSize: 16, lineHeight: 24, marginTop: 3 },
  chapterTitle: { textAlign: 'center', color: '#484844', fontSize: 21, lineHeight: 28, fontWeight: '700', marginTop: 26, marginBottom: 22 },
  paragraph: { color: '#484844', fontSize: 18, lineHeight: 26, textAlign: 'justify', marginBottom: 12 },
  progress: { color: '#74746e', fontSize: 11, textAlign: 'center', paddingVertical: 5 },
  navigation: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#c9c8c2', backgroundColor: '#eeede7' },
  navigationButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  navigationLabel: { color: '#3b718f', fontSize: 13 },
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
});
