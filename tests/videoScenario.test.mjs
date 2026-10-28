import test from 'node:test';
import assert from 'node:assert/strict';
import { genreNames } from '../src/data/genreTree.js';
import { books } from '../src/data/books.js';
import { filterBooks } from '../src/utils/filterBooks.js';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState, storageKey } from '../src/services/appState.js';
import { updateSettings, getSettings, mockApiControl } from '../src/services/mockApi.js';

test('video genre tree has unique values and never adds the excluded adult category', () => {
  assert.equal(genreNames.length, new Set(genreNames).size);
  assert.ok(genreNames.length > 40);
  assert.ok(!genreNames.some(name => /эрот/i.test(name)));
  for (const name of ['Боевик', 'Детектив', 'Исторический детектив', 'Фантастика', 'Антиутопия', 'Фэнтези', 'Попаданцы', 'Поэзия']) assert.ok(genreNames.includes(name));
});

test('a parent is a broad condition, without requiring all of its children', () => {
  const sciFi = filterBooks(books, { genres: ['Фантастика'] });
  assert.ok(sciFi.some(book => book.id === 'book_001'));
  assert.ok(sciFi.some(book => book.genres.includes('Научная фантастика')));
  const both = filterBooks(books, { genres: ['Фантастика', 'Темное фэнтези'], status: 'ongoing', access: 'free' });
  assert.deepEqual(both.map(book => book.id).sort(), ['book_001', 'book_019']);
  const leaves = filterBooks(books, { genres: ['Темное фэнтези', 'Боевая фантастика'], status: 'ongoing', access: 'free' });
  assert.deepEqual(leaves.map(book => book.id).sort(), ['book_001', 'book_019']);
});

test('excluding a parent excludes every descendant, while other conditions remain AND', () => {
  assert.deepEqual(filterBooks(books, { genres: ['Боевая фантастика'], excludedGenres: ['Фантастика'] }), []);
  assert.deepEqual(filterBooks(books, { genres: ['Темное фэнтези'], excludedGenres: ['Фэнтези'] }), []);
  assert.deepEqual(filterBooks(books, { genres: ['Антиутопия', 'Боевая фантастика'] }), []);
});

test('old reader settings gain controls without losing library, progress or font/theme', async () => {
  const storage = createMemoryStorage(); configureStorage(storage); await mockApiControl.reset();
  const original = await readAppState();
  original.settings.reader = { fontSize: 22, theme: 'dark' };
  await storage.setItem(storageKey, JSON.stringify(original));
  const restored = await reloadAppState();
  assert.equal(restored.settings.reader.fontSize, 22); assert.equal(restored.settings.reader.theme, 'dark');
  assert.equal(restored.settings.reader.brightness, 85); assert.equal(restored.settings.reader.alignment, 'justify');
  assert.deepEqual(restored.progressByBook, original.progressByBook); assert.deepEqual(restored.libraryStatuses, original.libraryStatuses);
  await updateSettings({ reader: { theme: 'sepia', brightness: 32, brightnessGestures: true, font: 'serif', readingMode: 'paged', alignment: 'left' } });
  await reloadAppState();
  const { reader } = await getSettings();
  assert.equal(reader.fontSize, 22); assert.equal(reader.theme, 'sepia'); assert.equal(reader.font, 'serif');
  assert.equal(reader.brightness, 32); assert.equal(reader.readingMode, 'paged'); assert.equal(reader.alignment, 'left');
  assert.deepEqual((await readAppState()).progressByBook, original.progressByBook);
});
