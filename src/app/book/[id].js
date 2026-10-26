import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Text from '../../components/AppText';
import AsyncState from '../../components/AsyncState';
import ScreenFrame from '../../components/ScreenFrame';
import Icon from '../../components/Icon';
import LibraryStatusModal, { libraryStatusLabels } from '../../components/LibraryStatusModal';
import ChapterPickerModal from '../../components/ChapterPickerModal';
import useAsyncResource from '../../hooks/useAsyncResource';
import { getBookById, getChapters, getComments, getSeriesById, setLibraryStatus } from '../../services/mockApi';
import { getAuthorAvatar, getBookCover } from '../../data/imageSources';
import { colors, layout } from '../../theme';

const formLabels = { novel: 'Роман', novella: 'Повесть', story: 'Рассказ', collection: 'Сборник' };

export default function BookScreen() {
  const { width } = useWindowDimensions();
  const coverWidth = Math.round((Math.min(width, layout.maxWidth) - 32) * 0.3);
  const { id: routeId } = useLocalSearchParams();
  const id = Array.isArray(routeId) ? routeId[0] : routeId;
  const loader = useCallback(async () => {
    const book = await getBookById(id);
    const [comments, chapters, series] = await Promise.all([
      getComments(id),
      getChapters(id),
      book.seriesId ? getSeriesById(book.seriesId) : Promise.resolve(null),
    ]);
    return { book, comments, chapters, series };
  }, [id]);
  const { data, loading, error, reload } = useAsyncResource(loader);
  const [statusVisible, setStatusVisible] = useState(false);
  const [chaptersVisible, setChaptersVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [tab, setTab] = useState('about');

  async function selectStatus(status) {
    if (saving) return;
    setSaving(true);
    setStatusError('');
    try {
      await setLibraryStatus(id, status);
      setStatusVisible(false);
      reload();
    } catch (requestError) {
      setStatusError(requestError.message || 'Не удалось сохранить статус.');
    } finally {
      setSaving(false);
    }
  }

  function openReader(chapterId) {
    setChaptersVisible(false);
    router.push({
      pathname: '/reader/[id]',
      params: {
        id,
        // The reader fetches the latest progress; only an explicit chapter overrides it.
        ...(chapterId ? { chapterId } : {}),
      },
    });
  }

  const book = data?.book;

  return (
    <ScreenFrame title="О книге" catalogHeader>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!!data && !loading && !error && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            <Image source={getBookCover(book.coverKey)} accessibilityLabel={`Обложка «${book.title}»`} style={[styles.cover, { width: coverWidth, height: coverWidth / 0.6 }]} />
            <View style={styles.information}>
              <Text accessibilityRole="header" style={styles.title}>{book.title}</Text>
              <View style={styles.authors}>
                {book.authorIds.map((authorId, index) => (
                  <Pressable key={authorId} onPress={() => router.push({ pathname: '/author/[id]', params: { id: authorId } })} accessibilityRole="button" accessibilityLabel={`Автор: ${book.authorNames[index]}`}>
                    <Text style={styles.author}>{book.authorNames[index]}{index < book.authorIds.length - 1 ? ',' : ''}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}><Text style={styles.statusText}>{book.status === 'ongoing' ? '✎ В процессе' : '✓ Завершено'}</Text></View>
              </View>
              <View style={styles.metadata}>
                <Text style={styles.age}>{book.ageRating}</Text>
                <Text style={styles.access}>{book.access === 'free' ? 'Свободный доступ' : book.access === 'paid' ? `${book.priceRub} ₽` : 'Подписка на серию'}</Text>
              </View>
              <Text style={styles.genres}>{formLabels[book.form] || 'Произведение'} / {book.genres.join(', ')}</Text>
              <Text style={styles.secondary}>{(book.textLength || 0).toLocaleString('ru-RU')} зн.</Text>
            </View>
          </View>

          <View style={styles.statistics}>
            <View style={styles.statistic}><View style={styles.commentNumber}><Icon name="heart" color="#ef715c" size={24} /><Text style={styles.statisticNumber}>{book.stats.likes}</Text></View><Text style={styles.statisticLabel}>Нравится</Text></View>
            <Pressable onPress={() => setTab('comments')} accessibilityRole="button" accessibilityLabel="Показать комментарии" style={styles.statistic}>
              <View style={styles.commentNumber}><Icon name="chat" color={colors.accent} /><Text style={styles.statisticNumber}>{book.stats.comments}</Text></View>
              <Text style={styles.statisticLabel}>Комментарии</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => openReader(null)} accessibilityRole="button" style={styles.readButton}>
            <Text style={styles.readLabel}>{book.readingProgress?.chapterId ? 'ПРОДОЛЖИТЬ ЧТЕНИЕ' : 'ЧИТАТЬ'}</Text>
          </Pressable>
          <View style={styles.bookActions}>
          <Pressable onPress={() => { setStatusError(''); setStatusVisible(true); }} accessibilityRole="button" accessibilityLabel={book.libraryStatus ? `Статус в библиотеке: ${libraryStatusLabels[book.libraryStatus]}` : 'В библиотеку'} style={styles.libraryButton}>
            <Icon name={book.libraryStatus ? 'check' : 'plus'} color={colors.accent} />
            <Text style={styles.libraryLabel}>{libraryStatusLabels[book.libraryStatus] || 'В библиотеку'}</Text>
          </Pressable>
          <Pressable onPress={() => setChaptersVisible(true)} accessibilityRole="button" accessibilityLabel="Оглавление произведения" style={styles.squareAction}><Icon name="openBook" color={colors.accent} /></Pressable>
          <Pressable onPress={() => setTab('comments')} accessibilityRole="button" accessibilityLabel="Отзывы о произведении" style={styles.squareAction}><Icon name="chat" color={colors.accent} /></Pressable>
          </View>

          <View accessibilityRole="tablist" style={styles.tabs}>
            {[['about', 'О книге'], ['tags', 'Тэги'], ['comments', 'Отзывы']].map(([value, label]) => (
              <Pressable key={value} onPress={() => setTab(value)} accessibilityRole="tab" aria-selected={tab === value} accessibilityState={{ selected: tab === value }} style={[styles.tab, tab === value && styles.activeTab]}>
                <Text style={[styles.tabLabel, tab === value && styles.activeTabLabel]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'about' && <View style={styles.section}>
            <Text style={styles.description}>{book.description}</Text>
            {data.series && <Pressable onPress={() => router.push({ pathname: '/series/[id]', params: { id: data.series.id } })} accessibilityRole="button" style={styles.detailRow}>
              <View style={styles.detailInfo}><Text style={styles.secondary}>Книжный цикл</Text><Text style={styles.link}>{data.series.title} · книга {book.seriesOrder}</Text></View><Text style={styles.chevron}>›</Text>
            </Pressable>}
            <Pressable onPress={() => setChaptersVisible(true)} accessibilityRole="button" style={styles.detailRow}><Text style={styles.detailLabel}>Оглавление · {data.chapters.length} глав</Text><Text style={styles.chevron}>›</Text></Pressable>
            <Text style={styles.secondary}>Просмотров: {book.stats.views.toLocaleString('ru-RU')} · В библиотеке: {book.stats.libraryCount.toLocaleString('ru-RU')}</Text>
          </View>}
          {tab === 'tags' && <View style={styles.tagList}>{book.tags.map((tag) => <View key={tag} style={styles.tag}><Text style={styles.link}>{tag}</Text></View>)}</View>}
          {tab === 'comments' && <View style={styles.comments}>
            {data.comments.map((comment) => <View key={comment.id} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Image source={getAuthorAvatar(comment.avatarKey)} style={styles.avatar} />
                <View style={styles.commentInfo}><Text style={styles.commentAuthor}>{comment.authorName}</Text><Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString('ru-RU', { timeZone: 'UTC' })}</Text></View>
                <Text style={styles.secondary}>+{comment.likes}</Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>)}
            {!data.comments.length && <Text style={styles.secondary}>Комментариев пока нет.</Text>}
          </View>}
        </ScrollView>
      )}
      <LibraryStatusModal visible={statusVisible} status={book?.libraryStatus} saving={saving} error={statusError} onSelect={selectStatus} onClose={() => setStatusVisible(false)} />
      <ChapterPickerModal visible={chaptersVisible} chapters={data?.chapters || []} selectedId={book?.readingProgress?.chapterId} onSelect={openReader} onClose={() => setChaptersVisible(false)} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  summary: { flexDirection: 'row', gap: 16, marginBottom: 18 },
  cover: { borderRadius: 6, backgroundColor: colors.card },
  information: { flex: 1, gap: 10 },
  title: { color: colors.text, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  authors: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  author: { color: colors.accent, fontSize: 14, lineHeight: 20 },
  statusRow: { flexDirection: 'row' },
  statusBadge: { borderWidth: 1, borderColor: colors.accent, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.accent, fontSize: 12 },
  metadata: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  age: { color: '#dc6c6f', fontSize: 12, borderColor: '#dc6c6f', borderWidth: 1, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 1 },
  access: { color: colors.secondary, fontSize: 12 },
  genres: { color: colors.accent, fontSize: 13, lineHeight: 19 },
  statistics: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider, marginBottom: 12 },
  statistic: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  statisticNumber: { color: colors.text, fontSize: 17 },
  statisticLabel: { color: colors.text, fontSize: 13 },
  heart: { color: '#ef715c', fontSize: 24 },
  commentNumber: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 29 },
  readButton: { backgroundColor: colors.accent, minHeight: 49, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  readLabel: { color: colors.text, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  bookActions: { flexDirection: 'row', gap: 6 },
  squareAction: { width: 44, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  libraryButton: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  libraryLabel: { color: colors.accent, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.divider, marginTop: 20 },
  tab: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#75aef0' },
  tabLabel: { color: colors.secondary, fontSize: 16, fontWeight: '700' },
  activeTabLabel: { color: '#75aef0' },
  section: { gap: 18, paddingVertical: 16 },
  description: { color: colors.text, fontSize: 16, lineHeight: 24 },
  detailRow: { minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.divider, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  detailInfo: { flex: 1, gap: 6 },
  detailLabel: { color: colors.text, fontSize: 16, flex: 1 },
  chevron: { color: colors.secondary, fontSize: 28 },
  secondary: { color: colors.secondary, fontSize: 12, lineHeight: 18 },
  link: { color: colors.accent, fontSize: 14, lineHeight: 20 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 16 },
  tag: { borderWidth: 1, borderColor: colors.accent, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12 },
  comments: { paddingTop: 16, gap: 22 },
  comment: { gap: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commentInfo: { flex: 1, gap: 4 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  commentAuthor: { color: colors.text, fontSize: 13, fontWeight: '700' },
  commentDate: { color: colors.secondary, fontSize: 11 },
  commentText: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
