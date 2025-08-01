// Утилиты для оптимизации Cordova версии

// Отключение логирования в продакшн версии
export const disableLogging = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENVIRONMENT === 'production') {
    // Отключаем console.log в продакшне
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    // Оставляем только ошибки
    // console.error = console.error;
    // console.warn = console.warn;
  }
};

// Оптимизация загрузки изображений для Cordova
export const preloadImages = (imageList) => {
  return Promise.all(
    imageList.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(src);
        img.src = src;
      });
    })
  );
};

// Оптимизация загрузки персонажей
export const preloadCharacterSprites = (character) => {
  const sprites = [];
  
  // Добавляем все слои персонажа
  if (character.appearance) {
    const { body, dress, hair, hairBehind, emotion, accessories } = character.appearance;
    
    if (body) sprites.push(`/sprites/characters/body/${body}`);
    if (dress) sprites.push(`/sprites/characters/dresses/${character.gender}/${dress}`);
    if (hair) sprites.push(`/sprites/characters/hairs/${character.gender}/${hair}`);
    if (hairBehind) sprites.push(`/sprites/characters/hair_behind/${character.gender}/${hairBehind}`);
    if (emotion) sprites.push(`/sprites/characters/emotion/${character.gender}/${emotion}`);
    if (accessories) sprites.push(`/sprites/characters/accessories/${character.gender}/${accessories}`);
  }
  
  return preloadImages(sprites);
};

// Проверка, запущено ли приложение в Cordova
export const isCordova = () => {
  return typeof cordova !== 'undefined' || 
         (typeof window !== 'undefined' && window.cordova) ||
         document.URL.indexOf('http') === -1 && document.URL.indexOf('https') === -1;
};

// Агрессивные оптимизации CSS для Cordova
export const optimizeCSSForCordova = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      /* Оптимизации для Cordova */
      * {
        /* Ускоряем рендеринг */
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-perspective: 1000;
        perspective: 1000;
      }
      
      /* Ускоряем анимации */
      .animate, .transition, [class*="animate"], [class*="transition"] {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        will-change: transform;
      }
      
      /* Оптимизация для экранов */
      .screen, [class*="screen"] {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        will-change: transform, opacity;
      }
      
      /* Ускоряем кнопки */
      button, .btn, [class*="btn"] {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-tap-highlight-color: transparent;
      }
      
      /* Оптимизация изображений */
      img {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      
      /* Ускоряем скролл */
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      /* Оптимизация для мини-игр */
      .minigame, [class*="minigame"] {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }
};

// Оптимизация WebView настроек
export const optimizeWebViewSettings = () => {
  if (typeof window !== 'undefined' && isCordova()) {
    // Отключаем некоторые браузерные функции для ускорения
    if (window.navigator && window.navigator.serviceWorker) {
      // Отключаем Service Worker в Cordova для ускорения
      window.navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    
    // Оптимизация для мобильных устройств
    if (window.devicePixelRatio > 1) {
      // Уменьшаем качество для ускорения на устройствах с высоким DPI
      document.documentElement.style.setProperty('--device-scale', '0.8');
    }
  }
};

// Оптимизация React Router для быстрого переключения экранов
export const optimizeReactRouter = () => {
  if (typeof window !== 'undefined' && isCordova()) {
    // Предзагружаем экраны для быстрого переключения
    const preloadScreens = () => {
      // Создаем скрытые элементы для предзагрузки
      const screens = ['main-menu', 'character-select', 'game-screen', 'settings'];
      screens.forEach(screen => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.top = '-9999px';
        div.style.visibility = 'hidden';
        div.id = `preload-${screen}`;
        document.body.appendChild(div);
      });
    };
    
    // Запускаем предзагрузку после загрузки страницы
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', preloadScreens);
    } else {
      preloadScreens();
    }
  }
};

// Оптимизация анимаций для Cordova
export const optimizeAnimations = () => {
  if (typeof document !== 'undefined' && isCordova()) {
    // Уменьшаем длительность анимаций для ускорения
    const style = document.createElement('style');
    style.textContent = `
      /* Ускоренные анимации для Cordova */
      * {
        transition-duration: 0.15s !important;
        animation-duration: 0.15s !important;
      }
      
      /* Убираем сложные анимации */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      
      /* Упрощенные анимации */
      .fade-in {
        animation: fadeIn 0.1s ease-out;
      }
      
      .slide-in {
        animation: slideIn 0.1s ease-out;
      }
    `;
    document.head.appendChild(style);
  }
};

// Оптимизация памяти для Cordova
export const optimizeMemory = () => {
  if (typeof window !== 'undefined' && isCordova()) {
    // Очистка памяти каждые 30 секунд
    setInterval(() => {
      if (window.gc) {
        window.gc();
      }
    }, 30000);
    
    // Оптимизация для слабых устройств
    const isLowEndDevice = () => {
      return navigator.hardwareConcurrency <= 4 || 
             navigator.deviceMemory <= 4 ||
             screen.width <= 720;
    };
    
    if (isLowEndDevice()) {
      // Дополнительные оптимизации для слабых устройств
      document.documentElement.style.setProperty('--animation-duration', '0.05s');
      document.documentElement.style.setProperty('--transition-duration', '0.05s');
    }
  }
};

// Инициализация всех оптимизаций для Cordova
export const initializeCordovaOptimizations = () => {
  if (isCordova()) {
    console.log('Cordova оптимизации включены');
    
    // Применяем все оптимизации
    disableLogging();
    optimizeCSSForCordova();
    optimizeWebViewSettings();
    optimizeReactRouter();
    optimizeAnimations();
    optimizeMemory();
    
    // Дополнительные оптимизации для мобильных устройств
    if (typeof window !== 'undefined') {
      // Отключаем некоторые анимации для лучшей производительности
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      
      // Оптимизация для тач-устройств
      document.documentElement.style.setProperty('--touch-action', 'manipulation');
      
      // Ускоряем рендеринг
      document.documentElement.style.setProperty('--will-change', 'transform');
    }
  }
}; 