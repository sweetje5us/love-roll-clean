# Система эпизодов

## Обзор

Система эпизодов теперь работает полностью динамически, загружая данные напрямую из папок эпизодов без необходимости дублирования в `episodes.json`.

## Структура папок

```
public/episodes/
├── tutorial/
│   ├── config.json          # Конфигурация эпизода
│   ├── chapters/            # Папка с главами
│   ├── scenes/              # Папка со сценами
│   └── characters/          # Папка с персонажами (опционально)
├── mansion/
│   ├── config.json
│   ├── chapters/
│   ├── scenes/
│   └── characters/
└── test_1/
    ├── config.json
    ├── chapters/
    └── scenes/
```

## Конфигурация эпизода (config.json)

Каждый эпизод должен иметь файл `config.json` со следующей структурой:

```json
{
  "id": "mansion",
  "name": "Поместье",
  "description": "Детективное расследование",
  "longDescription": "Подробное описание эпизода...",
  "preview": "sprites/episodes/locations/mansion/mansion_outside.png",
  "type": "detective",
  "ageRating": "0+",
  "duration": "30-60 мин",
  "difficulty": "medium",
  "unlocked": true,
  "completed": false,
  "tags": ["детектив", "расследование", "поместье"],
  "chapters": [
    {
      "id": 1,
      "name": "Глава 1: Знакомство с гостями",
      "description": "Знакомство с гостями поместья Диметрио",
      "duration": "3-5 минут",
      "scenes": ["scene1", "scene2", "scene3"]
    }
  ],
  "characters": [
    {
      "id": "peter",
      "name": "Питер",
      "description": "Дворецкий",
      "role": "dovr",
      "gender": "male",
      "age": "mature",
      "romanceAvailable": true,
      "appearance": {
        "hairStyle": "short2",
        "hairColor": "brown",
        "hairBehind": "short2",
        "dress": "teacher_uniform",
        "dressPaid": false,
        "accessory": "circle_glasses",
        "accessoryPaid": false,
        "bush": ""
      }
    }
  ]
}
```

## Добавление нового эпизода

1. Создайте папку для эпизода в `public/episodes/`
2. Создайте файл `config.json` с конфигурацией эпизода
3. Добавьте ID эпизода в `src/utils/episodeList.js` в массив `KNOWN_EPISODES`
4. Создайте папки `chapters/` и `scenes/` для контента

## Типы эпизодов

- `tutorial` - Обучение
- `detective` - Детектив
- `romance` - Романтика
- `mystery` - Мистика
- `adventure` - Приключения
- `story` - История

## Возрастные рейтинги

- `0+` - Для всех возрастов
- `6+` - Для детей от 6 лет
- `12+` - Для подростков от 12 лет
- `16+` - Для подростков от 16 лет
- `18+` - Только для взрослых

## Уровни сложности

- `easy` - Легкий
- `medium` - Средний
- `hard` - Сложный

## Файлы системы

- `src/utils/episodeUtils.js` - Основные утилиты для работы с эпизодами
- `src/utils/episodeList.js` - Список известных эпизодов
- `src/utils/episodeManager.js` - Менеджер эпизодов для игры

## Преимущества новой системы

1. **Нет дублирования данных** - вся информация хранится только в папках эпизодов
2. **Легкое добавление эпизодов** - достаточно создать папку и config.json
3. **Автоматическое сканирование** - система проверяет существование эпизодов
4. **Модульность** - каждый эпизод самодостаточен
5. **Совместимость с редактором** - редактор работает с той же структурой

## Миграция

Старый файл `episodes.json` больше не используется. Все данные теперь загружаются динамически из папок эпизодов. 