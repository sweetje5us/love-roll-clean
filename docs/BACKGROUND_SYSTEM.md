# Система фонов локаций

## Обзор

Система фонов локаций позволяет автоматически загружать и отображать фоновые изображения для сцен в эпизодах. Система поддерживает маппинг имен фонов в пути к файлам и автоматическое определение фонов по умолчанию для локаций.

## Структура файлов

```
sprites/episodes/locations/
├── school/
│   ├── school_class.png
│   ├── school_corridor.png
│   ├── school_building.png
│   └── school_rest_room.png
├── caffe/
│   ├── caffe_inside.jfif
│   └── caffe_building.jfif
└── mansion/
    ├── mansion_inside.png
    ├── attic_inside_day.png
    ├── attic_inside_night.png
    ├── mansion_garden.png
    └── mansion_entrance.png
```

## Маппинг фонов

Система использует маппинг имен фонов в пути к файлам:

```javascript
const backgroundMapping = {
  // Школа
  'school_class': 'sprites/episodes/locations/school/school_class.png',
  'school_corridor': 'sprites/episodes/locations/school/school_corridor.png',
  'school_building': 'sprites/episodes/locations/school/school_building.png',
  'school_rest_room': 'sprites/episodes/locations/school/school_rest_room.png',
  
  // Кафе
  'caffe_inside': 'sprites/episodes/locations/caffe/caffe_inside.jfif',
  'caffe_building': 'sprites/episodes/locations/caffe/caffe_building.jfif',
  
  // Особняк
  'mansion_inside': 'sprites/episodes/locations/mansion/mansion_inside.png',
  'attic_inside_day': 'sprites/episodes/locations/mansion/attic_inside_day.png',
  'attic_inside_night': 'sprites/episodes/locations/mansion/attic_inside_night.png',
  'mansion_garden': 'sprites/episodes/locations/mansion/mansion_garden.png',
  'mansion_entrance': 'sprites/episodes/locations/mansion/mansion_entrance.png'
};
```

## Использование в сценах

### Явное указание фона

```json
{
  "id": "scene60",
  "chapterId": 4,
  "location": "classroom",
  "background": "school_class",
  "characters": [...],
  "dialogue": [...]
}
```

### Автоматическое определение по локации

```json
{
  "id": "scene60",
  "chapterId": 4,
  "location": "classroom",
  "characters": [...],
  "dialogue": [...]
}
```

Если фон не указан, но есть локация, система автоматически использует фон по умолчанию для этой локации.

## API утилит

### getBackgroundPath(backgroundName)

Преобразует имя фона в полный путь к файлу.

```javascript
import { getBackgroundPath } from './backgroundUtils.js';

const path = getBackgroundPath('school_class');
// Результат: '/sprites/episodes/locations/school/school_class.png'
```

### getDefaultBackgroundForLocation(location)

Возвращает фон по умолчанию для указанной локации.

```javascript
import { getDefaultBackgroundForLocation } from './backgroundUtils.js';

const background = getDefaultBackgroundForLocation('classroom');
// Результат: '/sprites/episodes/locations/school/school_class.png'
```

### backgroundExists(backgroundName)

Проверяет, существует ли фон в маппинге.

```javascript
import { backgroundExists } from './backgroundUtils.js';

const exists = backgroundExists('school_class');
// Результат: true
```

### getAvailableBackgrounds()

Возвращает список всех доступных фонов.

```javascript
import { getAvailableBackgrounds } from './backgroundUtils.js';

const backgrounds = getAvailableBackgrounds();
// Результат: ['school_class', 'school_corridor', 'school_building', ...]
```

## Фоны по умолчанию для локаций

```javascript
const locationDefaults = {
  'classroom': 'school_class',
  'school': 'school_building',
  'caffe': 'caffe_inside',
  'mansion': 'mansion_inside'
};
```

## Интеграция с SceneManager

SceneManager автоматически обрабатывает фоны при обработке сцен:

```javascript
// В processScene()
let backgroundPath = null;
if (sceneData.background) {
  backgroundPath = getBackgroundPath(sceneData.background);
} else if (sceneData.location) {
  backgroundPath = getDefaultBackgroundForLocation(sceneData.location);
}

const result = {
  background: backgroundPath,
  characters: processedCharacters,
  dialogue: currentDialogue,
  choices: sceneData.choices || [],
  processedCharacters: processedCharacters
};
```

## Добавление новых фонов

1. Добавьте файл изображения в соответствующую папку локации
2. Добавьте маппинг в `backgroundMapping` в `backgroundUtils.js`
3. При необходимости добавьте фон по умолчанию в `locationDefaults`

## Примеры использования

### Сцена с явным фоном

```json
{
  "id": "scene1",
  "background": "school_class",
  "dialogue": [
    {
      "speaker": "teacher",
      "text": "Добро пожаловать в класс!",
      "emotion": "smile"
    }
  ]
}
```

### Сцена с автоматическим фоном

```json
{
  "id": "scene2",
  "location": "classroom",
  "dialogue": [
    {
      "speaker": "teacher",
      "text": "Сегодня мы изучим новую тему.",
      "emotion": "normal"
    }
  ]
}
```

### Сцена с полным путем к фону

```json
{
  "id": "scene3",
  "background": "sprites/episodes/locations/school/school_corridor.png",
  "dialogue": [
    {
      "speaker": "narrator",
      "text": "В коридоре школы..."
    }
  ]
}
```

## Обработка ошибок

Система включает обработку ошибок:

- Если фон не найден в маппинге, выводится предупреждение в консоль
- Если файл не загружается, используется фон по умолчанию
- Все ошибки логируются для отладки

## Тестирование

Для тестирования системы фонов используйте `test_backgrounds.html`, который проверяет:

1. Загрузку файлов фонов
2. Работу маппинга имен
3. Обработку сцен 4 главы
4. Отображение различных фонов школы 