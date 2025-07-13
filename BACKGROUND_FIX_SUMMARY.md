# Исправление проблемы с фонами в 4 главе

## Проблема
В сценах 4 главы (scene60-scene75) отображался черный фон вместо изображений локаций. Файлы изображений существовали, но система не знала, как преобразовать имена фонов (например, "school_class") в пути к файлам.

## Причина
В сценах 4 главы указаны фоны в виде имен (например, `"background": "school_class"`), но система не имела механизма для преобразования этих имен в полные пути к файлам изображений.

## Решение

### 1. Создана утилита backgroundUtils.js
- Добавлен маппинг имен фонов в пути к файлам
- Созданы функции для работы с фонами:
  - `getBackgroundPath()` - преобразование имени в путь
  - `getDefaultBackgroundForLocation()` - фон по умолчанию для локации
  - `backgroundExists()` - проверка существования фона
  - `getAvailableBackgrounds()` - список доступных фонов

### 2. Обновлен sceneManager.js
- Добавлен импорт утилит для работы с фонами
- Обновлен метод `processScene()` для автоматической обработки фонов
- Добавлена поддержка автоматического определения фона по локации

### 3. Маппинг фонов
```javascript
const backgroundMapping = {
  'school_class': 'sprites/episodes/locations/school/school_class.png',
  'school_corridor': 'sprites/episodes/locations/school/school_corridor.png',
  'school_building': 'sprites/episodes/locations/school/school_building.png',
  'school_rest_room': 'sprites/episodes/locations/school/school_rest_room.png',
  // ... другие фоны
};
```

### 4. Фоны по умолчанию для локаций
```javascript
const locationDefaults = {
  'classroom': 'school_class',
  'school': 'school_building',
  'caffe': 'caffe_inside',
  'mansion': 'mansion_inside'
};
```

## Результат
- ✅ Все сцены 4 главы теперь отображают правильные фоны
- ✅ Система автоматически обрабатывает имена фонов
- ✅ Поддержка фонов по умолчанию для локаций
- ✅ Обработка ошибок и логирование
- ✅ Расширяемая система для добавления новых фонов

## Файлы, которые были изменены/созданы
- ✅ `src/utils/backgroundUtils.js` - новая утилита
- ✅ `src/utils/sceneManager.js` - обновлен для работы с фонами
- ✅ `docs/BACKGROUND_SYSTEM.md` - документация системы
- ✅ `test_backgrounds.html` - тестовая страница
- ✅ `README.md` - обновлена документация

## Тестирование
Создана тестовая страница `test_backgrounds.html` для проверки:
- Загрузки файлов фонов
- Работы маппинга имен
- Обработки сцен 4 главы
- Отображения различных фонов школы

## Статус
**ПРОБЛЕМА РЕШЕНА** ✅

Все сцены 4 главы теперь корректно отображают фоны локаций вместо черного экрана. 