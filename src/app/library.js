import { useCallback, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Keyboard, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import ScreenFrame from '../components/ScreenFrame';
import AsyncState from '../components/AsyncState';
import Text from '../components/AppText';
import LibraryBookCard from '../components/LibraryBookCard';
import LibraryStatusModal from '../components/LibraryStatusModal';
import LibraryPopup from '../components/LibraryPopup';
import LibraryFiltersModal from '../components/LibraryFiltersModal';
import Icon from '../components/Icon';
import { createLibraryFilters, libraryShelves, librarySortOptions } from '../data/libraryShelves';
import useAsyncResource from '../hooks/useAsyncResource';
import { getLibraryPage, setLibraryStatus } from '../services/mockApi';
import { colors, fonts } from '../theme';

export default function LibraryScreen() {
  const params = useLocalSearchParams();
  const shelf = libraryShelves.find((option) => option.value === params.shelf)?.value || 'reading';
  const sort = librarySortOptions.find((option) => option.value === params.sort)?.value || 'recent';
  const selectedShelf = libraryShelves.find((option) => option.value === shelf);
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [filters, setFilters] = useState(createLibraryFilters);
  const [panel, setPanel] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const loader = useCallback(() => getLibraryPage({ shelf, query, filters, sort }), [shelf, query, filters, sort]);
  const { data, loading, error, reload } = useAsyncResource(loader);
  const items = data?.items || [];
  const filterCount = Object.values(filters).reduce((total, value) => total + (Array.isArray(value) ? value.length : Number(value !== 'any')), 0);
  const openPanel = (next) => { Keyboard.dismiss(); setPanel(next); };
  async function selectStatus(status) {
    if (saving || !selectedBook) return;
    setSaving(true); setStatusError('');
    try { await setLibraryStatus(selectedBook.id, status); setSelectedBook(null); await reload(); }
    catch (failure) { setStatusError(failure.message); }
    finally { setSaving(false); }
  }
  return (
    <ScreenFrame title="Моя библиотека" accentBack headerTitle={searchVisible ? <TextInput autoFocus accessibilityLabel="Поиск в моей библиотеке" placeholder="Название или автор" placeholderTextColor={colors.secondary} value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} style={styles.search} /> : <Text accessibilityRole="header" numberOfLines={1} style={styles.heading}>Моя библиотека</Text>} headerActions={<View style={styles.headerActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={searchVisible ? 'Закрыть поиск в библиотеке' : 'Поиск в библиотеке'} onPress={() => { if (searchVisible) { Keyboard.dismiss(); setQuery(''); } setSearchVisible(!searchVisible); }} style={styles.headerButton}><Icon name={searchVisible ? 'close' : 'search'} color={colors.accent} size={24} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Фильтры библиотеки" accessibilityState={{ expanded: panel === 'filters' }} aria-expanded={panel === 'filters'} onPress={() => openPanel('filters')} style={styles.headerButton}><Icon name="filter" color={colors.accent} size={23} />{filterCount > 0 && <View style={styles.dot} />}</Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Сортировка библиотеки" accessibilityState={{ expanded: panel === 'sort' }} aria-expanded={panel === 'sort'} onPress={() => openPanel('sort')} style={styles.headerButton}><Icon name="sort" color={colors.accent} size={23} /></Pressable>
    </View>}>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Выбрать полку: ${selectedShelf.label}`} accessibilityState={{ expanded: panel === 'shelves' }} aria-expanded={panel === 'shelves'} onPress={() => openPanel('shelves')} style={styles.selector}>
          <Icon name={selectedShelf.icon} size={24} /><Text style={styles.shelfLabel}>{selectedShelf.label}</Text><Icon name="down" size={18} />
        </Pressable>
        {(query.trim() || filterCount > 0) && <View style={styles.summary}><Text accessibilityLiveRegion="polite" style={styles.summaryText}>Найдено: {data?.total ?? '…'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Сбросить поиск и фильтры библиотеки" onPress={() => { setQuery(''); setFilters(createLibraryFilters()); }} style={styles.reset}><Text style={styles.active}>Сбросить</Text></Pressable></View>}
      </View>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && <FlatList key={`${shelf}:${sort}:${query}:${JSON.stringify(filters)}`} data={items} keyExtractor={(book) => book.id} contentContainerStyle={styles.list} renderItem={({ item }) => <LibraryBookCard book={item} onStatus={(book) => { setStatusError(''); setSelectedBook(book); }} onAvailability={setAvailability} />} ListEmptyComponent={<Text style={styles.empty}>{query.trim() || filterCount > 0 ? 'По выбранным условиям книг не найдено.' : 'На этой полке пока нет книг.'}</Text>} />}
      <LibraryPopup visible={panel === 'shelves' || panel === 'sort'} title={panel === 'sort' ? 'Сортировка' : null} options={panel === 'sort' ? librarySortOptions : libraryShelves} value={panel === 'sort' ? sort : shelf} counts={panel === 'sort' ? null : data?.counts || {}} onSelect={(value) => { const key = panel === 'sort' ? 'sort' : 'shelf'; setPanel(null); router.setParams({ [key]: value }); }} onClose={() => setPanel(null)} />
      {panel === 'filters' && <LibraryFiltersModal filters={filters} onClose={() => setPanel(null)} onApply={(next) => { setFilters(next); setPanel(null); }} />}
      <LibraryStatusModal visible={!!selectedBook} status={selectedBook?.libraryStatus} saving={saving} error={statusError} onSelect={selectStatus} onClose={() => setSelectedBook(null)} />
      <Modal visible={!!availability} transparent animationType="fade" onRequestClose={() => setAvailability(null)}>
        <View style={styles.overlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Закрыть сведения о доступе без сети" onPress={() => setAvailability(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>Доступ без сети</Text>
            <Text style={styles.dialogText}>{availability?.access === 'free' ? 'Книга доступна для чтения без сети.' : 'Бесплатные главы доступны для чтения без сети. Доступ к платным главам ограничен.'}</Text>
            <Pressable accessibilityRole="button" onPress={() => setAvailability(null)} style={styles.done}><Text style={styles.active}>ПОНЯТНО</Text></Pressable>
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row' }, headerButton: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' },
  dot: { position: 'absolute', right: 5, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  controls: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: colors.header },
  selector: { minHeight: 44, flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#666666', borderRadius: 8 },
  shelfLabel: { color: colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  search: { flex: 1, minWidth: 0, height: 44, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }, summaryText: { color: colors.secondary, fontSize: 13 }, reset: { minHeight: 36, justifyContent: 'center' },
  active: { color: colors.accent },
  empty: { color: colors.secondary, padding: 32, textAlign: 'center', fontSize: 15 },
  list: { paddingTop: 8, paddingBottom: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.panel, borderRadius: 12, padding: 20, gap: 16 },
  dialogTitle: { color: colors.text, fontSize: 19 }, dialogText: { color: colors.secondary, fontSize: 15, lineHeight: 22 },
  done: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 12 },
});
