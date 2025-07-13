/**
 * Система обработки предметов в диалогах
 */

import itemsData from '../data/items.json';

/**
 * Обработка эффектов выбора в диалоге
 * @param {Object} choice - Выбор из диалога
 * @param {Object} gameState - Текущее состояние игры
 * @param {Function} updateInventory - Функция обновления инвентаря
 * @param {Function} updateRelationships - Функция обновления отношений
 * @param {Function} showNotification - Функция показа уведомлений
 * @returns {Object} - Обновленное состояние игры
 */
export function processChoiceEffects(choice, gameState, updateInventory, updateRelationships, showNotification) {
  const effects = choice.effects || {};
  const newGameState = { ...gameState };

  // Обработка предметов
  if (effects.items) {
    newGameState.inventory = processItemEffects(effects.items, gameState.inventory, showNotification);
    if (updateInventory) {
      updateInventory(newGameState.inventory);
    }
  }

  // Обработка отношений
  if (effects.relationships) {
    newGameState.relationships = processRelationshipEffects(effects.relationships, gameState.relationships);
    if (updateRelationships) {
      updateRelationships(newGameState.relationships);
    }
  }

  return newGameState;
}

/**
 * Обработка эффектов предметов
 * @param {Object} itemEffects - Эффекты предметов
 * @param {Object} inventory - Текущий инвентарь
 * @param {Function} showNotification - Функция показа уведомлений
 * @returns {Object} - Обновленный инвентарь
 */
function processItemEffects(itemEffects, inventory, showNotification) {
  const newInventory = { ...inventory };

  // Добавление предметов
  if (itemEffects.add) {
    const itemsToAdd = Array.isArray(itemEffects.add) ? itemEffects.add : [itemEffects.add];
    itemsToAdd.forEach(itemId => {
      if (!newInventory[itemId]) {
        newInventory[itemId] = 0;
      }
      newInventory[itemId]++;
      
      // Показываем уведомление о получении предмета
      if (showNotification) {
        const itemName = getItemName(itemId);
        showNotification(`Получен предмет "${itemName}"`, 'success');
      }
    });
  }

  // Удаление предметов
  if (itemEffects.remove) {
    const itemsToRemove = Array.isArray(itemEffects.remove) ? itemEffects.remove : [itemEffects.remove];
    itemsToRemove.forEach(itemId => {
      if (newInventory[itemId] && newInventory[itemId] > 0) {
        newInventory[itemId]--;
        if (newInventory[itemId] === 0) {
          delete newInventory[itemId];
        }
        
        // Показываем уведомление об изъятии предмета
        if (showNotification) {
          const itemName = getItemName(itemId);
          showNotification(`Изъят предмет "${itemName}"`, 'info');
        }
      }
    });
  }

  return newInventory;
}

/**
 * Обработка эффектов отношений
 * @param {Object} relationshipEffects - Эффекты отношений
 * @param {Object} relationships - Текущие отношения
 * @returns {Object} - Обновленные отношения
 */
function processRelationshipEffects(relationshipEffects, relationships) {
  const newRelationships = { ...relationships };

  Object.entries(relationshipEffects).forEach(([characterId, change]) => {
    if (!newRelationships[characterId]) {
      newRelationships[characterId] = 0;
    }
    newRelationships[characterId] += change;
    
    // Ограничиваем значения отношений
    newRelationships[characterId] = Math.max(-100, Math.min(100, newRelationships[characterId]));
  });

  return newRelationships;
}

/**
 * Проверка доступности выбора на основе требуемых предметов
 * @param {Object} choice - Выбор из диалога
 * @param {Object} inventory - Текущий инвентарь
 * @returns {boolean} - Доступен ли выбор
 */
