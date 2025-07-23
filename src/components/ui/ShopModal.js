import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useDailyRewards } from '../../contexts/DailyRewardsContext';
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
import './ShopModal.css';

const ShopModal = ({ isOpen, onClose }) => {
  const { gold, gems, removeGold, addGold, addGems, removeGems, hasEnoughGold, hasEnoughGems } = useCurrency();
  const { addItem, removeItem, getAllItems: getInventoryData, addAllConsumables, addAllMaterials, addAllClothing, addAllPets, addAllChestsAndKeys } = useInventory();
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
  const [currentDiscountIndex, setCurrentDiscountIndex] = useState(0);
  
  // Проверяем, есть ли предметы, которые не найдены в данных
  const missingItems = Object.keys(inventoryData).filter(itemId => !getItemById(itemId));
  if (missingItems.length > 0) {
    console.warn('ShopModal - Предметы не найдены в данных:', missingItems);
  }
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySort, setInventorySort] = useState('name');

  // Фильтрация товаров по категории
  const filteredItems = activeCategory === 'all' 
    ? allShopItems 
    : getItemsByType(activeCategory, inventoryData);

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

  // Обработчики для сундуков
  const handleChestClick = (chestItem) => {
    setChestModal({
      isOpen: true,
      chestItem
    });
  };

  const handleChestClose = () => {
    setChestModal({
      isOpen: false,
      chestItem: null
    });
  };

  const handleChestOpen = (itemId, quantity = 1) => {
    // Добавляем предмет в инвентарь
    addItem(itemId, quantity);
  };

  const handleChestRemoveItem = (itemId) => {
    // Удаляем предмет из инвентаря
    removeItem(itemId, 1);
  };

  // Автоматическое переключение скидочных предложений
  React.useEffect(() => {
    if (discountItems.length > 1) {
      const interval = setInterval(() => {
        setCurrentDiscountIndex((prev) => (prev + 1) % discountItems.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [discountItems.length]);

  return (
    <AnimatePresence key="shop-main">
      {isOpen && (
        <motion.div
          key="shop-modal"
          className="shop-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="shop-modal-content"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок и кнопка закрытия */}
            <div className="shop-modal-header">
              <h2 className="shop-modal-title">Магазин</h2>
              <button className="shop-modal-close" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Валюта */}
            <div className="shop-modal-currency">
              <div className="currency-item">
                <span className="currency-icon gold-icon"></span>
                <span className="gold-amount">{gold}</span>
              </div>
              <div className="currency-item">
                <span className="currency-icon gem-icon"></span>
                <span className="gem-amount">{gems}</span>
              </div>
            </div>

            {/* Информация о ротации */}
            <div className="shop-modal-rotation">
              <span className="rotation-text">
                Обновление через {rotationInfo.daysUntilRotation} дн.
              </span>
            </div>

            {/* Вкладки */}
            <div className="shop-modal-tabs">
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
                className="shop-modal-tab-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Категории товаров */}
                <div className="shop-modal-categories">
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
                  <div className="shop-modal-discounts">
                    <h3>🔥 Скидки сегодня</h3>
                    <div className="discount-carousel">
                      {discountItems.map((item, index) => (
                        <div
                          key={`discount-${item.id}-${index}`}
                          className={`discount-item ${index === currentDiscountIndex ? 'active' : ''}`}
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Сетка товаров */}
                <div className="shop-modal-items">
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
                className="shop-modal-tab-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="shop-modal-inventory-header">
                  <h3>Ваш инвентарь</h3>
                  <div className="inventory-stats">
                    Предметов: {inventoryStats.totalItems} | Уникальных: {inventoryStats.uniqueItems}
                  </div>
                  <div className="test-buttons-container">
                    <button 
                      className="test-btn consumables-btn"
                      onClick={() => {
                        addAllConsumables();
                        alert('Все расходники добавлены!');
                      }}
                    >
                      <i className="fas fa-flask"></i>
                      Добавить расходники
                    </button>
                    <button 
                      className="test-btn materials-btn"
                      onClick={() => {
                        addAllMaterials();
                        alert('Все материалы добавлены!');
                      }}
                    >
                      <i className="fas fa-hammer"></i>
                      Добавить материалы
                    </button>
                    <button 
                      className="test-btn clothing-btn"
                      onClick={() => {
                        addAllClothing();
                        alert('Вся одежда добавлена!');
                      }}
                    >
                      <i className="fas fa-tshirt"></i>
                      Добавить одежду
                    </button>
                    <button 
                      className="test-btn pets-btn"
                      onClick={() => {
                        addAllPets();
                        alert('Все питомцы добавлены!');
                      }}
                    >
                      <i className="fas fa-paw"></i>
                      Добавить питомцев
                    </button>
                    <button 
                      className="test-btn chests-btn"
                      onClick={() => {
                        addAllChestsAndKeys();
                        alert('Все сундуки и ключи добавлены!');
                      }}
                    >
                      <i className="fas fa-treasure-chest"></i>
                      Добавить сундуки
                    </button>
                  </div>
                </div>

                {/* Фильтры инвентаря */}
                <div className="shop-modal-inventory-filters">
                  <select 
                    value={inventoryFilter} 
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    className="inventory-filter"
                  >
                    <option value="all">Все предметы</option>
                    <option value="consumable">Расходники</option>
                    <option value="gift">Подарки</option>
                    <option value="clothing">Одежда</option>
                    <option value="pet">Питомцы</option>
                    <option value="chest">Сундуки</option>
                  </select>
                  
                  <select 
                    value={inventorySort} 
                    onChange={(e) => setInventorySort(e.target.value)}
                    className="inventory-sort"
                  >
                    <option value="name">По названию</option>
                    <option value="type">По типу</option>
                    <option value="rarity">По редкости</option>
                    <option value="quantity">По количеству</option>
                  </select>
                </div>

                {inventoryItems.length > 0 ? (
                  <div className="shop-modal-items">
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
                  <div className="shop-modal-empty-inventory">
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
                className="shop-modal-tab-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Ежедневные награды */}
                <div className="shop-modal-topup-section">
                  <h3><i className="fas fa-calendar-check"></i> Ежедневные награды</h3>
                  <div className="daily-rewards-container">
                    <div className="daily-rewards-header">
                      <div className="streak-info">
                        <span className="streak-count">{dailyRewards.currentStreak}</span>
                        <span className="streak-label">дней подряд</span>
                      </div>
                      <div className="today-reward">
                        <h4>Награда за сегодня</h4>
                        <div className="reward-preview">
                          {(() => {
                            const todayReward = getTodayReward();
                            return (
                              <div className="reward-item-preview">
                                <i className={todayReward.icon}></i>
                                <span>{todayReward.name || `${todayReward.amount} ${todayReward.type === 'coins' ? 'монет' : todayReward.type === 'gems' ? 'самоцветов' : ''}`}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="weekly-rewards">
                      <h4>Награды недели</h4>
                      <div className="rewards-grid">
                        {getWeekRewards().map((dayReward) => (
                          <div 
                            key={dayReward.day} 
                            className={`day-reward ${dayReward.isClaimed ? 'claimed' : ''} ${dayReward.isToday ? 'today' : ''}`}
                          >
                            <div className="day-number">{dayReward.day}</div>
                            <div className="reward-icon">
                              <i className={dayReward.reward.icon}></i>
                            </div>
                            <div className="reward-amount">
                              {dayReward.reward.name || `${dayReward.reward.amount} ${dayReward.reward.type === 'coins' ? '🪙' : dayReward.reward.type === 'gems' ? '💎' : ''}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      className={`claim-reward-btn ${canClaimToday() ? 'available' : 'claimed'}`}
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
                </div>

                <div className="shop-modal-topup-section">
                  <h3><i className="fas fa-ad"></i> Награда за рекламу</h3>
                  <div className="ad-reward">
                    <div className="ad-info">
                      <h4>Просмотр рекламы</h4>
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

                <div className="shop-modal-topup-section">
                  <h3><i className="fas fa-credit-card"></i> Пополнение баланса</h3>
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
                        <h4>{pkg.gold ? `${pkg.gold} золота` : `${pkg.gems} самоцветов`}</h4>
                        <p>+{pkg.bonus} бонус</p>
                        <button className="package-btn">{pkg.price}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}

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
      <AnimatePresence key="quantity-modal">
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
    </AnimatePresence>
  );
};

export default ShopModal;