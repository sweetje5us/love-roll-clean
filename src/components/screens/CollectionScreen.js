import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useCharacters } from '../../contexts/CharacterContext';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import ItemCard from '../ui/ItemCard';
import CharacterCard from '../ui/CharacterCard';
import ChestModal from '../ui/ChestModal';
import { getInventoryItemsWithInfo, filterInventoryItems, sortInventoryItems, getInventoryStats } from '../../utils/inventoryUtils';
import { getItemById } from '../../utils/itemUtils';
import './CollectionScreen.css';

const CollectionScreen = () => {
  const { goBack, navigateTo, getNavigationParams } = useScreen();
  const { gold, gems } = useCurrency();
  const { getAllItems: getInventoryData, addItem, removeItem } = useInventory();
  const { getAllCharacters, removeCharacter, addExperience } = useCharacters();
  
  // Получаем параметры навигации для установки активной вкладки
  const navigationParams = getNavigationParams();
  const [activeTab, setActiveTab] = useState(navigationParams.activeTab || 'inventory');
  
  // Проверяем, пришел ли пользователь из экрана выбора персонажа
  const cameFromCharacterSelect = navigationParams.fromCharacterSelect;
  
  // Обновляем активную вкладку при изменении параметров навигации
  useEffect(() => {
    if (navigationParams.activeTab) {
      setActiveTab(navigationParams.activeTab);
    }
  }, [navigationParams.activeTab]);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');
  const [inventorySearch, setInventorySearch] = useState('');

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

  // Переключение вкладок
  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

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
    addItem(itemId, quantity);
  };

  const handleChestRemoveItem = (itemId, quantity) => {
    console.log('Удаление предмета после открытия сундука:', { itemId, quantity });
    removeItem(itemId, quantity);
  };

  // Функции для работы с персонажами
  const handleCreateCharacter = () => {
    navigateTo(SCREEN_TYPES.CHARACTER_CREATOR, { 
      fromCollection: true,
      returnToCollection: true,
      collectionTab: activeTab 
    });
  };

  const handleDeleteCharacter = (characterId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого персонажа?')) {
      removeCharacter(characterId);
    }
  };

  const handleEditCharacter = (character) => {
    // Переходим к редактированию персонажа через CharacterEditModal
    // Для этого нужно открыть модальное окно, но сначала проверим, есть ли у нас доступ к CharacterEditModal
    // Пока используем CharacterCreatorScreen, но с правильными параметрами
    navigateTo(SCREEN_TYPES.CHARACTER_CREATOR, { 
      character,
      fromCollection: true,
      returnToCollection: true,
      collectionTab: activeTab 
    });
  };



  // Получаем список персонажей
  const characters = getAllCharacters();

  return (
    <motion.div 
      className="collection-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="collection-container">
        {/* Заголовок и валюта */}
        <div className="collection-header">
          <button className="back-button" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="collection-title">Коллекция</h1>
          <div className="currency-container">
            <div className="currency-item">
              <span className="currency-icon gold-icon"></span>
              <span className="gold-amount">{gold}</span>
            </div>
            <div className="currency-item">
              <span className="currency-icon gem-icon"></span>
              <span className="gem-amount">{gems}</span>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => switchTab('characters')}
          >
            <i className="fas fa-users"></i>
            Персонажи
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => switchTab('inventory')}
          >
            <i className="fas fa-backpack"></i>
            Инвентарь
          </button>
          <button 
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => switchTab('achievements')}
          >
            <i className="fas fa-trophy"></i>
            Достижения
          </button>
        </div>

        {/* Содержимое вкладок */}
        <div className="tab-content">
          {/* Вкладка персонажи */}
          {activeTab === 'characters' && (
            <div className="characters-content">
              {/* Заголовок и кнопка */}
              <div className="characters-header">
                <div className="characters-stats">
                  <div className="stat-item">
                    <span className="stat-label">Персонажей:</span>
                    <span className="stat-value">{characters.length}</span>
                  </div>
                </div>
                <button 
                  className="add-character-btn"
                  onClick={handleCreateCharacter}
                >
                  <i className="fas fa-plus"></i>
                  Создать персонажа
                </button>
              </div>

              {/* Список персонажей */}
              {characters.length > 0 ? (
                <div className="characters-grid">
                  {characters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onDelete={handleDeleteCharacter}
                      onEdit={handleEditCharacter}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-characters">
                  <i className="fas fa-users empty-characters-icon"></i>
                  <h3>Персонажи отсутствуют</h3>
                  <p>Создайте своего первого персонажа, чтобы начать игру</p>
                  <button 
                    className="create-first-character-btn"
                    onClick={handleCreateCharacter}
                  >
                    <i className="fas fa-plus"></i>
                    Создать персонажа
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Вкладка инвентарь */}
          {activeTab === 'inventory' && (
            <div className="inventory-content">
              {/* Статистика инвентаря */}
              <div className="inventory-stats">
                <div className="stat-item">
                  <span className="stat-label">Предметов:</span>
                  <span className="stat-value">{inventoryStats.totalItems}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Уникальных:</span>
                  <span className="stat-value">{inventoryStats.uniqueItems}</span>
                </div>

              </div>

              {/* Фильтры и поиск */}
              <div className="inventory-filters">
                <div className="filter-group">
                  <select 
                    value={inventoryFilter} 
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Все предметы</option>
                    <option value="consumable">Зелья</option>
                    <option value="material">Материалы</option>
                    <option value="special">Особые</option>
                    <option value="pet">Питомцы</option>
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
                    <option value="name">По имени</option>
                    <option value="rarity">По редкости</option>
                    <option value="type">По типу</option>
                    <option value="quantity">По количеству</option>
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



              {/* Список предметов */}
              {sortedInventory.length > 0 ? (
                <div className="items-grid">
                  {sortedInventory.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onChestClick={handleChestClick}
                      showQuantity={true}
                      showSellButton={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-inventory">
                  <i className="fas fa-box-open empty-inventory-icon"></i>
                  <h3>Инвентарь пуст</h3>
                  <p>Добавьте предметы, чтобы увидеть их здесь</p>
                </div>
              )}
            </div>
          )}

          {/* Вкладка достижения */}
          {activeTab === 'achievements' && (
            <div className="achievements-content">
              <div className="placeholder-content">
                <i className="fas fa-trophy placeholder-icon"></i>
                <h3>Достижения</h3>
                <p>Здесь будут отображаться ваши достижения</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно сундука */}
      {chestModal.isOpen && (
        <ChestModal
          isOpen={chestModal.isOpen}
          chestItem={chestModal.chestItem}
          inventoryData={inventoryData}
          onClose={handleChestClose}
          onOpenChest={handleChestOpen}
          onRemoveItem={handleChestRemoveItem}
        />
      )}
    </motion.div>
  );
};

export default CollectionScreen; 