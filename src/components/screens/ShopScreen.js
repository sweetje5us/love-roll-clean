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

  // Получаем реальные данные предметов
  const allShopItems = getShopItems();
  const itemTypes = getAllTypes();
  const rotationInfo = getRotationInfo();
  const discountItems = getCurrentDiscounts(allShopItems);
  console.log('Скидочные предметы в карусели:', discountItems);
  const [currentDiscountIndex, setCurrentDiscountIndex] = useState(0);
  
  // Данные инвентаря
  const inventoryData = getInventoryData();
  const inventoryItems = getInventoryItemsWithInfo(inventoryData);
  const inventoryStats = getInventoryStats(inventoryItems);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');

  // Фильтрация товаров по категории
  const filteredItems = activeCategory === 'all' 
    ? allShopItems 
    : getItemsByType(activeCategory);

  // Переключение вкладок
  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  // Переключение категорий магазина
  const switchShopCategory = (category) => {
    setActiveCategory(category);
  };

  // Покупка предмета
  const buyItem = (itemId, price, currency = 'coins') => {
    console.log('Покупка предмета:', { itemId, price, currency });
    
    const item = getItemById(itemId);
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

  // Автоматическое переключение карусели
  useEffect(() => {
    if (discountItems.length <= 1) return;
    
    const interval = setInterval(() => {
      nextDiscount();
    }, 4000); // Переключаем каждые 4 секунды

    return () => clearInterval(interval);
  }, [discountItems.length]);

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
            <div className="categories-container">
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
                <option value="material">Материалы</option>
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
    </motion.div>
  );
};

export default ShopScreen; 