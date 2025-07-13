import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { 
  getInventoryItemsWithInfo, 
  getInventoryStats, 
  sortInventoryItems, 
  filterInventoryItems 
} from '../../utils/inventoryUtils';
import { getItemById } from '../../utils/itemUtils';
import ItemCard from './ItemCard';
import ChestModal from './ChestModal';
import './InventoryModal.css';

const InventoryModal = ({ isOpen, onClose }) => {
  const { getAllItems: getInventoryData, removeItem, addItem } = useInventory();
  const { addGold, addGems } = useCurrency();
  
  // Состояние для фильтров и поиска
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  
  // Состояние для модального окна сундука
  const [chestModal, setChestModal] = useState({
    isOpen: false,
    chestItem: null
  });

  // Получаем данные инвентаря
  const inventoryData = getInventoryData() || {};
  const inventoryItems = getInventoryItemsWithInfo(inventoryData);
  const inventoryStats = getInventoryStats(inventoryItems);

  // Фильтрация и сортировка инвентаря
  const filteredInventory = filterInventoryItems(inventoryItems, {
    type: inventoryFilter,
    search: inventorySearch
  });
  const sortedInventory = sortInventoryItems(filteredInventory, inventorySort);

  // Функции для работы с сундуками
  const handleChestClick = (chestItem) => {
    console.log('Клик по сундуку:', chestItem);
    setChestModal({
      isOpen: true,
      chestItem: chestItem
    });
  };

  const handleChestClose = () => {
    setChestModal({
      isOpen: false,
      chestItem: null
    });
  };

  const handleChestOpen = (itemId, quantity) => {
    console.log('Добавление награды из сундука:', { itemId, quantity });
    // Добавляем предметы из сундука в инвентарь
    addItem(itemId, quantity);
  };

  const handleChestRemoveItem = (itemId, quantity) => {
    console.log('Удаление предмета после открытия сундука:', { itemId, quantity });
    removeItem(itemId, quantity);
  };

  // Функция продажи предмета
  const sellItem = (itemId, sellPrice) => {
    const item = getItemById(itemId);
    if (!item || !item.canSell) {
      alert('Этот предмет нельзя продать!');
      return;
    }

    if (item.price?.currency === 'gems') {
      addGems(sellPrice);
    } else {
      addGold(sellPrice);
    }
    
    removeItem(itemId, 1);
    alert(`Предмет "${item.name}" продан за ${sellPrice} ${item.price?.currency === 'gems' ? 'камней' : 'монет'}!`);
  };

  // Очистка поиска при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setInventorySearch('');
      setInventoryFilter('all');
      setInventorySort('name');
    }
  }, [isOpen]);

  // Автоматическое скрытие статистики и фильтров на мобильных устройствах
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      setShowStats(false);
      setShowFilters(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="inventory-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="inventory-modal"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="inventory-modal-header">
              <h2>Инвентарь</h2>
              <button className="inventory-modal-close" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Статистика инвентаря */}
            <div className="inventory-stats-container">
              <button 
                className="inventory-stats-toggle"
                onClick={() => setShowStats(!showStats)}
              >
                <i className={`fas fa-${showStats ? 'chevron-up' : 'chevron-down'}`}></i>
                Статистика ({inventoryStats.totalItems} предметов)
              </button>
              
              {showStats && (
                <div className="inventory-stats">
                  <div className="stat-item">
                    <span className="stat-label">Всего предметов:</span>
                    <span className="stat-value">{inventoryStats.totalItems}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Уникальных:</span>
                    <span className="stat-value">{inventoryStats.uniqueItems}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Фильтры и поиск */}
            <div className="inventory-filters-container">
              <button 
                className="inventory-filters-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className={`fas fa-${showFilters ? 'chevron-up' : 'chevron-down'}`}></i>
                Фильтры и поиск
              </button>
              
              {showFilters && (
                <div className="inventory-filters">
                  <div className="filter-group">
                    <select 
                      value={inventoryFilter} 
                      onChange={(e) => setInventoryFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все предметы</option>
                      <option value="consumable">Расходники</option>
                      <option value="material">Материалы</option>
                      <option value="special">Особые</option>
                      <option value="pet">Питомцы</option>
                      <option value="clothing">Одежда</option>
                      <option value="chest">Сундуки</option>
                      <option value="key">Ключи</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <select 
                      value={inventorySort} 
                      onChange={(e) => setInventorySort(e.target.value)}
                      className="filter-select"
                    >
                      <option value="name">По названию</option>
                      <option value="rarity">По редкости</option>
                      <option value="type">По типу</option>
                      <option value="quantity">По количеству</option>
                      <option value="lastAdded">По дате получения</option>
                    </select>
                  </div>
                  
                  <div className="filter-group">
                    <input
                      type="text"
                      placeholder="Поиск предметов..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Список предметов */}
            <div className="inventory-items-container">
              {sortedInventory.length > 0 ? (
                <div className="inventory-items-grid">
                  {sortedInventory.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ItemCard
                        item={item}
                        onChestClick={handleChestClick}
                        onSell={() => sellItem(item.id, item.sellPrice)}
                        showQuantity={true}
                        showSellButton={item.canSell}
                        showBuyButton={false}
                        quantity={item.quantity}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-inventory">
                  <div className="empty-inventory-icon">
                    <i className="fas fa-box-open"></i>
                  </div>
                  <h3>Инвентарь пуст</h3>
                  <p>Купите предметы в магазине, чтобы они появились здесь</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Модальное окно сундука */}
          <ChestModal
            isOpen={chestModal.isOpen}
            onClose={handleChestClose}
            chestItem={chestModal.chestItem}
            inventoryData={inventoryData}
            onOpenChest={handleChestOpen}
            onRemoveItem={handleChestRemoveItem}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InventoryModal; 