import { defaultFilters, filterOptions } from './filterOptions';

const choices = (items) => items.map((label) => ({ value: label, label }));

// UI fields use the mock API's values directly (single choice stays scalar).
export const filterFields = [
  { key: 'genres', label: 'Жанр', title: 'Выбрать жанры', multiple: true, options: choices(filterOptions.genres) },
  { key: 'excludedGenres', label: 'Исключить жанры', title: 'Исключить жанры', multiple: true, options: choices(filterOptions.genres) },
  { key: 'format', label: 'Формат', options: filterOptions.formats },
  { key: 'sort', label: 'Сортировать', options: filterOptions.sort },
];

const dates = [
  { value: null, label: 'Не важно' }, { value: 1, label: 'За сутки' },
  { value: 7, label: 'За 7 дней' }, { value: 14, label: 'За 14 дней' }, { value: 30, label: 'За 30 дней' },
];

export const additionalFields = [
  { key: 'status', label: 'Статус', options: filterOptions.status },
  { key: 'form', label: 'Форма', options: filterOptions.form },
  { key: 'seriesStatus', label: 'Статус цикла', options: filterOptions.seriesStatus },
  { key: 'seriesOrder', label: 'Порядок в цикле', options: filterOptions.seriesOrder },
  { key: 'download', label: 'Скачивание', options: filterOptions.download },
  { key: 'access', label: 'Доступ', options: filterOptions.access },
  { key: 'updatedWithinDays', label: 'Последнее обновление', options: dates },
  { key: 'publishedWithinDays', label: 'Опубликовано', options: dates },
  { key: 'read', label: 'Прочитанное', options: filterOptions.read },
  { key: 'aiAssisted', label: 'С помощью нейросети', options: filterOptions.aiAssisted },
  { key: 'tags', label: 'Теги', multiple: true, options: choices(filterOptions.tags) },
];

export function createDefaultFilters() {
  return { ...defaultFilters, genres: [], excludedGenres: [], tags: [] };
}

export function getFilterLabel(field, value) {
  if (Array.isArray(value)) {
    if (!value.length) return 'Выбрать';
    const label = field.options.find((option) => option.value === value[0])?.label || value[0];
    return value.length > 1 ? `${label} (+${value.length - 1})` : label;
  }
  return field.options.find((option) => option.value === value)?.label || 'Выбрать';
}
