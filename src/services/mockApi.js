import { authors } from '../data/authors.js';
import { books } from '../data/books.js';
import { chapters } from '../data/chapters.js';
import { comments } from '../data/comments.js';
import { posts } from '../data/posts.js';
import { series } from '../data/series.js';
import { defaultFilters, filterOptions } from '../data/filterOptions.js';
import { preferenceGenres } from '../data/preferenceGenres.js';
import { currentUser } from '../data/currentUser.js';
import { filterBooks, normalizeText } from '../utils/filterBooks.js';
import { getPreferenceScore } from '../utils/preferenceScore.js';
import { getLibraryView } from '../utils/libraryView.js';
import { getBookPercent } from '../utils/bookProgress.js';
import { readAppState, updateAppState, resetAppState } from './appState.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
let latencyOverride = null;
let failedNext = false;
let nextNetworkOnly = false;
const pendingReadingProgress = new Map();

function enqueueReadingProgress(bookId, save) {
  // Register synchronously, before response/storage awaits can let a reader resume.
  const operation = (pendingReadingProgress.get(bookId) ?? Promise.resolve()).then(save);
  const settled = operation.then(() => {}, () => {});
  pendingReadingProgress.set(bookId, settled);
  settled.then(() => {
    if (pendingReadingProgress.get(bookId) === settled) pendingReadingProgress.delete(bookId);
  });
  return operation;
}

async function waitForReadingProgress(bookId) {
  // A later flush may be registered while the previous durable write is pending.
  while (pendingReadingProgress.has(bookId)) await pendingReadingProgress.get(bookId);
}

async function waitForAllReadingProgress() {
  while (pendingReadingProgress.size) await Promise.all(pendingReadingProgress.values());
}

export class MockApiError extends Error {
  constructor(message = 'Не удалось загрузить данные', status = 503, code = 'server') {
    super(message);
    this.name = 'MockApiError'; this.status = status; this.code = code;
  }
}

async function response(dataFn, local = false) {
  const before = await readAppState();
  await new Promise((resolve) => setTimeout(resolve, local ? 0 : latencyOverride ?? before.settings.latencyMs));
  const state = await readAppState();
  if (!local && state.settings.offline) throw new MockApiError('Нет подключения к интернету', 0, 'offline');
  if (failedNext && (!nextNetworkOnly || !local)) { failedNext = false; throw new MockApiError('Временная ошибка сервера. Повторите попытку.'); }
  return copy(await dataFn(state));
}

const requireBook = (id) => {
  const book = books.find((item) => item.id === id);
  if (!book) throw new MockApiError('Книга не найдена', 404);
  return book;
};
const requireAuthor = (id) => {
  const author = authors.find((item) => item.id === id);
  if (!author) throw new MockApiError('Автор не найден', 404);
  return author;
};
const bookChapters = (bookId) => chapters.filter(chapter => chapter.bookId === bookId);
const enrichProgress = (bookId, progress) => progress ? {
  ...progress,
  // percent remains the persisted position within chapterId for legacy saves.
  bookPercent: getBookPercent(bookChapters(bookId), progress.chapterId, progress.percent),
} : null;
const enrich = (book, state) => ({ ...book,
  textLength: chapters.filter((chapter) => chapter.bookId === book.id).reduce((length, chapter) => length + chapter.text.length, 0),
  seriesTitle: series.find((item) => item.id === book.seriesId)?.title || null,
  authorNames: book.authorIds.map((id) => requireAuthor(id).name),
  libraryStatus: state.libraryStatuses[book.id] ?? null,
  userLiked: state.bookFeedback[book.id]?.liked === true,
  userReaction: state.bookFeedback[book.id]?.reaction || null,
  isPurchased: state.purchasedBookIds.includes(book.id),
  readingProgress: enrichProgress(book.id, state.progressByBook[book.id]),
});
const visibleBooks = (state) => books.filter((book) => state.libraryStatuses[book.id] !== 'not_interested');
const enrichAuthor = (author, state) => ({ ...author, subscribed: state.subscriptions[author.id] ?? author.subscribed });

export const mockApiControl = {
  setLatency(ms) { latencyOverride = Math.max(0, Number(ms) || 0); },
  failNextRequest({ networkOnly = false } = {}) { failedNext = true; nextNetworkOnly = networkOnly; },
  reset() {
    latencyOverride = null; failedNext = false; nextNetworkOnly = false;
    return waitForAllReadingProgress().then(() => resetAppState());
  },
};

