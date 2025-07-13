import itemsData from '../data/items.json';
import { getItemById } from './itemUtils';

// Конфигурация сундуков
export const CHEST_CONFIG = {
  basic_chest: {
    name: 'Обычный сундук',
    rarity: 'common',
    dropRates: {
      common: 70,
      rare: 25,
      mythical: 4,
      legendary: 1
    },
    minItems: 1,
    maxItems: 2,
    canDropPets: true,
    canDropConsumables: true,
    canDropMaterials: true
  },
  silver_chest: {
    name: 'Серебряный сундук',
    rarity: 'rare',
    dropRates: {
      common: 40,
      rare: 45,
      mythical: 12,
      legendary: 3
    },
    minItems: 2,
    maxItems: 3,
    canDropPets: true,
    canDropConsumables: true,
    canDropMaterials: true
  },
  gold_chest: {
    name: 'Золотой сундук',
    rarity: 'mythical',
    dropRates: {
      common: 20,
      rare: 35,
      mythical: 35,
      legendary: 10
    },
    minItems: 3,
    maxItems: 4,
    canDropPets: true,
    canDropConsumables: true,
    canDropMaterials: true
  }
};

// Получить конфигурацию сундука
export const getChestConfig = (chestId) => {
  return CHEST_CONFIG[chestId] || CHEST_CONFIG.basic_chest;
};

// Получить все предметы, которые могут выпасть из сундука
export const getChestLootPool = (chestId) => {
  const config = getChestConfig(chestId);
  const lootPool = [];

  // Получаем все предметы из JSON
  Object.values(itemsData.items).forEach(category => {
    Object.values(category).forEach(item => {
      // Исключаем сундуки, ключи и особые предметы
      if (item.type === 'chest' || item.type === 'key' || item.type === 'special') {
        return;
      }

      // Проверяем, может ли этот тип предмета выпасть из данного сундука
      if (item.type === 'pet' && !config.canDropPets) return;
      if (item.type === 'consumable' && !config.canDropConsumables) return;
      if (item.type === 'material' && !config.canDropMaterials) return;

      lootPool.push(item);
    });
  });

  return lootPool;
};

// Выбрать случайную редкость на основе шансов
export const selectRandomRarity = (dropRates) => {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const [rarity, rate] of Object.entries(dropRates)) {
    cumulative += rate;
    if (random <= cumulative) {
      return rarity;
    }
  }

  return 'common'; // fallback
};

// Получить случайный предмет определенной редкости
export const getRandomItemByRarity = (lootPool, rarity) => {
  const itemsOfRarity = lootPool.filter(item => item.rarity === rarity);
  
  if (itemsOfRarity.length === 0) {
    // Если нет предметов данной редкости, берем случайный
    return lootPool[Math.floor(Math.random() * lootPool.length)];
  }
  
  return itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
};

// Открыть сундук и получить награды
export const openChest = (chestId) => {
  const config = getChestConfig(chestId);
  const lootPool = getChestLootPool(chestId);
  const rewards = [];

  // Определяем количество предметов для выдачи
  const itemCount = Math.floor(Math.random() * (config.maxItems - config.minItems + 1)) + config.minItems;

  for (let i = 0; i < itemCount; i++) {
    // Выбираем редкость
    const rarity = selectRandomRarity(config.dropRates);
    
    // Получаем случайный предмет данной редкости
    const item = getRandomItemByRarity(lootPool, rarity);
    
    if (item) {
      rewards.push({
        ...item,
        obtainedAt: new Date().toISOString()
      });
    }
  }

  return rewards;
};

// Проверить, есть ли у игрока подходящий ключ для сундука
export const hasMatchingKey = (chestId, inventoryData) => {
  const chest = getItemById(chestId);
  if (!chest) return false;

  // Ищем ключ, который подходит к данному сундуку
  for (const [itemId, inventoryItem] of Object.entries(inventoryData)) {
    const item = getItemById(itemId);
    if (item && item.type === 'key' && item.opensChest === chestId && inventoryItem.quantity > 0) {
      return { keyId: itemId, keyItem: item };
    }
  }

  return false;
};

// Получить информацию о возможных наградах из сундука
export const getChestPreview = (chestId) => {
  const config = getChestConfig(chestId);
  const lootPool = getChestLootPool(chestId);
  
  const preview = {
    name: config.name,
    rarity: config.rarity,
    dropRates: config.dropRates,
    possibleItems: {
      common: lootPool.filter(item => item.rarity === 'common').slice(0, 3),
      rare: lootPool.filter(item => item.rarity === 'rare').slice(0, 3),
      mythical: lootPool.filter(item => item.rarity === 'mythical').slice(0, 3),
      legendary: lootPool.filter(item => item.rarity === 'legendary').slice(0, 3)
    },
    itemCount: `${config.minItems}-${config.maxItems}`
  };

  return preview;
}; 