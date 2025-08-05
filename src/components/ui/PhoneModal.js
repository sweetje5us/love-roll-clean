import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRelationships, RELATIONSHIP_LEVELS, getRelationshipLevel } from '../../contexts/RelationshipsContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useScreen } from '../../contexts/ScreenContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useDailyRewards } from '../../contexts/DailyRewardsContext';
import { usePets } from '../../contexts/PetContext';
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
import PetMiniGameModal from './PetMiniGameModal';
import { FlyingOverCityGame, DoodleJumpGame, CrossyRoadGame, ZumaGame } from './PetMiniGameModal';

// Функция для получения CSS для анимированного спрайта
function getSpriteStyle(sprite, currentFrame = 0, row = 0) {
  if (!sprite) return {};
  
  // Ограничиваем currentFrame количеством кадров в спрайте
  const maxFrames = sprite.frames || 8;
  const clampedFrame = currentFrame % maxFrames;
  
  const frameX = clampedFrame * sprite.frameWidth;
  const frameY = row * sprite.frameHeight;
  
  const style = {
    backgroundImage: `url(${sprite.src})`,
    backgroundPosition: `-${frameX}px -${frameY}px`,
    backgroundSize: `${sprite.width}px ${sprite.height}px`,
    width: `${sprite.frameWidth}px`,
    height: `${sprite.frameHeight}px`,
    backgroundRepeat: 'no-repeat'
  };
  
  // Отладка для спрайтов Zuma
  if (sprite.src && sprite.src.includes('zuma')) {
    console.log('🎨 PHONE ZUMA SPRITE STYLE DEBUG:');
    console.log('  - sprite:', sprite.src);
    console.log('  - currentFrame:', currentFrame);
    console.log('  - maxFrames:', maxFrames);
    console.log('  - clampedFrame:', clampedFrame);
    console.log('  - frameWidth:', sprite.frameWidth);
    console.log('  - frameHeight:', sprite.frameHeight);
    console.log('  - frameX:', frameX);
    console.log('  - frameY:', frameY);
    console.log('  - returned style:', style);
  }
  
  return style;
}

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
  const [selectedShopItem, setSelectedShopItem] = useState(null);
  const [shopView, setShopView] = useState('list'); // 'list' или 'details'
  
  // Состояния для инвентаря
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryView, setInventoryView] = useState('list'); // 'list' или 'details'
  
  // Состояния для питомца
  const [petView, setPetView] = useState('main'); // 'main', 'minigame', 'change'
  const [selectedMinigame, setSelectedMinigame] = useState(null);
  const [isMiniGameOpen, setMiniGameOpen] = useState(false);
  const [, forceUpdate] = useState({});
  
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
    activePetId, 
    petCollection, 
    setActivePet, 
    addPetToCollection, 
    getActivePet,
    feedPet,
    playWithPet,
    restPet,
    healPet,
    wakeUpPet,
    getActivePetStatus,
    getStatusIconByName,
    getStatusColorByName,
    getStatusTextByName
  } = usePets();
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
  
  // Данные для питомца
  const activePet = getActivePet();
  const activePetData = activePetId ? getItemById(activePetId) : null;
  const activePetStatus = getActivePetStatus();
  
  // Определяем класс анимации для питомца
  const getPetAnimationClass = () => {
    if (!activePet) return 'idle';
    
    const statuses = activePetStatus || [];
    
    // Приоритет анимаций
    if (activePet.isSleeping) return 'sleeping';
    if (statuses.includes('sick')) return 'sick';
    if (statuses.includes('hungry')) return 'hungry';
    if (statuses.includes('sad')) return 'sad';
    
    return 'idle';
  };

  const petAnimationClass = getPetAnimationClass();

  // Инициализация питомца при открытии приложения
  useEffect(() => {
    if (activeApp === 'pet') {
      console.log('PhoneModal: Открыто приложение питомца');
      
      // Инициализируем питомцев в коллекции при первом открытии
      if (playerCharacter) {
        const characterPetId = playerCharacter.petId || playerCharacter.pet?.id;
        if (characterPetId && !petCollection[characterPetId]) {
          addPetToCollection(characterPetId, playerCharacter.petName || playerCharacter.pet?.name || '');
        }
        
        // Если нет активного питомца, устанавливаем питомца персонажа
        if (!activePetId && characterPetId) {
          setActivePet(characterPetId);
        }
      }

      // Проверяем данные питомца один раз при открытии
      if (activePetId) {
        const petData = getItemById(activePetId);
        if (petData) {
          console.log('PhoneModal: Активный питомец:', petData.name);
        }
      }
    }
  }, [activeApp]); // Только при изменении activeApp

  // Отслеживаем изменения активного питомца
  useEffect(() => {
    if (activeApp === 'pet' && activePetId) {
      console.log('PhoneModal: activePetId изменился на', activePetId);
      forceUpdate({});
    }
  }, [activePetId, activeApp, forceUpdate]);

  // Периодическое обновление для синхронизации с изменениями питомца (убрано - слишком часто)
  // useEffect(() => {
  //   if (activeApp === 'pet') {
  //     const interval = setInterval(() => {
  //       forceUpdate({});
  //     }, 5000); // Каждые 5 секунд

  //     return () => clearInterval(interval);
  //   }
  // }, [activeApp, forceUpdate]);

  // Обновляем активного питомца при изменении персонажа (как в PetModal)
  useEffect(() => {
    if (activeApp === 'pet' && playerCharacter) {
      const characterPetId = playerCharacter.petId || playerCharacter.pet?.id;
      const availablePets = getAvailablePets();
      
      // Если у игрока есть питомцы в инвентаре, не перезаписываем активного питомца
      if (availablePets.length > 0) {
        // Только добавляем питомца персонажа в коллекцию, если его там нет
        if (characterPetId && !petCollection[characterPetId]) {
          addPetToCollection(characterPetId, playerCharacter.petName || playerCharacter.pet?.name || '');
        }
        // Если нет активного питомца, устанавливаем первого доступного
        if (!activePetId) {
          setActivePet(availablePets[0].id);
        }
      } else if (characterPetId && characterPetId !== activePetId) {
        // Если питомцев в инвентаре нет, используем питомца персонажа
        console.log('PhoneModal: Обновляем активного питомца с', activePetId, 'на', characterPetId);
        // Добавляем питомца в коллекцию, если его там нет
        if (!petCollection[characterPetId]) {
          addPetToCollection(characterPetId, playerCharacter.petName || playerCharacter.pet?.name || '');
        }
        // Устанавливаем нового активного питомца
        setActivePet(characterPetId);
        // Принудительно обновляем компонент
        forceUpdate({});
      }
    }
  }, [activeApp, playerCharacter, activePetId, petCollection, addPetToCollection, setActivePet, forceUpdate]);

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
      setInventoryView('list');
      setSelectedInventoryItem(null);
      // Сбрасываем состояние магазина
      setShopView('list');
      setSelectedShopItem(null);
      // Сбрасываем состояние питомца
      setPetView('main');
      setSelectedMinigame(null);
      setMiniGameOpen(false);
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
    setInventoryView('list');
    setSelectedInventoryItem(null);
    // Сбрасываем состояние магазина
    setShopView('list');
    setSelectedShopItem(null);
    // Сбрасываем состояние питомца
    setPetView('main');
    setSelectedMinigame(null);
  };

  const handleAppClick = (appName) => {
    setActiveApp(appName);
  };

  const handleBackToHome = () => {
    setActiveApp('home');
    // Сбрасываем состояние инвентаря при возврате на главный экран
    setInventoryView('list');
    setSelectedInventoryItem(null);
    // Сбрасываем состояние магазина при возврате на главный экран
    setShopView('list');
    setSelectedShopItem(null);
    // Сбрасываем состояние питомца при возврате на главный экран
    setPetView('main');
    setSelectedMinigame(null);
    setMiniGameOpen(false);
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

  const openInventoryItemDetails = (item) => {
    setSelectedInventoryItem(item);
    setInventoryView('details');
  };

  const closeInventoryItemDetails = () => {
    setSelectedInventoryItem(null);
    setInventoryView('list');
  };

  const openShopItemDetails = (item) => {
    setSelectedShopItem(item);
    setShopView('details');
  };

  const closeShopItemDetails = () => {
    setSelectedShopItem(null);
    setShopView('list');
  };
  
  // Функции для работы с питомцем
  const handleFeedPet = () => {
    if (activePetId) {
      feedPet(activePetId);
    }
  };

  const handlePlayWithPet = () => {
    if (activePetId && activePetData) {
      console.log('PhoneModal: Нажата кнопка "Играть" для питомца:', activePetData.name);
      console.log('PhoneModal: Тип игры питомца:', activePetData.gameType);
      
      // Проверяем, есть ли у питомца тип игры
      if (activePetData.gameType) {
        console.log('PhoneModal: Открываем мини-игру:', activePetData.gameType);
        setSelectedMinigame(activePetData.gameType);
        setPetView('minigame');
      } else {
        console.log('PhoneModal: У питомца нет типа игры, используем обычную игру');
        // Если нет типа игры, просто играем с питомцем
        playWithPet(activePetId);
      }
    } else {
      console.log('PhoneModal: Нет активного питомца или данных питомца');
    }
  };

  const handleRestPet = () => {
    if (activePetId) {
      restPet(activePetId);
    }
  };

  const handleHealPet = () => {
    if (activePetId) {
      healPet(activePetId);
    }
  };

  const handleWakeUpPet = () => {
    if (activePetId) {
      wakeUpPet(activePetId);
    }
  };

  const handleChangePet = () => {
    setPetView('change');
  };

  const handleSelectPet = (petId) => {
    // Получаем данные питомца из инвентаря
    const petData = getItemById(petId);
    
    if (petData) {
      // Добавляем питомца в коллекцию, если его там нет
      if (!petCollection[petId]) {
        addPetToCollection(petId, petData.name);
      }
      
      // Меняем активного питомца
      setActivePet(petId);
    }
    
    // Возвращаемся к главному экрану
    setPetView('main');
    // Принудительно обновляем компонент
    forceUpdate({});
  };

  // Функция для получения питомцев из инвентаря
  const getAvailablePets = () => {
    return inventoryItems.filter(item => item.type === 'pet' && item.quantity > 0);
  };

  const openMinigame = (gameType) => {
    setSelectedMinigame(gameType);
    setPetView('minigame');
  };

  const closeMinigame = () => {
    console.log('PhoneModal: Закрываем мини-игру');
    
    // Если была активна мини-игра, награждаем питомца
    if (activePetId && selectedMinigame) {
      console.log('PhoneModal: Награждаем питомца за игру');
      playWithPet(activePetId);
    }
    
    setSelectedMinigame(null);
    setPetView('main');
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

  // Utility function to get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return '#9e9e9e';
      case 'uncommon':
        return '#4caf50';
      case 'rare':
        return '#2196f3';
      case 'epic':
        return '#9c27b0';
      case 'legendary':
        return '#ff9800';
      case 'mythic':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  // Внутри PhoneModal, перед return:
  const [zumaLevel, setZumaLevel] = useState(1);
const [zumaNextBall, setZumaNextBall] = useState(null);
const [zumaSpriteFrame, setZumaSpriteFrame] = useState(0);

// Отладка изменений zumaSpriteFrame
useEffect(() => {
  if (zumaNextBall) {
    console.log('🔄 PHONE ZUMA SPRITE FRAME DEBUG:');
    console.log('  - zumaSpriteFrame:', zumaSpriteFrame);
    console.log('  - zumaNextBall color:', zumaNextBall.color);
    console.log('  - zumaNextBall sprite frames:', zumaNextBall.sprite.frames);
    console.log('  - zumaNextBall sprite:', zumaNextBall.sprite);
  }
}, [zumaSpriteFrame, zumaNextBall]);

if (!isOpen) return null;

  return (
    <AnimatePresence key="phone-modal-main">
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
                            transform: `translateX(${-currentPage * 50 + (dragOffset / 320) * 50}%)`,
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
                              <div className="phone-app-icon" onClick={() => handleAppClick('pet')}>
                                <i className="fas fa-paw"></i>
                                <span>Питомец</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('messages')}>
                                <i className="fas fa-comments"></i>
                                <span>Сообщения</span>
                              </div>

                              <div className="phone-app-icon" onClick={() => handleAppClick('gallery')}>
                                <i className="fas fa-images"></i>
                                <span>Галерея</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('settings')}>
                                <i className="fas fa-cog"></i>
                                <span>Настройки</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('notes')}>
                                <i className="fas fa-sticky-note"></i>
                                <span>Заметки</span>
                              </div>
                              <div className="phone-app-icon" onClick={() => handleAppClick('music')}>
                                <i className="fas fa-music"></i>
                                <span>Музыка</span>
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
                                  key={character.id ? `character-${character.id}` : `character-${index}`} 
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
                                        <div key={choice.id ? `choice-${choice.id}` : `choice-${index}`} className="choice-entry">
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
                       {shopView === 'list' ? (
                         <>
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
                                 key={type.id}
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
                                 <div 
                                   key={item.id ? `shop-item-${item.id}` : `shop-item-${index}`} 
                                   className="phone-shop-item"
                                   onClick={() => openShopItemDetails(item)}
                                 >
                                   <div className="item-image">
                                     <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                                   </div>
                                   <div className="item-info">
                                     <div className="item-name">{item.name}</div>
                                     {item.rarity && (
                                       <div className="item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                                         <span>{item.rarity}</span>
                                       </div>
                                     )}
                                     <div className="item-price">
                                       {item.hasDiscount ? (
                                         <>
                                           <div className="original-price">
                                             {item.originalPrice} {item.price?.currency === 'gems' ? '💎' : '🪙'}
                                           </div>
                                           <div className="discount-price">
                                             {item.discountPrice} {item.price?.currency === 'gems' ? '💎' : '🪙'}
                                           </div>
                                         </>
                                       ) : (
                                         <div className="current-price">
                                           {item.price?.amount || item.price} {item.price?.currency === 'gems' ? '💎' : '🪙'}
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                   <button 
                                     className="buy-button"
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       buyItem(
                                         item.id || item.name, 
                                         item.hasDiscount ? item.discountPrice : (item.price?.amount || item.price), 
                                         item.price?.currency
                                       );
                                     }}
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
                                 <option key={type.id} value={type.name}>{type.name}</option>
                               ))}
                             </select>
                           </div>
                           
                           {/* Список предметов */}
                           <div className="phone-inventory-items">
                             {sortedInventory.length > 0 ? (
                               sortedInventory.map((item, index) => (
                                 <div 
                                   key={item.id ? `inventory-item-${item.id}` : `inventory-item-${index}`} 
                                   className="phone-inventory-item"
                                   onClick={() => openInventoryItemDetails(item)}
                                 >
                                   <div className="item-image">
                                     <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                                   </div>
                                   <div className="item-info">
                                     <div className="item-name">{item.name}</div>
                                     {item.rarity && (
                                       <div className="item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                                         <span>{item.rarity}</span>
                                       </div>
                                     )}
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
                                       onClick={(e) => {
                                         e.stopPropagation(); // Предотвращаем открытие деталей при продаже
                                         sellItem(item.id || item.name, item.sellPrice?.amount || item.sellPrice);
                                       }}
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
                         </>
                       ) : (
                         /* Детали товара магазина */
                         <div className="phone-app-content">
                           <div className="phone-app-header">
                             <button className="phone-back-button" onClick={closeShopItemDetails}>
                               <i className="fas fa-arrow-left"></i>
                             </button>
                             <h3>Детали товара</h3>
                           </div>
                           
                           <div className="phone-item-details">
                             {selectedShopItem && (
                               <>
                                 <div className="item-details-image">
                                   <img 
                                     src={selectedShopItem.sprite ? `/${selectedShopItem.sprite}` : `/sprites/items/consumable/apple.png`} 
                                     alt={selectedShopItem.name} 
                                   />
                                 </div>
                                 
                                 <div className="item-details-info">
                                   <div className="item-details-name">{selectedShopItem.name}</div>
                                   {selectedShopItem.rarity && (
                                     <div className="item-details-rarity" style={{ color: getRarityColor(selectedShopItem.rarity) }}>
                                       <span>{selectedShopItem.rarity}</span>
                                     </div>
                                   )}
                                   
                                   <div className="item-details-price">
                                     {selectedShopItem.hasDiscount ? (
                                       <>
                                         <div className="original-price">
                                           {selectedShopItem.originalPrice} {selectedShopItem.price?.currency === 'gems' ? '💎' : '🪙'}
                                         </div>
                                         <div className="discount-price">
                                           {selectedShopItem.discountPrice} {selectedShopItem.price?.currency === 'gems' ? '💎' : '🪙'}
                                         </div>
                                       </>
                                     ) : (
                                       <div className="current-price">
                                         {selectedShopItem.price?.amount || selectedShopItem.price} {selectedShopItem.price?.currency === 'gems' ? '💎' : '🪙'}
                                       </div>
                                     )}
                                   </div>
                                   
                                   {selectedShopItem.description && (
                                     <div className="item-details-description">
                                       <h4>Описание</h4>
                                       <p>{selectedShopItem.description}</p>
                                     </div>
                                   )}
                                   
                                   {selectedShopItem.effects && selectedShopItem.effects.length > 0 && (
                                     <div className="item-details-effects">
                                       <h4>Эффекты</h4>
                                       <ul>
                                         {selectedShopItem.effects.map((effect, index) => (
                                           <li key={`effect-${index}-${effect}`}>{effect}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   )}
                                 </div>
                                 
                                 {selectedShopItem && (
                                   <div className="item-details-buy-info">
                                     <button 
                                       className="item-details-buy-button"
                                       onClick={() => buyItem(
                                         selectedShopItem.id || selectedShopItem.name, 
                                         selectedShopItem.hasDiscount ? selectedShopItem.discountPrice : (selectedShopItem.price?.amount || selectedShopItem.price), 
                                         selectedShopItem.price?.currency
                                       )}
                                     >
                                       Купить за {selectedShopItem.hasDiscount ? selectedShopItem.discountPrice : (selectedShopItem.price?.amount || selectedShopItem.price)} {selectedShopItem.price?.currency === 'gems' ? '💎' : '🪙'}
                                     </button>
                                   </div>
                                 )}
                               </>
                             )}
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Инвентарь */}
                   {activeApp === 'inventory' && (
                     <div className="phone-app-content">
                       {inventoryView === 'list' ? (
                         <>
                           <div className="phone-app-header">
                             <button className="phone-back-button" onClick={handleBackToHome}>
                               <i className="fas fa-arrow-left"></i>
                             </button>
                             <h3>Инвентарь</h3>
                           </div>
                           
                           {/* Фильтры и поиск */}
                           <div className="phone-inventory-controls">
                             <div className="inventory-controls-row">
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
                                   <option key={type.id} value={type.name}>{type.name}</option>
                                 ))}
                               </select>
                             </div>
                           </div>
                           
                           {/* Список предметов */}
                           <div className="phone-inventory-list">
                             {sortedInventory.length > 0 ? (
                               sortedInventory.map((item, index) => (
                                 <div 
                                   key={item.id ? `inventory-item-${item.id}` : `inventory-item-${index}`} 
                                   className="phone-inventory-item"
                                   onClick={() => openInventoryItemDetails(item)}
                                 >
                                   <div className="item-image">
                                     <img src={item.sprite ? `/${item.sprite}` : `/sprites/items/consumable/apple.png`} alt={item.name} />
                                   </div>
                                   <div className="item-info">
                                     <div className="item-name">{item.name}</div>
                                     {item.rarity && (
                                       <div className="item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                                         <span>{item.rarity}</span>
                                       </div>
                                     )}
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
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         sellItem(item.id || item.name, item.sellPrice?.amount || item.sellPrice);
                                       }}
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
                         </>
                       ) : (
                         /* Детали предмета */
                         <>
                           <div className="phone-app-header">
                             <button className="phone-back-button" onClick={closeInventoryItemDetails}>
                               <i className="fas fa-arrow-left"></i>
                             </button>
                             <h3>Детали предмета</h3>
                           </div>
                           
                           <div className="phone-item-details">
                             <div className="item-details-image">
                               <img 
                                 src={selectedInventoryItem.sprite ? `/${selectedInventoryItem.sprite}` : `/sprites/items/consumable/apple.png`} 
                                 alt={selectedInventoryItem.name} 
                               />
                             </div>
                             
                             <div className="item-details-info">
                               <h3 className="item-details-name">{selectedInventoryItem.name}</h3>
                               
                               {selectedInventoryItem.rarity && (
                                 <div className="item-details-rarity" style={{ color: getRarityColor(selectedInventoryItem.rarity) }}>
                                   <span>{selectedInventoryItem.rarity}</span>
                                 </div>
                               )}
                               
                               <div className="item-details-quantity">
                                 Количество: {selectedInventoryItem.quantity}
                               </div>
                               
                               {selectedInventoryItem.description && (
                                 <div className="item-details-description">
                                   <h4>Описание:</h4>
                                   <p>{selectedInventoryItem.description}</p>
                                 </div>
                               )}
                               
                               {selectedInventoryItem.effects && selectedInventoryItem.effects.length > 0 && (
                                 <div className="item-details-effects">
                                   <h4>Эффекты:</h4>
                                   <ul>
                                     {selectedInventoryItem.effects.map((effect, index) => (
                                       <li key={`effect-${index}-${effect}`}>{effect}</li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                               
                               {selectedInventoryItem.canSell && (
                                 <div className="item-details-sell-info">
                                   <div className="sell-price">
                                     Цена продажи: {selectedInventoryItem.sellPrice?.amount || selectedInventoryItem.sellPrice} {selectedInventoryItem.sellPrice?.currency === 'gems' ? '💎' : '🪙'}
                                   </div>
                                   <button 
                                     className="item-details-sell-button"
                                     onClick={() => {
                                       sellItem(selectedInventoryItem.id || selectedInventoryItem.name, selectedInventoryItem.sellPrice?.amount || selectedInventoryItem.sellPrice);
                                       closeInventoryItemDetails();
                                     }}
                                   >
                                     Продать
                                   </button>
                                 </div>
                               )}
                             </div>
                           </div>
                         </>
                       )}
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





                  {/* Питомец */}
                  {activeApp === 'pet' && (
                    <div className="phone-app-content">
                      {petView === 'main' ? (
                        <>
                          <div className="phone-app-header pet-header-with-button">
                            <button className="phone-back-button" onClick={handleBackToHome}>
                              <i className="fas fa-arrow-left"></i>
                            </button>
                            <h3>Питомец</h3>
                            {(() => {
                              const availablePets = getAvailablePets();
                              if (availablePets.length > 1) {
                                return (
                                  <button 
                                    className="header-change-pet-btn" 
                                    onClick={handleChangePet}
                                    title="Сменить питомца"
                                  >
                                    <i className="fas fa-exchange-alt"></i>
                                  </button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          <div className="pet-view">
                            {activePet && activePetData ? (
                              <div className="pet-container">
                                {/* Верхняя часть - питомец и имя */}
                                <div className="pet-header">
                                  <div className="pet-avatar-container">
                                    <div className={`pet-avatar ${petAnimationClass}`}>
                                      <img 
                                        src={activePetData.sprite ? `/${activePetData.sprite}` : '/sprites/items/pets/rat.png'} 
                                        alt={activePetData.name}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="pet-placeholder" style={{ display: 'none' }}>
                                        <i className="fas fa-paw"></i>
                                      </div>
                                      
                                      {/* Эффект сна */}
                                      {activePet?.isSleeping && (
                                        <div className="sleep-effect"></div>
                                      )}
                                      
                                      {/* Статусы питомца */}
                                      {activePetStatus && activePetStatus.length > 0 && (
                                        <div className="pet-status-indicators">
                                          {activePetStatus.map((status, index) => (
                                            <div 
                                              key={status} 
                                              className="pet-status-indicator"
                                              style={{ 
                                                backgroundColor: getStatusColorByName(status),
                                                animationDelay: `${index * 0.1}s`
                                              }}
                                              title={getStatusTextByName(status)}
                                            >
                                              <i className={getStatusIconByName(status)}></i>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="pet-name">{activePetData.name}</div>
                                  </div>
                                </div>

                                {/* Средняя часть - статистика */}
                                {activePet && (
                                  <div className="pet-stats-section">
                                    <div className="pet-stat-row">
                                      <div className="pet-stat-item">
                                        <div className="stat-icon">🍽️</div>
                                        <div className="stat-bar">
                                          <div 
                                            className="stat-fill hunger-fill" 
                                            style={{ width: `${activePet.hunger}%` }}
                                          ></div>
                                        </div>
                                        <div className="stat-value">{Math.round(activePet.hunger)}%</div>
                                      </div>
                                      <div className="pet-stat-item">
                                        <div className="stat-icon">😊</div>
                                        <div className="stat-bar">
                                          <div 
                                            className="stat-fill happiness-fill" 
                                            style={{ width: `${activePet.happiness}%` }}
                                          ></div>
                                        </div>
                                        <div className="stat-value">{Math.round(activePet.happiness)}%</div>
                                      </div>
                                    </div>
                                    <div className="pet-stat-row">
                                      <div className="pet-stat-item">
                                        <div className="stat-icon">⚡</div>
                                        <div className="stat-bar">
                                          <div 
                                            className="stat-fill energy-fill" 
                                            style={{ width: `${activePet.energy}%` }}
                                          ></div>
                                        </div>
                                        <div className="stat-value">{Math.round(activePet.energy)}%</div>
                                      </div>
                                      <div className="pet-stat-item">
                                        <div className="stat-icon">❤️</div>
                                        <div className="stat-bar">
                                          <div 
                                            className="stat-fill health-fill" 
                                            style={{ width: `${activePet.health}%` }}
                                          ></div>
                                        </div>
                                        <div className="stat-value">{Math.round(activePet.health)}%</div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Нижняя часть - кнопки действий */}
                                <div className="pet-action-buttons">
                                  <button 
                                    className="pet-action-btn" 
                                    onClick={handleFeedPet}
                                    disabled={!activePet || activePet.hunger >= 100 || activePet.isSleeping}
                                    title={!activePet || activePet.hunger >= 100 || activePet.isSleeping ? (activePet?.isSleeping ? "Питомец спит!" : "Питомец уже сыт!") : "Покормить питомца"}
                                  >
                                    <i className="fas fa-utensils"></i>
                                    <span>Кормить</span>
                                  </button>
                                  <button 
                                    className="pet-action-btn" 
                                    onClick={handlePlayWithPet}
                                    disabled={!activePet || activePet.energy < 15 || activePet.happiness >= 100 || activePet.isSleeping}
                                    title={!activePet || activePet.energy < 15 || activePet.happiness >= 100 || activePet.isSleeping ? (activePet?.isSleeping ? "Питомец спит!" : "Питомец слишком устал или уже счастлив!") : "Поиграть с питомцем"}
                                  >
                                    <i className="fas fa-gamepad"></i>
                                    <span>Играть</span>
                                  </button>
                                  <button 
                                    className="pet-action-btn" 
                                    onClick={activePet?.isSleeping ? handleWakeUpPet : handleRestPet}
                                    disabled={!activePet}
                                    title={activePet?.isSleeping 
                                      ? "Разбудить питомца"
                                      : "Уложить питомца спать"
                                    }
                                  >
                                    <i className={activePet?.isSleeping ? "fas fa-sun" : "fas fa-bed"}></i>
                                    <span>{activePet?.isSleeping ? "Будить" : "Спать"}</span>
                                  </button>
                                  <button 
                                    className="pet-action-btn" 
                                    onClick={handleHealPet}
                                    disabled={!activePet || activePet.health >= 100 || activePet.isSleeping}
                                    title={!activePet || activePet.health >= 100 || activePet.isSleeping ? (activePet?.isSleeping ? "Питомец спит!" : "Питомец полностью здоров!") : "Лечить питомца"}
                                  >
                                    <i className="fas fa-heartbeat"></i>
                                    <span>Лечить</span>
                                  </button>
                                </div>
                                

                              </div>
                            ) : (
                              <div className="no-pet">
                                <i className="fas fa-paw"></i>
                                <p>У вас пока нет питомца</p>
                                <p>Питомцев можно получить в магазине</p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : petView === 'change' ? (
                        /* Экран выбора питомца */
                        <div className="pet-change-view">
                          <div className="phone-app-header">
                            <button className="phone-back-button" onClick={() => setPetView('main')}>
                              <i className="fas fa-arrow-left"></i>
                            </button>
                            <h3>Выбор питомца</h3>
                          </div>
                          <div className="pet-selection-container">
                            <div className="pet-selection-list">
                              {(() => {
                                const availablePets = getAvailablePets();
                                if (availablePets.length === 0) {
                                  return (
                                    <div className="no-pets-message">
                                      <i className="fas fa-paw"></i>
                                      <p>У вас нет питомцев в инвентаре</p>
                                      <p>Питомцев можно купить в магазине</p>
                                    </div>
                                  );
                                }
                                
                                return availablePets.map((pet, index) => (
                                  <div key={pet.id} className="pet-selection-item">
                                    <div className="pet-selection-avatar">
                                      <img 
                                        src={pet.sprite ? `/${pet.sprite}` : '/sprites/items/pets/rat.png'} 
                                        alt={pet.name}
                                        onError={(e) => {
                                          e.target.src = '/sprites/items/pets/rat.png';
                                        }}
                                      />
                                    </div>
                                    <div className="pet-selection-info">
                                      <div className="pet-selection-name">{pet.name}</div>
                                      <div className="pet-selection-status">
                                        {activePetData?.id === pet.id ? 'Активный' : 'Доступен'}
                                      </div>
                                      {pet.rarity && (
                                        <div className="pet-selection-rarity" style={{ color: getRarityColor(pet.rarity) }}>
                                          {pet.rarity}
                                        </div>
                                      )}
                                    </div>
                                    <button 
                                      className="pet-selection-btn"
                                      onClick={() => handleSelectPet(pet.id)}
                                      disabled={activePetData?.id === pet.id}
                                    >
                                      {activePetData?.id === pet.id ? 'Выбран' : 'Выбрать'}
                                    </button>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Мини-игра */
                        <div className="minigame-view">
                          <div className="phone-app-header">
                            <button className="phone-back-button" onClick={closeMinigame}>
                              <i className="fas fa-arrow-left"></i>
                            </button>
                            <h3>
                              {activePetData?.gameType === 'can_fly' && 'Полет над городом'}
                              {activePetData?.gameType === 'can_jump' && 'Doodle Jump'}
                              {activePetData?.gameType === 'can_walk' && 'Crossy Road'}
                              {activePetData?.gameType === 'can_swim' && (
                                <>
                                  Zuma
                                  {zumaNextBall && (
                                    <span style={{marginLeft: 12, fontSize: 14, verticalAlign: 'middle'}}>
                                      <div 
                                        key={`zuma-ball-${zumaNextBall.color}-${zumaSpriteFrame}`}
                                        style={{
                                          display: 'inline-block',
                                          verticalAlign: 'middle',
                                          transform: 'scale(0.75)', // Уменьшаем размер для заголовка
                                          ...getSpriteStyle(zumaNextBall.sprite, zumaSpriteFrame, 0)
                                        }}
                                        title={`Frame: ${zumaSpriteFrame}, Color: ${zumaNextBall.color}, Frames: ${zumaNextBall.sprite.frames}`}
                                      />
                                    </span>
                                  )}
                                  <span style={{marginLeft: 8, fontSize: 14, verticalAlign: 'middle'}}>Уровень: {zumaLevel}</span>
                                </>
                              )}
                              {!activePetData?.gameType && 'Мини-игра'}
                            </h3>
                          </div>
                          <div className="minigame-container">
                            {activePetData && (
                              <>
                                {activePetData.gameType === 'can_fly' && (
                                  <FlyingOverCityGame 
                                    petSprite={activePetData.sprite ? `/${activePetData.sprite}` : '/sprites/items/pets/rat.png'} 
                                    onClose={closeMinigame} 
                                    petId={activePetData.id} 
                                  />
                                )}
                                {activePetData.gameType === 'can_jump' && (
                                  <DoodleJumpGame 
                                    petSprite={activePetData.sprite ? `/${activePetData.sprite}` : '/sprites/items/pets/rat.png'} 
                                    onClose={closeMinigame} 
                                    petId={activePetData.id} 
                                  />
                                )}
                                {activePetData.gameType === 'can_walk' && (
                                  <CrossyRoadGame 
                                    petSprite={activePetData.sprite ? `/${activePetData.sprite}` : '/sprites/items/pets/rat.png'} 
                                    onClose={closeMinigame} 
                                    petId={activePetData.id} 
                                  />
                                )}
                                {activePetData.gameType === 'can_swim' && (
                                  <ZumaGame 
                                    petSprite={activePetData.sprite ? `/${activePetData.sprite}` : '/sprites/items/pets/rat.png'} 
                                    onClose={closeMinigame} 
                                    petId={activePetData.id} 
                                    onLevelChange={setZumaLevel}
                                    onNextBallChange={setZumaNextBall}
                                    onSpriteFrameChange={setZumaSpriteFrame}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
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
       <AnimatePresence key="quantity-modal-presence">
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