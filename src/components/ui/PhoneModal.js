import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRelationships, RELATIONSHIP_LEVELS, getRelationshipLevel } from '../../contexts/RelationshipsContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useScreen } from '../../contexts/ScreenContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useDailyRewards } from '../../contexts/DailyRewardsContext';
import { getEpisodeSave } from '../../utils/saveUtils';
import episodeManager from '../../utils/episodeManager';
import sceneManager from '../../utils/sceneManager';
import { 
  getShopItems, 
  getShopItemsWithInventoryFilter,
  getAllTypes, 
  getRotationInfo, 
  getCurrentDiscounts, 
  getItemsByType, 
  getTypeInfo,
  getItemById,
  getInventoryItemsWithInfo,
  getInventoryStats,
  sortInventoryItems,
  filterInventoryItems
} from '../../utils/itemUtils';
import ItemCard from './ItemCard';
import ChestModal from './ChestModal';
import './PhoneModal.css';

const PhoneModal = ({ isOpen, onClose }) => {
  const [activeApp, setActiveApp] = useState('home');
  const [isPhoneOn, setIsPhoneOn] = useState(false); // По умолчанию заблокирован
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  // Состояния для главного экрана с приложениями
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Состояния для контактов
  const [contactsView, setContactsView] = useState('list'); // 'list' или 'details'
  const [selectedContactId, setSelectedContactId] = useState(null);
  
  // Состояния для магазина
  const [shopActiveTab, setShopActiveTab] = useState('shop');
  const [shopActiveCategory, setShopActiveCategory] = useState('all');
  const [shopQuantityModal, setShopQuantityModal] = useState({
    isOpen: false,
    item: null,
    maxQuantity: 1,
    selectedQuantity: 1
  });
  
  // Состояния для инвентаря
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showInventoryStats, setShowInventoryStats] = useState(true);
  
  // Состояние для модального окна сундука
  const [chestModal, setChestModal] = useState({
    isOpen: false,
    chestItem: null
  });
  
  // Контексты для работы с отношениями
  const { selectedCharacter } = useCharacters();
  const { 
    getCharacterRelationships, 
    changeRelationship,
    RELATIONSHIP_LEVELS,
    getRelationshipLevel 
  } = useRelationships();
  
  // Контексты для работы с валютой и инвентарем
  const { gold, gems, removeGold, addGold, addGems, removeGems, hasEnoughGold, hasEnoughGems } = useCurrency();
  const { addItem, removeItem, getAllItems: getInventoryData } = useInventory();
  const { 
    dailyRewards, 
    canClaimToday, 
    getTodayReward, 
    getWeekProgress, 
    getWeekRewards, 
    claimReward 
  } = useDailyRewards();
  
  // Получаем персонажа игрока из контекста
  const { getCharacter } = useCharacters();
  const params = useScreen().getNavigationParams();
  const { characterId } = params;
  const playerCharacter = characterId ? getCharacter(characterId) : null;
  const selectedCharacterId = playerCharacter?.id;
  
  // Получаем персонажей эпизода
  const episodeCharacters = sceneManager.episodeCharacters || [];
  
  // Данные для магазина и инвентаря
  const inventoryData = getInventoryData() || {};
  const inventoryItems = getInventoryItemsWithInfo(inventoryData);
  const inventoryStats = getInventoryStats(inventoryItems);
  const allShopItems = getShopItemsWithInventoryFilter(inventoryData);
    const itemTypes = getAllTypes()
    .filter(type => type !== 'quest') // Скрываем категорию "Квестовое"
    .map(type => ({
      id: type,
      name: getTypeInfo(type)?.name || type
    }));
  const rotationInfo = getRotationInfo();
  const discountItems = getCurrentDiscounts(allShopItems);
  
  // Фильтрация и сортировка инвентаря
  const filteredInventory = filterInventoryItems(inventoryItems, {
    type: inventoryFilter === 'all' ? 'all' : (() => {
      const selectedType = itemTypes.find(type => type.name === inventoryFilter);
      return selectedType ? selectedType.id : 'all';
    })(),
    search: inventorySearch
  });
  const sortedInventory = sortInventoryItems(filteredInventory, inventorySort);
  
  // Фильтрация товаров по категории
  const filteredShopItems = shopActiveCategory === 'all' 
    ? allShopItems 
    : allShopItems.filter(item => {
        const selectedType = itemTypes.find(type => type.name === shopActiveCategory);
        return selectedType && item.type === selectedType.id;
      });

  // Обработчик кнопки Home - возвращает на главный экран
  const handleHomeButton = () => {
    if (isPhoneOn) {
      // Если телефон включен, возвращаемся на главный экран
      setActiveApp('home');
      // Сбрасываем состояние контактов
      setContactsView('list');
      setSelectedContactId(null);
      // Сбрасываем состояние магазина
      setShopActiveTab('shop');
      setShopActiveCategory('all');
      // Сбрасываем состояние инвентаря
      setInventoryFilter('all');
      setInventorySort('name');
      setInventorySearch('');
    } else {
      // Если телефон заблокирован, включаем его
      setIsPhoneOn(true);
    }
  };

  // Обработчик кнопки блокировки - блокирует экран
  const handlePowerButton = () => {
    setIsPhoneOn(false);
    setActiveApp('home'); // Возвращаемся на главный экран при блокировке
    // Сбрасываем состояние контактов
    setContactsView('list');
    setSelectedContactId(null);
    // Сбрасываем состояние магазина
    setShopActiveTab('shop');
    setShopActiveCategory('all');
    // Сбрасываем состояние инвентаря
    setInventoryFilter('all');
    setInventorySort('name');
    setInventorySearch('');
  };

  const handleAppClick = (appName) => {
    setActiveApp(appName);
  };

  const handleBackToHome = () => {
    setActiveApp('home');
    setCurrentPage(0); // Сбрасываем на первую страницу
  };

  // Функции для обработки свайпов главного экрана
  const handleHomeScreenTouchStart = (e) => {
    if (activeApp !== 'home') return;
    
    const touch = e.touches ? e.touches[0] : e;
    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragOffset(0);
  };

  const handleHomeScreenTouchMove = (e) => {
    if (!isDragging || activeApp !== 'home') return;
    
    const touch = e.touches ? e.touches[0] : e;
    const deltaX = touch.clientX - dragStartX;
    setDragOffset(deltaX);
  };

  const handleHomeScreenTouchEnd = () => {
    if (!isDragging || activeApp !== 'home') return;
    
    setIsDragging(false);
    
    // Определяем направление свайпа
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0 && currentPage > 0) {
        // Свайп вправо - предыдущая страница
        setCurrentPage(currentPage - 1);
      } else if (dragOffset < 0 && currentPage < 1) {
        // Свайп влево - следующая страница
        setCurrentPage(currentPage + 1);
      }
    }
    
    setDragOffset(0);
  };

  // Обработчики для мыши (десктоп)
  const handleHomeScreenMouseDown = (e) => {
    if (activeApp !== 'home') return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
  };

  const handleHomeScreenMouseMove = (e) => {
    if (!isDragging || activeApp !== 'home') return;
    
    const deltaX = e.clientX - dragStartX;
    setDragOffset(deltaX);
  };

  const handleHomeScreenMouseUp = () => {
    if (!isDragging || activeApp !== 'home') return;
    
    setIsDragging(false);
    
    // Определяем направление свайпа
    if (Math.abs(dragOffset) > 50) {
      if (dragOffset > 0 && currentPage > 0) {
        // Свайп вправо - предыдущая страница
        setCurrentPage(currentPage - 1);
      } else if (dragOffset < 0 && currentPage < 1) {
        // Свайп влево - следующая страница
        setCurrentPage(currentPage + 1);
      }
    }
    
    setDragOffset(0);
  };

  // Функции для работы с контактами
  const openContactDetails = (characterId) => {
    setSelectedContactId(characterId);
    setContactsView('details');
  };

  const backToContactsList = () => {
    setContactsView('list');
    setSelectedContactId(null);
  };

  // Получение важных выборов для персонажа
  const getCharacterImportantChoices = (characterId) => {
    const allImportantChoices = episodeManager.getImportantChoices();
    const characterChoices = [];
    
    // Фильтруем важные выборы по связанным персонажам
    for (const [choiceId, choiceData] of Object.entries(allImportantChoices)) {
      // Проверяем, связан ли выбор с данным персонажем
      const isRelatedToCharacter = choiceData.relatedCharacters && 
        choiceData.relatedCharacters.includes(characterId);
      
      // Используем правильные поля из структуры данных
      if (choiceData.timestamp && isRelatedToCharacter) {
        const choiceText = choiceData.description || choiceData.text || choiceData.value || `Выбор ${choiceId}`;
        
        characterChoices.push({
          id: choiceId,
          text: choiceText,
          scene: choiceData.scene,
          chapter: choiceData.chapter,
          timestamp: choiceData.timestamp,
          value: choiceData.value
        });
      }
    }
    
    return characterChoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getCharacterById = (id) => {
    // Сначала ищем в персонажах игрока
    const playerChar = getCharacter(id);
    if (playerChar) return playerChar;
    
    // Затем в персонажах эпизода
    return episodeCharacters.find(char => char.id === id);
  };
  
  // Функции для работы с магазином
  const switchShopTab = (tabId) => {
    setShopActiveTab(tabId);
  };
  
  const switchShopCategory = (category) => {
    setShopActiveCategory(category);
  };
  
  const buyItem = (itemId, price, currency = 'coins') => {
    const item = getItemById(itemId);
    
    if (item.type === 'pet' || item.type === 'clothing') {
      const currencySymbol = currency === 'gems' ? '💎' : '🪙';
      const currentBalance = currency === 'gems' ? gems : gold;
      
      const confirmMessage = `Купить "${item?.name || itemId}" за ${price} ${currencySymbol}?`;
      
      if (window.confirm(confirmMessage)) {
        if (currency === 'coins') {
          if (hasEnoughGold(price)) {
            removeGold(price);
            addItem(itemId, 1);
            alert(`✅ Куплено "${item?.name || itemId}" за ${price} монет!`);
          } else {
            alert('❌ Недостаточно монет!');
          }
        } else if (currency === 'gems') {
          if (hasEnoughGems(price)) {
            removeGems(price);
            addItem(itemId, 1);
            alert(`✅ Куплено "${item?.name || itemId}" за ${price} самоцветов!`);
          } else {
            alert('❌ Недостаточно самоцветов!');
          }
        }
      }
    } else {
      const currentBalance = currency === 'gems' ? gems : gold;
      const maxQuantity = Math.floor(currentBalance / price);
      
      setShopQuantityModal({
        isOpen: true,
        item: { ...item, price, currency },
        maxQuantity: Math.max(1, maxQuantity),
        selectedQuantity: 1
      });
    }
  };
  
  const confirmPurchase = () => {
    const { item, selectedQuantity } = shopQuantityModal;
    const totalPrice = item.price * selectedQuantity;
    const currencySymbol = item.currency === 'gems' ? '💎' : '🪙';
    
    const confirmMessage = `Купить ${selectedQuantity} "${item.name}" за ${totalPrice} ${currencySymbol}?`;
    
    if (window.confirm(confirmMessage)) {
      if (item.currency === 'coins') {
        if (hasEnoughGold(totalPrice)) {
          removeGold(totalPrice);
          addItem(item.id, selectedQuantity);
          alert(`✅ Куплено ${selectedQuantity} "${item.name}" за ${totalPrice} монет!`);
        } else {
          alert('❌ Недостаточно монет!');
        }
      } else if (item.currency === 'gems') {
        if (hasEnoughGems(totalPrice)) {
          removeGems(totalPrice);
          addItem(item.id, selectedQuantity);
          alert(`✅ Куплено ${selectedQuantity} "${item.name}" за ${totalPrice} самоцветов!`);
        } else {
          alert('❌ Недостаточно самоцветов!');
        }
      }
      
      setShopQuantityModal({
        isOpen: false,
        item: null,
        maxQuantity: 1,
        selectedQuantity: 1
      });
    }
  };
  
  const closeQuantityModal = () => {
    setShopQuantityModal({
      isOpen: false,
      item: null,
      maxQuantity: 1,
      selectedQuantity: 1
    });
  };
  
  // Функции для работы с инвентарем
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
  
  // Функции для работы с сундуками
  const handleChestClick = (chestItem) => {
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

  const handleChestOpen = (itemId, quantity = 1) => {
    addItem(itemId, quantity);
  };

  const handleChestRemoveItem = (itemId) => {
    removeItem(itemId, 1);
  };

  // Обработка свайпа для разблокировки
  const handleLockScreenSwipe = (e) => {
    if (!isPhoneOn) {
      const startY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const handleMove = (moveEvent) => {
        const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
        const deltaY = startY - currentY;
        
        // Если свайп вверх больше 50px, разблокируем
        if (deltaY > 50) {
          setIsUnlocking(true);
          setTimeout(() => {
            setIsPhoneOn(true);
            setIsUnlocking(false);
          }, 300);
          document.removeEventListener('touchmove', handleMove);
          document.removeEventListener('touchend', handleEnd);
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleEnd);
        }
      };
      
      const handleEnd = () => {
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };
      
      if (e.touches) {
        // Мобильное устройство
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
      } else {
        // Десктоп
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="phone-modal"
        className="phone-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="phone-container"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
                     {/* Телефон устройство */}
           <div className={`device iphone5 ${!isPhoneOn ? 'phone-off' : ''}`}>
             {/* Динамик */}
             <div className="device-speaker"></div>
             
             {/* Камера */}
             <div className="device-camera"></div>
             
             {/* Кнопки громкости */}
             <div className="device-volume-buttons">
               <div className="device-volume-button-plus"></div>
               <div className="device-volume-button-min"></div>
             </div>
             
                           {/* Кнопка блокировки */}
              <div className="device-power-button" onClick={handlePowerButton}></div>
              
              {/* Разъем для наушников */}
              <div className="device-headphone-jack"></div>
              
              {/* Разъем для зарядки */}
              <div className="device-lightning-port"></div>
              
              {/* Кнопка Home */}
              <div className="device-menu-button" onClick={handleHomeButton}></div>
             
             {/* Сетка устройства */}
             <div className="device-grid hidden">
               <div className="device-grid-top-10"></div>
               <div className="device-grid-top-5"></div>
               <div className="device-grid-left-10"></div>
               <div className="device-grid-left-5"></div>
             </div>

            {/* Экран телефона */}
            <div className="phone-screen">
              {isPhoneOn ? (
                <div className="phone-app">
                  {/* Статус бар */}
                  <div className="phone-status-bar">
                    <div className="status-time">12:34</div>
                    <div className="status-icons">
                      <i className="fas fa-signal"></i>
                      <i className="fas fa-wifi"></i>
                      <i className="fas fa-battery-three-quarters"></i>
                    </div>
                  </div>

                  {/* Главный экран */}
                  {activeApp === 'home' && (
                    <div className="phone-home-screen">
                      {/* Индикаторы страниц - вынесены выше */}
                      <div className="page-indicators">
                        <div className={`page-indicator ${currentPage === 0 ? 'active' : ''}`}></div>
                        <div className={`page-indicator ${currentPage === 1 ? 'active' : ''}`}></div>
                      </div>
                      
                      {/* Контейнер для перелистывания страниц */}
                      <div 
                        className="home-screen-container"
                        onTouchStart={handleHomeScreenTouchStart}
                        onTouchMove={handleHomeScreenTouchMove}
                        onTouchEnd={handleHomeScreenTouchEnd}
                        onMouseDown={handleHomeScreenMouseDown}
                        onMouseMove={handleHomeScreenMouseMove}
                        onMouseUp={handleHomeScreenMouseUp}
                        onMouseLeave={handleHomeScreenMouseUp}
                      >
                        <div 
                          className="home-screen-pages"
                          style={{
                            transform: `translateX(${-currentPage * 100 + (dragOffset / 320) * 100}%)`,
                            transition: isDragging ? 'none' : 'transform 0.3s ease'
                          }}
                        >
                          {/* Первая страница приложений */}
                          <div className="home-screen-page">
                            <div className="phone-app-grid">
                              <div className="phone-app-icon" onClick={() => handleAppClick('contacts')}>
                                <i className="fas fa-address-book"></i>
                                <span>Контакты</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('shop')}>
                                <i className="fas fa-shopping-cart"></i>
                                <span>Магазин</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('inventory')}>
                                <i className="fas fa-briefcase"></i>
                                <span>Инвентарь</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('messages')}>
                                <i className="fas fa-comments"></i>
                                <span>Сообщения</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('camera')}>
                                <i className="fas fa-camera"></i>
                                <span>Камера</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('gallery')}>
                                <i className="fas fa-images"></i>
                                <span>Галерея</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('settings')}>
                                <i className="fas fa-cog"></i>
                                <span>Настройки</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('internet')}>
                                <i className="fas fa-globe"></i>
                                <span>Интернет</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Вторая страница приложений */}
                          <div className="home-screen-page">
                            <div className="phone-app-grid">
                              <div className="phone-app-icon" onClick={() => handleAppClick('calendar')}>
                                <i className="fas fa-calendar"></i>
                                <span>Календарь</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('notes')}>
                                <i className="fas fa-sticky-note"></i>
                                <span>Заметки</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('calculator')}>
                                <i className="fas fa-calculator"></i>
                                <span>Калькулятор</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('weather')}>
                                <i className="fas fa-cloud-sun"></i>
                                <span>Погода</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('maps')}>
                                <i className="fas fa-map-marker-alt"></i>
                                <span>Карты</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('music')}>
                                <i className="fas fa-music"></i>
                                <span>Музыка</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('games')}>
                                <i className="fas fa-gamepad"></i>
                                <span>Игры</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('health')}>
                                <i className="fas fa-heartbeat"></i>
                                <span>Здоровье</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Док-панель */}
                      <div className="phone-dock">
                        <div className="dock-app" onClick={() => handleAppClick('phone')}>
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="dock-app" onClick={() => handleAppClick('mail')}>
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="dock-app" onClick={() => handleAppClick('safari')}>
                          <i className="fas fa-compass"></i>
                        </div>
                        <div className="dock-app" onClick={() => handleAppClick('appstore')}>
                          <i className="fas fa-shopping-bag"></i>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Контакты */}
                  {activeApp === 'contacts' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        {contactsView === 'details' ? (
                          <button className="phone-back-button" onClick={backToContactsList}>
                            <i className="fas fa-arrow-left"></i>
                          </button>
                        ) : (
                          <button className="phone-back-button" onClick={handleBackToHome}>
                            <i className="fas fa-arrow-left"></i>
                          </button>
                        )}
                        <h3>
                          {contactsView === 'details' 
                            ? getCharacterById(selectedContactId)?.name || 'Детали'
                            : 'Контакты'
                          }
                        </h3>
                      </div>
                      
                                             {contactsView === 'list' ? (
                         <div className="phone-contacts-list">
                           {selectedCharacterId && episodeCharacters && episodeCharacters.length > 0 ? (
                             episodeCharacters
                               .filter(char => char.id !== selectedCharacterId)
                               .map((character, index) => {
                              const currentValue = getCharacterRelationships(selectedCharacterId)[character.id]?.friendship || 0;
                              const romanceAvailable = character.romanceAvailable;
                              const { level, color } = getRelationshipLevel(currentValue, romanceAvailable);
                              
                              return (
                                <div 
                                  key={character.id || `character-${index}`} 
                                  className="phone-contact"
                                                                     onClick={() => openContactDetails(character.id || character.name)}
                                >
                                  <div className="contact-avatar" style={{ backgroundColor: color }}>
                                    {character.name[0]}
                                  </div>
                                  <div className="contact-info">
                                    <div className="contact-name">{character.name}</div>
                                    <div className="contact-status" style={{ color }}>
                                      {level}
                                    </div>
                                  </div>
                                  <div className="contact-chevron">
                                    <i className="fas fa-chevron-right"></i>
                                  </div>
                                </div>
                                                               );
                               })
                             ) : (
                               <div className="no-contacts">
                                 <p>Нет доступных контактов</p>
                               </div>
                             )}
                         </div>
                      ) : (
                        <div className="phone-contact-details">
                          {(() => {
                            const character = getCharacterById(selectedContactId);
                            if (!character) return <div>Персонаж не найден</div>;
                            
                            const currentValue = getCharacterRelationships(selectedCharacterId)[character.id]?.friendship || 0;
                            const romanceAvailable = character.romanceAvailable;
                            const { level, color } = getRelationshipLevel(currentValue, romanceAvailable);
                            const importantChoices = getCharacterImportantChoices(character.id);
                            
                            return (
                              <>
                                <div className="contact-details-header">
                                  <div className="contact-details-avatar" style={{ backgroundColor: color }}>
                                    {character.name[0]}
                                  </div>
                                  <div className="contact-details-info">
                                    <div className="contact-details-name">{character.name}</div>
                                    <div className="contact-details-status" style={{ color }}>
                                      {level}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="relationship-progress">
                                  <div className="relationship-bar">
                                    <div 
                                      className="relationship-fill" 
                                      style={{ 
                                        width: `${((currentValue + 100) / 260) * 100}%`,
                                        backgroundColor: color
                                      }}
                                    />
                                  </div>
                                  <div className="relationship-value">
                                    Отношения: {currentValue > 0 ? '+' : ''}{currentValue}
                                  </div>
                                </div>
                                
                                <div className="important-choices-section">
                                  <h4 className="section-title">
                                    <i className="fas fa-book"></i>
                                    Журнал событий
                                  </h4>
                                  <div className="important-choices-list">
                                    {importantChoices.length > 0 ? (
                                      importantChoices.map((choice, index) => (
                                        <div key={choice.id || `choice-${index}`} className="choice-entry">
                                          <div className="choice-text">{choice.text}</div>
                                          <div className="choice-meta">
                                            {choice.chapter && <span>Глава {choice.chapter}</span>}
                                            {choice.scene && <span>• Сцена {choice.scene}</span>}
                                            {choice.timestamp && (
                                              <span>• {new Date(choice.timestamp).toLocaleDateString()}</span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="no-choices">
                                        <p>Пока нет записей о важных событиях</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                                     )}

                   {/* Магазин */}
                   {activeApp === 'shop' && (
                     <div className="phone-app-content">
                       <div className="phone-app-header">
                         <button className="phone-back-button" onClick={handleBackToHome}>
                           <i className="fas fa-arrow-left"></i>
                         </button>
                         <h3>Магазин</h3>
                       </div>
                       
                                               {/* Валюта */}
                        <div className="phone-shop-currency">
                          <div className="currency-item">
                            <span className="currency-icon">🪙</span>
                            <span>{gold || 0}</span>
                          </div>
                          <div className="currency-item">
                            <span className="currency-icon">💎</span>
                            <span>{gems || 0}</span>
                          </div>
                        </div>
                       
                       {/* Ротация */}
                       <div className="phone-shop-rotation">
                         <span>Обновление через {rotationInfo.daysUntilRotation} дн.</span>
                       </div>
                       
                       {/* Вкладки */}
                       <div className="phone-shop-tabs">
                         <button 
                           className={`shop-tab ${shopActiveTab === 'shop' ? 'active' : ''}`}
                           onClick={() => switchShopTab('shop')}
                         >
                           Магазин
                         </button>
                         <button 
                           className={`shop-tab ${shopActiveTab === 'inventory' ? 'active' : ''}`}
                           onClick={() => switchShopTab('inventory')}
                         >
                           Инвентарь
                         </button>
                         <button 
                           className={`shop-tab ${shopActiveTab === 'topup' ? 'active' : ''}`}
                           onClick={() => switchShopTab('topup')}
                         >
                           Пополнение
                         </button>
                       </div>
                       
                       {/* Содержимое вкладки магазина */}
                       {shopActiveTab === 'shop' && (
                         <div className="phone-shop-content">
                           {/* Категории */}
                           <div className="phone-shop-categories">
                             <button 
                               className={`category-btn ${shopActiveCategory === 'all' ? 'active' : ''}`}
                               onClick={() => switchShopCategory('all')}
                             >
                               Все
                             </button>
                             {itemTypes.map((type, index) => (
                               <button 
                                 key={type.id || `type-${index}`}
                                                                                                     className={`category-btn ${shopActiveCategory === type.name ? 'active' : ''}`}
                                  onClick={() => switchShopCategory(type.name)}
                               >
                                 {type.name}
                               </button>
                             ))}
                           </div>
                           
                           {/* Список товаров */}
                           <div className="phone-shop-items">
                             {filteredShopItems.length > 0 ? (
                               filteredShopItems.map((item, index) => (
                                                                                                    <div key={item.id || `shop-item-${index}`} className="phone-shop-item">
                                   <div className="item-image">
                                     <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                                   </div>
                                   <div className="item-info">
                                     <div className="item-name">{item.name}</div>
                                     <div className="item-price">
                                       {item.price?.amount || item.price} {item.price?.currency === 'gems' ? '💎' : '🪙'}
                                     </div>
                                   </div>
                                   <button 
                                     className="buy-button"
                                     onClick={() => buyItem(item.id || item.name, item.price?.amount || item.price, item.price?.currency)}
                                   >
                                     Купить
                                   </button>
                                 </div>
                               ))
                             ) : (
                               <div className="no-items">
                                 <p>Нет доступных товаров</p>
                               </div>
                             )}
                           </div>
                         </div>
                       )}
                       
                       {/* Содержимое вкладки инвентаря */}
                       {shopActiveTab === 'inventory' && (
                         <div className="phone-shop-content">
                           {/* Фильтры */}
                           <div className="phone-inventory-filters">
                             <select 
                               value={inventoryFilter} 
                               onChange={(e) => setInventoryFilter(e.target.value)}
                             >
                               <option value="all">Все типы</option>
                               {itemTypes.map((type, index) => (
                                 <option key={type.id || `type-${index}`} value={type.name}>{type.name}</option>
                               ))}
                             </select>
                           </div>
                           
                           {/* Список предметов */}
                           <div className="phone-inventory-items">
                             {sortedInventory.length > 0 ? (
                               sortedInventory.map((item, index) => (
                                 <div key={item.id || `inventory-item-${index}`} className="phone-inventory-item">
                                   <div className="item-image">
                                     <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                                   </div>
                                   <div className="item-info">
                                     <div className="item-name">{item.name}</div>
                                     <div className="item-quantity">x{item.quantity}</div>
                                   </div>
                                   {item.canSell && (
                                     <button 
                                       className="sell-button"
                                       onClick={() => sellItem(item.id || item.name, item.sellPrice?.amount || item.sellPrice)}
                                     >
                                       Продать
                                     </button>
                                   )}
                                 </div>
                               ))
                             ) : (
                               <div className="no-items">
                                 <p>Инвентарь пуст</p>
                               </div>
                             )}
                           </div>
                         </div>
                       )}
                       
                       {/* Содержимое вкладки пополнения */}
                       {shopActiveTab === 'topup' && (
                         <div className="phone-shop-content">
                           {/* Ежедневные награды */}
                           <div className="topup-section daily-rewards-section">
                             <div className="section-header">
                               <i className="fas fa-calendar-check"></i>
                               <span>Ежедневные награды</span>
                             </div>
                             
                             <div className="daily-rewards-card">
                               <div className="streak-display">
                                 <div className="streak-circle">
                                   <span className="streak-number">{dailyRewards.currentStreak}</span>
                                   <span className="streak-text">дней</span>
                                 </div>
                                 <div className="streak-info">
                                   <div className="streak-title">Серия входов</div>
                                   <div className="streak-subtitle">Получайте награды каждый день</div>
                                 </div>
                               </div>
                               
                               <div className="today-reward-card">
                                 <div className="reward-label">Награда за сегодня</div>
                                 <div className="reward-content">
                                   {(() => {
                                     const todayReward = getTodayReward();
                                     return (
                                       <div className="reward-item">
                                         <i className={todayReward.icon}></i>
                                         <span>{todayReward.name || `${todayReward.amount} ${todayReward.type === 'coins' ? 'монет' : todayReward.type === 'gems' ? 'самоцветов' : ''}`}</span>
                                       </div>
                                     );
                                   })()}
                                 </div>
                               </div>
                               
                               <button 
                                 className={`claim-button ${canClaimToday() ? 'available' : 'claimed'}`}
                                 onClick={() => {
                                   const result = claimReward(addGold, addGems, addItem);
                                   if (result.success) {
                                     alert(result.message);
                                   } else {
                                     alert(result.message);
                                   }
                                 }}
                                 disabled={!canClaimToday()}
                               >
                                 {canClaimToday() ? (
                                   <>
                                     <i className="fas fa-gift"></i>
                                     Получить награду
                                   </>
                                 ) : (
                                   <>
                                     <i className="fas fa-check"></i>
                                     Уже получено
                                   </>
                                 )}
                               </button>
                             </div>
                             
                             <div className="weekly-progress">
                               <div className="progress-title">Прогресс недели</div>
                               <div className="week-grid">
                                 {getWeekRewards().map((dayReward) => (
                                   <div 
                                     key={dayReward.day} 
                                     className={`day-item ${dayReward.isClaimed ? 'claimed' : ''} ${dayReward.isToday ? 'today' : ''}`}
                                   >
                                     <div className="day-number">{dayReward.day}</div>
                                     <div className="day-reward">
                                       <i className={dayReward.reward.icon}></i>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </div>

                           {/* Награда за рекламу */}
                           <div className="topup-section ad-section">
                             <div className="section-header">
                               <i className="fas fa-play-circle"></i>
                               <span>Бесплатные награды</span>
                             </div>
                             
                             <div className="ad-reward-card">
                               <div className="ad-content">
                                 <div className="ad-icon">
                                   <i className="fas fa-ad"></i>
                                 </div>
                                 <div className="ad-info">
                                   <div className="ad-title">Просмотр рекламы</div>
                                   <div className="ad-description">Доступно через: 2 часа 15 минут</div>
                                 </div>
                               </div>
                               
                               <div className="ad-rewards">
                                 <div className="reward-badge">
                                   <span className="reward-amount">50</span>
                                   <span className="reward-icon">🪙</span>
                                 </div>
                                 <div className="reward-badge">
                                   <span className="reward-amount">5</span>
                                   <span className="reward-icon">💎</span>
                                 </div>
                               </div>
                             </div>
                             
                             <button className="watch-ad-button">
                               <i className="fas fa-play"></i>
                               <span>Смотреть рекламу (30 сек)</span>
                             </button>
                           </div>

                           {/* Пополнение баланса */}
                           <div className="topup-section purchase-section">
                             <div className="section-header">
                               <i className="fas fa-credit-card"></i>
                               <span>Пополнение баланса</span>
                             </div>
                             
                             <div className="purchase-grid">
                               {[
                                 { 
                                   type: 'gold', 
                                   amount: 100, 
                                   bonus: 10, 
                                   price: '$0.99',
                                   popular: false,
                                   icon: 'fas fa-coins'
                                 },
                                 { 
                                   type: 'gold', 
                                   amount: 500, 
                                   bonus: 75, 
                                   price: '$4.99',
                                   popular: true,
                                   icon: 'fas fa-coins'
                                 },
                                 { 
                                   type: 'gems', 
                                   amount: 50, 
                                   bonus: 5, 
                                   price: '$2.99',
                                   popular: false,
                                   icon: 'fas fa-gem'
                                 },
                                 { 
                                   type: 'gems', 
                                   amount: 200, 
                                   bonus: 30, 
                                   price: '$9.99',
                                   popular: false,
                                   icon: 'fas fa-gem'
                                 }
                               ].map((pkg, index) => (
                                 <div key={index} className={`package-card ${pkg.popular ? 'popular' : ''}`}>
                                   {pkg.popular && (
                                     <div className="popular-badge">
                                       <i className="fas fa-star"></i>
                                       Популярно
                                     </div>
                                   )}
                                   <div className="package-header">
                                     <div className="package-icon">
                                       <i className={pkg.icon}></i>
                                     </div>
                                     <div className="package-amount">
                                       {pkg.amount} {pkg.type === 'gold' ? 'монет' : 'самоцветов'}
                                     </div>
                                   </div>
                                   <div className="package-bonus">
                                     +{pkg.bonus} бонус
                                   </div>
                                   <button className="package-button">
                                     {pkg.price}
                                   </button>
                                 </div>
                               ))}
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Инвентарь */}
                   {activeApp === 'inventory' && (
                     <div className="phone-app-content">
                       <div className="phone-app-header">
                         <button className="phone-back-button" onClick={handleBackToHome}>
                           <i className="fas fa-arrow-left"></i>
                         </button>
                         <h3>Инвентарь</h3>
                       </div>
                       
                       {/* Статистика */}
                       <div className="phone-inventory-stats">
                         <div className="stats-toggle" onClick={() => setShowInventoryStats(!showInventoryStats)}>
                           <i className={`fas fa-${showInventoryStats ? 'chevron-up' : 'chevron-down'}`}></i>
                           Статистика ({inventoryStats.totalItems} предметов)
                         </div>
                         
                         {showInventoryStats && (
                           <div className="stats-content">
                             <div className="stat-item">
                               <span>Всего предметов:</span>
                               <span>{inventoryStats.totalItems}</span>
                             </div>
                             <div className="stat-item">
                               <span>Уникальных:</span>
                               <span>{inventoryStats.uniqueItems}</span>
                             </div>
                           </div>
                         )}
                       </div>
                       
                       {/* Фильтры и поиск */}
                       <div className="phone-inventory-controls">
                         <input
                           type="text"
                           placeholder="Поиск..."
                           value={inventorySearch}
                           onChange={(e) => setInventorySearch(e.target.value)}
                           className="inventory-search"
                         />
                         <select 
                           value={inventoryFilter} 
                           onChange={(e) => setInventoryFilter(e.target.value)}
                           className="inventory-filter"
                         >
                           <option value="all">Все типы</option>
                           {itemTypes.map((type, index) => (
                             <option key={type.id || `type-${index}`} value={type.name}>{type.name}</option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Список предметов */}
                       <div className="phone-inventory-list">
                         {sortedInventory.length > 0 ? (
                           sortedInventory.map((item, index) => (
                             <div key={item.id || `inventory-item-${index}`} className="phone-inventory-item">
                               <div className="item-image">
                                 <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                               </div>
                               <div className="item-info">
                                 <div className="item-name">{item.name}</div>
                                 <div className="item-quantity">x{item.quantity}</div>
                                 {item.canSell && (
                                   <div className="item-sell-price">
                                     Продать за {item.sellPrice?.amount || item.sellPrice} {item.sellPrice?.currency === 'gems' ? '💎' : '🪙'}
                                   </div>
                                 )}
                               </div>
                               {item.canSell && (
                                 <button 
                                   className="sell-button"
                                   onClick={() => sellItem(item.id || item.name, item.sellPrice?.amount || item.sellPrice)}
                                 >
                                   Продать
                                 </button>
                               )}
                             </div>
                           ))
                         ) : (
                           <div className="no-items">
                             <p>Инвентарь пуст</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Сообщения */}
                  {activeApp === 'messages' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Сообщения</h3>
                      </div>
                      <div className="phone-messages-list">
                        <div className="phone-message">
                          <div className="message-avatar">А</div>
                          <div className="message-content">
                            <div className="message-sender">Анна</div>
                            <div className="message-text">Привет! Как дела?</div>
                            <div className="message-time">12:30</div>
                          </div>
                        </div>
                        <div className="phone-message">
                          <div className="message-avatar">М</div>
                          <div className="message-content">
                            <div className="message-sender">Мария</div>
                            <div className="message-text">Встретимся завтра?</div>
                            <div className="message-time">11:45</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Камера */}
                  {activeApp === 'camera' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Камера</h3>
                      </div>
                      <div className="phone-camera-view">
                        <div className="camera-preview">
                          <i className="fas fa-camera"></i>
                          <span>Предварительный просмотр</span>
                        </div>
                        <div className="camera-controls">
                          <button className="camera-button">
                            <i className="fas fa-camera"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Галерея */}
                  {activeApp === 'gallery' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Галерея</h3>
                      </div>
                      <div className="phone-gallery-grid">
                        <div className="gallery-item">
                          <i className="fas fa-image"></i>
                        </div>
                        <div className="gallery-item">
                          <i className="fas fa-image"></i>
                        </div>
                        <div className="gallery-item">
                          <i className="fas fa-image"></i>
                        </div>
                        <div className="gallery-item">
                          <i className="fas fa-image"></i>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Настройки */}
                  {activeApp === 'settings' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Настройки</h3>
                      </div>
                      <div className="phone-settings-list">
                        <div className="setting-item">
                          <span>Звуки</span>
                          <i className="fas fa-toggle-on"></i>
                        </div>
                        <div className="setting-item">
                          <span>Вибрация</span>
                          <i className="fas fa-toggle-off"></i>
                        </div>
                        <div className="setting-item">
                          <span>Яркость</span>
                          <div className="brightness-slider"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Интернет */}
                  {activeApp === 'internet' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Интернет</h3>
                      </div>
                      <div className="phone-browser">
                        <div className="browser-address-bar">
                          <span>https://example.com</span>
                        </div>
                        <div className="browser-content">
                          <div className="browser-placeholder">
                            <i className="fas fa-globe"></i>
                            <span>Веб-страница</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Телефон */}
                  {activeApp === 'phone' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Телефон</h3>
                      </div>
                      <div className="phone-dialer">
                        <div className="dialer-display">
                          <span>Введите номер</span>
                        </div>
                        <div className="dialer-keypad">
                          <div className="keypad-row">
                            <button className="dialer-key">1</button>
                            <button className="dialer-key">2</button>
                            <button className="dialer-key">3</button>
                          </div>
                          <div className="keypad-row">
                            <button className="dialer-key">4</button>
                            <button className="dialer-key">5</button>
                            <button className="dialer-key">6</button>
                          </div>
                          <div className="keypad-row">
                            <button className="dialer-key">7</button>
                            <button className="dialer-key">8</button>
                            <button className="dialer-key">9</button>
                          </div>
                          <div className="keypad-row">
                            <button className="dialer-key">*</button>
                            <button className="dialer-key">0</button>
                            <button className="dialer-key">#</button>
                          </div>
                        </div>
                        <button className="call-button">
                          <i className="fas fa-phone"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Почта */}
                  {activeApp === 'mail' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Почта</h3>
                      </div>
                      <div className="mail-list">
                        <div className="mail-item">
                          <div className="mail-sender">Анна</div>
                          <div className="mail-subject">Привет!</div>
                          <div className="mail-preview">Как дела? Встретимся завтра?</div>
                          <div className="mail-time">12:30</div>
                        </div>
                        <div className="mail-item">
                          <div className="mail-sender">Работа</div>
                          <div className="mail-subject">Встреча</div>
                          <div className="mail-preview">Напоминание о встрече в 15:00</div>
                          <div className="mail-time">10:15</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* App Store */}
                  {activeApp === 'appstore' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>App Store</h3>
                      </div>
                      <div className="appstore-content">
                        <div className="featured-app">
                          <div className="app-icon">
                            <i className="fas fa-gamepad"></i>
                          </div>
                          <div className="app-info">
                            <div className="app-name">Новая игра</div>
                            <div className="app-category">Игры</div>
                            <div className="app-rating">★★★★☆</div>
                          </div>
                          <button className="download-button">Скачать</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Календарь */}
                  {activeApp === 'calendar' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Календарь</h3>
                      </div>
                      <div className="calendar-view">
                        <div className="calendar-header">
                          <span>Январь 2024</span>
                        </div>
                        <div className="calendar-grid">
                          <div className="calendar-day">1</div>
                          <div className="calendar-day">2</div>
                          <div className="calendar-day">3</div>
                          <div className="calendar-day">4</div>
                          <div className="calendar-day">5</div>
                          <div className="calendar-day">6</div>
                          <div className="calendar-day">7</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Заметки */}
                  {activeApp === 'notes' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Заметки</h3>
                      </div>
                      <div className="notes-list">
                        <div className="note-item">
                          <div className="note-title">Список покупок</div>
                          <div className="note-preview">Молоко, хлеб, яйца...</div>
                          <div className="note-date">Сегодня</div>
                        </div>
                        <div className="note-item">
                          <div className="note-title">Идеи</div>
                          <div className="note-preview">Новые идеи для проекта...</div>
                          <div className="note-date">Вчера</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Калькулятор */}
                  {activeApp === 'calculator' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Калькулятор</h3>
                      </div>
                      <div className="calculator">
                        <div className="calc-display">0</div>
                        <div className="calc-buttons">
                          <button className="calc-btn">7</button>
                          <button className="calc-btn">8</button>
                          <button className="calc-btn">9</button>
                          <button className="calc-btn">÷</button>
                          <button className="calc-btn">4</button>
                          <button className="calc-btn">5</button>
                          <button className="calc-btn">6</button>
                          <button className="calc-btn">×</button>
                          <button className="calc-btn">1</button>
                          <button className="calc-btn">2</button>
                          <button className="calc-btn">3</button>
                          <button className="calc-btn">-</button>
                          <button className="calc-btn">0</button>
                          <button className="calc-btn">.</button>
                          <button className="calc-btn">=</button>
                          <button className="calc-btn">+</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Погода */}
                  {activeApp === 'weather' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Погода</h3>
                      </div>
                      <div className="weather-view">
                        <div className="weather-current">
                          <div className="weather-icon">
                            <i className="fas fa-sun"></i>
                          </div>
                          <div className="weather-temp">22°</div>
                          <div className="weather-desc">Солнечно</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Карты */}
                  {activeApp === 'maps' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Карты</h3>
                      </div>
                      <div className="maps-view">
                        <div className="maps-placeholder">
                          <i className="fas fa-map"></i>
                          <span>Карта</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Музыка */}
                  {activeApp === 'music' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Музыка</h3>
                      </div>
                      <div className="music-player">
                        <div className="music-cover">
                          <i className="fas fa-music"></i>
                        </div>
                        <div className="music-info">
                          <div className="music-title">Название песни</div>
                          <div className="music-artist">Исполнитель</div>
                        </div>
                        <div className="music-controls">
                          <button className="music-btn">
                            <i className="fas fa-step-backward"></i>
                          </button>
                          <button className="music-btn play">
                            <i className="fas fa-play"></i>
                          </button>
                          <button className="music-btn">
                            <i className="fas fa-step-forward"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Игры */}
                  {activeApp === 'games' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Игры</h3>
                      </div>
                      <div className="games-grid">
                        <div className="game-item">
                          <div className="game-icon">
                            <i className="fas fa-puzzle-piece"></i>
                          </div>
                          <div className="game-name">Пазл</div>
                        </div>
                        <div className="game-item">
                          <div className="game-icon">
                            <i className="fas fa-chess"></i>
                          </div>
                          <div className="game-name">Шахматы</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Здоровье */}
                  {activeApp === 'health' && (
                    <div className="phone-app-content">
                      <div className="phone-app-header">
                        <button className="phone-back-button" onClick={handleBackToHome}>
                          <i className="fas fa-arrow-left"></i>
                        </button>
                        <h3>Здоровье</h3>
                      </div>
                      <div className="health-view">
                        <div className="health-card">
                          <div className="health-icon">
                            <i className="fas fa-heartbeat"></i>
                          </div>
                          <div className="health-value">72</div>
                          <div className="health-label">Удары в минуту</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className={`phone-lock-screen ${isUnlocking ? 'unlocking' : ''}`}
                  onTouchStart={handleLockScreenSwipe}
                  onMouseDown={handleLockScreenSwipe}
                >
                  <div className="lock-time">12:34</div>
                  <div className="lock-date">Понедельник, 1 января</div>
                  <div className="lock-slider">
                    <i className="fas fa-arrow-up"></i>
                    <span>Сдвиньте для разблокировки</span>
                  </div>
                </div>
              )}
                         </div>
           </div>
         </motion.div>
       </motion.div>
       
       {/* Модальное окно выбора количества */}
       <AnimatePresence>
         {shopQuantityModal.isOpen && (
           <motion.div
             key="quantity-modal"
             className="quantity-modal-overlay"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={closeQuantityModal}
           >
             <motion.div
               className="quantity-modal"
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
             >
               <h3>Выберите количество</h3>
               <div className="quantity-controls">
                 <button 
                   onClick={() => setShopQuantityModal(prev => ({
                     ...prev,
                     selectedQuantity: Math.max(1, prev.selectedQuantity - 1)
                   }))}
                 >
                   -
                 </button>
                 <span>{shopQuantityModal.selectedQuantity}</span>
                 <button 
                   onClick={() => setShopQuantityModal(prev => ({
                     ...prev,
                     selectedQuantity: Math.min(prev.maxQuantity, prev.selectedQuantity + 1)
                   }))}
                 >
                   +
                 </button>
               </div>
               <div className="quantity-buttons">
                 <button onClick={closeQuantityModal}>Отмена</button>
                 <button onClick={confirmPurchase}>Купить</button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
       
       {/* Модальное окно сундука */}
       {chestModal.isOpen && (
         <ChestModal
           key="chest-modal"
           isOpen={chestModal.isOpen}
           onClose={handleChestClose}
           chestItem={chestModal.chestItem}
           inventoryData={inventoryData}
           onOpenChest={handleChestOpen}
           onRemoveItem={handleChestRemoveItem}
         />
       )}
     </AnimatePresence>
   );
 };

export default PhoneModal; 