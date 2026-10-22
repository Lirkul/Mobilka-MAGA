import { authors } from '../data/authors.js';
import { books } from '../data/books.js';
import { chapters } from '../data/chapters.js';
import { comments } from '../data/comments.js';
import { posts } from '../data/posts.js';
import { series } from '../data/series.js';
import { initialLibraryStatuses, initialReadingProgress } from '../data/library.js';
import { defaultFilters, filterOptions } from '../data/filterOptions.js';
import { filterBooks, normalizeText } from '../utils/filterBooks.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
let currentLatencyMs = 240;
let failedNext = false;
let libraryStatuses = { ...initialLibraryStatuses };
let progressByBook = copy(initialReadingProgress);

export class MockApiError extends Error {
  constructor(message = 'Не удалось загрузить данные', status = 503) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
  }
}

async function response(dataFn) {
  await new Promise((resolve) => setTimeout(resolve, currentLatencyMs));
  if (failedNext) {
    failedNext = false;
    throw new MockApiError('Временная ошибка сервера. Повторите попытку.', 503);
  }
  return copy(dataFn());
}

const requireBook = (bookId) => {
  const book = books.find((item) => item.id === bookId);
  if (!book) throw new MockApiError('Книга не найдена', 404);
  return book;
};

const enrich = (book) => ({
  ...book,
  authorNames: book.authorIds.map((id) => authors.find((a) => a.id === id)?.name ?? 'Неизвестный автор'),
  libraryStatus: libraryStatuses[book.id] ?? null,
  readingProgress: progressByBook[book.id] ?? null,
});

// Управление демонстрационными состояниями для ДЗ3.
export const mockApiControl = {
  setLatency(ms) { currentLatencyMs = Math.max(0, Number(ms) || 0); },
  failNextRequest() { failedNext = true; },
  reset() {
    currentLatencyMs = 240;
    failedNext = false;
    libraryStatuses = { ...initialLibraryStatuses };
    progressByBook = copy(initialReadingProgress);
  },
};

/**
 * Каталог с фильтрами. Результат: {total, items, appliedFilters}
 * AND между критериями и внутри выбранных жанров/тегов.
 */
export async function getBooks(filters = {}) {
  return response(() => {
    const appliedFilters = { ...defaultFilters, ...filters };
    const matches = filterBooks(books, appliedFilters, { authors, libraryStatuses });
    return { total: matches.length, items: matches.map(enrich), appliedFilters };
  });
}

/** Поиск по книгам, авторам и постам — отдельный сценарий из ДЗ1. */
export async function searchAll(query) {
  return response(() => {
    const q = normalizeText(query);
    if (!q) return { query, books: [], authors: [], posts: [] };
    const foundBooks = filterBooks(books, { search: query }, { authors, libraryStatuses }).map(enrich);
    const foundAuthors = authors.filter((a) => normalizeText(a.name + ' ' + a.bio).includes(q));
    const foundPosts = posts.filter((p) => normalizeText(p.title + ' ' + p.excerpt + ' ' + (authors.find((a) => a.id === p.authorId)?.name || '')).includes(q));
    return { query, books: foundBooks, authors: foundAuthors, posts: foundPosts };
  });
}

export async function getBookById(bookId) {
  return response(() => enrich(requireBook(bookId)));
}

export async function getAuthorById(authorId) {
  return response(() => {
    const author = authors.find((a) => a.id === authorId);
    if (!author) throw new MockApiError('Автор не найден', 404);
    return { ...author, books: books.filter((b) => b.authorIds.includes(authorId)).map(enrich) };
  });
}

export async function getSeriesById(seriesId) {
  return response(() => {
    const item = series.find((s) => s.id === seriesId);
    if (!item) throw new MockApiError('Цикл не найден', 404);
    return { ...item, books: books.filter((b) => b.seriesId === seriesId).map(enrich) };
  });
}

export async function getChapters(bookId) {
  return response(() => {
    requireBook(bookId);
    return chapters.filter((c) => c.bookId === bookId).map(({text, ...chapter}) => chapter);
  });
}

export async function getChapter(bookId, chapterId) {
  return response(() => {
    const book = requireBook(bookId);
    const chapter = chapters.find((c) => c.id === chapterId && c.bookId === bookId);
    if (!chapter) throw new MockApiError('Глава не найдена', 404);
    // В демо доступ к платной части можно показать заглушкой, без реальной покупки.
    return { ...chapter, requiresPayment: !chapter.isFree && book.access !== 'free', titleOfBook: book.title };
  });
}

export async function getComments(bookId) {
  return response(() => {
    requireBook(bookId);
    return comments.filter((c) => c.bookId === bookId);
  });
}

export async function getLibrary() {
  return response(() => Object.entries(libraryStatuses)
    .filter(([id, status]) => status && status !== 'not_interested')
    .map(([id]) => books.find((book) => book.id === id))
    .filter(Boolean).map(enrich));
}

/** status: reading | planned | finished | not_interested | null */
export async function setLibraryStatus(bookId, status) {
  return response(() => {
    requireBook(bookId);
    const allowed = [null, 'reading', 'planned', 'finished', 'not_interested'];
    if (!allowed.includes(status)) throw new MockApiError('Недопустимый статус', 400);
    if (status === null) delete libraryStatuses[bookId];
    else libraryStatuses[bookId] = status;
    return { bookId, status };
  });
}

export async function saveReadingProgress(bookId, chapterId, percent) {
  return response(() => {
    requireBook(bookId);
    if (!chapters.some((c) => c.bookId === bookId && c.id === chapterId)) {
      throw new MockApiError('Глава не найдена', 404);
    }
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new MockApiError('Прогресс должен быть от 0 до 100', 400);
    }
    progressByBook[bookId] = { chapterId, percent };
    return { bookId, ...progressByBook[bookId] };
  });
}

export async function getReadingProgress(bookId) {
  return response(() => {
    requireBook(bookId);
    return progressByBook[bookId] ?? { chapterId: null, percent: 0 };
  });
}


export async function getFilterOptions() {
  return response(() => filterOptions);
}

export async function getHomeFeed() {
  return response(() => ({
    popular: [...books].sort((a,b) => b.stats.libraryCount - a.stats.libraryCount).slice(0, 8).map(enrich),
    hotNew: [...books].sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8).map(enrich),
    recommendations: [...books].filter((b) => libraryStatuses[b.id] !== 'not_interested').slice(0, 8).map(enrich),
  }));
}

export async function getAccessOptions(bookId) {
  return response(() => {
    const book = requireBook(bookId);
    const bookSeries = series.find((s) => s.id === book.seriesId);
    const options = [];
    if (book.access === 'paid') {
      options.push({type:'single_book',label:'Купить книгу',priceRub:book.priceRub});
    }
    if (book.access === 'series_subscription' && bookSeries) {
      options.push({type:'series_subscription',label:'Подписка на серию',priceRub:bookSeries.subscriptionPrice,seriesId:bookSeries.id});
    }
    return {bookId,canStartFree:book.freeChapters > 0,freeChapters:book.freeChapters,options};
  });
}
