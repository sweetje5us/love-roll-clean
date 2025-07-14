// Утилиты для работы с персонажами

import characterSprites from '../data/character_sprites.json';
import itemsData from '../data/items.json';

// Создание тестовых персонажей
export const createTestCharacters = () => {
  return [
    {
      id: '1',
      name: 'Алиса',
      gender: 'female',
      level: 5,
      description: 'Храбрая воительница с острым мечом и добрым сердцем',
      stats: {
        health: 120,
        attack: 25,
        defense: 15,
        magic: 10,
        agility: 20
      },
      appearance: {
        hair: 'long_hair',
        hairColor: 'brown',
        eyes: 'pink_eyes',
        body: 'Female body',
        dress: 'summer_dress'
      },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Макс',
      gender: 'male',
      level: 3,
      description: 'Умный маг, изучающий древние заклинания',
      stats: {
        health: 80,
        attack: 8,
        defense: 5,
        magic: 35,
        agility: 12
      },
      appearance: {
        hair: 'short1',
        hairColor: 'dark',
        eyes: 'pink_eyes',
        body: 'Male body',
        dress: 'casual'
      },
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Луна',
      gender: 'female',
      level: 7,
      description: 'Таинственная лучница с серебряным луком',
      stats: {
        health: 95,
        attack: 30,
        defense: 8,
        magic: 5,
        agility: 35
      },
      appearance: {
        hair: 'twin_tail',
        hairColor: 'blond',
        eyes: 'pink_eyes',
        body: 'Female body',
        dress: 'sport_uniform'
      },
      createdAt: new Date().toISOString()
    }
  ];
};

// Валидация персонажа
export const validateCharacter = (character) => {
  const errors = [];

  if (!character.name || character.name.trim().length === 0) {
    errors.push('Имя персонажа обязательно');
  }

  if (!character.gender || !['male', 'female'].includes(character.gender)) {
    errors.push('Пол персонажа должен быть указан');
  }

  if (!character.stats) {
    errors.push('Характеристики персонажа обязательны');
  } else {
    const requiredStats = ['health', 'attack', 'defense'];
    requiredStats.forEach(stat => {
      if (typeof character.stats[stat] !== 'number' || character.stats[stat] < 0) {
        errors.push(`Характеристика ${stat} должна быть положительным числом`);
      }
    });
  }

  return errors;
};

// Создание нового персонажа с базовыми характеристиками
export const createNewCharacter = (name, gender) => {
  const baseStats = {
    health: 100,
    attack: 10,
    defense: 5,
    magic: 5,
    agility: 10
  };

  return {
    name: name.trim(),
    gender,
    level: 1,
    description: '',
    stats: baseStats,
    appearance: {
      hair: gender === 'female' ? 'long_hair' : 'short1',
      hairColor: 'brown',
      eyes: 'pink_eyes',
      body: gender === 'female' ? 'Female body' : 'Male body',
      dress: gender === 'female' ? 'summer_dress' : 'casual'
    }
  };
};

// Получение иконки для пола
export const getGenderIcon = (gender) => {
  return gender === 'female' ? 'venus' : 'mars';
};

// Получение цвета для пола
export const getGenderColor = (gender) => {
  return gender === 'female' ? '#ff69b4' : '#4169e1';
};

// Форматирование уровня
export const formatLevel = (level) => {
  return `Уровень ${level}`;
};

// Получение общего рейтинга персонажа
export const getCharacterRating = (character) => {
  if (!character.stats) return 0;
  
  const { health, attack, defense, magic, agility } = character.stats;
  return Math.floor((health + attack + defense + magic + agility) / 5);
};

/**
 * Получение типа персонажа из пола и возраста
 */
export const getCharacterType = (gender, age) => {
  if (age === '2' || age === 'mature') {
    return `${gender}_mature`;
  }
  return gender;
};

/**
 * Получение платных предметов одежды для персонажа
 */
export const getPaidClothingItems = (gender, age) => {
  const clothingItems = Object.values(itemsData.items.clothing);
  
  return clothingItems.filter(item => {
    // Проверяем, что это платная одежда (цена в gems)
    if (item.price?.currency !== 'gems') return false;
    
    // Проверяем совместимость по полу и возрасту
    if (item.gender && item.gender !== gender) return false;
    
    // Преобразуем возраст: '2' -> 'mature', '1' -> '1'
    const itemAge = item.age === 'mature' ? '2' : item.age;
    if (item.age && itemAge !== age) return false;
    
    return true;
  });
};

