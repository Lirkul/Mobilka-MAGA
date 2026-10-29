export const libraryShelves = [
  { value: 'all', label: 'Все', icon: 'library' },
  { value: 'reading', label: 'Читаю / слушаю', icon: 'reading' },
  { value: 'planned', label: 'Отложено', icon: 'clock' },
  { value: 'finished', label: 'Прочитано', icon: 'doubleCheck' },
  { value: 'paid', label: 'Оплачено', icon: 'ruble' },
  { value: 'liked', label: 'Понравилось', icon: 'heart' },
  { value: 'reactions', label: 'Реакции', icon: 'sparkles' },
  { value: 'not_interested', label: 'Не интересно', icon: 'eyeOff' },
];

export const librarySortOptions = [
  { value: 'recent', label: 'По последнему чтению' },
  { value: 'title', label: 'По названию' },
  { value: 'author', label: 'По автору' },
  { value: 'updated', label: 'По обновлению' },
  { value: 'progress', label: 'По прогрессу чтения' },
];

export const createLibraryFilters = () => ({ genres: [], excludedGenres: [], format: 'any', status: 'any', access: 'any' });
