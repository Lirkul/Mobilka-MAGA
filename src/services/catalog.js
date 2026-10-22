import { series } from '../data/series';
import { getBookCover } from '../data/imageSources';
import { getBooks, getHomeFeed, getRecentBooks, searchAll } from './mockApi';

// The API model stays independent of the original home-card presentation.
export function toBookCard(book) {
  const subscription = series.find((item) => item.id === book.seriesId);
  return {
    ...book,
    author: book.authorNames?.join(', ') || '',
    cover: getBookCover(book.coverKey),
    priceLabel: book.access === 'free' ? 'Бесплатно'
      : book.access === 'series_subscription' ? `Подписка ${subscription?.subscriptionPrice ?? 0} ₽`
        : `${book.priceRub} ₽`,
  };
}

export async function getHomeContent({ personalized = false } = {}) {
  const [feed, recent] = await Promise.all([getHomeFeed(), getRecentBooks()]);
  return {
    sections: [
      personalized
        ? { id: 'recommendations', title: 'Рекомендуемое', subtitle: 'С учётом любимых жанров', books: feed.recommendations.map(toBookCard) }
        : { id: 'popular', title: 'Популярное', subtitle: 'Самые популярные книги за сегодня', books: feed.popular.map(toBookCard) },
      { id: 'hot', title: 'Горячие новинки', subtitle: 'Популярные новинки за последние две недели', books: feed.hotNew.map(toBookCard), hot: true },
    ],
    lastRead: recent[0] || null,
  };
}

export const discoverBooks = getBooks;
export const searchCatalog = searchAll;
