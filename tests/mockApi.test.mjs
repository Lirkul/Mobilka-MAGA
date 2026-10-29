import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { books, authors, chapters, comments, posts, series } from '../src/data/index.js';
import {
  getBooks, getHomeFeed, searchAll, getBookById, getAuthorById, getSeriesById,
  getPostById, getLibrary, getChapters, getChapter, getReadingProgress,
  saveReadingProgress, setLibraryStatus, mockApiControl, MockApiError,
} from '../src/services/mockApi.js';

beforeEach(() => {
  mockApiControl.reset();
  mockApiControl.setLatency(0);
});

test('все фикстуры и изображения связаны с существующими книгами и авторами', async () => {
  assert.equal(books.length, 20);
  assert.equal(authors.length, 8);
  assert.equal(chapters.length, 120);
  assert.equal(comments.length, 60);
  assert.equal(posts.length, 4);
  assert.equal(series.length, 3);
  assert.equal(new Set(books.map((book) => book.id)).size, 20);
  for (const book of books) {
    assert.ok(book.authorIds.every((id) => authors.some((author) => author.id === id)));
    assert.ok(!book.seriesId || series.some((item) => item.id === book.seriesId));
    assert.equal(chapters.filter((chapter) => chapter.bookId === book.id).length, 6);
    assert.equal(comments.filter((comment) => comment.bookId === book.id).length, 3);
    await access(new URL(`../assets/mock-covers/${book.coverKey}.png`, import.meta.url));
  }
  for (const author of authors) {
    await access(new URL(`../assets/mock-avatars/${author.avatarKey}.png`, import.meta.url));
  }
});

test('несколько жанров, статус и доступ дают строго book_001 и book_019', async () => {
  const result = await getBooks({
    genres: ['Тёмное фэнтези', 'Боевая фантастика'], status: 'ongoing', access: 'free',
  });
  assert.equal(result.total, 2);
  assert.deepEqual(result.items.map((book) => book.id).sort(), ['book_001', 'book_019']);
  const excluded = await getBooks({
    genres: ['Темное фэнтези'], excludedGenres: ['Боевая фантастика'],
  });
  assert.ok(excluded.total > 0);
  assert.ok(excluded.items.every((book) => !book.genres.includes('Боевая фантастика')));
});

test('«Не интересно» скрывает книгу во всех последующих списках и поиске', async () => {
  for (const id of ['book_001', 'book_002', 'book_020']) {
    await setLibraryStatus(id, 'not_interested');
  }
  const hidden = new Set(['book_001', 'book_002', 'book_012', 'book_020']);
  const [catalog, home, search, author, cycle, library] = await Promise.all([
    getBooks(), getHomeFeed(), searchAll('Арсений'), getAuthorById('author_01'),
    getSeriesById('ember'), getLibrary(),
  ]);
  for (const list of [catalog.items, ...Object.values(home), search.books, author.books, cycle.books, library]) {
    assert.ok(list.every((book) => !hidden.has(book.id)));
  }
  assert.equal((await getBookById('book_001')).libraryStatus, 'not_interested');
  await setLibraryStatus('book_001', null);
  assert.ok((await getBooks()).items.some((book) => book.id === 'book_001'));
});

test('текстовый поиск находит автора, его книги и посты; пустой запрос безопасен', async () => {
  const result = await searchAll(' Арсений ');
  assert.ok(result.authors.some((author) => author.id === 'author_01'));
  assert.ok(result.books.some((book) => book.id === 'book_001'));
  assert.ok(result.posts.some((post) => post.id === 'post_001'));
  assert.deepEqual(await searchAll('   '), { query: '   ', books: [], authors: [], posts: [] });
  const post = await getPostById('post_001');
  assert.equal(post.author.id, 'author_01');
});

test('ошибка одного запроса не изменяет состояние; повторный запрос проходит', async () => {
  mockApiControl.failNextRequest();
  await assert.rejects(() => setLibraryStatus('book_001', 'not_interested'), (error) => (
    error instanceof MockApiError && error.status === 503
  ));
  const retried = await getBookById('book_001');
  assert.equal(retried.libraryStatus, null);
  await setLibraryStatus('book_001', 'reading');
  assert.equal((await getBookById('book_001')).libraryStatus, 'reading');
});

test('читалка получает текст, сохраняет главу и прогресс, проверяет входные данные', async () => {
  const list = await getChapters('book_001');
  assert.equal(list.length, 6);
  assert.ok(list.every((chapter) => !('text' in chapter)));
  const next = await getChapter('book_001', list[1].id);
  assert.ok(next.text.length > 100);
  assert.equal(next.requiresPayment, false);
  await saveReadingProgress('book_001', next.id, 24);
  const progress = await getReadingProgress('book_001');
  assert.equal(progress.bookId, 'book_001');
  assert.equal(progress.chapterId, next.id);
  assert.equal(progress.percent, 24);
  assert.ok(Number.isFinite(Date.parse(progress.lastReadAt)));
  assert.deepEqual((await getBookById('book_001')).readingProgress, progress);
  await assert.rejects(() => saveReadingProgress('book_001', next.id, 101), { status: 400 });
  await assert.rejects(() => getChapter('book_001', 'book_002_ch_01'), { status: 404 });
  await assert.rejects(() => setLibraryStatus('book_001', 'unknown'), { status: 400 });
});

test('результаты API не дают изменять общие фикстуры извне', async () => {
  const response = await getBookById('book_001');
  response.title = 'Изменённый заголовок';
  response.genres.push('Изменённый жанр');
  const again = await getBookById('book_001');
  assert.equal(again.title, 'Город под чёрным солнцем');
  assert.ok(!again.genres.includes('Изменённый жанр'));
});
