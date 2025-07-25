// Утилиты для работы с кастомными квестовыми предметами

/**
 * Создает объект кастомного квестового предмета
 * @param {Object} params - Параметры предмета
 * @param {string} params.id - Уникальный ID предмета
 * @param {string} params.name - Название предмета
 * @param {string} [params.description] - Описание предмета
 * @param {string} [params.rarity] - Редкость предмета (common, uncommon, rare, legendary, mythical)
 * @param {string} [params.sprite] - Путь к спрайту
 * @param {Object} [params.extra] - Дополнительные свойства
 * @returns {Object} Объект квестового предмета
 */
export function createCustomQuestItem({ 
  id, 
  name, 
  description = '', 
  rarity = 'common', 
  sprite = '', 
  extra = {} 
}) {
  return {
    id,
    name,
    description,
    type: 'quest',
    rarity,
    sprite,
    ...extra
  };
}

/**
 * Проверяет, является ли предмет кастомным квестовым
 * @param {Object} item - Объект предмета
 * @returns {boolean}
 */
export function isCustomQuestItem(item) {
  return item && 
         typeof item === 'object' && 
         item.type === 'quest' && 
         item.id && 
         item.name &&
         !item.price; // У квестовых предметов нет цены
}

/**
 * Получает предмет по ID, включая кастомные квестовые предметы
 * @param {string} itemId - ID предмета
 * @param {Array} customItems - Массив кастомных предметов
 * @returns {Object|null} Объект предмета или null
 */
export function getItemByIdIncludingCustom(itemId, customItems = []) {
  // Сначала ищем в кастомных предметах
  const customItem = customItems.find(item => item.id === itemId);
  if (customItem) {
    return customItem;
  }
  
  // Затем ищем в стандартных предметах
  const { getItemById } = require('./itemUtils');
  return getItemById(itemId);
} 