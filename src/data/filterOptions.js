import { genreNames } from './genreTree.js';

export const filterOptions = {
  "genres": genreNames,
  "tags": [
    "аномалия",
    "артефакты",
    "боевые сцены",
    "война",
    "выживание",
    "город",
    "граница",
    "дорога",
    "древние тайны",
    "дружба",
    "загадка",
    "заговор",
    "империя",
    "интриги",
    "искусственный интеллект",
    "история",
    "караван",
    "катастрофа",
    "команда",
    "корпорации",
    "легенды",
    "лес",
    "магия",
    "мутанты",
    "неон",
    "осада",
    "параллельные миры",
    "призраки",
    "проклятие",
    "путешествие",
    "путешествия",
    "расследование",
    "север",
    "семья",
    "сильный герой",
    "станция",
    "старый город",
    "тайна",
    "тайны",
    "трактир",
    "ученик",
    "хакеры",
    "экипаж",
    "экспедиция",
    "юмор"
  ],
  "formats": [
    {
      "value": "any",
      "label": "Электронная и аудио"
    },
    {
      "value": "ebook",
      "label": "Электронная книга"
    },
    {
      "value": "audio",
      "label": "Аудиокнига"
    }
  ],
  "sort": [
    {
      "value": "popularity",
      "label": "По популярности"
    },
    {
      "value": "newest",
      "label": "По новизне"
    },
    {
      "value": "likes",
      "label": "По количеству лайков"
    },
    {
      "value": "views",
      "label": "По просмотрам"
    },
    {
      "value": "comments",
      "label": "По комментариям"
    },
    {
      "value": "trending",
      "label": "Набирающие популярность"
    }
  ],
  "status": [
    {
      "value": "any",
      "label": "Любой"
    },
    {
      "value": "ongoing",
      "label": "В процессе"
    },
    {
      "value": "completed",
      "label": "Завершено"
    }
  ],
  "form": [
    {
      "value": "any",
      "label": "Любая"
    },
    {
      "value": "novel",
      "label": "Роман"
    },
    {
      "value": "novella",
      "label": "Повесть"
    },
    {
      "value": "story",
      "label": "Рассказ"
    }
  ],
  "seriesStatus": [
    {
      "value": "any",
      "label": "Не важно"
    },
    {
      "value": "standalone",
      "label": "Вне цикла"
    },
    {
      "value": "completed",
      "label": "Цикл завершен"
    },
    {
      "value": "ongoing",
      "label": "Цикл не завершен"
    }
  ],
  "seriesOrder": [
    {
      "value": "any",
      "label": "Любой"
    },
    {
      "value": "first",
      "label": "Первая книга цикла"
    }
  ],
  "download": [
    {
      "value": "any",
      "label": "Не важно"
    },
    {
      "value": "allowed",
      "label": "Разрешено"
    },
    {
      "value": "friends",
      "label": "Только друзьям"
    },
    {
      "value": "forbidden",
      "label": "Запрещено"
    }
  ],
  "access": [
    {
      "value": "any",
      "label": "Любой"
    },
    {
      "value": "paid",
      "label": "Платный"
    },
    {
      "value": "free",
      "label": "Свободный"
    }
  ],
  "read": [
    {
      "value": "show",
      "label": "Показывать"
    },
    {
      "value": "hide",
      "label": "Скрывать"
    }
  ],
  "aiAssisted": [
    {
      "value": "any",
      "label": "Не важно"
    },
    {
      "value": "yes",
      "label": "Да"
    },
    {
      "value": "no",
      "label": "Нет"
    }
  ]
};


// Внимание: все многозначные включающие фильтры (genres, tags)
// работают по принципу И (каждый выбранный пункт обязан встречаться у книги).
export const defaultFilters = {
  search: '',
  genres: [],
  excludedGenres: [],
  tags: [],
  format: 'any',
  sort: 'popularity',
  status: 'any',
  form: 'any',
  seriesStatus: 'any',
  seriesOrder: 'any',
  download: 'any',
  access: 'any',
  publishedWithinDays: null,
  updatedWithinDays: null,
  read: 'show',
  aiAssisted: 'any',
};
