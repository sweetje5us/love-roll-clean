# Система динамической загрузки эпизодов

## Обзор

Новая система динамической загрузки эпизодов устраняет дублирование данных между `episodes.json` и отдельными конфигурациями эпизодов. Теперь все данные эпизодов загружаются напрямую из их папок в `public/episodes/`.

## Архитектура

### Структура папок
```
public/
├── episodes/
│   ├── tutorial/
│   │   ├── config.json          # Конфигурация эпизода
│   │   ├── preview.jpg          # Превью эпизода
│   │   ├── chapters/            # Главы эпизода
│   │   └── scenes/              # Сцены эпизода
│   ├── mansion/
│   │   ├── config.json
│   │   ├── preview.png
│   │   ├── chapters/
│   │   └── scenes/
│   └── [другие эпизоды]/
└── episodes.json                # Fallback файл (минимальная структура)
```

### API Endpoints

#### 1. `/api/episodes/dynamic`
Динамически сканирует папки эпизодов и возвращает данные в формате, совместимом с `episodes.json`.

**Ответ:**
```json
{
  "episodes": {
    "tutorial": {
      "id": "tutorial",
      "name": "Обучение",
      "description": "...",
      "chapters": [...],
      "characters": [...],
      // ... все данные из config.json
    }
  },
  "types": {
    "tutorial": {
      "name": "Обучение",
      "color": "#4ade80",
      "icon": "fas fa-graduation-cap"
    }
  },
  "ageRatings": {
    "0+": {
      "name": "0+",
      "color": "#22c55e",
      "description": "Для всех возрастов"
    }
  }
}
```

#### 2. `/api/episodes`
Возвращает список всех эпизодов в виде массива (для редактора).

#### 3. `/episodes.json`
Fallback файл с минимальной структурой, используется только если динамический API недоступен.

## Использование в коде

### Основное приложение

```javascript
// В EpisodeSelectScreen.js
const loadData = async () => {
  try {
    // Сначала пробуем загрузить через динамический API
    const dynamicResponse = await fetch('/api/episodes/dynamic');
    if (dynamicResponse.ok) {
      const dynamicData = await dynamicResponse.json();
      // Используем данные из dynamicData.episodes
    } else {
      // Fallback: используем старую систему
      const episodes = await loadAllEpisodeConfigs();
    }
  } catch (error) {
    // Fallback обработка
  }
};
```

### EpisodeManager

```javascript
// В episodeManager.js
async initializeEpisode(episodeId, startChapter = 1, playerCharacterId = null) {
  try {
    // Сначала пробуем загрузить через динамический API
    const dynamicResponse = await fetch('/api/episodes/dynamic');
    if (dynamicResponse.ok) {
      const episodesData = await dynamicResponse.json();
      episodeData = episodesData.episodes[episodeId];
    } else {
      // Fallback: загружаем из статического файла
      const episodesResponse = await fetch('/episodes.json');
      // ...
    }
  } catch (error) {
    // Обработка ошибок
  }
}
```

### Редактор

```javascript
// В EpisodeEditorScreen.js
const loadEpisodes = async () => {
  try {
    // Сначала пробуем загрузить через динамический API
    const dynamicResponse = await fetch('/api/episodes/dynamic');
    if (dynamicResponse.ok) {
      const dynamicData = await dynamicResponse.json();
      const episodesList = Object.values(dynamicData.episodes);
      setEpisodes(episodesList);
    } else {
      // Fallback: загружаем через API редактора
      const response = await fetch('http://localhost:3001/api/episodes');
      // ...
    }
  } catch (error) {
    // Fallback обработка
  }
};
```

## Преимущества новой системы

1. **Устранение дублирования**: Данные эпизодов хранятся только в одном месте
2. **Динамическая загрузка**: Новые эпизоды автоматически появляются без редактирования `episodes.json`
3. **Совместимость**: Система работает как с новым API, так и со старыми файлами
4. **Модульность**: Каждый эпизод самодостаточен в своей папке
5. **Масштабируемость**: Легко добавлять новые эпизоды

## Миграция

### Для разработчиков

1. Убедитесь, что все эпизоды имеют корректные `config.json` файлы
2. Обновите код для использования нового API
3. Проверьте fallback механизмы

### Для редактора

1. Редактор автоматически использует новую систему
2. При создании новых эпизодов они сохраняются в отдельных папках
3. API редактора (`http://localhost:3001/api/episodes`) остается совместимым

## Fallback механизмы

Система имеет несколько уровней fallback:

1. **Динамический API** (`/api/episodes/dynamic`) - основной источник
2. **API редактора** (`http://localhost:3001/api/episodes`) - для редактора
3. **Статический файл** (`/episodes.json`) - минимальная структура
4. **Функция загрузки** (`loadAllEpisodeConfigs`) - прямая загрузка из папок

## Типы и рейтинги

Типы и возрастные рейтинги генерируются автоматически на основе данных эпизодов:

### Типы
- `tutorial` - Обучение
- `detective` - Детектив
- `romance` - Романтика
- `mystery` - Мистика
- `adventure` - Приключения
- `story` - История

### Возрастные рейтинги
- `0+` - Для всех возрастов
- `6+` - Для детей от 6 лет
- `12+` - Для подростков от 12 лет
- `16+` - Для подростков от 16 лет
- `18+` - Только для взрослых

## Добавление новых эпизодов

1. Создайте папку в `public/episodes/[episode-id]/`
2. Создайте `config.json` с конфигурацией эпизода
3. Добавьте превью изображение
4. Создайте папки `chapters/` и `scenes/` при необходимости
5. Эпизод автоматически появится в игре

## Отладка

### Проверка API
```bash
# Проверка динамического API
curl http://localhost:3000/api/episodes/dynamic

# Проверка API редактора
curl http://localhost:3001/api/episodes
```

### Логи
Система выводит подробные логи в консоль:
- Успешная загрузка через динамический API
- Fallback на статические файлы
- Ошибки загрузки конфигураций

## Совместимость

Новая система полностью совместима с существующим кодом благодаря fallback механизмам. Старые эпизоды продолжат работать без изменений. 