export function isChoiceAvailable(choice, inventory) {
  console.log('isChoiceAvailable - проверка выбора:', choice.id || 'undefined');
  console.log('isChoiceAvailable - инвентарь:', inventory);
  
  // Проверяем требуемый предмет
  if (choice.requiredItem) {
    console.log('isChoiceAvailable - требуется предмет:', choice.requiredItem);
    
    // Поддерживаем оба формата инвентаря
    const itemData = inventory[choice.requiredItem];
    console.log('isChoiceAvailable - данные предмета:', itemData);
    
    if (typeof itemData === 'number') {
      // Простой формат: { itemId: number }
      const hasItem = itemData > 0;
      console.log('isChoiceAvailable - простой формат, количество:', itemData, 'доступен:', hasItem);
      return hasItem;
    } else if (itemData && typeof itemData === 'object' && itemData.quantity !== undefined) {
      // Сложный формат: { itemId: { quantity: number, ... } }
      const hasItem = itemData.quantity > 0;
      console.log('isChoiceAvailable - сложный формат, количество:', itemData.quantity, 'доступен:', hasItem);
      return hasItem;
    } else {
      // Предмет не найден
      console.log('isChoiceAvailable - предмет не найден в инвентаре');
      return false;
    }
  }

  // Проверяем требуемый уровень отношений
  if (choice.requiredRelationship) {
    // Эта логика будет реализована позже
    console.log('isChoiceAvailable - требуется уровень отношений:', choice.requiredRelationship);
    return true;
  }

  console.log('isChoiceAvailable - выбор доступен (нет требований)');
  return true;
}

/**
 * Получение имени предмета по ID
 * @param {string} itemId - ID предмета
 * @returns {string} - Имя предмета
 */
function getItemName(itemId) {
  console.log(`DialogueItemSystem.getItemName вызвана для: ${itemId}`);
  
  try {
    // Проверяем все категории предметов
    const categories = ['consumable', 'material', 'special', 'pet', 'clothing', 'chest', 'key'];
    
    for (const category of categories) {
      const categoryItems = itemsData.items[category];
      if (categoryItems && categoryItems[itemId]) {
        const name = categoryItems[itemId].name || itemId;
        console.log(`DialogueItemSystem: найден предмет в категории ${category}: ${itemId} -> ${name}`);
        return name;
      }
    }
    console.log(`DialogueItemSystem: предмет ${itemId} не найден в itemsData`);
  } catch (error) {
    console.warn('DialogueItemSystem: ошибка при загрузке items.json:', error);
  }
  
  // Если предмет не найден, возвращаем ID как есть
  console.log(`DialogueItemSystem: предмет ${itemId} не найден, возвращаем ID`);
  return itemId;
}

/**
 * Получение уровня отношений с персонажем
 * @param {number} relationshipValue - Значение отношений
 * @returns {string} - Уровень отношений
 */
export function getRelationshipLevel(relationshipValue) {
  if (relationshipValue >= 80) return 'love';
  if (relationshipValue >= 60) return 'friendship';
  if (relationshipValue >= 40) return 'acquaintance';
  if (relationshipValue >= 20) return 'neutral';
  if (relationshipValue >= 0) return 'stranger';
  return 'hostile';
}

/**
 * Проверка, достигнут ли требуемый уровень отношений
 * @param {Object} requiredRelationship - Требуемые отношения
 * @param {Object} currentRelationships - Текущие отношения
 * @returns {boolean} - Достигнут ли уровень
 */
export function checkRelationshipRequirement(requiredRelationship, currentRelationships) {
  const [characterId, requiredLevel] = Object.entries(requiredRelationship)[0];
  const currentValue = currentRelationships[characterId] || 0;
  const currentLevel = getRelationshipLevel(currentValue);
  
  const levelHierarchy = {
    'hostile': 0,
    'stranger': 1,
    'neutral': 2,
    'acquaintance': 3,
    'friendship': 4,
    'love': 5
  };
  
  return levelHierarchy[currentLevel] >= levelHierarchy[requiredLevel];
} 