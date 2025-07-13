# Руководство по использованию character_sprites.json

## Обзор

Файл `src/data/character_sprites.json` содержит структурированные данные о всех спрайтах персонажей для составного рендеринга. Персонаж собирается из 7 слоёв в определённом порядке z-index.

## Структура слоёв (z-index снизу вверх)

```
0. hair_behind    - Волосы сзади (может быть null)
1. base_body      - Тело персонажа (обязательный)
2. emotion        - Эмоции лица (обязательный)
3. bush           - Смущение (только женские, может быть null)
4. dresses        - Одежда (обязательный)
5. hairs          - Причёска (обязательный)
6. accessories    - Аксессуары (может быть null)
```

## Типы персонажей

- `female` - Девушка (1011×1145)
- `female_mature` - Женщина (1736×1440)
- `male` - Парень (1158×1287)
- `male_mature` - Мужчина (1100×1300)

## Использование в редакторе персонажей

### Инициализация редактора

```javascript
import characterSprites from '../data/character_sprites.json';

// Получение доступных опций для персонажа
const getAvailableOptions = (gender, age) => {
  const type = `${gender}_${age}`; // например: "female_mature"
  
  return {
    hairBehind: Object.keys(characterSprites.hair_behind[type] || {}),
    emotions: Object.keys(characterSprites.emotion[type].pink_eyes),
    dresses: {
      free: Object.keys(characterSprites.dresses[type].free),
      paid: getUnlockedPaidItems(characterSprites.dresses[type].paid)
    },
    hairs: Object.keys(characterSprites.hairs[type]),
    accessories: {
      free: Object.keys(characterSprites.accessories[type]?.free || {}),
      paid: getUnlockedPaidItems(characterSprites.accessories[type]?.paid || {})
    }
  };
};
```

### Сборка спрайта персонажа

```javascript
const buildCharacterSprite = (characterData) => {
  const { gender, age, appearance } = characterData;
  const type = `${gender}_${age}`;
  const layers = [];
  
  // 0. Волосы сзади (если есть)
  if (appearance.hairBehind) {
    const hairBehindPath = characterSprites.hair_behind[type][appearance.hairStyle][appearance.hairColor];
    if (hairBehindPath) {
      layers.push({
        src: hairBehindPath,
        zIndex: 0
      });
    }
  }
  
  // 1. Тело
  const bodyData = characterSprites.base_body[type];
  layers.push({
    src: bodyData.file,
    zIndex: 1,
    size: bodyData.size
  });
  
  // 2. Эмоция (в редакторе всегда "normal")
  const emotionPath = characterSprites.emotion[type].pink_eyes.normal;
  layers.push({
    src: emotionPath,
    zIndex: 2
  });
  
  // 3. Смущение (только для женских персонажей в определённых сценах)
  if (gender === 'female' && appearance.bush) {
    const bushPath = characterSprites.bush[type][appearance.bush];
    if (bushPath) {
      layers.push({
        src: bushPath,
        zIndex: 3
      });
    }
  }
  
  // 4. Одежда
  const dressCategory = appearance.dressPaid ? 'paid' : 'free';
  const dressPath = characterSprites.dresses[type][dressCategory][appearance.dress];
  if (dressPath) {
    layers.push({
      src: dressPath,
      zIndex: 4
    });
  }
  
  // 5. Причёска
  const hairPath = characterSprites.hairs[type][appearance.hairStyle][appearance.hairColor];
  if (hairPath) {
    layers.push({
      src: hairPath,
      zIndex: 5
    });
  }
  
  // 6. Аксессуары (если есть)
  if (appearance.accessory) {
    const accessoryCategory = appearance.accessoryPaid ? 'paid' : 'free';
    const accessoryPath = characterSprites.accessories[type][accessoryCategory][appearance.accessory];
    if (accessoryPath) {
      layers.push({
        src: accessoryPath,
        zIndex: 6
      });
    }
  }
  
  return layers.sort((a, b) => a.zIndex - b.zIndex);
};
```

### Валидация выбора

```javascript
const validateCharacterChoice = (gender, age, choices) => {
  const type = `${gender}_${age}`;
  const errors = [];
  
  // Проверка совместимости причёски и волос сзади
  if (choices.hairBehind && !characterSprites.hair_behind[type][choices.hairStyle]) {
    errors.push('Данная причёска не поддерживает волосы сзади');
  }
  
  // Проверка доступности платных предметов
  if (choices.dressPaid && !isItemUnlocked(choices.dress, 'dress')) {
    errors.push('Данная одежда не куплена');
  }
  
  if (choices.accessoryPaid && !isItemUnlocked(choices.accessory, 'accessory')) {
    errors.push('Данный аксессуар не куплен');
  }
  
  return errors;
};
```

## Использование в игре

### Рендеринг персонажа в сценах

```javascript
const renderCharacterInScene = (characterData, emotion = 'normal', showBush = false) => {
  const layers = buildCharacterSprite(characterData);
  const type = `${characterData.gender}_${characterData.age}`;
  
  // Замена эмоции на нужную
  const emotionLayer = layers.find(layer => layer.zIndex === 2);
  if (emotionLayer) {
    emotionLayer.src = characterSprites.emotion[type].pink_eyes[emotion];
  }
  
  // Добавление смущения для женских персонажей в определённых сценах
  if (characterData.gender === 'female' && showBush && characterData.appearance.bush) {
    const bushPath = characterSprites.bush[type][characterData.appearance.bush];
    if (bushPath) {
      layers.push({
        src: bushPath,
        zIndex: 3
      });
    }
  }
  
  // Сортировка по z-index и рендеринг
  return layers.sort((a, b) => a.zIndex - b.zIndex);
};
```

