# Подключение в существующий Expo-проект

## Не заменять существующие экраны

Codex уже создал красивую главную страницу; её необходимо **сохранить**. Здесь только данные, изображения, функции поиска и мок-API. Проверь текущие имена свойств в существующих компонентах и при необходимости сделай адаптер вместо массовой правки дизайна.

## Куда помещать файлы

Из папки `reference/AuthorToday_mock_kit/` скопировать:

```
assets/mock-covers/   -> <проект>/assets/mock-covers/
assets/mock-avatars/  -> <проект>/assets/mock-avatars/
src/data/*            -> <проект>/src/data/*
src/services/*        -> <проект>/src/services/*
src/utils/*           -> <проект>/src/utils/*
```

`imageSources.js` предполагает расположение `src/data/imageSources.js` относительно `assets/` в корне Expo-приложения. НЕ писать `require(variable)`: Metro не соберёт такие пути.

## Основные функции

```js
import {
  getHomeFeed, getBooks, searchAll, getBookById,
  getAuthorById, getChapters, getChapter, getComments,
  getFilterOptions, getAccessOptions, getLibrary,
  setLibraryStatus, saveReadingProgress, mockApiControl,
} from './src/services/mockApi';
import { getBookCover, getAuthorAvatar } from './src/data/imageSources';

// Результаты подбора:
const response = await getBooks({
  genres: ['Темное фэнтези', 'Боевая фантастика'],
  status: 'ongoing',
  access: 'free',
  sort: 'popularity',
});
console.log(response.total, response.items);

// Источник Image в React Native:
// <Image source={getBookCover(book.coverKey)} style={{width:100,height:145}} />

// Полнотекстовый поиск: отдельные секции выдачи.
const found = await searchAll('Арсений');
console.log(found.authors, found.books, found.posts);

// Смена статуса:
await setLibraryStatus('book_001', 'not_interested');
// Теперь book_001 не появится в getBooks().
```

## Полный интерфейс состояний

- `status`: `any`, `ongoing`, `completed`.
- `format`: `any`, `ebook`, `audio`. Значение `any` соответствует «Электронная и аудио» в оригинальном модальном окне.
- `access`: `any`, `free`, `paid`, где `paid` включает как платную отдельную книгу, так и подписку на серию.
- `form`: `any`, `novel`, `novella`, `story`.
- `seriesStatus`: `any`, `standalone`, `completed`, `ongoing`.
- `seriesOrder`: `any`, `first`.
- `download`: `any`, `allowed`, `friends`, `forbidden`.
- `read`: `show` или `hide` (скрывает уже прочитанное `finished`).
- `aiAssisted`: `any`, `yes`, `no`.
- `publishedWithinDays` и `updatedWithinDays`: количество дней или `null`.
- `genres`: массив **включаемых** жанров. Книга должна иметь ВСЕ выбранные жанры.
- `excludedGenres`: массив исключений. Ни одного из них не должно быть у книги.
- `tags`: массив тегов, тоже все должны присутствовать.

Наборы справочников находятся в `src/data/filterOptions.js`.

## Как показать загрузку и ошибку в ДЗ3

```js
mockApiControl.setLatency(850); // искусственная задержка
mockApiControl.failNextRequest(); // ровно один следующий запрос вернёт 503

try {
  await getBooks();
} catch (e) {
  // показать экран ошибки и кнопку «Повторить»
  console.log(e.status, e.message);
}
// По кнопке «Повторить» вызвать getBooks() заново.
```

## Контрольные тесты

```powershell
node --test reference/AuthorToday_mock_kit/tests/filterBooks.test.mjs
npx.cmd expo start --web
```

Сравни скриншоты пользовательских экранов с оригиналом; тесты проверяют данные и фильтрацию, но не точность визуального дизайна.
