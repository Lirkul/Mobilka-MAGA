export const genreOptions = [
  { value: 'fantasy', label: 'Фэнтези' },
  { value: 'dark-fantasy', label: 'Темное фэнтези' },
  { value: 'urban', label: 'Городское фэнтези' },
  { value: 'action', label: 'Боевик' },
  { value: 'litrpg', label: 'ЛитРПГ' },
  { value: 'history', label: 'Альтернативная история' },
  { value: 'contemporary', label: 'Современная проза' },
];

export const filterFields = [
  { key: 'genres', label: 'Жанр', title: 'Выбрать жанры', multiple: true, options: genreOptions },
  { key: 'excludedGenres', label: 'Исключить жанры', title: 'Исключить жанры', multiple: true, options: genreOptions },
  { key: 'format', label: 'Формат', options: [
    { value: 'any', label: 'Электронная и аудио' }, { value: 'ebook', label: 'Электронная книга' }, { value: 'audio', label: 'Аудиокнига' },
  ] },
  { key: 'sort', label: 'Сортировать', options: [
    { value: 'popular', label: 'по популярности' }, { value: 'title', label: 'по названию' },
  ] },
];

export const additionalFields = [
  { key: 'status', label: 'Статус', options: [
    { value: 'any', label: 'Любой' }, { value: 'ongoing', label: 'В процессе' }, { value: 'complete', label: 'Завершено' },
  ] },
  { key: 'form', label: 'Форма', options: [
    { value: 'any', label: 'Любая' }, { value: 'novel', label: 'Роман' }, { value: 'story', label: 'Рассказ' },
  ] },
  { key: 'access', label: 'Доступ', options: [
    { value: 'any', label: 'Любой' }, { value: 'paid', label: 'Платный' }, { value: 'free', label: 'Свободный' },
  ] },
];

export function createDefaultFilters() {
  return { genres: ['dark-fantasy'], excludedGenres: [], format: 'any', sort: 'popular', status: 'any', form: 'any', access: 'any' };
}

/** @param {{ options: { value: string, label: string }[] }} field
 * @param {string | string[]} value */
export function getFilterLabel(field, value) {
  if (Array.isArray(value)) {
    if (!value.length) return 'Выбрать';
    const label = field.options.find((option) => option.value === value[0])?.label;
    return value.length > 1 ? `${label} (+${value.length - 1})` : label;
  }
  return field.options.find((option) => option.value === value)?.label;
}