/**
 * Проверка, куплен ли предмет одежды
 */
export const isClothingItemOwned = (itemId, inventory) => {
  if (!inventory) return false;
  
  // Проверяем наличие предмета в инвентаре
  // Инвентарь хранится в формате { itemId: { quantity, lastAdded } }
  return inventory[itemId] && inventory[itemId].quantity > 0;
};

/**
 * Получение доступных платных опций для персонажа
 */
export const getAvailablePaidOptions = (gender, age, inventory) => {
  const paidItems = getPaidClothingItems(gender, age);
  const ownedItems = paidItems.filter(item => isClothingItemOwned(item.id, inventory));
  
  return {
    dresses: ownedItems.filter(item => item.subtype === 'dress').map(item => item.id),
    accessories: ownedItems.filter(item => item.subtype === 'accessory').map(item => item.id)
  };
};

/**
 * Получение названия предмета одежды из character_sprites.json
 */
export const getClothingSpriteName = (itemId) => {
  // Маппинг ID предметов на названия в character_sprites.json
  const itemMapping = {
    // Женские платья
    'female_mature_casual2': 'casual2',
    'female_mature_casual3': 'casual3',
    'female_mature_dress1': 'dress1',
    'female_mature_summer_dress': 'summer_dress',
    
    // Мужские платья
    'male_casual4': 'casual4',
    'male_casual5': 'casual5',
    'male_casual6': 'casual6',
    'male_office1': 'office1',
    'male_office2': 'office2',
    'male_office3': 'office3',
    'male_office4': 'office4',
    'male_vest': 'vest',
    
    // Мужские зрелые платья
    'male_mature_casual1': 'casual1',
    'male_mature_casual2': 'casual2',
    'male_mature_tshirt2': 'tshirt2',
    'male_mature_vest': 'vest',
    
    // Аксессуары
    'black_ribbon': 'black_ribbon',
    'choker': 'choker',
    'ribbon': 'ribbon',
    'rose1': 'rose1',
    'rose2': 'rose2',
    'white_ribbon': 'white_ribbon',
    'yellow_ribbon': 'yellow_ribbon'
  };
  
  return itemMapping[itemId] || itemId;
};

/**
 * Сборка спрайта персонажа из слоев с учетом платных предметов
 */
export const buildCharacterSprite = (characterData, inventory = null) => {
  const { gender, age, appearance, emotion } = characterData;
  const type = getCharacterType(gender, age);
  
  const layers = [];
  
  // 0. Волосы сзади (если выбраны)
  
  if (appearance.hairBehind && typeof appearance.hairBehind === 'string') {
    const hairBehindPath = characterSprites.hair_behind[type]?.[appearance.hairBehind]?.[appearance.hairColor];
    if (hairBehindPath) {
      layers.push({
        src: `${process.env.PUBLIC_URL}/sprites/characters/${hairBehindPath}`,
        zIndex: 0
      });
    }
  }
  
  // 1. Тело
  const bodyData = characterSprites.base_body[type];
  if (bodyData) {
    layers.push({
      src: `${process.env.PUBLIC_URL}/sprites/characters/${bodyData.file}`,
      zIndex: 1,
      size: bodyData.size
    });
  }
  
  // 2. Эмоция (поддерживает разные эмоции)
  const emotionToUse = emotion || 'normal';
  const emotionPath = characterSprites.emotion[type]?.pink_eyes?.[emotionToUse];
  if (emotionPath) {
    layers.push({
      src: `${process.env.PUBLIC_URL}/sprites/characters/${emotionPath}`,
      zIndex: 2
    });
  }
  
  // 3. Смущение (только для женских персонажей в определённых сценах)
  if (gender === 'female' && appearance.bush && characterSprites.bush[type]?.[appearance.bush]) {
    const bushPath = characterSprites.bush[type][appearance.bush];
    layers.push({
      src: `${process.env.PUBLIC_URL}/sprites/characters/${bushPath}`,
      zIndex: 3
    });
  }
  
  // 4. Одежда
  let dressPath = null;
  if (appearance.dressPaid && inventory) {
    // Проверяем, куплена ли платная одежда
    const dressItemId = appearance.dress;
    if (isClothingItemOwned(dressItemId, inventory)) {
      const spriteName = getClothingSpriteName(dressItemId);
      dressPath = characterSprites.dresses[type]?.paid?.[spriteName];
    }
  } else {
    // Бесплатная одежда
    dressPath = characterSprites.dresses[type]?.free?.[appearance.dress];
  }
  
  if (dressPath) {
    layers.push({
      src: `${process.env.PUBLIC_URL}/sprites/characters/${dressPath}`,
      zIndex: 4
    });
  }
  
  // 5. Причёска
  const hairPath = characterSprites.hairs[type]?.[appearance.hairStyle]?.[appearance.hairColor];
  if (hairPath) {
    layers.push({
      src: `${process.env.PUBLIC_URL}/sprites/characters/${hairPath}`,
      zIndex: 5
    });
  }
  
  // 6. Аксессуары (если есть)
  if (appearance.accessory) {
    let accessoryPath = null;
    if (appearance.accessoryPaid && inventory) {
      // Проверяем, куплен ли платный аксессуар
      const accessoryItemId = appearance.accessory;
      if (isClothingItemOwned(accessoryItemId, inventory)) {
        const spriteName = getClothingSpriteName(accessoryItemId);
        accessoryPath = characterSprites.accessories[type]?.paid?.[spriteName];
      }
    } else {
      // Бесплатный аксессуар
      accessoryPath = characterSprites.accessories[type]?.free?.[appearance.accessory];
    }
    
    if (accessoryPath) {
      layers.push({
        src: `${process.env.PUBLIC_URL}/sprites/characters/${accessoryPath}`,
        zIndex: 6
      });
    }
  }
  
  const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
  
  return sortedLayers;
};

