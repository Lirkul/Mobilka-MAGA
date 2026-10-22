import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { preferenceGenres } from '../src/data/preferenceGenres.js';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey } from '../src/services/appState.js';
import { getBooks, getFavoriteGenres, getHomeFeed, searchAll, setFavoriteGenres, setLibraryStatus, updateSettings, mockApiControl } from '../src/services/mockApi.js';

beforeEach(async () => {
  configureStorage(createMemoryStorage());
  await mockApiControl.reset();
  mockApiControl.setLatency(0);
});

test('20 любимых жанров из референса не включают исключённую пользователем категорию', () => {
  assert.equal(preferenceGenres.length, 20);
  assert.equal(new Set(preferenceGenres.map((genre) => genre.value)).size, 20);
  assert.ok(preferenceGenres.every((genre) => !/эрот/i.test(genre.label)));
});

test('любимые жанры и сброс сохраняются после перезапуска, в том числе offline', async () => {
  await updateSettings({ offline: true });
  await setFavoriteGenres(['fantasy', 'detective', 'fantasy']);
  await reloadAppState();
  assert.deepEqual(await getFavoriteGenres(), ['fantasy', 'detective']);
  await setFavoriteGenres([]);
  await reloadAppState();
  assert.deepEqual(await getFavoriteGenres(), []);
  await assert.rejects(() => setFavoriteGenres(['unknown']), { status: 400 });
  await assert.rejects(() => setFavoriteGenres(null), { status: 400 });
  assert.deepEqual(await getFavoriteGenres(), []);
});

test('старое сохранение получает пустые предпочтения, сохраняя библиотеку и прогресс', async () => {
  const storage = createMemoryStorage();
  configureStorage(storage);
  const original = await readAppState();
  delete original.settings.favoriteGenres;
  await storage.setItem(storageKey, JSON.stringify(original));
  const restored = await reloadAppState();
  assert.deepEqual(restored.settings.favoriteGenres, []);
  assert.deepEqual(restored.libraryStatuses, original.libraryStatuses);
  assert.deepEqual(restored.progressByBook, original.progressByBook);
});

test('предпочтения поднимают подходящие книги в рекомендациях и учитывают «Не интересно»', async () => {
  const before = await getHomeFeed();
  await setFavoriteGenres(['detective']);
  const after = await getHomeFeed();
  assert.deepEqual(after.recommendations.slice(0, 2).map((book) => book.id), ['book_016', 'book_011']);
  assert.deepEqual(after.popular, before.popular);
  assert.deepEqual(after.hotNew, before.hotNew);
  await setLibraryStatus('book_016', 'not_interested');
  assert.equal((await getHomeFeed()).recommendations[0].id, 'book_011');
  assert.ok((await getHomeFeed()).recommendations.every((book) => book.id !== 'book_016'));
});

test('любимые жанры не добавляют условий к текстовому поиску и AND-подбору', async () => {
  const before = await getBooks();
  await setFavoriteGenres(['poetry', 'detective']);
  assert.deepEqual((await getBooks()).items, before.items);
  const filtered = await getBooks({ genres: ['Темное фэнтези', 'Боевая фантастика'], status: 'ongoing', access: 'free' });
  assert.deepEqual(filtered.items.map((book) => book.id).sort(), ['book_001', 'book_019']);
  assert.deepEqual((await searchAll('Город под чёрным солнцем')).books.map((book) => book.id), ['book_001']);
  // A category without fixture books is still selectable and does not fabricate results.
  await setFavoriteGenres(['poetry']);
  assert.deepEqual((await getHomeFeed()).recommendations, (await getHomeFeed()).popular);
});
