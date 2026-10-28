// Display order and nesting from the recorded Author.Today 1.9 scenario.
// Selecting a parent is one broad condition; independent leaves still use AND.
export const genreTree = [
  { label: 'Боевик' },
  { label: 'Детектив', children: ['Исторический детектив', 'Фантастический детектив', 'Шпионский детектив'] },
  { label: 'Драма' }, { label: 'Историческая проза' }, { label: 'ЛитРПГ' },
  { label: 'Любовные романы', children: ['Исторический любовный роман', 'Короткий любовный роман', 'Современный любовный роман'] },
  { label: 'Мистика' }, { label: 'Подростковая проза' },
  { label: 'Попаданцы', children: ['Назад в СССР', 'Попаданцы в космос', 'Попаданцы в магические миры', 'Попаданцы во времени'] },
  { label: 'Поэзия' },
  { label: 'Приключения', children: ['Исторические приключения'] },
  { label: 'Разное', children: ['Бизнес-литература', 'Детская литература', 'Документальная проза', 'Драматургия', 'Публицистика', 'Сказка'] },
  { label: 'РеалРПГ' }, { label: 'Современная проза', children: ['Русреал'] },
  { label: 'Триллер' }, { label: 'Ужасы' },
  { label: 'Фантастика', children: ['Альтернативная история', 'Антиутопия', 'Боевая фантастика', 'Героическая фантастика', 'Киберпанк', 'Космическая фантастика', 'Научная фантастика', 'Постапокалипсис'] },
  { label: 'Фэнтези', children: ['Боевое фэнтези', 'Бытовое фэнтези', 'Героическое фэнтези', 'Городское фэнтези', 'Романтическое фэнтези', 'Темное фэнтези', 'Эпическое фэнтези', 'Юмористическое фэнтези'] },
  { label: 'Фанфик' }, { label: 'Юмор' },
];

export const genreNames = genreTree.flatMap(group => [group.label, ...(group.children || [])]);
export const genreParent = Object.fromEntries(genreTree.flatMap(group => (group.children || []).map(child => [child, group.label])));

const normalize = value => String(value).toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
const parents = Object.fromEntries(Object.entries(genreParent).map(([child, parent]) => [normalize(child), normalize(parent)]));

export function expandBookGenres(genres = []) {
  const values = genres.map(normalize);
  return [...new Set(values.flatMap(value => parents[value] ? [value, parents[value]] : [value]))];
}
