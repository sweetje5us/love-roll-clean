import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScreen } from '../../contexts/ScreenContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useDailyRewards } from '../../contexts/DailyRewardsContext';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import ItemCard from '../ui/ItemCard';
import ChestModal from '../ui/ChestModal';
import { 
  getShopItems, 
  getShopItemsWithInventoryFilter,
  getItemsByType, 
  getAllTypes, 
  getTypeInfo,
  filterItems 
} from '../../utils/itemUtils';
import { getRotationInfo } from '../../utils/shopRotation';
import { getCurrentDiscounts } from '../../utils/discountSystem';
import { getInventoryItemsWithInfo, filterInventoryItems, sortInventoryItems, getInventoryStats } from '../../utils/inventoryUtils';
import { getItemById } from '../../utils/itemUtils';
import './ShopScreen.css';
import { AnimatePresence } from 'framer-motion';

const ShopScreen = () => {
  const { goBack } = useScreen();
  const { gold, gems, removeGold, addGold, addGems, removeGems, hasEnoughGold, hasEnoughGems } = useCurrency();
  const { addItem, removeItem, getAllItems: getInventoryData, addTestItems } = useInventory();
  const { 
    dailyRewards, 
    canClaimToday, 
    getTodayReward, 
    getWeekProgress, 
    getWeekRewards, 
    claimReward 
  } = useDailyRewards();
  const [activeTab, setActiveTab] = useState('shop');
  const [activeCategory, setActiveCategory] = useState('all');

  // Состояние для модального окна сундука
  const [chestModal, setChestModal] = useState({
    isOpen: false,
    chestItem: null
  });

  // Состояние для модального окна выбора количества
  const [quantityModal, setQuantityModal] = useState({
    isOpen: false,
    item: null,
    maxQuantity: 1,
    selectedQuantity: 1
  });

  // Данные инвентаря
  const inventoryData = getInventoryData();
  const inventoryItems = getInventoryItemsWithInfo(inventoryData);
  const inventoryStats = getInventoryStats(inventoryItems);
  
  // Получаем реальные данные предметов
  const allShopItems = getShopItemsWithInventoryFilter(inventoryData);
  const itemTypes = getAllTypes();
  const rotationInfo = getRotationInfo();
  const discountItems = getCurrentDiscounts(allShopItems);
  console.log('Скидочные предметы в карусели:', discountItems);
  const [currentDiscountIndex, setCurrentDiscountIndex] = useState(0);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');
  
  // Дополнительные фильтры для магазина
  const [rarityFilter, setRarityFilter] = useState('all');
  const [petAbilityFilter, setPetAbilityFilter] = useState('all');
  const [clothingGenderFilter, setClothingGenderFilter] = useState('all');
  const [clothingAgeFilter, setClothingAgeFilter] = useState('all');
  const [clothingTypeFilter, setClothingTypeFilter] = useState('all');
  const [consumableEffectFilter, setConsumableEffectFilter] = useState('all');
  const [consumableStatFilter, setConsumableStatFilter] = useState('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  // Фильтрация товаров по категории и дополнительным фильтрам
  let filteredItems = activeCategory === 'all' 
    ? allShopItems 
    : getItemsByType(activeCategory, inventoryData);
    
  // Применяем дополнительные фильтры
  if (rarityFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.rarity === rarityFilter);
  }
  
  // Фильтры для питомцев
  if (activeCategory === 'pet' && petAbilityFilter !== 'all') {
    filteredItems = filteredItems.filter(item => {
      if (!item.special) return false;
      return item.special.type === petAbilityFilter;
    });
  }
  
  // Фильтры для одежды
  if (activeCategory === 'clothing') {
    if (clothingGenderFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.gender === clothingGenderFilter);
    }
    if (clothingAgeFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.age === clothingAgeFilter);
    }
    if (clothingTypeFilter !== 'all') {
      filteredItems = filteredItems.filter(item => item.subtype === clothingTypeFilter);
    }
  }
  
  // Фильтры для расходуемых
  if (activeCategory === 'consumable') {
    if (consumableEffectFilter !== 'all') {
      filteredItems = filteredItems.filter(item => {
        const description = item.description.toLowerCase();
        
        if (consumableEffectFilter === 'stat') {
          // Ищем зелья, которые добавляют очки к характеристикам
          return description.includes('добавляет') && description.includes('очко');
        } else if (consumableEffectFilter === 'reroll') {
          // Ищем предметы с перебросом
          return description.includes('переброс') || description.includes('перекинуть') ||
                 description.includes('перебросить');
        } else if (consumableEffectFilter === 'relation') {
          // Ищем предметы, влияющие на отношения (но не зелья характеристик)
          return (description.includes('отношения') || description.includes('отношений')) &&
                 !(description.includes('добавляет') && description.includes('очко'));
        }
        return true;
      });
    }
    if (consumableStatFilter !== 'all') {
      filteredItems = filteredItems.filter(item => {
        const description = item.description.toLowerCase();
        const name = item.name.toLowerCase();
        
        // Карта соответствий характеристик и их вариантов написания в данных
        const statVariants = {
          'харизма': ['харизм'],
          'холод': ['холод'],
          'чувствительность': ['чувствительн'],
          'решительность': ['решительн'],
          'коварство': ['коварств'],
          'интеллект': ['интеллект']
        };
        
        const searchTerm = consumableStatFilter.toLowerCase();
        const variants = statVariants[searchTerm] || [searchTerm];
        
        // Ищем в описании и названии по всем вариантам
        return variants.some(variant => 
          description.includes(variant) || name.includes(variant)
        );
      });
    }
  }

  // Переключение вкладок
  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  // Переключение категорий магазина
  const switchShopCategory = (category) => {
    setActiveCategory(category);
    // Сбрасываем специфичные фильтры при смене категории
    setRarityFilter('all');
    setPetAbilityFilter('all');
    setClothingGenderFilter('all');
    setClothingAgeFilter('all');
    setClothingTypeFilter('all');
    setConsumableEffectFilter('all');
    setConsumableStatFilter('all');
    // Скрываем фильтры при смене категории
    setFiltersVisible(false);
  };

  // Покупка предмета
  const buyItem = (itemId, price, currency = 'coins') => {
    console.log('Покупка предмета:', { itemId, price, currency });
    
    const item = getItemById(itemId);
    
    // Для питомцев и одежды - покупка только по 1 штуке
    if (item.type === 'pet' || item.type === 'clothing') {
      const currencySymbol = currency === 'gems' ? '💎' : '🪙';
      const currentBalance = currency === 'gems' ? gems : gold;
      
      const confirmMessage = `Вы уверены, что хотите купить "${item?.name || itemId}" за ${price} ${currencySymbol}?\n\nВаш баланс: ${currentBalance} ${currencySymbol}`;
      
      if (window.confirm(confirmMessage)) {
        if (currency === 'coins') {
          if (hasEnoughGold(price)) {
            removeGold(price);
            addItem(itemId, 1);
            alert(`✅ Вы купили "${item?.name || itemId}" за ${price} монет!`);
          } else {
            alert('❌ Недостаточно монет!');
          }
        } else if (currency === 'gems') {
          if (hasEnoughGems(price)) {
            removeGems(price);
            addItem(itemId, 1);
            alert(`✅ Вы купили "${item?.name || itemId}" за ${price} самоцветов!`);
          } else {
            alert('❌ Недостаточно самоцветов!');
          }
        }
      }
    } else {
      // Для остальных предметов - открываем модальное окно выбора количества
      const currentBalance = currency === 'gems' ? gems : gold;
      const maxQuantity = Math.floor(currentBalance / price);
      
      setQuantityModal({
        isOpen: true,
        item: { ...item, price, currency },
        maxQuantity: Math.max(1, maxQuantity),
        selectedQuantity: 1
      });
    }
  };

  // Подтверждение покупки с выбранным количеством
  const confirmPurchase = () => {
    const { item, selectedQuantity } = quantityModal;
    const totalPrice = item.price * selectedQuantity;
    const currencySymbol = item.currency === 'gems' ? '💎' : '🪙';
    
    const confirmMessage = `Вы уверены, что хотите купить ${selectedQuantity} "${item.name}" за ${totalPrice} ${currencySymbol}?`;
    
    if (window.confirm(confirmMessage)) {
      if (item.currency === 'coins') {
        if (hasEnoughGold(totalPrice)) {
          removeGold(totalPrice);
          addItem(item.id, selectedQuantity);
          alert(`✅ Вы купили ${selectedQuantity} "${item.name}" за ${totalPrice} монет!`);
        } else {
          alert('❌ Недостаточно монет!');
        }
      } else if (item.currency === 'gems') {
        if (hasEnoughGems(totalPrice)) {
          removeGems(totalPrice);
          addItem(item.id, selectedQuantity);
          alert(`✅ Вы купили ${selectedQuantity} "${item.name}" за ${totalPrice} самоцветов!`);
        } else {
          alert('❌ Недостаточно самоцветов!');
        }
      }
      
      setQuantityModal({
        isOpen: false,
        item: null,
        maxQuantity: 1,
        selectedQuantity: 1
      });
    }
  };

  // Закрытие модального окна выбора количества
  const closeQuantityModal = () => {
    setQuantityModal({
      isOpen: false,
      item: null,
      maxQuantity: 1,
      selectedQuantity: 1
    });
  };

  // Продажа предмета
  const sellItem = (itemId, sellPrice) => {
    console.log('Продажа предмета:', { itemId, sellPrice });
    
    const item = getItemById(itemId);
    const confirmMessage = `Вы уверены, что хотите продать "${item?.name || itemId}" за ${sellPrice} 🪙?\n\nЭто действие нельзя отменить.`;
    
    if (window.confirm(confirmMessage)) {
      removeItem(itemId, 1);
      addGold(sellPrice);
      alert(`✅ Вы продали "${item?.name || itemId}" за ${sellPrice} монет!`);
    }
  };

  // Получение ежедневной награды
  const handleClaimDailyReward = () => {
    console.log('Попытка получения ежедневной награды');
    const result = claimReward(addGold, addGems, addItem);
    console.log('Результат получения награды:', result);
    
    if (result.success) {
      alert(`🎉 ${result.message}`);
    } else {
      alert(`❌ ${result.message}`);
    }
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

  // Управление каруселью скидок
  const nextDiscount = () => {
    if (discountItems.length > 0) {
      setCurrentDiscountIndex((prev) => (prev + 1) % discountItems.length);
    }
  };

  const prevDiscount = () => {
    if (discountItems.length > 0) {
      setCurrentDiscountIndex((prev) => 
        prev === 0 ? discountItems.length - 1 : prev - 1
      );
    }
  };

  // Функция для проверки возможности прокрутки категорий
  const checkScrollPosition = (container) => {
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Обработчик прокрутки категорий
  const handleCategoriesScroll = (e) => {
    checkScrollPosition(e.target);
  };

  // Автоматическое переключение карусели
  useEffect(() => {
    if (discountItems.length <= 1) return;
    
    const interval = setInterval(() => {
      nextDiscount();
    }, 4000); // Переключаем каждые 4 секунды

    return () => clearInterval(interval);
  }, [discountItems.length]);

  // Проверка возможности прокрутки категорий при изменении размера окна
  useEffect(() => {
    const checkScrollOnResize = () => {
      const container = document.querySelector('.categories-container');
      if (container) {
        checkScrollPosition(container);
      }
    };

    checkScrollOnResize();
    window.addEventListener('resize', checkScrollOnResize);
    
    return () => window.removeEventListener('resize', checkScrollOnResize);
  }, [activeCategory, itemTypes]);

  return (
    <motion.div 
      className="shop-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="shop-container">
        {/* Заголовок и валюта */}
        <div className="shop-header">
          <button 
            className="back-button"
            onClick={goBack}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="shop-title">Магазин</h1>
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

        {/* Информация о ротации */}
        <div className="rotation-info">
          <span className="rotation-text">
            Обновление через {rotationInfo.daysUntilRotation} дн.
          </span>
        </div>

        {/* Вкладки */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => switchTab('shop')}
          >
            <i className="fas fa-shopping-cart"></i>
            Магазин
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => switchTab('inventory')}
          >
            <i className="fas fa-backpack"></i>
            Инвентарь
          </button>
          <button 
            className={`tab-btn ${activeTab === 'topup' ? 'active' : ''}`}
            onClick={() => switchTab('topup')}
          >
            <i className="fas fa-coins"></i>
            Пополнение
          </button>
        </div>

        {/* Содержимое вкладки магазина */}
        {activeTab === 'shop' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Категории товаров */}
            <div className="categories-wrapper">
              {/* Индикатор прокрутки влево */}
              {canScrollLeft && (
                <div className="scroll-indicator scroll-indicator-left">
                  <i className="fas fa-chevron-left"></i>
                </div>
              )}
              
              <div 
                className="categories-container"
                onScroll={handleCategoriesScroll}
                ref={(el) => {
                  if (el) {
                    checkScrollPosition(el);
                  }
                }}
              >
                <button 
                  className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => switchShopCategory('all')}
                >
                  Все
                </button>
                {itemTypes.map((type) => {
                  const typeInfo = getTypeInfo(type);
                  return (
                    <button 
                      key={type}
                      className={`category-btn ${activeCategory === type ? 'active' : ''}`}
                      onClick={() => switchShopCategory(type)}
                    >
                      {typeInfo.name}
                    </button>
                  );
                })}
              </div>

              {/* Индикатор прокрутки вправо */}
              {canScrollRight && (
                <div className="scroll-indicator scroll-indicator-right">
                  <i className="fas fa-chevron-right"></i>
                </div>
              )}
            </div>

            {/* Кнопка показа/скрытия фильтров */}
            <div className="filters-toggle">
              <button 
                className="filters-toggle-btn"
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                <i className={`fas fa-filter ${filtersVisible ? 'active' : ''}`}></i>
                Фильтры
                <i className={`fas fa-chevron-${filtersVisible ? 'up' : 'down'}`}></i>
              </button>
            </div>

            {/* Дополнительные фильтры */}
            <AnimatePresence>
              {filtersVisible && (
                <motion.div 
                  className="shop-filters"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
              {/* Фильтр по редкости */}
              <div className="filter-group">
                <label>Редкость:</label>
                <select 
                  value={rarityFilter} 
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Все редкости</option>
                  <option value="common">Обычная</option>
                  <option value="rare">Редкая</option>
                  <option value="legendary">Легендарная</option>
                  <option value="mythical">Мифическая</option>
                </select>
              </div>

              {/* Фильтры для питомцев */}
              {activeCategory === 'pet' && (
                <div className="filter-group">
                  <label>Способность:</label>
                  <select 
                    value={petAbilityFilter} 
                    onChange={(e) => setPetAbilityFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Все способности</option>
                    <option value="relation">Отношения</option>
                    <option value="reroll">Переброс</option>
                    <option value="stat">Характеристики</option>
                  </select>
                </div>
              )}

              {/* Фильтры для одежды */}
              {activeCategory === 'clothing' && (
                <>
                  <div className="filter-group">
                    <label>Пол:</label>
                    <select 
                      value={clothingGenderFilter} 
                      onChange={(e) => setClothingGenderFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все</option>
                      <option value="male">Мужской</option>
                      <option value="female">Женский</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Возраст:</label>
                    <select 
                      value={clothingAgeFilter} 
                      onChange={(e) => setClothingAgeFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все возрасты</option>
                      <option value="1">Молодой</option>
                      <option value="2">Зрелый</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Тип:</label>
                    <select 
                      value={clothingTypeFilter} 
                      onChange={(e) => setClothingTypeFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все типы</option>
                      <option value="dress">Одежда</option>
                      <option value="accessory">Аксессуар</option>
                    </select>
                  </div>
                </>
              )}

              {/* Фильтры для расходуемых */}
              {activeCategory === 'consumable' && (
                <>
                  <div className="filter-group">
                    <label>Эффект:</label>
                    <select 
                      value={consumableEffectFilter} 
                      onChange={(e) => setConsumableEffectFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все эффекты</option>
                      <option value="stat">+ к характеристикам</option>
                      <option value="reroll">Переброс</option>
                      <option value="relation">Отношения</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Характеристика:</label>
                    <select 
                      value={consumableStatFilter} 
                      onChange={(e) => setConsumableStatFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Все характеристики</option>
                      <option value="харизма">Харизма</option>
                      <option value="холод">Холод</option>
                      <option value="чувствительность">Чувствительность</option>
                      <option value="решительность">Решительность</option>
                      <option value="коварство">Коварство</option>
                      <option value="интеллект">Интеллект</option>
                    </select>
                  </div>
                </>
              )}
              
              {/* Кнопка сброса фильтров */}
              {(rarityFilter !== 'all' || 
                (activeCategory === 'pet' && petAbilityFilter !== 'all') ||
                (activeCategory === 'clothing' && (clothingGenderFilter !== 'all' || clothingAgeFilter !== 'all' || clothingTypeFilter !== 'all')) ||
                (activeCategory === 'consumable' && (consumableEffectFilter !== 'all' || consumableStatFilter !== 'all'))) && (
                <div className="filter-group">
                  <button 
                    className="reset-filters-btn"
                    onClick={() => {
                      setRarityFilter('all');
                      setPetAbilityFilter('all');
                      setClothingGenderFilter('all');
                      setClothingAgeFilter('all');
                      setClothingTypeFilter('all');
                      setConsumableEffectFilter('all');
                      setConsumableStatFilter('all');
                    }}
                  >
                    <i className="fas fa-times"></i>
                    Сбросить фильтры
                  </button>
                </div>
              )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Карусель скидочных предложений */}
            {discountItems.length > 0 && (
              <div className="discount-carousel">
                <div className="carousel-container">
                  <button 
                    className="carousel-btn prev"
                    onClick={prevDiscount}
                    disabled={discountItems.length <= 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  <div className="carousel-content">
                    {discountItems.length > 0 && (
                      <motion.div
                        key={discountItems[currentDiscountIndex]?.id}
                        className="carousel-item active"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ 
                          display: 'flex',
                          position: 'relative',
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        <div className="discount-badge">-{discountItems[currentDiscountIndex].discountPercent}%</div>
                        <div className="carousel-item-content">
                          <div className="carousel-item-image">
                            <img 
                              src={discountItems[currentDiscountIndex].sprite} 
                              alt={discountItems[currentDiscountIndex].name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="carousel-item-placeholder">
                              
                            </div>
                          </div>
                          <div className="carousel-item-info">
                            <h4>{discountItems[currentDiscountIndex].name}</h4>
                            <p>{discountItems[currentDiscountIndex].description}</p>
                            <div className="carousel-item-price">
                              <span className="original-price">{discountItems[currentDiscountIndex].originalPrice} {discountItems[currentDiscountIndex].currency === 'gems' ? '💎' : '🪙'}</span>
                              <span className="discount-price">{discountItems[currentDiscountIndex].discountPrice} {discountItems[currentDiscountIndex].currency === 'gems' ? '💎' : '🪙'}</span>
                            </div>
                            <button 
                              className="buy-btn special"
                              onClick={() => {
                                const currentItem = discountItems[currentDiscountIndex];
                                console.log('Клик по кнопке покупки в карусели:', {
                                  itemId: currentItem.id,
                                  discountPrice: currentItem.discountPrice,
                                  currency: currentItem.currency,
                                  name: currentItem.name
                                });
                                buyItem(currentItem.id, currentItem.discountPrice, currentItem.currency);
                              }}
                            >
                              Купить
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <button 
                    className="carousel-btn next"
                    onClick={nextDiscount}
                    disabled={discountItems.length <= 1}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
                
                <div className="carousel-indicators">
                  {discountItems.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === currentDiscountIndex ? 'active' : ''}`}
                      onClick={() => setCurrentDiscountIndex(index)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Список товаров */}
            <div className="items-grid">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ItemCard
                    item={item}
                    onBuy={() => buyItem(
                      item.id, 
                      item.hasDiscount ? item.discountPrice : item.price.amount, 
                      item.price.currency
                    )}
                    onSell={() => sellItem(item.id, item.sellPrice)}
                    showBuyButton={true}
                    showSellButton={false}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Содержимое вкладки инвентаря */}
        {activeTab === 'inventory' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >


            {/* Фильтры инвентаря */}
            <div className="inventory-filters">
              <select 
                value={inventoryFilter}
                onChange={(e) => setInventoryFilter(e.target.value)}
                className="inventory-filter-select"
              >
                <option value="all">Все предметы</option>
                <option value="consumable">Расходуемые</option>
                <option value="gift">Подарки</option>
                <option value="key">Ключи</option>
                <option value="pet">Питомцы</option>
                <option value="clothing">Одежда</option>
              </select>
              <select 
                value={inventorySort}
                onChange={(e) => setInventorySort(e.target.value)}
                className="inventory-filter-select"
              >
                <option value="name">По имени</option>
                <option value="quantity">По количеству</option>
                <option value="rarity">По редкости</option>
                <option value="type">По типу</option>
                <option value="lastAdded">По дате получения</option>
              </select>
            </div>

            {/* Список предметов в инвентаре */}
            {inventoryItems.length > 0 ? (
              <div className="items-grid">
                {sortInventoryItems(
                  filterInventoryItems(inventoryItems, { type: inventoryFilter }),
                  inventorySort
                ).map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ItemCard
                      item={item}
                      onBuy={() => {}} // Покупка отключена в инвентаре
                      onSell={() => sellItem(item.id, item.sellPrice)}
                      onChestClick={handleChestClick}
                      showBuyButton={false}
                      showSellButton={item.canSell}
                      showQuantity={true}
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
          </motion.div>
        )}

        {/* Содержимое вкладки пополнения */}
        {activeTab === 'topup' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="topup-section">
              <h2><i className="fas fa-calendar-day"></i> Ежедневные награды</h2>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(getWeekProgress() / 7) * 100}%` }}></div>
              </div>
              <div className="daily-rewards">
                {getWeekRewards().map((dayReward) => (
                  <div key={dayReward.day} className={`daily-reward ${dayReward.isClaimed ? 'claimed' : ''} ${dayReward.isToday ? 'today' : ''}`}>
                    <div className={`reward-icon ${dayReward.isClaimed ? 'claimed' : ''} ${dayReward.canClaim ? 'can-claim' : ''}`}>
                      <i className={dayReward.reward.icon}></i>
                    </div>
                    <span>День {dayReward.day}</span>
                    <div className="reward-amount">
                      {dayReward.reward.type === 'coins' && `${dayReward.reward.amount} 🪙`}
                      {dayReward.reward.type === 'gems' && `${dayReward.reward.amount} 💎`}
                      {dayReward.reward.type === 'item' && dayReward.reward.name}
                      {dayReward.reward.type === 'random_pet' && 'Случайный питомец'}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className={`claim-btn ${!canClaimToday() ? 'disabled' : ''}`}
                onClick={handleClaimDailyReward}
                disabled={!canClaimToday()}
              >
                {canClaimToday() ? `Получить награду (День ${dailyRewards.currentStreak % 7 + 1})` : 'Уже получено сегодня'}
              </button>
            </div>

            <div className="topup-section">
              <h2><i className="fas fa-ad"></i> Награда за рекламу</h2>
              <div className="ad-reward">
                <div className="ad-info">
                  <h3>Просмотр рекламы</h3>
                  <p>Доступно через: 2 часа 15 минут</p>
                </div>
                <div className="ad-rewards">
                  <div>50 <span className="currency-icon gold"></span></div>
                  <div>5 <span className="currency-icon gems"></span></div>
                </div>
              </div>
              <button className="watch-ad-btn">
                <i className="fas fa-play-circle"></i> Смотреть рекламу (30 сек)
              </button>
            </div>

            <div className="topup-section">
              <h2><i className="fas fa-credit-card"></i> Пополнение баланса</h2>
              <div className="purchase-packages">
                {[
                  { gold: 100, bonus: 10, price: '$0.99' },
                  { gold: 500, bonus: 75, price: '$4.99' },
                  { gems: 50, bonus: 5, price: '$2.99' },
                  { gems: 200, bonus: 30, price: '$9.99' }
                ].map((pkg, index) => (
                  <div key={index} className="package-card">
                    <div className="package-icon">
                      <i className={pkg.gold ? 'fas fa-coins' : 'fas fa-gem'}></i>
                    </div>
                    <h3>{pkg.gold ? `${pkg.gold} золота` : `${pkg.gems} самоцветов`}</h3>
                    <p>+{pkg.bonus} бонус</p>
                    <button className="package-btn">{pkg.price}</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}


      </div>

      {/* Модальное окно сундука */}
      <ChestModal
        isOpen={chestModal.isOpen}
        onClose={handleChestClose}
        chestItem={chestModal.chestItem}
        inventoryData={inventoryData}
        onOpenChest={handleChestOpen}
        onRemoveItem={handleChestRemoveItem}
      />

      {/* Модальное окно выбора количества */}
      <AnimatePresence>
        {quantityModal.isOpen && (
          <motion.div
            className="quantity-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuantityModal}
          >
            <motion.div
              className="quantity-modal-content"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="quantity-modal-header">
                <h3>Выберите количество</h3>
                <button className="quantity-modal-close" onClick={closeQuantityModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="quantity-modal-body">
                <div className="quantity-item-info">
                  <img 
                    src={quantityModal.item?.sprite} 
                    alt={quantityModal.item?.name}
                    className="item-sprite"
                  />
                  <div className="item-details">
                    <h4>{quantityModal.item?.name}</h4>
                    <p>{quantityModal.item?.description}</p>
                    <div className="item-price">
                      {quantityModal.item?.price} {quantityModal.item?.currency === 'gems' ? '💎' : '🪙'} за штуку
                    </div>
                  </div>
                </div>
                
                <div className="quantity-selector">
                  <label>Количество:</label>
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantityModal(prev => ({
                        ...prev,
                        selectedQuantity: Math.max(1, prev.selectedQuantity - 1)
                      }))}
                      disabled={quantityModal.selectedQuantity <= 1}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max={quantityModal.maxQuantity}
                      value={quantityModal.selectedQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setQuantityModal(prev => ({
                          ...prev,
                          selectedQuantity: Math.max(1, Math.min(value, prev.maxQuantity))
                        }));
                      }}
                      className="quantity-input"
                    />
                    
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantityModal(prev => ({
                        ...prev,
                        selectedQuantity: Math.min(prev.maxQuantity, prev.selectedQuantity + 1)
                      }))}
                      disabled={quantityModal.selectedQuantity >= quantityModal.maxQuantity}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  
                  <div className="total-price">
                    Итого: {quantityModal.item?.price * quantityModal.selectedQuantity} {quantityModal.item?.currency === 'gems' ? '💎' : '🪙'}
                  </div>
                </div>
              </div>
              
              <div className="quantity-modal-footer">
                <button className="quantity-cancel-btn" onClick={closeQuantityModal}>
                  Отмена
                </button>
                <button className="quantity-confirm-btn" onClick={confirmPurchase}>
                  Купить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ShopScreen; 