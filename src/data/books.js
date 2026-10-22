// The six covers are extracted from reference/screenshots/1000017162.jpg.
// Metadata for discovery is a local fixture, not a copy of the service's API.
export const books = [
  {
    id: 'regressor', title: 'Регрессор: Я заберу ваши силы. Книга 1', author: 'Александр Кронос',
    cover: require('../../assets/covers/regressor.jpg'), priceLabel: '168 ₽',
    genres: ['fantasy', 'action'], format: 'ebook', popularity: 100, status: 'complete', form: 'novel', access: 'paid',
  },
  {
    id: 'taxi', title: 'Таксист из Forbes 10', author: 'Ник Тарасов',
    cover: require('../../assets/covers/taxi.jpg'), priceLabel: 'Подписка 179 ₽',
    genres: ['fantasy', 'urban'], format: 'ebook', popularity: 95, status: 'ongoing', form: 'novel', access: 'paid',
  },
  {
    id: 'yardman', title: 'Дворник 32-го уровня. Том 12', author: 'Дорничев Дмитрий',
    cover: require('../../assets/covers/yardman.jpg'), priceLabel: 'Подписка 169 ₽',
    genres: ['fantasy', 'dark-fantasy', 'litrpg'], format: 'ebook', popularity: 90, status: 'ongoing', form: 'novel', access: 'paid',
  },
  {
    id: 'masquerade', title: 'Эльфийский маскарад', author: 'Евгений Лисицин',
    cover: require('../../assets/covers/masquerade.jpg'), priceLabel: 'Подписка 159 ₽',
    genres: ['fantasy', 'urban'], format: 'ebook', popularity: 85, status: 'ongoing', form: 'novel', access: 'paid',
  },
  {
    id: 'tankman', title: 'Танкист. 1941. Том I', author: 'Артём Март',
    cover: require('../../assets/covers/tankman.jpg'), priceLabel: '159 ₽',
    genres: ['history', 'action'], format: 'ebook', popularity: 80, status: 'complete', form: 'novel', access: 'paid',
  },
  {
    id: 'rocker', title: 'Второй Шанс Старого Рокера', author: 'Алексей Сказ',
    cover: require('../../assets/covers/rocker.jpg'), priceLabel: '149 ₽',
    genres: ['contemporary'], format: 'ebook', popularity: 75, status: 'complete', form: 'novel', access: 'paid',
  },
];

export const homeSections = [
  { id: 'popular', title: 'Популярное', subtitle: 'Самые популярные книги за сегодня', books: books.slice(0, 3) },
  { id: 'hot', title: 'Горячие новинки', subtitle: 'Популярные новинки за последние две недели', books: books.slice(3), hot: true },
];
