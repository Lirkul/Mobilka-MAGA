import { useCallback, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import ScreenFrame from '../components/ScreenFrame';
import AsyncState from '../components/AsyncState';
import BookResultItem from '../components/BookResultItem';
import SearchPanel from '../components/SearchPanel';
import useAsyncResource from '../hooks/useAsyncResource';
import { discoverBooks, searchCatalog } from '../services/catalog';
import AuthorResultItem from '../components/AuthorResultItem';
import EmptyState from '../components/EmptyState';
import { normalizeText } from '../utils/filterBooks';
import { additionalFields, createDefaultFilters, filterFields } from '../data/filters';
import { colors } from '../theme';
import Icon from '../components/Icon';
import LibraryStatusModal from '../components/LibraryStatusModal';
import { setLibraryStatus } from '../services/mockApi';

function decodeFilters(serialized) {
  const filters = createDefaultFilters();
  try {
    const input = JSON.parse(serialized || '{}');
    if (!input || typeof input !== 'object') return filters;
    for (const field of [...filterFields, ...additionalFields]) {
      const allowed = field.options.map((option) => option.value);
      if (field.multiple && Array.isArray(input[field.key])) filters[field.key] = input[field.key].map((value) => allowed.find((option) => normalizeText(option) === normalizeText(value))).filter(Boolean);
      else if (allowed.includes(input[field.key])) filters[field.key] = input[field.key];
    }
  } catch { /* Invalid links open the unfiltered catalog. */ }
  return filters;
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const mode = params.mode === 'search' ? 'search' : 'discover';
  const query = typeof params.q === 'string' ? params.q : '';
  const serialized = typeof params.filters === 'string' ? params.filters : '';
  const filters = useMemo(() => decodeFilters(serialized), [serialized]);
  const [panelVisible, setPanelVisible] = useState(false);
  const [statusBook, setStatusBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const loader = useCallback(() => mode === 'search' ? searchCatalog(query) : discoverBooks(filters), [mode, query, filters]);
  const { data, loading, error, reload } = useAsyncResource(loader);
  const rows = [];
  if (data && !loading && !error) {
    if (mode === 'discover') {
      rows.push(...data.items.map((book) => ({ key: book.id, kind: 'book', item: book })));
    } else {
      for (const [kind, title, items] of [['author', 'Люди', data.authors], ['book', 'Книги', data.books], ['post', 'Посты', data.posts]]) {
        if (!items.length) continue;
        rows.push({ key: kind, kind: 'heading', title: `${title} · ${items.length}` });
        rows.push(...items.map((item) => ({ key: item.id, kind, item })));
      }
    }
  }

  function renderRow({ item: row }) {
    if (row.kind === 'heading') return <Text accessibilityRole="header" style={styles.heading}>{row.title}</Text>;
    if (row.kind === 'book') return <BookResultItem book={row.item} onStatus={() => { setStatusError(''); setStatusBook(row.item); }} />;
    if (row.kind === 'author') {
      return <AuthorResultItem author={row.item} />;
    }
    return (
      <Pressable testID={`post-result-${row.item.id}`} accessibilityRole="button" accessibilityLabel={`Открыть пост «${row.item.title}»`} onPress={() => router.push({ pathname: '/post/[id]', params: { id: row.item.id } })} style={styles.post}>
        <Text style={styles.title}>{row.item.title}</Text><Text style={styles.secondary}>{row.item.excerpt}</Text>
      </Pressable>
    );
  }

  const total = mode === 'discover' ? data?.total : (data ? data.books.length + data.authors.length + data.posts.length : 0);
  const activeCount = [...filterFields, ...additionalFields].reduce((count, field) => {
    const value = filters[field.key]; const initial = createDefaultFilters()[field.key];
    return count + (Array.isArray(value) ? value.length : value !== initial ? 1 : 0);
  }, 0);
  async function changeStatus(status) {
    if (saving) return;
    setSaving(true); setStatusError('');
    try { await setLibraryStatus(statusBook.id, status); setStatusBook(null); await reload(); }
    catch (failure) { setStatusError(failure.message); }
    finally { setSaving(false); }
  }
  return (
    <ScreenFrame title={mode === 'search' ? 'Результаты поиска' : 'Подбор книг'} catalogHeader onSearch={() => setPanelVisible(true)}>
      {mode === 'search' && <Text accessibilityRole="header" style={styles.searchHeading}>Результаты поиска</Text>}
      <View style={styles.summary}>
        <Text accessibilityLiveRegion="polite" style={styles.summaryText}>{mode === 'search' ? `Поиск: «${query}»` : `Найдено книг: ${total ?? '…'}`}</Text>
        <View style={styles.tools}>
          <Pressable accessibilityRole="button" accessibilityLabel={mode === 'search' ? 'НОВЫЙ ПОИСК' : 'ФИЛЬТРЫ'} onPress={() => setPanelVisible(true)} style={styles.filters}><Text style={styles.filterText}>{mode === 'search' ? 'НОВЫЙ ПОИСК' : `ФИЛЬТРЫ${activeCount ? ` (${activeCount})` : ''}`}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Открыть параметры подбора" onPress={() => setPanelVisible(true)} style={styles.round}><Icon name="down" color={colors.accent} size={22} /></Pressable>
          {!error && <Pressable accessibilityRole="button" accessibilityLabel="Обновить результаты" onPress={reload} style={styles.refresh}><Icon name="reset" color={colors.accent} size={18} /></Pressable>}
        </View>
      </View>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && data && (total === 0 ? <EmptyState /> : <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
      />)}
      <SearchPanel key={`${mode}:${serialized}:${query}`} visible={panelVisible} initialFilters={filters} initialQuery={query} onClose={() => setPanelVisible(false)} onSearch={(q) => router.setParams({ mode: 'search', q })} onDiscover={(next) => router.setParams({ mode: 'discover', filters: JSON.stringify(next) })} />
      <LibraryStatusModal visible={!!statusBook} status={statusBook?.libraryStatus} saving={saving} error={statusError} onSelect={changeStatus} onClose={() => setStatusBook(null)} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  summary: { padding: 16, gap: 16, paddingTop: 10, paddingBottom: 10 },
  searchHeading: { color: colors.text, backgroundColor: colors.segment, fontSize: 14, paddingHorizontal: 16, paddingVertical: 10 },
  summaryText: { color: colors.text, fontSize: 14 },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  filters: { flex: 1, borderWidth: 1, borderColor: colors.accent, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  round: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  filterText: { color: colors.accent, fontSize: 14, fontWeight: '500', letterSpacing: 1 },
  refresh: { width: 28, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 24 },
  heading: { color: colors.text, fontSize: 16, fontWeight: '700', padding: 16, backgroundColor: colors.card },
  author: { margin: 8, padding: 12, borderRadius: 12, backgroundColor: colors.segment, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  authorInfo: { flex: 1, gap: 8 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  secondary: { color: colors.secondary, fontSize: 13, lineHeight: 19 },
  post: { padding: 16, gap: 10, borderBottomWidth: 1, borderColor: colors.divider },
  empty: { padding: 24, color: colors.secondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
