import itemsData from '../data/items.json';
import { getCurrentWeek, getWeeklyItems, getRotationInfo } from './shopRotation';
import { getCurrentDiscounts, hasDiscount, getItemDiscount } from './discountSystem';
import { getInventoryItemsWithInfo, getInventoryStats, sortInventoryItems, filterInventoryItems } from './inventoryUtils';

// Получить все предметы
export const getAllItems = () => {
  const allItems = [];
  Object.values(itemsData.items).forEach(category => {
    Object.values(category).forEach(item => {
      allItems.push(item);
    });
  });
  return allItems;
};

// Получить предметы по типу
export const getItemsByType = (type, inventory = {}) => {
  if (type === 'all') {
    return getShopItemsWithInventoryFilter(inventory);
  }
  // Исключаем сундуки и особые предметы из всех категорий
  if (type === 'chest' || type === 'special') {
    return [];
  }
  
  // Получаем все предметы магазина с фильтрацией и фильтруем по типу
  const shopItems = getShopItemsWithInventoryFilter(inventory);
  return shopItems.filter(item => item.type === type);
};

// Получить предметы по редкости
export const getItemsByRarity = (rarity) => {
  const allItems = getAllItems();
  return allItems.filter(item => item.rarity === rarity);
};

// Получить предмет по ID
export const getItemById = (id) => {
  const allItems = getAllItems();
  return allItems.find(item => item.id === id);
};

// Получить информацию о редкости
export const getRarityInfo = (rarity) => {
  return itemsData.rarity[rarity] || null;
};

// Получить информацию о типе
export const getTypeInfo = (type) => {
  return itemsData.types[type] || null;
};

// Получить все типы предметов
export const getAllTypes = () => {
  return Object.keys(itemsData.types).filter(type => 
    type !== 'chest' && type !== 'special'
  );
};

// Получить все редкости
export const getAllRarities = () => {
  return Object.keys(itemsData.rarity);
};

// Фильтрация предметов
export const filterItems = (items, filters = {}) => {
  let filteredItems = [...items];

  // Фильтр по типу
  if (filters.type && filters.type !== 'all') {
    filteredItems = filteredItems.filter(item => item.type === filters.type);
  }

  // Фильтр по редкости
  if (filters.rarity && filters.rarity !== 'all') {
    filteredItems = filteredItems.filter(item => item.rarity === filters.rarity);
  }

  // Фильтр по цене
  if (filters.minPrice !== undefined) {
    filteredItems = filteredItems.filter(item => {
      const price = item.price.currency === 'gems' ? item.price.amount * 10 : item.price.amount;
      return price >= filters.minPrice;
    });
  }

  if (filters.maxPrice !== undefined) {
    filteredItems = filteredItems.filter(item => {
      const price = item.price.currency === 'gems' ? item.price.amount * 10 : item.price.amount;
      return price <= filters.maxPrice;
    });
  }

  // Фильтр по валюте
  if (filters.currency) {
    filteredItems = filteredItems.filter(item => item.price.currency === filters.currency);
  }

  // Фильтр по возможности продажи
  if (filters.canSell !== undefined) {
    filteredItems = filteredItems.filter(item => item.canSell === filters.canSell);
  }

  return filteredItems;
};

// Сортировка предметов
export const sortItems = (items, sortBy = 'name', sortOrder = 'asc') => {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = a.price.currency === 'gems' ? a.price.amount * 10 : a.price.amount;
        bValue = b.price.currency === 'gems' ? b.price.amount * 10 : b.price.amount;
        break;
      case 'rarity':
        const rarityOrder = { common: 1, rare: 2, mythical: 3, legendary: 4 };
        aValue = rarityOrder[a.rarity] || 0;
        bValue = rarityOrder[b.rarity] || 0;
        break;
      case 'type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  return sortedItems;
};

// Форматирование цены
export const formatPrice = (price) => {
  if (price.currency === 'gems') {
    return `${price.amount} 💎`;
  } else {
    return `${price.amount} 🪙`;
  }
};

// Получить цвет редкости
export const getRarityColor = (rarity) => {
  const rarityInfo = getRarityInfo(rarity);
  return rarityInfo ? rarityInfo.color : '#9ca3af';
};

// Получить цвет типа
export const getTypeColor = (type) => {
  const typeInfo = getTypeInfo(type);
  return typeInfo ? typeInfo.color : '#6b7280';
};

