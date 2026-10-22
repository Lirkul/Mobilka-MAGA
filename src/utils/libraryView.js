import { libraryShelves } from '../data/libraryShelves.js';
import { filterBooks, normalizeText } from './filterBooks.js';

function belongsToShelf(book, shelf) {
  if (shelf === 'not_interested') return book.libraryStatus === 'not_interested';
  if (book.libraryStatus === 'not_interested') return false;
  if (shelf === 'all') return true;
  if (shelf === 'paid') return book.isPurchased === true;
  if (shelf === 'liked') return book.userLiked === true;
  if (shelf === 'reactions') return !!book.userReaction;
  return book.libraryStatus === shelf;
}

// Counts describe the whole library; search/filter narrow only the selected shelf.
export function getLibraryView(library, { shelf = 'reading', query = '', filters = {}, sort = 'recent' } = {}) {
  const counts = Object.fromEntries(libraryShelves.map(({ value }) => [value, library.filter((book) => belongsToShelf(book, value)).length]));
  const q = normalizeText(query);
  const candidates = library.filter((book) => belongsToShelf(book, shelf)
    && (!q || normalizeText([book.title, ...book.authorNames].join(' ')).includes(q)));
  const libraryStatuses = Object.fromEntries(library.map((book) => [book.id, book.libraryStatus]));
  const items = filterBooks(candidates, { ...filters, search: '' }, { includeNotInterested: true, libraryStatuses });
  const time = (value) => Date.parse(value || '') || 0;
  const comparators = {
    recent: (a, b) => time(b.readingProgress?.lastReadAt) - time(a.readingProgress?.lastReadAt),
    title: (a, b) => a.title.localeCompare(b.title, 'ru'),
    author: (a, b) => a.authorNames.join(', ').localeCompare(b.authorNames.join(', '), 'ru'),
    updated: (a, b) => time(b.updatedAt) - time(a.updatedAt),
    progress: (a, b) => (b.readingProgress?.percent || 0) - (a.readingProgress?.percent || 0),
  };
  const compare = comparators[sort] || comparators.recent;
  items.sort((a, b) => compare(a, b) || a.title.localeCompare(b.title, 'ru') || a.id.localeCompare(b.id));
  return { shelf, counts, total: items.length, items };
}
