import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey, updateAppState } from '../src/services/appState.js';
import { getLibraryPage, getBooks, searchAll, setLibraryStatus, updateSettings, mockApiControl } from '../src/services/mockApi.js';

beforeEach(async () => {
  configureStorage(createMemoryStorage());
  await mockApiControl.reset();
  mockApiControl.setLatency(0);
});
const ids = (response) => response.items.map((book) => book.id).sort();

test('восемь полок имеют реальные счётчики; «Все» не включает «Не интересно»', async () => {
  const page = await getLibraryPage({ shelf: 'all' });
  assert.deepEqual(page.counts, { all: 3, reading: 1, planned: 1, finished: 1, paid: 0, liked: 0, reactions: 0, not_interested: 1 });
  assert.deepEqual(ids(page), ['book_002', 'book_005', 'book_008']);
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'not_interested' })), ['book_012']);
  await setLibraryStatus('book_005', 'reading');
  const next = await getLibraryPage();
  assert.equal(next.counts.reading, 2);
  assert.equal(next.counts.planned, 0);
  assert.equal(next.counts.all, 3);
});

test('«Оплачено» использует запись об оплате, а не цену книги', async () => {
  assert.equal((await getLibraryPage({ shelf: 'paid' })).total, 0);
  await updateAppState((state) => { state.purchasedBookIds = ['book_002']; });
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'paid' })), ['book_002']);
  await setLibraryStatus('book_002', 'not_interested');
  assert.equal((await getLibraryPage({ shelf: 'paid' })).total, 0);
});

test('личные отметки и реакции не подменяются общей статистикой; скрытые книги остаются на своей полке', async () => {
  await updateAppState((state) => { state.bookFeedback = { book_008: { liked: true, reaction: 'inspiring' }, book_004: { liked: true }, book_005: { reaction: 'funny' } }; });
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'liked' })), ['book_004', 'book_008']);
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'reactions' })), ['book_005', 'book_008']);
  assert.equal((await getLibraryPage({ shelf: 'all' })).counts.all, 4);
  await setLibraryStatus('book_008', 'not_interested');
  await reloadAppState();
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'liked' })), ['book_004']);
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'reactions' })), ['book_005']);
});

test('поиск библиотеки и AND-фильтры применяются к выбранной полке, не меняя каталог или счётчики', async () => {
  await setLibraryStatus('book_001', 'reading');
  await setLibraryStatus('book_019', 'reading');
  const filters = { genres: ['Темное фэнтези', 'Боевая фантастика'], status: 'ongoing', access: 'free' };
  const page = await getLibraryPage({ shelf: 'all', filters });
  assert.deepEqual(ids(page), ['book_001', 'book_019']);
  assert.equal(page.counts.all, 5);
  assert.deepEqual(ids(await getLibraryPage({ shelf: 'all', filters, query: '  ГОРОД ПОД ЧЕРНЫМ  ' })), ['book_001']);
  assert.equal((await getLibraryPage({ shelf: 'all', filters: { ...filters, excludedGenres: ['Боевая фантастика'] } })).total, 0);
  assert.equal((await getLibraryPage({ shelf: 'planned', query: 'Арсений' })).total, 0);
  assert.equal((await getBooks()).total, 19);
  assert.deepEqual((await searchAll('Протокол')).books.map((book) => book.id), ['book_004']);
});

test('сортировка меняет порядок, сохраняя состав и данные прогресса; библиотека работает offline', async () => {
  await updateSettings({ offline: true });
  const recent = await getLibraryPage({ shelf: 'all', sort: 'recent' });
  assert.deepEqual(recent.items.map((book) => book.id), ['book_002', 'book_008', 'book_005']);
  const progress = await getLibraryPage({ shelf: 'all', sort: 'progress' });
  assert.deepEqual(progress.items.map((book) => book.id), ['book_008', 'book_002', 'book_005']);
  assert.equal(progress.items[1].readingProgress.percent, 24);
  const title = await getLibraryPage({ shelf: 'all', sort: 'title' });
  assert.deepEqual(ids(title), ids(recent));
  assert.deepEqual(title.items.map((book) => book.title), recent.items.map((book) => book.title).sort((a, b) => a.localeCompare(b, 'ru')));
});

test('старое сохранение получает пустые данные отметок и оплат без потери библиотеки', async () => {
  const storage = createMemoryStorage(); configureStorage(storage);
  const previous = await readAppState();
  delete previous.bookFeedback; delete previous.purchasedBookIds;
  await storage.setItem(storageKey, JSON.stringify(previous));
  const restored = await reloadAppState();
  assert.deepEqual(restored.bookFeedback, {}); assert.deepEqual(restored.purchasedBookIds, []);
  assert.deepEqual(restored.libraryStatuses, previous.libraryStatuses);
  assert.deepEqual(restored.progressByBook, previous.progressByBook);
});