### Анимация эмоций

```javascript
const animateEmotion = (characterElement, emotion, duration = 300) => {
  const emotionLayer = characterElement.querySelector('.emotion-layer');
  const newEmotionPath = getEmotionPath(characterData, emotion);
  
  // Плавная смена эмоции
  emotionLayer.style.transition = `opacity ${duration}ms ease`;
  emotionLayer.style.opacity = '0';
  
  setTimeout(() => {
    emotionLayer.src = newEmotionPath;
    emotionLayer.style.opacity = '1';
  }, duration / 2);
};
```

### Смена одежды в сценах

```javascript
const changeDressForScene = (characterData, sceneType) => {
  const type = `${characterData.gender}_${characterData.age}`;
  
  // Получение специальной одежды для сцены
  const sceneDresses = characterSprites.dresses[type].scenes;
  
  if (sceneDresses[sceneType]) {
    return {
      ...characterData,
      appearance: {
        ...characterData.appearance,
        dress: sceneType,
        dressPaid: false // Сценная одежда всегда бесплатна
      }
    };
  }
  
  return characterData; // Возвращаем исходную одежду
};
```

## Использование в магазине

### Отображение доступных предметов

```javascript
const getShopItems = (category, gender, age) => {
  const type = `${gender}_${age}`;
  
  switch (category) {
    case 'dresses':
      return {
        free: characterSprites.dresses[type].free,
        paid: characterSprites.dresses[type].paid,
        scenes: characterSprites.dresses[type].scenes
      };
      
    case 'accessories':
      return {
        free: characterSprites.accessories[type]?.free || {},
        paid: characterSprites.accessories[type]?.paid || {}
      };
      
    default:
      return {};
  }
};
```

### Предварительный просмотр покупки

```javascript
const previewPurchase = (characterData, itemType, itemName, isPaid = false) => {
  const previewData = { ...characterData };
  
  if (itemType === 'dress') {
    previewData.appearance.dress = itemName;
    previewData.appearance.dressPaid = isPaid;
  } else if (itemType === 'accessory') {
    previewData.appearance.accessory = itemName;
    previewData.appearance.accessoryPaid = isPaid;
  }
  
  return buildCharacterSprite(previewData);
};
```

### Проверка совместимости

```javascript
const checkItemCompatibility = (characterData, itemType, itemName) => {
  const type = `${characterData.gender}_${characterData.age}`;
  
  // Проверка существования предмета для данного типа персонажа
  if (itemType === 'dress') {
    const dressExists = characterSprites.dresses[type].free[itemName] || 
                       characterSprites.dresses[type].paid[itemName];
    return !!dressExists;
  }
  
  if (itemType === 'accessory') {
    const accessoryExists = characterSprites.accessories[type]?.free[itemName] || 
                           characterSprites.accessories[type]?.paid[itemName];
    return !!accessoryExists;
  }
  
  return false;
};
```

## Утилиты

### Получение информации о предмете

```javascript
const getItemInfo = (itemType, itemName, gender, age) => {
  const type = `${gender}_${age}`;
  
  switch (itemType) {
    case 'dress':
      return {
        free: characterSprites.dresses[type].free[itemName],
        paid: characterSprites.dresses[type].paid[itemName],
        scenes: characterSprites.dresses[type].scenes[itemName]
      };
      
    case 'accessory':
      return {
        free: characterSprites.accessories[type]?.free[itemName],
        paid: characterSprites.accessories[type]?.paid[itemName]
      };
      
    default:
      return null;
  }
};
```

### Получение всех доступных цветов волос

```javascript
const getAvailableHairColors = (gender, age, hairStyle) => {
  const type = `${gender}_${age}`;
  const hairData = characterSprites.hairs[type][hairStyle];
  
  if (hairData) {
    return Object.keys(hairData);
  }
  
  return [];
};
```

### Проверка поддержки волос сзади

```javascript
const supportsHairBehind = (gender, age, hairStyle) => {
  const type = `${gender}_${age}`;
  const hairBehindData = characterSprites.hair_behind[type];
  
  return hairBehindData && hairBehindData[hairStyle];
};
```

## Примеры использования

### Создание персонажа в редакторе

```javascript
const newCharacter = {
  name: "Алиса",
  gender: "female",
  age: "mature",
  appearance: {
    hairStyle: "long",
    hairColor: "brown",
    hairBehind: true,
    dress: "casual",
    dressPaid: false,
    accessory: "black_glasses",
    accessoryPaid: false,
    bush: "1"
  }
};

const spriteLayers = buildCharacterSprite(newCharacter);
```

### Рендеринг в игре

```javascript
// Обычная сцена
const normalLayers = renderCharacterInScene(characterData, 'smile');

// Романтическая сцена с смущением
const romanticLayers = renderCharacterInScene(characterData, 'blush', true);

// Сцена в пижаме
const pajamaCharacter = changeDressForScene(characterData, 'pajama');
const pajamaLayers = renderCharacterInScene(pajamaCharacter, 'sleepy');
```

### Магазин

```javascript
// Получение платных платьев для женщины
const paidDresses = getShopItems('dresses', 'female', 'mature').paid;

// Предварительный просмотр покупки
const previewLayers = previewPurchase(characterData, 'dress', 'summer_dress', true);
```

## Примечания

1. **Размеры спрайтов**: Учитывайте разные размеры тел при позиционировании слоёв
2. **Производительность**: Кэшируйте загруженные изображения для быстрого рендеринга
3. **Расширяемость**: Структура поддерживает добавление новых цветов глаз и типов персонажей
4. **Совместимость**: Всегда проверяйте существование путей перед использованием
5. **Локализация**: Названия предметов можно вынести в отдельные файлы локализации 