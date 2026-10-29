import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { books } from '../src/data/books.js';
import { chapters } from '../src/data/chapters.js';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey } from '../src/services/appState.js';
import { getReadingProgress, saveReadingProgress, getBookById, getLibrary, getLibraryPage, getRecentBooks, getBooks, getHomeFeed, searchAll, mockApiControl } from '../src/services/mockApi.js';

beforeEach(async () => {
  configureStorage(createMemoryStorage());
  await mockApiControl.reset();
  mockApiControl.setLatency(0);
});

async function useSlowStorage() {
  const storage = createMemoryStorage();
  const write = storage.setItem;
  let failNextWrite = false;
  storage.setItem = async (key, value) => {
    await delay(30);
    if (failNextWrite) {
      failNextWrite = false;
      throw new Error('Storage is full');
    }
    await write(key, value);
  };
  configureStorage(storage);
  await readAppState();
  return { storage, failNextWrite() { failNextWrite = true; } };
}

test('immediate resume waits for both chapter writes before initializing the next reader', async () => {
  const { storage } = await useSlowStorage();
  const first = saveReadingProgress('book_001', 'book_001_ch_01', 67);
  const last = saveReadingProgress('book_001', 'book_001_ch_02', 19);
  const resumed = await getReadingProgress('book_001');
  assert.equal(resumed.chapterId, 'book_001_ch_02');
  assert.equal(resumed.percent, 19);
  await Promise.all([first, last]);

  // A reopened reader writes its initial position; stale chapter 1 must not return.
  await saveReadingProgress('book_001', resumed.chapterId, resumed.percent);
  await reloadAppState();
  const restored = await getReadingProgress('book_001');
  assert.equal(restored.chapterId, 'book_001_ch_02');
  assert.equal(restored.percent, 19);
  const persisted = JSON.parse(await storage.getItem(storageKey));
  assert.equal(persisted.progressByBook.book_001.chapterId, 'book_001_ch_02');
  assert.equal(persisted.progressByBook.book_001.percent, 19);
});

test('resume also waits for a chapter flush registered while storage is still writing', async () => {
  await useSlowStorage();
  const first = saveReadingProgress('book_019', 'book_019_ch_01', 94);
  const resumed = getReadingProgress('book_019');
  await delay(5);
  const nextChapter = saveReadingProgress('book_019', 'book_019_ch_02', 7);
  const progress = await resumed;
  assert.equal(progress.chapterId, 'book_019_ch_02');
  assert.equal(progress.percent, 7);
  await Promise.all([first, nextChapter]);
});

test('interleaved books preserve each book last chapter and durable progress', async () => {
  await useSlowStorage();
  const writes = [
    saveReadingProgress('book_001', 'book_001_ch_01', 35),
    saveReadingProgress('book_019', 'book_019_ch_01', 48),
    saveReadingProgress('book_001', 'book_001_ch_02', 6),
    saveReadingProgress('book_019', 'book_019_ch_02', 14),
  ];
  const [firstBook, secondBook] = await Promise.all([
    getReadingProgress('book_001'), getReadingProgress('book_019'),
  ]);
  assert.equal(firstBook.chapterId, 'book_001_ch_02');
  assert.equal(firstBook.percent, 6);
  assert.equal(secondBook.chapterId, 'book_019_ch_02');
  assert.equal(secondBook.percent, 14);
  await Promise.all(writes);
  await reloadAppState();
  assert.equal((await getReadingProgress('book_001')).percent, 6);
  assert.equal((await getReadingProgress('book_019')).percent, 14);
});

test('a durable failure rejects its save without breaking the following queued chapter', async () => {
  const { failNextWrite } = await useSlowStorage();
  failNextWrite();
  const failed = assert.rejects(saveReadingProgress('book_001', 'book_001_ch_01', 77), /Storage is full/);
  const saved = saveReadingProgress('book_001', 'book_001_ch_02', 23);
  const resumed = await getReadingProgress('book_001');
  assert.equal(resumed.chapterId, 'book_001_ch_02');
  assert.equal(resumed.percent, 23);
  await Promise.all([failed, saved]);
  await reloadAppState();
  assert.equal((await getReadingProgress('book_001')).percent, 23);
});

test('failed progress is not committed, and an explicit retry can be resumed immediately', async () => {
  const { storage, failNextWrite } = await useSlowStorage();
  await saveReadingProgress('book_001', 'book_001_ch_01', 12);
  failNextWrite();
  await assert.rejects(saveReadingProgress('book_001', 'book_001_ch_02', 31), /Storage is full/);
  assert.equal((await getReadingProgress('book_001')).chapterId, 'book_001_ch_01');
  assert.equal(JSON.parse(await storage.getItem(storageKey)).progressByBook.book_001.percent, 12);
  const retry = saveReadingProgress('book_001', 'book_001_ch_02', 31);
  assert.equal((await getReadingProgress('book_001')).percent, 31);
  await retry;
  await reloadAppState();
  assert.equal((await getReadingProgress('book_001')).chapterId, 'book_001_ch_02');
});

test('MockApiError and chapter/access/percent validation still reject without poisoning the queue', async () => {
  await useSlowStorage();
  mockApiControl.failNextRequest();
  await assert.rejects(saveReadingProgress('book_001', 'book_001_ch_01', 10), { name: 'MockApiError', status: 503 });
  await assert.rejects(saveReadingProgress('book_001', 'missing', 10), { status: 404 });
  await assert.rejects(saveReadingProgress('book_001', 'book_001_ch_01', 101), { status: 400 });
  const paidChapter = chapters.find((chapter) => !chapter.isFree && books.find((book) => book.id === chapter.bookId)?.access !== 'free');
  assert.ok(paidChapter);
  await assert.rejects(saveReadingProgress(paidChapter.bookId, paidChapter.id, 10), { status: 403 });
  const retry = saveReadingProgress('book_001', 'book_001_ch_02', 42);
  assert.equal((await getReadingProgress('book_001')).percent, 42);
  await retry;
});

test('book, library, home and search cards wait for the latest declared progress', async () => {
  await useSlowStorage();
  const first = saveReadingProgress('book_019', 'book_019_ch_01', 87);
  const last = saveReadingProgress('book_019', 'book_019_ch_02', 26);
  const [book, library, page, recent, catalog, home, search] = await Promise.all([
    getBookById('book_019'), getLibrary(), getLibraryPage(), getRecentBooks(),
    getBooks(), getHomeFeed(), searchAll('Тени кристального перевала'),
  ]);
  const findBook = (items) => items.find((item) => item.id === 'book_019');
  for (const item of [book, findBook(library), findBook(page.items), findBook(recent), findBook(catalog.items), findBook(home.popular), findBook(search.books)]) {
    assert.ok(item, 'book must be present');
    assert.equal(item.readingProgress.chapterId, 'book_019_ch_02');
    assert.equal(item.readingProgress.percent, 26);
  }
  await Promise.all([first, last]);
});

test('programmatic reset waits for pending progress so it cannot overwrite the reset afterwards', async () => {
  const { storage } = await useSlowStorage();
  const first = saveReadingProgress('book_001', 'book_001_ch_01', 55);
  const last = saveReadingProgress('book_001', 'book_001_ch_02', 9);
  await mockApiControl.reset();
  await Promise.all([first, last]);
  assert.equal((await getReadingProgress('book_001')).chapterId, null);
  await reloadAppState();
  assert.equal((await getReadingProgress('book_001')).percent, 0);
  assert.equal(JSON.parse(await storage.getItem(storageKey)).progressByBook.book_001, undefined);
});
