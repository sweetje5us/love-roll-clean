import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../contexts/ScreenContext';
import MainMenu from './screens/MainMenu';
import GameScreen from './screens/GameScreen';
import ShopScreen from './screens/ShopScreen';
import CollectionScreen from './screens/CollectionScreen';
import CharacterCreatorScreen from './screens/CharacterCreatorScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoadingScreen from './screens/LoadingScreen';
import CharacterSelectScreen from './screens/CharacterSelectScreen';
import EpisodeSelectScreen from './screens/EpisodeSelectScreen';
import EpisodeEditorScreen from './screens/EpisodeEditorScreen';

const ScreenManager = () => {
  const { currentScreen, transitionType, isLoading, getNavigationParams, goBack } = useScreen();
  const [isMobile, setIsMobile] = useState(false);

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Оптимизированные анимации для мобильных устройств
  const transitions = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { 
        duration: isMobile ? 0.15 : 0.3,
        ease: 'easeInOut'
      }
    },
    slide: {
      initial: { x: isMobile ? '50%' : '100%' },
      animate: { x: 0 },
      exit: { x: isMobile ? '-50%' : '-100%' },
      transition: { 
        duration: isMobile ? 0.2 : 0.4, 
        ease: 'easeInOut',
        type: 'tween'
      }
    },
    scale: {
      initial: { scale: isMobile ? 0.95 : 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: isMobile ? 1.05 : 1.2, opacity: 0 },
      transition: { 
        duration: isMobile ? 0.15 : 0.3,
        ease: 'easeInOut'
      }
    }
  };

  // Функция для получения компонента экрана
  const getScreenComponent = (screenType) => {
    const navigationParams = getNavigationParams();
    
    switch (screenType) {
      case SCREEN_TYPES.MAIN_MENU:
        return <MainMenu />;
      case SCREEN_TYPES.GAME:
        return <GameScreen />;
      case SCREEN_TYPES.SHOP:
        return <ShopScreen />;
      case SCREEN_TYPES.COLLECTION:
        return <CollectionScreen />;
      case SCREEN_TYPES.CHARACTER_CREATOR:
        return <CharacterCreatorScreen />;
      case SCREEN_TYPES.CHARACTER_SELECT:
        return <CharacterSelectScreen />;
      case SCREEN_TYPES.EPISODE_SELECT:
        return (
          <EpisodeSelectScreen 
            onBack={goBack}
            onEpisodeSelect={(episodeId) => {
              console.log('Выбран эпизод:', episodeId);
              // Здесь можно добавить логику запуска эпизода
            }}
          />
        );
      case SCREEN_TYPES.EPISODE_EDITOR:
        return <EpisodeEditorScreen />;
      case SCREEN_TYPES.SETTINGS:
        return <SettingsScreen />;
      case SCREEN_TYPES.LOADING:
        return <LoadingScreen />;
      default:
        return <MainMenu />;
    }
  };

  // Получаем текущую анимацию
  const currentTransition = transitions[transitionType] || transitions.fade;

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Для мобильных устройств используем упрощенные переходы
  if (isMobile) {
    return (
      <div className="screen-manager">
        <div className="screen-container">
          {getScreenComponent(currentScreen)}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-manager">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          className="screen-container"
          {...currentTransition}
        >
          {getScreenComponent(currentScreen)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ScreenManager; 