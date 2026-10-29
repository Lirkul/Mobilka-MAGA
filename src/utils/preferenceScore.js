import { preferenceGenres } from '../data/preferenceGenres.js';
import { normalizeText } from './filterBooks.js';

// Interests rank recommendations; exact AND filters still belong to discovery.
export function getPreferenceScore(book, favorites) {
  const terms = [...book.genres, ...(book.tags || [])].map(normalizeText);
  return preferenceGenres.reduce((score, genre) => score + Number(
    favorites.includes(genre.value) && genre.terms.some((term) => terms.some((value) => value.includes(term))),
  ), 0);
}
