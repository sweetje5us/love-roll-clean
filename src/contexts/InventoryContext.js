import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItemById } from '../utils/itemUtils';
import itemsData from '../data/items.json';

const InventoryContext = createContext();

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('game_inventory');
    const initialInventory = savedInventory ? JSON.parse(savedInventory) : {};
    
    // Если инвентарь пустой, добавляем питомца "крыса"
    if (Object.keys(initialInventory).length === 0) {
      initialInventory.rat = {
        quantity: 1,
        lastAdded: new Date().toISOString()
      };
    }
    
    return initialInventory;
  });

  // Сохранение инвентаря в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('game_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Автоматическое исправление опечатки при загрузке
  useEffect(() => {
    const savedInventory = localStorage.getItem('game_inventory');
    if (savedInventory) {
      const parsedInventory = JSON.parse(savedInventory);
      if (parsedInventory['ressurection_potion']) {
        console.log('Найдена опечатка ressurection_potion, исправляем...');
        fixResurrectionPotionTypo();
      }
    }
  }, []); // Выполняется только при первой загрузке

  // Добавить предмет в инвентарь
  const addItem = (itemId, quantity = 1) => {
    setInventory(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: (prev[itemId]?.quantity || 0) + quantity,
        lastAdded: new Date().toISOString()
      }
    }));
  };

  // Удалить предмет из инвентаря
  const removeItem = (itemId, quantity = 1) => {
    setInventory(prev => {
      const currentQuantity = prev[itemId]?.quantity || 0;
      const newQuantity = Math.max(0, currentQuantity - quantity);
      
      if (newQuantity === 0) {
        const newInventory = { ...prev };
        delete newInventory[itemId];
        return newInventory;
      }
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      };
    });
  };

  // Установить количество предмета
  const setItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId, Infinity);
    } else {
      setInventory(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity,
          lastAdded: new Date().toISOString()
        }
      }));
    }
  };

  // Получить количество предмета
  const getItemQuantity = (itemId) => {
    return inventory[itemId]?.quantity || 0;
  };

  // Проверить, есть ли предмет в инвентаре
  const hasItem = (itemId, quantity = 1) => {
    return getItemQuantity(itemId) >= quantity;
  };

  // Получить все предметы в инвентаре
  const getAllItems = () => {
    return inventory;
  };

  // Получить количество уникальных предметов
  const getUniqueItemCount = () => {
    return Object.keys(inventory).length;
  };

  // Получить общее количество предметов
  const getTotalItemCount = () => {
    return Object.values(inventory).reduce((total, item) => total + item.quantity, 0);
  };

  // Очистить инвентарь (для тестирования)
  const clearInventory = () => {
    setInventory({});
  };

  // Добавить все расходники (для тестирования)
  const addAllConsumables = () => {
    const consumables = {};
    
    // Получаем все расходники из данных
    Object.values(itemsData.items.consumable || {}).forEach(item => {
      consumables[item.id] = { 
        quantity: 3, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    setInventory(prev => ({ ...prev, ...consumables }));
  };

  // Добавить все материалы (для тестирования)
  const addAllMaterials = () => {
    const materials = {};
    
    // Получаем все материалы из данных
    Object.values(itemsData.items.material || {}).forEach(item => {
      materials[item.id] = { 
        quantity: 5, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    setInventory(prev => ({ ...prev, ...materials }));
  };

  // Добавить всю одежду (для тестирования)
  const addAllClothing = () => {
    const clothing = {};
    
    // Получаем всю одежду из данных (плоская структура)
    Object.values(itemsData.items.clothing || {}).forEach(item => {
      clothing[item.id] = { 
        quantity: 1, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    setInventory(prev => ({ ...prev, ...clothing }));
  };

  // Добавить всех питомцев (для тестирования)
  const addAllPets = () => {
    const pets = {};
    
    // Получаем всех питомцев из данных
    Object.values(itemsData.items.pet || {}).forEach(item => {
      pets[item.id] = { 
        quantity: 1, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    setInventory(prev => ({ ...prev, ...pets }));
  };

  // Добавить все сундуки и ключи (для тестирования)
  const addAllChestsAndKeys = () => {
    const chestsAndKeys = {};
    
    // Получаем все сундуки и ключи из данных
    Object.values(itemsData.items.chest || {}).forEach(item => {
      chestsAndKeys[item.id] = { 
        quantity: 2, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    Object.values(itemsData.items.key || {}).forEach(item => {
      chestsAndKeys[item.id] = { 
        quantity: 2, 
        lastAdded: new Date().toISOString() 
      };
    });
    
    setInventory(prev => ({ ...prev, ...chestsAndKeys }));
  };

  // Очистить несуществующие предметы из инвентаря
  const cleanInvalidItems = () => {
    setInventory(prev => {
      const cleanedInventory = {};
      Object.entries(prev).forEach(([itemId, itemData]) => {
        // Проверяем, существует ли предмет в данных
        try {
          const itemInfo = getItemById(itemId);
          if (itemInfo) {
            cleanedInventory[itemId] = itemData;
          } else {
            console.warn(`Удаляем несуществующий предмет из инвентаря: ${itemId}`);
          }
        } catch (error) {
          console.warn(`Ошибка при проверке предмета ${itemId}:`, error);
        }
      });
      return cleanedInventory;
    });
  };

  // Исправить опечатку ressurection_potion → resurrection_potion
  const fixResurrectionPotionTypo = () => {
    setInventory(prev => {
      const updatedInventory = { ...prev };
      
      // Проверяем наличие опечатки
      if (updatedInventory['ressurection_potion']) {
        const quantity = updatedInventory['ressurection_potion'].quantity || 0;
        const lastAdded = updatedInventory['ressurection_potion'].lastAdded;
        
        // Удаляем неправильный предмет
        delete updatedInventory['ressurection_potion'];
        
        // Добавляем правильный предмет
        if (quantity > 0) {
          updatedInventory['resurrection_potion'] = {
            quantity: quantity,
            lastAdded: lastAdded || new Date().toISOString()
          };
          console.log(`Исправлена опечатка: ressurection_potion → resurrection_potion (${quantity} единиц)`);
        }
      }
      
      return updatedInventory;
    });
  };

  // Добавить тестовые предметы (для тестирования)
  const addTestItems = () => {
    // Сначала очищаем инвентарь от несуществующих предметов
    cleanInvalidItems();
    
    // Добавляем только существующие предметы
    const testItems = {
      // Зелья
      'health_potion': { quantity: 5, lastAdded: new Date().toISOString() },
      'mana_potion': { quantity: 3, lastAdded: new Date().toISOString() },
      'strength_potion': { quantity: 2, lastAdded: new Date().toISOString() },
      'agility_potion': { quantity: 1, lastAdded: new Date().toISOString() },
      'magic_potion': { quantity: 2, lastAdded: new Date().toISOString() },
      'basic_health_potion': { quantity: 3, lastAdded: new Date().toISOString() },
      'basic_mana_potion': { quantity: 2, lastAdded: new Date().toISOString() },
      'resurrection_potion': { quantity: 1, lastAdded: new Date().toISOString() },
      'golden_apple': { quantity: 1, lastAdded: new Date().toISOString() },
      
      // Материалы
      'bone': { quantity: 10, lastAdded: new Date().toISOString() },
      'fabric': { quantity: 8, lastAdded: new Date().toISOString() },
      'iron_ingot': { quantity: 3, lastAdded: new Date().toISOString() },
      'bronze_ingot': { quantity: 2, lastAdded: new Date().toISOString() },
      'gold_ingot': { quantity: 1, lastAdded: new Date().toISOString() },
      
      // Ключи и сундуки
      'old_key': { quantity: 2, lastAdded: new Date().toISOString() },
      'silver_key': { quantity: 1, lastAdded: new Date().toISOString() },
      'gold_key': { quantity: 1, lastAdded: new Date().toISOString() },
      'basic_chest': { quantity: 3, lastAdded: new Date().toISOString() },
      'silver_chest': { quantity: 2, lastAdded: new Date().toISOString() },
      'gold_chest': { quantity: 1, lastAdded: new Date().toISOString() },
      
      // Питомцы (только проверенные)
      'slime': { quantity: 1, lastAdded: new Date().toISOString() },
      'goblin': { quantity: 1, lastAdded: new Date().toISOString() },
      'wolf': { quantity: 1, lastAdded: new Date().toISOString() },
      'dragon': { quantity: 1, lastAdded: new Date().toISOString() },
      'griffin': { quantity: 1, lastAdded: new Date().toISOString() },
      'kraken': { quantity: 1, lastAdded: new Date().toISOString() },
      'basilisk': { quantity: 1, lastAdded: new Date().toISOString() },
      'dryad': { quantity: 1, lastAdded: new Date().toISOString() },
      'fairy': { quantity: 1, lastAdded: new Date().toISOString() },
      'troll': { quantity: 1, lastAdded: new Date().toISOString() },
      'cyclops': { quantity: 1, lastAdded: new Date().toISOString() },
      'harpy': { quantity: 1, lastAdded: new Date().toISOString() },
      'gorgon': { quantity: 1, lastAdded: new Date().toISOString() },
      'wraith': { quantity: 1, lastAdded: new Date().toISOString() },
      'banshee': { quantity: 1, lastAdded: new Date().toISOString() },
      'reaper': { quantity: 1, lastAdded: new Date().toISOString() }
    };
    
    // Проверяем каждый предмет перед добавлением
    const validItems = {};
    Object.entries(testItems).forEach(([itemId, itemData]) => {
      const itemInfo = getItemById(itemId);
      if (itemInfo) {
        validItems[itemId] = itemData;
      } else {
        console.warn(`Предмет ${itemId} не найден в данных, пропускаем`);
      }
    });
    
    setInventory(validItems);
  };

  const value = {
    inventory,
    addItem,
    removeItem,
    setItemQuantity,
    getItemQuantity,
    hasItem,
    getAllItems,
    getUniqueItemCount,
    getTotalItemCount,
    clearInventory,
    cleanInvalidItems,
    fixResurrectionPotionTypo,
    addAllConsumables,
    addAllMaterials,
    addAllClothing,
    addAllPets,
    addAllChestsAndKeys
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}; 