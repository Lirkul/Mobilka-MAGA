// Статические require(): Metro должен видеть пути во время сборки.
// Codex должен скопировать assets/mock-covers в корневую assets/ приложения.
export const bookCoverSources = {
  book_001: require('../../assets/mock-covers/book_001.png'),
  book_002: require('../../assets/mock-covers/book_002.png'),
  book_003: require('../../assets/mock-covers/book_003.png'),
  book_004: require('../../assets/mock-covers/book_004.png'),
  book_005: require('../../assets/mock-covers/book_005.png'),
  book_006: require('../../assets/mock-covers/book_006.png'),
  book_007: require('../../assets/mock-covers/book_007.png'),
  book_008: require('../../assets/mock-covers/book_008.png'),
  book_009: require('../../assets/mock-covers/book_009.png'),
  book_010: require('../../assets/mock-covers/book_010.png'),
  book_011: require('../../assets/mock-covers/book_011.png'),
  book_012: require('../../assets/mock-covers/book_012.png'),
  book_013: require('../../assets/mock-covers/book_013.png'),
  book_014: require('../../assets/mock-covers/book_014.png'),
  book_015: require('../../assets/mock-covers/book_015.png'),
  book_016: require('../../assets/mock-covers/book_016.png'),
  book_017: require('../../assets/mock-covers/book_017.png'),
  book_018: require('../../assets/mock-covers/book_018.png'),
  book_019: require('../../assets/mock-covers/book_019.png'),
  book_020: require('../../assets/mock-covers/book_020.png'),
};

export const authorAvatarSources = {
  author_01: require('../../assets/mock-avatars/author_01.png'),
  author_02: require('../../assets/mock-avatars/author_02.png'),
  author_03: require('../../assets/mock-avatars/author_03.png'),
  author_04: require('../../assets/mock-avatars/author_04.png'),
  author_05: require('../../assets/mock-avatars/author_05.png'),
  author_06: require('../../assets/mock-avatars/author_06.png'),
  author_07: require('../../assets/mock-avatars/author_07.png'),
  author_08: require('../../assets/mock-avatars/author_08.png'),
};

export const getBookCover = (bookId) => bookCoverSources[bookId] ?? null;
export const getAuthorAvatar = (authorId) => authorAvatarSources[authorId] ?? null;
