import test from 'node:test';
import assert from 'node:assert/strict';
import { filterBooks } from '../src/utils/filterBooks.js';
import { books } from '../src/data/books.js';
import { authors } from '../src/data/authors.js';
import { initialLibraryStatuses } from '../src/data/library.js';
import { getBooks, searchAll, getChapters, getChapter, setLibraryStatus, mockApiControl, MockApiError } from '../src/services/mockApi.js';

const options = { authors, libraryStatuses: initialLibraryStatuses, now: '2026-10-22T12:00:00Z' };
const ids = (items) => items.map((b) => b.id);

// Жанры должны объединяться по AND, не OR.
test('два выбранных жанра одновременно: книга должна иметь ОБА', () => {
  const result = filterBooks(books, {genres:['Темное фэнтези','Боевая фантастика']}, options);
  assert.ok(result.length >= 2);
  assert.ok(result.every((b) => b.genres.includes('Темное фэнтези') && b.genres.includes('Боевая фантастика')));
  assert.ok(!ids(result).includes('book_007')); // только темное фэнтези + мистика
});

test('включающие жанры + статус + доступ = AND', () => {
  const result = filterBooks(books, {
    genres:['Темное фэнтези','Боевая фантастика'], status:'ongoing', access:'free'
  }, options);
  assert.deepEqual(ids(result).sort(), ['book_001','book_019']);
});

test('исключение жанров блокирует любое совпадение', () => {
  const result = filterBooks(books, {genres:['Темное фэнтези'],excludedGenres:['Боевая фантастика']}, options);
  assert.ok(result.every((b) => !b.genres.includes('Боевая фантастика')));
});

test('многозначные теги также работают по AND', () => {
  const result = filterBooks(books, {tags:['выживание','магия']}, options);
  assert.deepEqual(ids(result), ['book_001']);
});

test('по умолчанию скрывает книги со статусом не интересно', () => {
  const result = filterBooks(books, {}, options);
  assert.ok(!ids(result).includes('book_012'));
});

test('режим скрывать прочитанное', () => {
  const result = filterBooks(books, {read:'hide'}, options);
  assert.ok(!ids(result).includes('book_008'));
});

test('формат ebook и audio — одиночный выбор, any не ограничивает', () => {
  const any = filterBooks(books, {format:'any'}, options);
  const audio = filterBooks(books, {format:'audio'}, options);
  assert.ok(any.length >= audio.length);
  assert.ok(audio.every((b) => b.formats.includes('audio')));
});

test('признак первой книги цикла', () => {
  const result = filterBooks(books, {seriesOrder:'first'}, options);
  assert.ok(result.length > 0);
  assert.ok(result.every((b) => b.seriesOrder === 1));
});

test('поиск не различает е и ё', () => {
  const result = filterBooks(books, {search:'черным солнцем'}, options);
  assert.ok(ids(result).includes('book_001'));
});

test('сортировка по лайкам', () => {
  const result = filterBooks(books, {sort:'likes'}, options);
  assert.ok(result.every((b,i) => i===0 || result[i-1].stats.likes >= b.stats.likes));
});

test('окно свежих обновлений использует дату и допускает инъекцию now', () => {
  const result = filterBooks(books, {updatedWithinDays:7}, options);
  assert.ok(result.length > 0);
  assert.ok(result.every((b) => Date.parse(b.updatedAt) >= Date.parse('2026-10-15T12:00:00Z')));
});

test('API возвращает загрузочные данные и допускает ошибку/повтор', async () => {
  mockApiControl.reset();
  mockApiControl.setLatency(0);
  const result = await getBooks({genres:['Темное фэнтези','Боевая фантастика'], status:'ongoing',access:'free'});
  assert.deepEqual(result.items.map((b) => b.id).sort(), ['book_001','book_019']);
  mockApiControl.failNextRequest();
  await assert.rejects(() => getBooks(), (err) => err instanceof MockApiError && err.status === 503);
  const next = await getBooks();
  assert.ok(next.total > 0);
});

test('изменение статуса не интересно немедленно исключает книгу', async () => {
  mockApiControl.reset(); mockApiControl.setLatency(0);
  await setLibraryStatus('book_001','not_interested');
  const matches = await getBooks({search:'чёрным солнцем'});
  assert.ok(!matches.items.some((b) => b.id === 'book_001'));
  mockApiControl.reset();
});

test('поиск по авторам и постам; чтение главы', async () => {
  mockApiControl.reset(); mockApiControl.setLatency(0);
  const results = await searchAll('Арсений');
  assert.ok(results.authors.some((a) => a.id === 'author_01'));
  const chapterList = await getChapters('book_001');
  assert.equal(chapterList.length, 6);
  const chapter = await getChapter('book_001',chapterList[0].id);
  assert.ok(chapter.text.length > 100);
});
