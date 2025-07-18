import React, { useEffect, useState } from 'react';
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
  const [currentIcon, setCurrentIcon] = useState(0);
  const [confetti, setConfetti] = useState([]);

  const icons = ['fa-dice-d20', 'fa-heart', 'fa-font'];
  const iconTexts = ['', '', '&'];

  useEffect(() => {
    // Анимация смены иконки в заголовке
    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 3000);

    return () => clearInterval(iconInterval);
  }, []);

  const createConfetti = (x, y) => {
    const colors = ['#FF9BD2', '#D63484', '#40A2D8', '#FFD700', '#F8F4EC'];
    const newConfetti = [];
    
    for (let i = 0; i < 20; i++) {
      const confettiPiece = {
        id: Date.now() + i,
        x: x,
        y: y,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        velocity: 5 + Math.random() * 5,
        rotation: Math.random() * 360,
        opacity: 1,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 5 + 2
      };
      newConfetti.push(confettiPiece);
    }
    
    setConfetti(prev => [...prev, ...newConfetti]);
    
    // Анимация конфетти
    const animateConfetti = () => {
      setConfetti(prev => 
        prev.map(piece => {
          if (newConfetti.includes(piece)) {
            return {
              ...piece,
              x: piece.x + piece.vx,
              y: piece.y + piece.vy,
              vy: piece.vy + 0.5, // гравитация
              opacity: piece.opacity - 0.02,
              rotation: piece.rotation + 5
            };
          }
          return piece;
        }).filter(piece => piece.opacity > 0)
      );
    };
    
    const interval = setInterval(animateConfetti, 30);
    
    // Останавливаем анимацию через 2 секунды
    setTimeout(() => {
      clearInterval(interval);
      setConfetti(prev => prev.filter(c => !newConfetti.includes(c)));
    }, 2000);
  };

  const handleMenuClick = (screenType, event) => {
    // Создаем эффект конфетти при клике
    if (event) {
      createConfetti(event.clientX, event.clientY);
    }
    
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
      gradient: 'linear-gradient(to right, #FF9BD2, #D63484)'
    },
    {
      id: SCREEN_TYPES.SHOP,
      icon: 'fas fa-store',
      text: 'Магазин',
      gradient: 'linear-gradient(to right, #40A2D8, #3A4F7A)'
    },
    {
      id: SCREEN_TYPES.COLLECTION,
      icon: 'fas fa-book-open',
      text: 'Коллекция',
      gradient: 'linear-gradient(to right, #9BD6E5, #5D9B9B)'
    },
    {
      id: SCREEN_TYPES.SETTINGS,
      icon: 'fas fa-cog',
      text: 'Настройки',
      gradient: 'linear-gradient(to right, #A0A0A0, #606060)'
    }
  ];

  return (
    <div className="main-menu">
      {/* Анимированный фон с кубиками */}
      <div className="animated-background">
        <div className="dice-bg dice-1"></div>
        <div className="dice-bg dice-2"></div>
        <div className="dice-bg dice-3"></div>
        <div className="dice-bg dice-4"></div>
        <div className="dice-bg dice-5"></div>
      </div>

      {/* Эффект дождя */}
      <div className="rain-container">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="raindrop"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${0.5 + Math.random() * 1.5}s`,
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: Math.random() * 0.3 + 0.3,
              height: `${Math.random() * 10 + 10}px`
            }}
          />
        ))}
      </div>

      <div className="main-menu-container">
        {/* Валюты в верхней части */}
        <motion.div
          className="main-menu-currency"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="currency-gold">
            <i className="fas fa-coins"></i>
            <span>{gold.toLocaleString()}</span>
          </div>
          <div className="currency-gem">
            <i className="fas fa-gem"></i>
            <span>{gems.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Заголовок с анимированным кубиком */}
        <motion.div 
          className="main-menu-title-container"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <h1 className="main-menu-title">
            Love{' '}
            <span className="title-icon">
              {currentIcon === 2 ? (
                <span className="ampersand">&</span>
              ) : (
                <i className={`fas ${icons[currentIcon]} dice-roll`}></i>
              )}
            </span>{' '}
            Roll
          </h1>
          <p className="main-menu-subtitle">Ваша история зависит от броска кубика</p>
        </motion.div>
        
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
              <button
                className="menu-btn"
                style={{ background: item.gradient }}
                onClick={(e) => handleMenuClick(item.id, e)}
              >
                <i className={item.icon}></i>
                <span>{item.text}</span>
              </button>
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
      </div>

      {/* Конфетти */}
      <div className="confetti-container">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: piece.x,
              top: piece.y,
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              transform: `rotate(${piece.rotation}deg)`,
              opacity: piece.opacity
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MainMenu; 