// Проверить, можно ли продать предмет
export const canSellItem = (item) => {
  return item.canSell && item.sellPrice > 0;
};

// Получить цену продажи
export const getSellPrice = (item) => {
  return item.sellPrice || 0;
};

// Получить предметы для магазина (только те, что можно купить)
export const getShopItems = () => {
  const allItems = getAllItems();
  const availableItems = allItems.filter(item => 
    item.price && 
    item.price.amount > 0 && 
    item.type !== 'chest' && 
    item.type !== 'special' // Специальные предметы недоступны в магазине
  );
  
  // Применяем ротацию ассортимента (влияет только на питомцев)
  const currentWeek = getCurrentWeek();
  const rotatedItems = getWeeklyItems(availableItems, currentWeek);
  
  // Применяем скидки
  const discounts = getCurrentDiscounts(rotatedItems);
  
  // Добавляем информацию о скидках к предметам
  const itemsWithDiscounts = rotatedItems.map(item => {
    if (hasDiscount(item.id, discounts)) {
      const discount = getItemDiscount(item.id, discounts);
      return {
        ...item,
        hasDiscount: true,
        originalPrice: discount.originalPrice,
        discountPrice: discount.discountPrice,
        discountPercent: discount.discountPercent
      };
    }
    return item;
  });
  
  // Возвращаем все предметы с ротацией (питомцы меняются каждую неделю)
  return itemsWithDiscounts;
};

// Получить предметы для магазина с фильтрацией по инвентарю
export const getShopItemsWithInventoryFilter = (inventory = {}) => {
  const allShopItems = getShopItems();
  
  // Фильтруем предметы, исключая уже купленные питомцы и одежду
  const filteredItems = allShopItems.filter(item => {
    // Если это питомец или одежда, проверяем, есть ли уже в инвентаре
    if (item.type === 'pet' || item.type === 'clothing') {
      return !inventory[item.id]; // Исключаем, если уже есть в инвентаре
    }
    
    // Для остальных предметов оставляем как есть
    return true;
  });
  
  return filteredItems;
};

// Получить предметы для инвентаря (только те, что можно продать)
export const getInventoryItems = () => {
  const allItems = getAllItems();
  return allItems.filter(item => canSellItem(item));
};

// Функция для получения текста специальной способности питомца
export const getPetSpecialText = (pet) => {
  if (!pet.special) return null;
  
  const { type, ...params } = pet.special;
  
  switch (type) {
    case 'cube':
      return `🎲 Модификатор: +${params.modificator}`;
    case 'relation':
      return `💕 Отношения: +${params.increase}`;
    case 'money':
      return `💰 Деньги: +${params.increase}`;
    case 'reroll':
      return `🔄 Переброс: ${params.count}`;
    case 'price':
      return `💎 Цена: ${params.value}`;
    case 'stat':
      const statNames = {
        charisma: 'Харизма',
        coldness: 'Хладнокровие',
        sensitivity: 'Чувствительность',
        cunning: 'Хитрость',
        determination: 'Решительность',
        intelligence: 'Интеллект'
      };
      return `📊 ${statNames[params.stat_type]}: +${params.bonus}`;
    default:
      return null;
  }
};

// Функция для получения иконки специальной способности
export const getPetSpecialIcon = (specialType) => {
  switch (specialType) {
    case 'cube':
      return '🎲';
    case 'relation':
      return '💕';
    case 'money':
      return '💰';
    case 'reroll':
      return '🔄';
    case 'price':
      return '💎';
    case 'stat':
      return '📊';
    default:
      return '✨';
  }
};

// Функция для получения цвета специальной способности
export const getPetSpecialColor = (specialType) => {
  switch (specialType) {
    case 'cube':
      return '#8B5CF6'; // Фиолетовый
    case 'relation':
      return '#EC4899'; // Розовый
    case 'money':
      return '#F59E0B'; // Оранжевый
    case 'reroll':
      return '#10B981'; // Зеленый
    case 'price':
      return '#F59E0B'; // Золотой
    case 'stat':
      return '#3B82F6'; // Синий
    default:
      return '#6B7280'; // Серый
  }
}; 

// Реэкспорт функций из других модулей
export { getRotationInfo } from './shopRotation';
export { getCurrentDiscounts } from './discountSystem';
export { getInventoryItemsWithInfo, getInventoryStats, sortInventoryItems, filterInventoryItems } from './inventoryUtils'; 