export async function getBooks(filters = {}) {
  await waitForAllReadingProgress();
  return response((state) => {
    // Text search deliberately cannot leak into discovery.
    const appliedFilters = { ...defaultFilters, ...filters, search: '' };
    const matches = state.settings.emptyResults ? [] : filterBooks(books, appliedFilters, { authors, libraryStatuses: state.libraryStatuses });
    return { total: matches.length, items: matches.map((book) => enrich(book, state)), appliedFilters };
  });
}

export async function searchAll(query) {
  await waitForAllReadingProgress();
  return response((state) => {
    const q = normalizeText(query);
    if (!q || state.settings.emptyResults) return { query, books: [], authors: [], posts: [] };
    return { query,
      books: filterBooks(books, { search: query }, { authors, libraryStatuses: state.libraryStatuses }).map((book) => enrich(book, state)),
      authors: authors.filter((a) => normalizeText(a.name + ' ' + a.bio).includes(q)).map((author) => enrichAuthor(author, state)),
      posts: posts.filter((p) => normalizeText(p.title + ' ' + p.excerpt + ' ' + requireAuthor(p.authorId).name).includes(q)),
    };
  });
}

// Book metadata and all bundled teaching chapters are available offline.
export async function getBookById(id) {
  await waitForReadingProgress(id);
  return response((state) => enrich(requireBook(id), state), true);
}
export async function getAuthorById(id) {
  await waitForAllReadingProgress();
  return response((state) => ({ ...enrichAuthor(requireAuthor(id), state),
    note: state.authorNotes[id] || '',
    books: visibleBooks(state).filter((book) => book.authorIds.includes(id)).map((book) => enrich(book, state)),
    posts: posts.filter((post) => post.authorId === id).map((post) => ({ ...post, liked: !!state.reactions[post.id] })),
    illustrations: books.filter((book) => book.authorIds.includes(id)).map((book) => ({ id: `${book.id}-art`, bookId: book.id, coverKey: book.coverKey, title: book.title })),
  }));
}
export async function getSeriesById(id) {
  await waitForAllReadingProgress();
  return response((state) => {
    const item = series.find((s) => s.id === id);
    if (!item) throw new MockApiError('Цикл не найден', 404);
    return { ...item, books: visibleBooks(state).filter((book) => book.seriesId === id).map((book) => enrich(book, state)) };
  }, true);
}
export async function getPostById(id) {
  return response((state) => {
    const post = posts.find((item) => item.id === id);
    if (!post) throw new MockApiError('Пост не найден', 404);
    return { ...post, liked: !!state.reactions[id], author: enrichAuthor(requireAuthor(post.authorId), state) };
  });
}
export async function getChapters(bookId) {
  return response(() => { requireBook(bookId); return bookChapters(bookId).map(({ text, ...item }) => ({ ...item, textLength: text.length })); }, true);
}
export async function getChapter(bookId, chapterId) {
  return response(() => {
    const book = requireBook(bookId);
    const chapter = chapters.find((c) => c.id === chapterId && c.bookId === bookId);
    if (!chapter) throw new MockApiError('Глава не найдена', 404);
    return { ...chapter, requiresPayment: !chapter.isFree && book.access !== 'free', titleOfBook: book.title };
  }, true);
}
export async function getComments(bookId) { return response(() => { requireBook(bookId); return comments.filter((c) => c.bookId === bookId); }, true); }

