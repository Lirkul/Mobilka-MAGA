import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../src/data/chapters.js';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey } from '../src/services/appState.js';
import { getBookById, getChapters, getLibraryPage, getReadingProgress, getRecentBooks, mockApiControl, saveReadingProgress } from '../src/services/mockApi.js';
import { getBookPercent } from '../src/utils/bookProgress.js';

const own = bookId => chapters.filter(chapter => chapter.bookId === bookId).sort((a, b) => a.number - b.number);
const expected = (bookId, number, percent) => {
  const list = own(bookId), total = list.reduce((sum, chapter) => sum + chapter.text.length, 0);
  const read = list.slice(0, number - 1).reduce((sum, chapter) => sum + chapter.text.length, 0) + list[number - 1].text.length * percent / 100;
  return number === list.length && percent === 100 ? 100 : Math.min(99, Math.round(read / total * 100));
};
beforeEach(async () => { configureStorage(createMemoryStorage()); await mockApiControl.reset(); mockApiControl.setLatency(0); });

test('главы разной длины имеют разный вес; порядок входных метаданных не влияет на расчёт', () => {
  const list = [{ id: 'long', number: 2, textLength: 900 }, { id: 'short', number: 1, textLength: 100 }];
  assert.equal(getBookPercent(list, 'short', 0), 0);
  assert.equal(getBookPercent(list, 'short', 100), 10);
  assert.equal(getBookPercent(list, 'long', 0), 10);
  assert.equal(getBookPercent(list, 'long', 50), 55);
  assert.equal(getBookPercent(list, 'long', 100), 100);
});

test('отсутствие позиции/текста означает 0%, значения ограничены 0–100', () => {
  assert.equal(getBookPercent([], null, 100), 0);
  assert.equal(getBookPercent([{ id: 'empty', number: 1, textLength: 0 }], 'empty', 100), 0);
  const list = [{ id: 'chapter', number: 1, textLength: 1000 }];
  assert.equal(getBookPercent(list, 'missing', 100), 0);
  assert.equal(getBookPercent(list, 'chapter', -10), 0);
  assert.equal(getBookPercent(list, 'chapter', NaN), 0);
  assert.equal(getBookPercent(list, 'chapter', 101), 100);
});

test('конец первой главы означает часть книги; начало следующей сохраняет общий процент', async () => {
  const first = await saveReadingProgress('book_001', 'book_001_ch_01', 100);
  assert.equal(first.bookPercent, expected('book_001', 1, 100));
  assert.ok(first.bookPercent > 0 && first.bookPercent < 100);
  const second = await saveReadingProgress('book_001', 'book_001_ch_02', 0);
  assert.equal(second.bookPercent, first.bookPercent);
  assert.equal(second.percent, 0); // Chapter position remains suitable for resuming.
});

test('общий процент учитывает длину глав и одинаков в книге, библиотеке и последних книгах', async () => {
  await saveReadingProgress('book_019', 'book_019_ch_02', 63);
  const progress = await getReadingProgress('book_019');
  assert.equal(progress.bookPercent, expected('book_019', 2, 63));
  assert.equal(progress.percent, 63);
  assert.deepEqual((await getBookById('book_019')).readingProgress, progress);
  assert.deepEqual((await getRecentBooks())[0].readingProgress, progress);
  assert.deepEqual((await getLibraryPage({ shelf: 'reading' })).items.find(book => book.id === 'book_019').readingProgress, progress);
});

test('100% доступны только в конце последней главы; платные главы входят в объём всей книги', async () => {
  await saveReadingProgress('book_001', 'book_001_ch_06', 99.99);
  assert.equal((await getReadingProgress('book_001')).bookPercent, 99);
  await saveReadingProgress('book_001', 'book_001_ch_06', 100);
  assert.equal((await getReadingProgress('book_001')).bookPercent, 100);
  await saveReadingProgress('book_002', 'book_002_ch_02', 100);
  assert.equal((await getReadingProgress('book_002')).bookPercent, expected('book_002', 2, 100));
  assert.ok((await getReadingProgress('book_002')).bookPercent < 100);
  const list = await getChapters('book_002');
  assert.ok(list.every(chapter => !('text' in chapter)));
  assert.deepEqual(list.map(chapter => chapter.textLength), own('book_002').map(chapter => chapter.text.length));
});

test('старое сохранение восстанавливает точную главу/позицию и получает общий процент без перезаписи', async () => {
  const storage = createMemoryStorage(); configureStorage(storage); await mockApiControl.reset();
  const state = await readAppState();
  state.progressByBook.book_001 = { bookId: 'book_001', chapterId: 'book_001_ch_03', percent: 42, lastReadAt: '2026-10-20T12:00:00Z', updatedAt: '2026-10-20T12:00:00Z' };
  await storage.setItem(storageKey, JSON.stringify(state)); await reloadAppState();
  const progress = await getReadingProgress('book_001');
  assert.equal(progress.chapterId, 'book_001_ch_03'); assert.equal(progress.percent, 42);
  assert.equal(progress.bookPercent, expected('book_001', 3, 42));
  assert.deepEqual((await readAppState()).progressByBook, state.progressByBook);
  assert.deepEqual((await readAppState()).libraryStatuses, state.libraryStatuses);
});

test('сортировка библиотеки сравнивает книгу целиком, не локальную позицию в главе', async () => {
  await saveReadingProgress('book_001', 'book_001_ch_06', 0);
  await saveReadingProgress('book_019', 'book_019_ch_01', 100);
  const page = await getLibraryPage({ shelf: 'reading', sort: 'progress' });
  assert.deepEqual(page.items.filter(book => ['book_001', 'book_019'].includes(book.id)).map(book => book.id), ['book_001', 'book_019']);
});
