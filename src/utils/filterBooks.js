/**
 * Фильтрация каталога Author.Today (учебный мок).
 *
 * ВАЖНО:
 *  - между РАЗНЫМИ фильтрами логическое И (AND);
 *  - внутри множественных ВКЛЮЧАЮЩИХ полей genres/tags тоже И: every();
 *  - excludedGenres исключает книгу при совпадении с ЛЮБЫМ исключённым жанром;
 *  - одиночные настройки UI (format, status, access...) сравниваются напрямую;
 *  - «Электронная и аудио» = любой доступный формат, не требование обоих;
 *  - «Не интересно» по умолчанию полностью скрывается из каталога.
 */

import { expandBookGenres } from '../data/genreTree.js';

export const normalizeText = (value = '') =>
  String(value ?? '').toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();

const getAuthorName = (book, authors) =>
  (book.authorIds ?? [])
    .map((id) => authors.find((author) => author.id === id)?.name ?? '')
    .join(' ');

function passesDate(dateString, withinDays, now) {
  if (withinDays === undefined || withinDays === null || withinDays === 'any') return true;
  const days = Number(withinDays);
  if (!Number.isFinite(days) || days < 0) return false;
  const date = new Date(dateString).getTime();
  const reference = new Date(now).getTime();
  if (!Number.isFinite(date) || !Number.isFinite(reference)) return false;
  const diff = reference - date;
  // Не допускаем будущих дат; 0 = сегодня в рамках последних 24 часов.
  return diff >= 0 && diff <= (days === 0 ? 1 : days) * 86400000;
}

/**
 * @param {object[]} allBooks
 * @param {object} filters - см. src/data/filterOptions.js
 * @param {object} options - {authors, libraryStatuses, now, includeNotInterested}
 * @returns {object[]} новый массив книг, отсортированный по выбранному ключу
 */
export function filterBooks(allBooks, filters = {}, options = {}) {
  const {
    search = '', genres = [], excludedGenres = [], tags = [],
    format = 'any', sort = 'popularity', status = 'any',
    form = 'any', seriesStatus = 'any', seriesOrder = 'any',
    download = 'any', access = 'any',
    publishedWithinDays = null, updatedWithinDays = null,
    read = 'show', aiAssisted = 'any',
  } = filters;
  const {
    authors = [], libraryStatuses = {}, now = new Date(),
    includeNotInterested = false,
  } = options;

  const normalizedSearch = normalizeText(search);
  const normalizeList = (items) => (Array.isArray(items) ? items : []).map(normalizeText);
  const requestedGenres = normalizeList(genres);
  const blockedGenres = normalizeList(excludedGenres);
  const requestedTags = normalizeList(tags);

  const found = allBooks.filter((book) => {
    const bookGenres = expandBookGenres(book.genres);
    const bookTags = normalizeList(book.tags);
    const libraryState = libraryStatuses[book.id] ?? null;

    // Сохраняем историческое поведение «Не интересно»: исключается из выдачи.
    if (!includeNotInterested && libraryState === 'not_interested') return false;
    if (read === 'hide' && libraryState === 'finished') return false;

    // Текстовый поиск — одно поле поиска проверяется по нескольким полям книги.
    if (normalizedSearch) {
      const searchable = normalizeText([
        book.title, getAuthorName(book, authors),
        book.description, ...(book.genres ?? []), ...(book.tags ?? []),
      ].join(' '));
      if (!searchable.includes(normalizedSearch)) return false;
    }

    // ВСЕ выбранные жанры должны встречаться в книге.
    if (!requestedGenres.every((genre) => bookGenres.includes(genre))) return false;
    if (blockedGenres.some((genre) => bookGenres.includes(genre))) return false;
    // ВСЕ выбранные теги должны встречаться в книге.
    if (!requestedTags.every((tag) => bookTags.includes(tag))) return false;

    if (format !== 'any' && !(book.formats ?? []).includes(format)) return false;
    if (status !== 'any' && book.status !== status) return false;
    if (form !== 'any' && book.form !== form) return false;
    if (seriesStatus !== 'any' && book.seriesStatus !== seriesStatus) return false;
    if (seriesOrder === 'first' && book.seriesOrder !== 1) return false;
    if (download !== 'any' && book.download !== download) return false;
    // Подписка на цикл относится к платному доступу.
    if (access === 'free' && book.access !== 'free') return false;
    if (access === 'paid' && book.access === 'free') return false;
    if (aiAssisted === 'yes' && book.aiAssisted !== true) return false;
    if (aiAssisted === 'no' && book.aiAssisted !== false) return false;
    if (!passesDate(book.publishedAt, publishedWithinDays, now)) return false;
    if (!passesDate(book.updatedAt, updatedWithinDays, now)) return false;
    return true;
  });

  const scores = {
    popularity: (b) => b.stats?.libraryCount ?? 0,
    likes: (b) => b.stats?.likes ?? 0,
    views: (b) => b.stats?.views ?? 0,
    comments: (b) => b.stats?.comments ?? 0,
    trending: (b) => b.trendingScore ?? 0,
    newest: (b) => Date.parse(b.publishedAt) || 0,
  };
  const valueOf = scores[sort] ?? scores.popularity;
  return [...found].sort((a, b) => valueOf(b) - valueOf(a) || a.id.localeCompare(b.id));
}
