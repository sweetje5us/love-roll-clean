// Утилиты для оптимизации Cordova версии

// Система адаптации под частоту обновления экрана
let detectedRefreshRate = 60; // По умолчанию
let frameTimeAverage = 16.67; // 1000/60
let lastFrameTime = 0;
let frameCount = 0;
let totalFrameTime = 0;

// Определение частоты обновления экрана
export const detectRefreshRate = () => {
  return new Promise((resolve) => {
    console.log('🎯 Начинаю определение частоты экрана...');
    
    let samples = 0;
    let frameTimes = [];
    let localLastFrameTime = 0;
    
    const measureFrame = (currentTime) => {
      if (localLastFrameTime > 0) {
        const deltaTime = currentTime - localLastFrameTime;
        if (deltaTime > 0 && deltaTime < 100) { // Исключаем аномальные значения
          frameTimes.push(deltaTime);
          samples++;
        }
      }
      
      localLastFrameTime = currentTime;
      
      if (samples < 30) { // Уменьшил до 30 образцов для быстрее результата
        requestAnimationFrame(measureFrame);
      } else {
        // Вычисляем среднее время кадра
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        frameTimeAverage = avgFrameTime;
        detectedRefreshRate = Math.round(1000 / avgFrameTime);
        
        console.log(`🎯 Сырые данные: среднее время кадра ${avgFrameTime.toFixed(2)}ms, частота ${detectedRefreshRate}Hz`);
        
        // Ограничиваем стандартными значениями
        if (detectedRefreshRate >= 115) detectedRefreshRate = 120;
        else if (detectedRefreshRate >= 85) detectedRefreshRate = 90;
        else detectedRefreshRate = 60;
        
        frameTimeAverage = 1000 / detectedRefreshRate;
        
        console.log(`🎯 Обнаружена частота: ${detectedRefreshRate} Hz (${frameTimeAverage.toFixed(2)}ms/кадр)`);
        resolve(detectedRefreshRate);
      }
    };
    
    requestAnimationFrame(measureFrame);
  });
};

// Получение нормализованного множителя времени для анимаций
export const getTimeMultiplier = () => {
  // Возвращаем 1.0 для нативной частоты экрана вместо нормализации к 60 FPS
  return 1.0;
};

// Получение реального времени кадра для игр
export const getRealFrameTime = () => {
  return frameTimeAverage;
};

// Получение текущей частоты экрана
export const getCurrentRefreshRate = () => {
  return detectedRefreshRate;
};

// Получение адаптированной длительности анимации
export const getAdaptedDuration = (baseDuration) => {
  const multiplier = getTimeMultiplier();
  console.log(`🎯 Адаптация длительности: ${baseDuration}s * ${multiplier.toFixed(2)} = ${(baseDuration * multiplier).toFixed(3)}s`);
  return baseDuration * multiplier;
};

// Получение адаптированного интервала
export const getAdaptedInterval = (baseInterval) => {
  const multiplier = getTimeMultiplier();
  const result = Math.max(1, Math.round(baseInterval * multiplier));
  console.log(`🎯 Адаптация интервала: ${baseInterval}ms * ${multiplier.toFixed(2)} = ${result}ms`);
  return result;
};

// Утилиты для игровых циклов с delta time
let lastGameFrameTime = 0;

// Создание адаптивного игрового цикла
export const createAdaptiveGameLoop = (gameLogic) => {
  let animationFrame;
  let isRunning = false;
  let localLastFrameTime = 0;
  
  const loop = (currentTime) => {
    if (!isRunning) return;
    
    // Вычисляем delta time (время с прошлого кадра в миллисекундах)
    const deltaTime = localLastFrameTime ? currentTime - localLastFrameTime : 16.67;
    
    localLastFrameTime = currentTime;
    
    // Передаём deltaTime в миллисекундах (без нормализации!)
    gameLogic(deltaTime);
    
    animationFrame = requestAnimationFrame(loop);
  };
  
  return {
    start: () => {
      if (!isRunning) {
        isRunning = true;
        localLastFrameTime = 0;
        console.log(`🎯 Запуск нативного игрового цикла (без ограничений)`);
        animationFrame = requestAnimationFrame(loop);
      }
    },
    stop: () => {
      isRunning = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }
  };
};

// Адаптивная скорость движения для игр
export const getAdaptiveSpeed = (baseSpeed) => {
  // При использовании delta time, базовая скорость должна оставаться неизменной
  // так как deltaMultiplier уже учитывает частоту кадров
  return baseSpeed;
};

