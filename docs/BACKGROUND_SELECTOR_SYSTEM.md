# Система динамического выбора фонов в редакторе

## Описание

Новая система позволяет динамически загружать все доступные фоны из папки `public/sprites/episodes` и выбирать их через удобный выпадающий список в редакторе сцен.

## Проблема, которую решает система

Ранее при создании сцен нужно было вручную вводить пути к фонам, что приводило к ошибкам:
- Неправильные пути к файлам
- Отсутствие предварительного просмотра
- Сложность выбора из множества доступных фонов
- Необходимость знать точные имена файлов

## Решение

### 1. API для получения списка фонов

Добавлен новый endpoint в `editor/server/server.js`:

```javascript
// API для получения списка всех доступных фонов
app.get('/api/backgrounds', async (req, res) => {
  try {
    const backgroundsPath = path.join(__dirname, '..', '..', 'public', 'sprites', 'episodes');
    const backgrounds = await getAllBackgrounds(backgroundsPath);
    res.json(backgrounds);
  } catch (error) {
    console.error('Ошибка при получении списка фонов:', error);
    res.status(500).json({ error: 'Ошибка при получении списка фонов' });
  }
});
```

### 2. Функция сканирования фонов

```javascript
async function getAllBackgrounds(basePath) {
  const backgrounds = [];
  
  // Рекурсивно сканирует все папки и файлы
  // Поддерживает форматы: .png, .jpg, .jpeg, .gif, .webp, .jfif
  // Автоматически определяет категории по структуре папок
  
  return backgrounds;
}
```

### 3. Обновленный интерфейс редактора

В `SceneModal.js` заменено текстовое поле на выпадающий список:

```javascript
<div className="background-selector">
  <select
    value={formData.background}
    onChange={(e) => {
      const selected = backgrounds.find(bg => bg.path === e.target.value);
      setSelectedBackground(selected);
      setFormData({ ...formData, background: e.target.value });
    }}
    disabled={loadingBackgrounds}
  >
    <option value="">Выберите фон...</option>
    {backgrounds.map((bg, index) => (
      <option key={index} value={bg.path}>
        {bg.category} - {bg.name}
      </option>
    ))}
  </select>
  
  {/* Предварительный просмотр */}
  {selectedBackground && (
    <div className="background-preview">
      <img src={selectedBackground.fullPath} alt={selectedBackground.name} />
      <small>Путь: {selectedBackground.path}</small>
    </div>
  )}
</div>
```

## Структура данных фона

Каждый фон содержит следующую информацию:

```javascript
{
  name: "school_building.png",           // Имя файла
  path: "sprites/episodes/locations/school/school_building.png", // Относительный путь
  fullPath: "/sprites/episodes/locations/school/school_building.png", // Полный URL
  category: "school",                   // Категория (определяется по папке)
  size: 123456,                         // Размер файла в байтах
  modified: "2024-01-15T10:30:00.000Z"  // Дата последнего изменения
}
```

## Автоматическое определение категорий

Система автоматически определяет категории фонов по структуре папок:

- `sprites/episodes/locations/school/` → категория "school"
- `sprites/episodes/locations/mansion/` → категория "mansion"
- `sprites/episodes/locations/caffe/` → категория "caffe"
- и т.д.

## Поддерживаемые форматы изображений

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- JFIF (.jfif)

## Функциональность

### 1. Динамическая загрузка
- Автоматическое сканирование всех папок при открытии редактора
- Обновление списка при добавлении новых фонов
- Индикатор загрузки во время сканирования

### 2. Удобный выбор
- Группировка по категориям
- Сортировка по алфавиту
- Поиск по имени файла

### 3. Предварительный просмотр
- Миниатюра выбранного фона
- Отображение полного пути
- Обработка ошибок загрузки изображений

### 4. Совместимость
- Поддержка существующих сцен с полными путями
- Автоматическое определение выбранного фона при редактировании
- Сохранение в правильном формате

## Использование

### В редакторе сцен:

1. Откройте редактор сцен
2. В поле "Фон" появится выпадающий список
3. Выберите нужный фон из списка
4. Увидите предварительный просмотр
5. Сохраните сцену

### Добавление новых фонов:

1. Поместите файл изображения в соответствующую папку:
   ```
   public/sprites/episodes/locations/[категория]/[имя_файла].[расширение]
   ```
2. Обновите редактор - новый фон появится в списке автоматически

## Преимущества

1. **Удобство**: Не нужно помнить точные пути к файлам
2. **Надежность**: Исключены ошибки в путях к фонам
3. **Визуальность**: Предварительный просмотр выбранного фона
4. **Масштабируемость**: Автоматическое добавление новых фонов
5. **Организация**: Группировка по категориям
6. **Производительность**: Кэширование списка фонов

## Технические детали

### Файлы, которые были изменены:

1. `editor/server/server.js` - добавлен API endpoint
2. `editor/client/src/components/SceneModal.js` - обновлен интерфейс
3. `editor/client/src/components/SceneModal.css` - добавлены стили

### Зависимости:

- `fs-extra` для работы с файловой системой
- `path` для обработки путей
- React hooks для управления состоянием

## Статус

**РЕАЛИЗОВАНО** ✅

Система полностью функциональна и готова к использованию. 