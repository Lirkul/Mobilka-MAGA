import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey, updateAppState } from '../src/services/appState.js';
import { getBooks, getLibrary, getReadingProgress, getRecentBooks, getBookById, getChapter, getChapters, saveReadingProgress, setLibraryStatus, searchAll, updateSettings, getSettings, mockApiControl } from '../src/services/mockApi.js';

beforeEach(async () => {
  configureStorage(createMemoryStorage());
  await mockApiControl.reset();
  mockApiControl.setLatency(0);
});

test('статусы, удаление с полки и прогресс восстанавливаются после перезапуска', async () => {
  await setLibraryStatus('book_001', 'planned');
  await setLibraryStatus('book_005', null);
  await saveReadingProgress('book_019', 'book_019_ch_02', 63);
  await reloadAppState();
  assert.equal((await getBookById('book_001')).libraryStatus, 'planned');
  assert.equal((await getBookById('book_005')).libraryStatus, null);
  assert.equal((await getReadingProgress('book_019')).percent, 63);
  assert.equal((await getRecentBooks())[0].id, 'book_019');
  assert.equal((await getRecentBooks())[0].readingProgress.chapterId, 'book_019_ch_02');
});

test('параллельные записи не теряют изменения, и старт не перезаписывает сохранённое', async () => {
  await Promise.all([setLibraryStatus('book_001', 'planned'), setLibraryStatus('book_019', 'finished')]);
  await reloadAppState();
  assert.equal((await getBookById('book_001')).libraryStatus, 'planned');
  assert.equal((await getBookById('book_019')).libraryStatus, 'finished');
});

test('ошибка записи не сообщает об успехе и не затирает предыдущее состояние', async () => {
  const storage = createMemoryStorage();
  configureStorage(storage);
  await readAppState();
  const original = await storage.getItem(storageKey);
  storage.setItem = async () => { throw new Error('Storage is full'); };
  await assert.rejects(() => updateAppState((state) => { state.libraryStatuses.book_001 = 'finished'; }));
  assert.equal((await readAppState()).libraryStatuses.book_001, undefined);
  assert.equal(await storage.getItem(storageKey), original);
});

test('«Не интересно» хранится на локальной полке и допускает возврат в каталог', async () => {
  await setLibraryStatus('book_001', 'not_interested');
  await reloadAppState();
  assert.ok(!(await getBooks()).items.some((book) => book.id === 'book_001'));
  assert.ok((await getLibrary({ includeNotInterested: true })).some((book) => book.id === 'book_001'));
  await setLibraryStatus('book_001', 'reading');
  assert.ok((await getBooks()).items.some((book) => book.id === 'book_001'));
});

test('offline сохраняется после рестарта, retry не даёт ложный успех, локальное чтение работает', async () => {
  await updateSettings({ offline: true });
  await reloadAppState();
  assert.equal((await getSettings()).offline, true);
  await assert.rejects(() => getBooks(), { code: 'offline' });
  await assert.rejects(() => searchAll('Арсений'), { code: 'offline' });
  await assert.rejects(() => getBooks(), { code: 'offline' });
  assert.ok((await getLibrary()).length);
  assert.ok((await getChapters('book_001')).length);
  assert.ok((await getChapter('book_001', 'book_001_ch_01')).text.length);
  await saveReadingProgress('book_001', 'book_001_ch_01', 40);
  assert.equal((await getReadingProgress('book_001')).percent, 40);
  await updateSettings({ offline: false });
  assert.ok((await getBooks()).total > 0);
});

test('подбор без условий не пуст и независим от текстового поиска', async () => {
  assert.equal((await getBooks()).total, 19);
  assert.equal((await getBooks({ search: 'нет такой книги' })).total, 19);
  assert.equal((await searchAll('нет такой книги')).books.length, 0);
  await getBooks({ genres: ['Темное фэнтези', 'Боевая фантастика'], access: 'free', status: 'ongoing' });
  assert.ok((await searchAll('киберпанк')).books.length > 0);
});