// Отключение избыточного логирования для производительности
export const disableLogging = () => {
  if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENVIRONMENT === 'production') {
    // АГРЕССИВНОЕ отключение логов в продакшне для производительности
    const originalLog = console.log;
    const originalInfo = console.info;
    
    console.log = (...args) => {
      // Оставляем только критические системные логи
      const argString = args.join(' ');
      if (argString.includes('ОШИБКА') || argString.includes('ERROR') || argString.includes('🚨')) {
        originalLog(...args);
      }
      // ВСЕ остальные логи отключаем для производительности
    };
    
    console.info = (...args) => {
      // Отключаем все INFO логи в продакшне
    };
    
    console.debug = () => {};
    
    // Оставляем только ошибки и предупреждения
    // console.error остается как есть
    // console.warn остается как есть
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

// Оптимизация анимаций для Cordova с адаптацией под частоту экрана
export const optimizeAnimations = async () => {
  if (typeof document !== 'undefined' && isCordova()) {
    // Определяем частоту обновления, если ещё не определена
    if (detectedRefreshRate === 60 && frameTimeAverage === 16.67) {
      await detectRefreshRate();
    }
    
    // Адаптивные длительности анимаций
    const baseTransition = getAdaptedDuration(0.15);
    const baseAnimation = getAdaptedDuration(0.15);
    const fastFadeIn = getAdaptedDuration(0.1);
    const fastSlideIn = getAdaptedDuration(0.1);
    
    const style = document.createElement('style');
    style.textContent = `
      /* Адаптивные анимации для Cordova (${detectedRefreshRate}Hz) */
      :root {
        --refresh-rate: ${detectedRefreshRate};
        --frame-time: ${frameTimeAverage}ms;
        --time-multiplier: ${getTimeMultiplier()};
        --base-transition: ${baseTransition}s;
        --base-animation: ${baseAnimation}s;
        --fast-transition: ${fastFadeIn}s;
        --slide-animation: ${fastSlideIn}s;
      }
      
      *:not(.pet-minigame-modal-overlay):not(.pet-minigame-modal-overlay *) {
        transition-duration: var(--base-transition) !important;
        animation-duration: var(--base-animation) !important;
      }
      
      /* Оптимизированные keyframes */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      
      /* Упрощенные анимации с адаптивным временем */
      .fade-in {
        animation: fadeIn var(--fast-transition) ease-out;
      }
      
      .slide-in {
        animation: slideIn var(--slide-animation) ease-out;
      }
    `;
    document.head.appendChild(style);
    
    console.log(`🎨 Анимации адаптированы под ${detectedRefreshRate}Hz (множитель: ${getTimeMultiplier().toFixed(2)}x)`);
  }
};

// Оптимизация памяти для Cordova с адаптивными интервалами
export const optimizeMemory = () => {
  if (typeof window !== 'undefined' && isCordova()) {
    // Адаптивная очистка памяти (базовый интервал 30 секунд)
    const gcInterval = getAdaptedInterval(30000);
    setInterval(() => {
      if (window.gc) {
        window.gc();
      }
    }, gcInterval);
    
    // Оптимизация для слабых устройств
    const isLowEndDevice = () => {
      return navigator.hardwareConcurrency <= 4 || 
             navigator.deviceMemory <= 4 ||
             screen.width <= 720;
    };
    
    if (isLowEndDevice()) {
      // Дополнительные оптимизации для слабых устройств
      const ultraFastAnimation = getAdaptedDuration(0.05);
      document.documentElement.style.setProperty('--base-animation', `${ultraFastAnimation}s`);
      document.documentElement.style.setProperty('--base-transition', `${ultraFastAnimation}s`);
      
      console.log(`⚡ Режим слабого устройства: анимации ${ultraFastAnimation.toFixed(3)}s`);
    }
  }
};

// Инициализация всех оптимизаций для Cordova с адаптацией под частоту экрана
// Функция для автоматического применения анти-мерцательного режима
export const applyAntiFlickerMode = () => {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth <= 768;
  const isLowEndDevice = () => {
    return navigator.hardwareConcurrency <= 4 || 
           navigator.deviceMemory <= 4 ||
           screen.width <= 720;
  };
  
  // Применяем анти-мерцательный режим на мобильных или слабых устройствах
  if (isMobile || isLowEndDevice()) {
    console.log('🚫 Включен анти-мерцательный режим для предотвращения белого мерцания');
    
    // Добавляем класс для отключения проблематичных анимаций
    if (document.body) {
      document.body.classList.add('no-flicker-animations');
    }
    
    // Дополнительные CSS правила для предотвращения мерцания
    const antiFlickerStyle = document.createElement('style');
    antiFlickerStyle.textContent = `
      /* Экстренные правила против мерцания */
      body.no-flicker-animations .game-main-area {
        transition: none !important;
      }
      
      body.no-flicker-animations .dialogue-box {
        transition: none !important;
        backdrop-filter: none !important;
      }
      
      body.no-flicker-animations .choices-container {
        backdrop-filter: none !important;
      }
      
      body.no-flicker-animations .game-top-panel {
        backdrop-filter: none !important;
      }
      
      /* Убираем transform которые могут вызывать мерцание */
      body.no-flicker-animations * {
        -webkit-transform: none !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(antiFlickerStyle);
  }
};

export const initializeCordovaOptimizations = async () => {
  console.log('🚀 Инициализация Cordova оптимизаций...');
  
  // ПРОВЕРКА: Если это веб-браузер (http/https), НЕ применяем НИКАКИХ оптимизаций!
  const isWebBrowser = document.URL.indexOf('http') !== -1 || document.URL.indexOf('https') !== -1;
  
  if (isWebBrowser) {
    console.log('🌐 Веб-браузер обнаружен - Cordova оптимизации ОТКЛЮЧЕНЫ для максимальной производительности!');
    // Только определяем частоту экрана для совместимости, но НЕ применяем оптимизации
    try {
      await detectRefreshRate();
      console.log(`🎯 Частота экрана: ${detectedRefreshRate}Hz (БЕЗ оптимизаций)`);
    } catch (error) {
      console.warn('⚠️ Ошибка определения частоты экрана:', error);
      detectedRefreshRate = 60;
      frameTimeAverage = 16.67;
    }
    return; // ВЫХОДИМ БЕЗ ПРИМЕНЕНИЯ ОПТИМИЗАЦИЙ!
  }
  
  // Сначала определяем частоту обновления экрана (независимо от Cordova)
  try {
    await detectRefreshRate();
    console.log(`🎯 Частота экрана определена: ${detectedRefreshRate}Hz`);
  } catch (error) {
    console.warn('⚠️ Ошибка определения частоты экрана, использую 60Hz по умолчанию:', error);
    detectedRefreshRate = 60;
    frameTimeAverage = 16.67;
  }
  
  if (isCordova()) {
    console.log('📱 Применяю базовые оптимизации для Cordova...');
    
    // ОТКЛЮЧАЕМ проблематичные CSS оптимизации которые вызывают мерцание
    // optimizeCSSForCordova(); // ОТКЛЮЧЕНО - вызывает белое мерцание
    optimizeWebViewSettings();
    optimizeReactRouter();
    // await optimizeAnimations(); // ОТКЛЮЧЕНО - конфликтует с анимациями сцен
    optimizeMemory();
    
    // СБАЛАНСИРОВАННЫЕ ОПТИМИЗАЦИИ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
    if (typeof window !== 'undefined') {
      // Базовая оптимизация тач-устройств  
      document.documentElement.style.setProperty('--touch-action', 'manipulation');
      document.body.style.touchAction = 'manipulation';
      
      // Убираем выделение текста для предотвращения мерцания
      document.documentElement.style.setProperty('-webkit-user-select', 'none');
      document.documentElement.style.setProperty('-moz-user-select', 'none');
      document.documentElement.style.setProperty('-ms-user-select', 'none');
      document.documentElement.style.setProperty('user-select', 'none');
      
      // Убираем highlight на тап
      document.documentElement.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      
      // Автоматическое включение анти-мерцательного режима на проблематичных устройствах
      applyAntiFlickerMode();
      
      console.log('✅ Базовые оптимизации применены без перегрузки GPU');
    }
    
    console.log(`✅ Базовые Cordova оптимизации применены (без мерцающих эффектов)`);
    
    // Отключаем лишние логи ПОСЛЕ инициализации
    disableLogging();
  } else {
    console.log('🌐 Работаем в браузере, оптимизации под частоту экрана активированы');
  }
};

// Функция для ручного включения анти-мерцательного режима
export const enableAntiFlickerMode = () => {
  console.log('🚫 Ручное включение анти-мерцательного режима');
  
  if (typeof window !== 'undefined' && document.body) {
    document.body.classList.add('no-flicker-animations');
    
    // Убираем проблематичные CSS свойства
    const style = document.createElement('style');
    style.id = 'manual-anti-flicker';
    style.textContent = `
      /* Ручной анти-мерцательный режим */
      body.no-flicker-animations * {
        transition: none !important;
        animation: none !important;
        backdrop-filter: none !important;
        -webkit-transform: none !important;
        transform: none !important;
      }
    `;
    
    // Удаляем старый стиль если есть
    const existingStyle = document.getElementById('manual-anti-flicker');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }
};

// Функция для ручного отключения анти-мерцательного режима
export const disableAntiFlickerMode = () => {
  console.log('✅ Отключение анти-мерцательного режима');
  
  if (typeof window !== 'undefined' && document.body) {
    document.body.classList.remove('no-flicker-animations');
    
    // Удаляем ручной стиль
    const manualStyle = document.getElementById('manual-anti-flicker');
    if (manualStyle) {
      manualStyle.remove();
    }
  }
};

// Функция для полного отключения loading экранов
export const disableAllLoadingScreens = () => {
  console.log('🚫 Отключение всех loading экранов для устранения белого мерцания');
  
  if (typeof window !== 'undefined') {
    const style = document.createElement('style');
    style.id = 'disable-loading-screens';
    style.textContent = `
      /* Полное отключение loading экранов */
      .game-screen.loading {
        display: none !important;
      }
      
      .loading, .elegant-loading {
        display: none !important;
      }
      
      /* Скрываем loading dots */
      .loading-dots {
        display: none !important;
      }
    `;
    
    // Удаляем старый стиль если есть
    const existingStyle = document.getElementById('disable-loading-screens');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
  }
}; 