export async function getLibrary({ includeNotInterested = false } = {}) {
  await waitForAllReadingProgress();
  return response((state) => Object.entries(state.libraryStatuses)
    .filter(([, status]) => status && (includeNotInterested || status !== 'not_interested'))
    .map(([id]) => books.find((book) => book.id === id)).filter(Boolean).map((book) => enrich(book, state)), true);
}
export async function setLibraryStatus(bookId, status) {
  return response(async () => {
    requireBook(bookId);
    if (![null, 'reading', 'planned', 'finished', 'not_interested'].includes(status)) throw new MockApiError('Недопустимый статус', 400);
    await updateAppState((state) => {
      if (status === null) delete state.libraryStatuses[bookId];
      else state.libraryStatuses[bookId] = status;
    });
    return { bookId, status };
  }, true);
}
export async function getLibraryPage(options = {}) {
  await waitForAllReadingProgress();
  return response((state) => {
    const library = books.map((book) => enrich(book, state)).filter((book) => book.libraryStatus || book.userLiked || book.userReaction || book.isPurchased);
    return getLibraryView(library, options);
  }, true);
}
export async function saveReadingProgress(bookId, chapterId, percent) {
  return enqueueReadingProgress(bookId, () => response(async () => {
    const book = requireBook(bookId);
    const chapter = chapters.find((c) => c.bookId === bookId && c.id === chapterId);
    if (!chapter) throw new MockApiError('Глава не найдена', 404);
    if (!chapter.isFree && book.access !== 'free') throw new MockApiError('Платная глава недоступна', 403);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new MockApiError('Прогресс должен быть от 0 до 100', 400);
    const now = new Date().toISOString();
    const progress = { bookId, chapterId, percent, lastReadAt: now, updatedAt: now };
    await updateAppState((state) => {
      state.progressByBook[bookId] = progress;
      if (!state.libraryStatuses[bookId] || state.libraryStatuses[bookId] === 'planned') state.libraryStatuses[bookId] = 'reading';
    });
    return enrichProgress(bookId, progress);
  }, true));
}
export async function getReadingProgress(bookId) {
  await waitForReadingProgress(bookId);
  return response((state) => { requireBook(bookId); return enrichProgress(bookId, state.progressByBook[bookId] ?? { bookId, chapterId: null, percent: 0, lastReadAt: null, updatedAt: null }); }, true);
}
export async function getRecentBooks() {
  await waitForAllReadingProgress();
  return response((state) => visibleBooks(state).filter((book) => state.progressByBook[book.id])
    .sort((a, b) => Date.parse(state.progressByBook[b.id].lastReadAt || '') - Date.parse(state.progressByBook[a.id].lastReadAt || ''))
    .map((book) => enrich(book, state)), true);
}
export async function getFilterOptions() { return response(() => filterOptions); }
export async function getHomeFeed() {
  await waitForAllReadingProgress();
  return response((state) => {
    const available = state.settings.emptyResults ? [] : visibleBooks(state);
    return {
      popular: [...available].sort((a, b) => b.stats.libraryCount - a.stats.libraryCount).slice(0, 8).map((book) => enrich(book, state)),
      hotNew: [...available].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 8).map((book) => enrich(book, state)),
      recommendations: [...available].sort((a, b) => (
        getPreferenceScore(b, state.settings.favoriteGenres) - getPreferenceScore(a, state.settings.favoriteGenres)
        || b.stats.libraryCount - a.stats.libraryCount
      )).slice(0, 8).map((book) => enrich(book, state)),
    };
  });
}
export async function getAccessOptions(bookId) {
  return response(() => {
    const book = requireBook(bookId); const cycle = series.find((s) => s.id === book.seriesId);
    const options = [];
    if (book.access === 'paid') options.push({ type: 'single_book', label: 'Купить книгу', priceRub: book.priceRub });
    if (book.access === 'series_subscription' && cycle) options.push({ type: 'series_subscription', label: 'Подписка на серию', priceRub: cycle.subscriptionPrice, seriesId: cycle.id });
    return { bookId, canStartFree: book.freeChapters > 0, freeChapters: book.freeChapters, options };
  }, true);
}

export async function getSettings() { return (await readAppState()).settings; }
export async function getCurrentUser() { return { ...currentUser, signedIn: (await readAppState()).settings.signedIn }; }
export async function setSignedIn(signedIn) {
  await updateAppState((state) => { state.settings.signedIn = !!signedIn; });
  return getCurrentUser();
}
export async function getFavoriteGenres() { return [...(await readAppState()).settings.favoriteGenres]; }
export async function setFavoriteGenres(values) {
  if (!Array.isArray(values) || values.some((value) => !preferenceGenres.some((genre) => genre.value === value))) {
    throw new MockApiError('Неизвестный любимый жанр', 400);
  }
  const selected = [...new Set(values)];
  await updateAppState((state) => { state.settings.favoriteGenres = selected; });
  return [...selected];
}
export async function updateSettings(settings) {
  const allowed = {};
  if (typeof settings.offline === 'boolean') allowed.offline = settings.offline;
  if (typeof settings.emptyResults === 'boolean') allowed.emptyResults = settings.emptyResults;
  if (Number.isFinite(settings.latencyMs)) allowed.latencyMs = Math.max(0, Math.min(3000, settings.latencyMs));
  if (settings.reader) allowed.reader = { ...(await getSettings()).reader, ...settings.reader };
  return (await updateAppState((state) => { state.settings = { ...state.settings, ...allowed }; })).settings;
}
export async function setAuthorSubscription(id, subscribed) {
  return response(async () => { requireAuthor(id); await updateAppState((state) => { state.subscriptions[id] = !!subscribed; }); return { subscribed: !!subscribed }; });
}
export async function saveAuthorNote(id, note) {
  requireAuthor(id); await updateAppState((state) => { state.authorNotes[id] = String(note).slice(0, 500); });
}
export async function setPostReaction(id, liked) {
  return response(async () => {
    if (!posts.some((post) => post.id === id)) throw new MockApiError('Пост не найден', 404);
    await updateAppState((state) => { state.reactions[id] = !!liked; });
    return { liked: !!liked };
  });
}