/**
 * Получение доступных опций для персонажа
 */
export const getAvailableOptions = (gender, age) => {
  const type = getCharacterType(gender, age);
  
  return {
    hairStyles: Object.keys(characterSprites.hairs[type] || {}),
    hairColors: Object.keys(characterSprites.hairs[type]?.[Object.keys(characterSprites.hairs[type] || {})[0]] || {}),
    hairBehindStyles: Object.keys(characterSprites.hair_behind[type] || {}),
    emotions: Object.keys(characterSprites.emotion[type]?.pink_eyes || {}),
    dresses: {
      free: Object.keys(characterSprites.dresses[type]?.free || {}),
      paid: Object.keys(characterSprites.dresses[type]?.paid || {})
    },
    accessories: {
      free: Object.keys(characterSprites.accessories[type]?.free || {}),
      paid: Object.keys(characterSprites.accessories[type]?.paid || {})
    },
    bush: gender === 'female' ? Object.keys(characterSprites.bush[type] || {}) : []
  };
};

/**
 * Проверка совместимости прически и волос сзади
 */
export const supportsHairBehind = (gender, age, hairStyle) => {
  const type = getCharacterType(gender, age);
  const hairBehindData = characterSprites.hair_behind[type];
  
  // Теперь волосы сзади доступны для всех причесок
  return hairBehindData && Object.keys(hairBehindData).length > 0;
};

/**
 * Получение информации о размере тела персонажа
 */
export const getCharacterSize = (gender, age) => {
  const type = getCharacterType(gender, age);
  const bodyData = characterSprites.base_body[type];
  
  return bodyData?.size || [800, 1000];
};

/**
 * Получение масштаба для превью персонажа
 */
export const getCharacterPreviewScale = (gender, age) => {
  const type = getCharacterType(gender, age);
  
  // Увеличиваем масштаб для female_mature, чтобы спрайт лучше заполнял контейнер
  if (type === 'female_mature') {
    return 1.8;
  }
  
  return 1.2;
};

/**
 * Валидация выбора персонажа
 */
