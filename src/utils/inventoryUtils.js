import { getItemById } from './itemUtils';

// Получить предметы инвентаря с полной информацией
export const getInventoryItemsWithInfo = (inventoryData) => {
  const items = [];
  const itemsData = require('../data/items.json');
  
  Object.entries(inventoryData).forEach(([itemId, inventoryItem]) => {
    // Сначала проверяем квестовые предметы с шаблоном
    if (inventoryItem && inventoryItem.type === 'quest' && inventoryItem.type_of_quest_item) {
      const questTemplate = itemsData.items.quest[inventoryItem.type_of_quest_item];
      if (questTemplate) {
        items.push({
          ...questTemplate, // Спрайт, редкость и другие данные из шаблона
          ...inventoryItem, // Переопределяем id, name, description из инвентаря
          id: itemId, // Уникальный ID квестового предмета
          quantity: inventoryItem.quantity,
          lastAdded: inventoryItem.lastAdded
        });
      } else {
        console.warn(`Шаблон ${inventoryItem.type_of_quest_item} не найден для предмета ${itemId}`);
        // Шаблон не найден, используем данные из инвентаря
      items.push({
          ...inventoryItem,
          id: itemId,
          name: inventoryItem.name || `Квестовый предмет ${itemId}`,
          description: inventoryItem.description || 'Описание отсутствует',
        quantity: inventoryItem.quantity,
        lastAdded: inventoryItem.lastAdded
      });
      }
    } else if (inventoryItem && inventoryItem.name && inventoryItem.description) {
      // Предмет уже имеет полные данные (кастомный квестовый предмет без шаблона)
      items.push({
        ...inventoryItem,
        id: itemId,
        quantity: inventoryItem.quantity,
        lastAdded: inventoryItem.lastAdded
      });
    } else {
      // Обычный предмет - ищем в стандартных данных
      const itemInfo = getItemById(itemId, inventoryData);
      if (itemInfo) {
        items.push({
          ...itemInfo,
          quantity: inventoryItem.quantity,
          lastAdded: inventoryItem.lastAdded
        });
      } else {
        // Предмет не найден в стандартных данных, но есть в инвентаре
        console.warn(`Предмет ${itemId} не найден в стандартных данных, но присутствует в инвентаре`);
        items.push({
          id: itemId,
          name: inventoryItem.name || `Предмет ${itemId}`,
          description: inventoryItem.description || 'Описание отсутствует',
          type: inventoryItem.type || 'unknown',
          rarity: inventoryItem.rarity || 'unknown',
          quantity: inventoryItem.quantity,
          lastAdded: inventoryItem.lastAdded
        });
      }
    }
  });
  return items;
};

// Фильтрация предметов инвентаря
export const filterInventoryItems = (items, filters = {}) => {
  let filteredItems = [...items];

  // Фильтр по типу
  if (filters.type && filters.type !== 'all') {
    filteredItems = filteredItems.filter(item => item.type === filters.type);
  }

  // Поиск по названию
  if (filters.search && filters.search.trim() !== '') {
    const searchTerm = filters.search.toLowerCase().trim();
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  }

  // Фильтр по редкости
  if (filters.rarity && filters.rarity !== 'all') {
    filteredItems = filteredItems.filter(item => item.rarity === filters.rarity);
  }

  // Фильтр по возможности продажи
  if (filters.canSell !== undefined) {
    filteredItems = filteredItems.filter(item => item.canSell === filters.canSell);
  }

  // Фильтр по количеству
  if (filters.minQuantity !== undefined) {
    filteredItems = filteredItems.filter(item => item.quantity >= filters.minQuantity);
  }

  return filteredItems;
};

// Сортировка предметов инвентаря
export const sortInventoryItems = (items, sortBy = 'name', sortOrder = 'asc') => {
  const sortedItems = [...items];

  sortedItems.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
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
      case 'lastAdded':
        aValue = new Date(a.lastAdded || 0);
        bValue = new Date(b.lastAdded || 0);
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

// Получить статистику инвентаря
export const getInventoryStats = (items) => {
  const stats = {
    totalItems: 0,
    uniqueItems: items.length,
    byType: {},
    byRarity: {},
    canSell: 0,
    cannotSell: 0
  };

  items.forEach(item => {
    stats.totalItems += item.quantity;
    
    // По типам
    stats.byType[item.type] = (stats.byType[item.type] || 0) + item.quantity;
    
    // По редкости
    stats.byRarity[item.rarity] = (stats.byRarity[item.rarity] || 0) + item.quantity;
    
    // По возможности продажи
    if (item.canSell) {
      stats.canSell += item.quantity;
    } else {
      stats.cannotSell += item.quantity;
    }
  });

  return stats;
}; 