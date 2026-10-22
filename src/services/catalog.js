import { books } from '../data/books';

const normalize = (text) => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');

// Separate entry points allow each flow to acquire its own API/route later.
export function searchBooksByTitle(title) {
  const query = normalize(title);
  return query ? books.filter((book) => normalize(book.title).includes(query)) : [];
}

export function discoverBooks(filters) {
  return books.filter((book) => (
    (!filters.genres.length || filters.genres.some((genre) => book.genres.includes(genre))) &&
    !filters.excludedGenres.some((genre) => book.genres.includes(genre)) &&
    (filters.format === 'any' || book.format === filters.format) &&
    (filters.status === 'any' || book.status === filters.status) &&
    (filters.form === 'any' || book.form === filters.form) &&
    (filters.access === 'any' || book.access === filters.access)
  )).sort((a, b) => filters.sort === 'title'
    ? a.title.localeCompare(b.title, 'ru')
    : b.popularity - a.popularity);
}