export const validateCharacterChoice = (characterData) => {
  const { gender, age, appearance } = characterData;
  const type = getCharacterType(gender, age);
  const errors = [];
  
  // Проверка существования прически
  if (!characterSprites.hairs[type]?.[appearance.hairStyle]) {
    errors.push('Выбранная прическа недоступна для данного типа персонажа');
  }
  
  // Проверка существования цвета волос
  if (!characterSprites.hairs[type]?.[appearance.hairStyle]?.[appearance.hairColor]) {
    errors.push('Выбранный цвет волос недоступен для данной прически');
  }
  
  // Проверка совместимости волос сзади
  if (appearance.hairBehind && !supportsHairBehind(gender, age, appearance.hairStyle)) {
    errors.push('Данная прическа не поддерживает волосы сзади');
  }
  
  // Проверка существования одежды
  const dressCategory = appearance.dressPaid ? 'paid' : 'free';
  if (!characterSprites.dresses[type]?.[dressCategory]?.[appearance.dress]) {
    errors.push('Выбранная одежда недоступна');
  }
  
  // Проверка существования аксессуара
  if (appearance.accessory) {
    const accessoryCategory = appearance.accessoryPaid ? 'paid' : 'free';
    if (!characterSprites.accessories[type]?.[accessoryCategory]?.[appearance.accessory]) {
      errors.push('Выбранный аксессуар недоступен');
    }
  }
  
  return errors;
};

/**
 * Получение названия опции для отображения
 */
export const getOptionDisplayName = (optionKey) => {
  const displayNames = {
    // Прически
    'long_hair': 'Длинные волосы',
    'short_hair': 'Короткие волосы',
    'hime_cut': 'Принцесса',
    'short_bob': 'Каре',
    'twin_tail': 'Два хвостика',
    'long': 'Длинные',
    'short': 'Короткие',
    'curly': 'Кудрявые',
    'long2': 'Длинные 2',
    'long3': 'Длинные 3',
    'long4': 'Длинные 4',
    'short1': 'Короткие 1',
    'short2': 'Короткие 2',
    'short3': 'Короткие 3',
    'short4': 'Короткие 4',
    'middle': 'Средние',
    'side_curl': 'Локон',
    'hime_cut_short': 'Принцесса короткая',
    'long_blocking_eyes': 'Длинные на глаза',
    'long1': 'Длинные 1',
    
    // Цвета волос
    'blond': 'Светлые',
    'brown': 'Каштановые',
    'dark': 'Темные',
    'pink': 'Розовые',
    'silver': 'Серебристые',
    'red': 'Рыжие',
    'black': 'Черные',
    
    // Одежда
    'hoodie': 'Худи',
    'casual': 'Повседневная',
    'school_uniform': 'Школьная форма',
    'sport_uniform': 'Спортивная форма',
    'summer_dress': 'Летнее платье',
    'winter_outfit': 'Зимний наряд',
    'tanktop': 'Майка',
    'tshirt': 'Футболка',
    'office_suit': 'Офисный костюм',
    'winter': 'Зимняя одежда',
    
    // Аксессуары
    'black_glasses': 'Черные очки',
    'circle_glasses': 'Круглые очки',
    'red_glasses': 'Красные очки',
    'glasses': 'Очки',
    'glasses_black': 'Черные очки',
    'headphones': 'Наушники',
    'flower': 'Цветок',
    'choker': 'Чокер',
    'black_band': 'Черная лента',
    'white_band': 'Белая лента',
    'yellow_band': 'Желтая лента',
    'black_ribbon': 'Черная лента',
    'ribbon': 'Лента',
    'rose1': 'Роза 1',
    'rose2': 'Роза 2',
    'white_ribbon': 'Белая лента',
    'yellow_ribbon': 'Желтая лента'
  };
  
  return displayNames[optionKey] || optionKey.replace('_', ' ');
};

/**
 * Тестирование системы платных предметов
 */
export const testPaidClothingSystem = (gender, age, inventory) => {
  console.log('=== ТЕСТ СИСТЕМЫ ПЛАТНЫХ ПРЕДМЕТОВ ===');
  console.log('Пол:', gender, 'Возраст:', age);
  console.log('Инвентарь:', inventory);
  
  const paidItems = getPaidClothingItems(gender, age);
  console.log('Доступные платные предметы для персонажа:', paidItems.map(item => item.name));
  
  const availableOptions = getAvailablePaidOptions(gender, age, inventory);
  console.log('Купленные платные опции:', availableOptions);
  
  // Проверяем каждый платный предмет
  paidItems.forEach(item => {
    const isOwned = isClothingItemOwned(item.id, inventory);
    console.log(`${item.name} (${item.id}): ${isOwned ? '✅ Куплен' : '❌ Не куплен'}`);
  });
  
  console.log('=== ТЕСТ ЗАВЕРШЕН ===');
}; 