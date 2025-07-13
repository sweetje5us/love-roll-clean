import React from 'react';
import { motion } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useDailyRewards } from '../../contexts/DailyRewardsContext';
import MenuButton from '../ui/MenuButton';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import './MainMenu.css';

const MainMenu = () => {
  const { navigateTo } = useScreen();
  const { gold, gems, addGold, addGems, resetCurrency } = useCurrency();
  const { addTestItems, clearInventory } = useInventory();
  const { resetProgress: resetDailyRewards } = useDailyRewards();

  const handleMenuClick = (screenType) => {
    if (screenType === SCREEN_TYPES.COLLECTION) {
      navigateTo(screenType, { activeTab: 'inventory' }, 'scale');
    } else {
      navigateTo(screenType, {}, 'scale');
    }
  };

  const menuItems = [
    {
      id: 'CHARACTER_SELECT',
      icon: 'fas fa-play',
      text: 'Начать игру',
      color: 'pink',
      hoverColor: 'pink'
    },
    {
      id: SCREEN_TYPES.SHOP,
      icon: 'fas fa-shopping-bag',
      text: 'Магазин',
      color: 'purple',
      hoverColor: 'purple'
    },
    {
      id: SCREEN_TYPES.COLLECTION,
      icon: 'fas fa-book-open',
      text: 'Коллекция',
      color: 'blue',
      hoverColor: 'blue'
    },
    {
      id: SCREEN_TYPES.SETTINGS,
      icon: 'fas fa-cog',
      text: 'Настройки',
      color: 'gray',
      hoverColor: 'gray'
    }
  ];

  return (
    <div className="main-menu">
      <div className="main-menu-container">
        {/* Валюты в верхней части */}
        <motion.div
          className="main-menu-currency"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <CurrencyDisplay 
            gold={gold} 
            gems={gems} 
            size="small" 
            showLabels={true}
            className="main-currency"
          />
        </motion.div>

        {/* Заголовок с анимацией */}
        <motion.h1 
          className="main-menu-title title-float"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          Love & Roll
        </motion.h1>
        
        {/* Меню */}
        <motion.div 
          className="main-menu-buttons"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          {menuItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
            >
              <MenuButton
                icon={item.icon}
                text={item.text}
                color={item.color}
                hoverColor={item.hoverColor}
                onClick={() => handleMenuClick(item.id)}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Кнопки для тестирования (скрыты) */}
        {false && (
        <motion.div 
          className="main-menu-test-buttons"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <button 
            className="test-btn add-gold"
            onClick={() => addGold(100)}
            title="Добавить 100 монет"
          >
            +100 🪙
          </button>
          <button 
            className="test-btn add-gems"
            onClick={() => addGems(10)}
            title="Добавить 10 самоцветов"
          >
            +10 💎
          </button>
          <button 
            className="test-btn add-items"
            onClick={addTestItems}
            title="Добавить тестовые предметы"
          >
            +📦
          </button>
          <button 
            className="test-btn clear-inventory"
            onClick={clearInventory}
            title="Очистить инвентарь"
          >
            🗑️
          </button>
          <button 
            className="test-btn reset-daily"
            onClick={resetDailyRewards}
            title="Сбросить ежедневные награды"
          >
            📅
          </button>
          <button 
            className="test-btn reset"
            onClick={resetCurrency}
            title="Сбросить валюту"
          >
            Сброс
          </button>
        </motion.div>
        )}
        
        {/* Дополнительные декоративные элементы */}
        <motion.div 
          className="main-menu-copyright"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          © 2023 Love & Roll Visual Novel
        </motion.div>
      </div>
    </div>
  );
};

export default MainMenu; 