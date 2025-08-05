// Утилиты для мобильной оптимизации производительности

// Определение мобильного устройства
export const isMobileDevice = typeof window !== 'undefined' && (
  window.innerWidth < 700 || 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
);

// Определение слабого устройства
export const isWeakDevice = () => {
  if (typeof navigator === 'undefined') return false;
  
  // Проверяем количество ядер CPU
  const cores = navigator.hardwareConcurrency || 1;
  
  // Проверяем доступную память (если доступно)
  const memory = navigator.deviceMemory || 4;
  
  // Проверяем размер экрана (маленькие экраны часто означают слабые устройства)
  const screenSize = window.innerWidth * window.innerHeight;
  
  return cores <= 2 || memory <= 2 || screenSize < 300000; // 300k пикселей
};

// Настройки производительности для разных типов устройств
export const getPerformanceSettings = () => {
  if (isWeakDevice()) {
    return {
      renderInterval: 2, // каждые 2 кадра (30 обновлений/сек при 60 FPS)
      maxDeltaTime: 33, // максимум 33ms (30 FPS)
      animationThrottle: 1, // без пропуска кадров анимации для плавности
      enableHardwareAcceleration: true, // включаем для всех устройств
    };
  } else if (isMobileDevice) {
    return {
      renderInterval: 1, // каждый кадр (60 обновлений/сек при 60 FPS)
      maxDeltaTime: 33, // максимум 33ms (30 FPS)
      animationThrottle: 1, // без пропуска кадров анимации для плавности
      enableHardwareAcceleration: true,
      // Дополнительные настройки для мобильных устройств
      enableContainment: true, // включаем CSS containment
      enableImageOptimization: true, // оптимизация изображений
    };
  } else {
    return {
      renderInterval: 1, // каждый кадр (60 обновлений/сек при 60 FPS)
      maxDeltaTime: 50, // максимум 50ms (20 FPS)
      animationThrottle: 1, // без пропуска кадров
      enableHardwareAcceleration: true,
    };
  }
};

// Применение мобильных оптимизаций к элементу
export const applyMobileOptimizations = (element) => {
  if (!element || !isMobileDevice) return;
  
  const settings = getPerformanceSettings();
  
  if (settings.enableHardwareAcceleration) {
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  }
  
  if (settings.enableContainment) {
    element.style.contain = 'layout style paint';
    element.style.containIntrinsicSize = 'auto';
  }
  
  if (settings.enableImageOptimization) {
    element.style.imageRendering = 'optimizeSpeed';
    element.style.imageRendering = '-webkit-optimize-contrast';
    element.style.imageRendering = 'crisp-edges';
  }
  
  // Отключаем touch события для лучшей производительности
  element.style.touchAction = 'none';
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
};

// Оптимизация игрового цикла
export const createOptimizedGameLoop = (callback, settings = null) => {
  const performanceSettings = settings || getPerformanceSettings();
  let frameCount = 0;
  let animationFrameCount = 0;
  let lastTime = performance.now();
  
  const loop = (currentTime) => {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Ограничиваем deltaTime
    const clampedDeltaTime = Math.min(deltaTime, performanceSettings.maxDeltaTime);
    const deltaTimeSeconds = clampedDeltaTime / 1000;
    
    // Вызываем callback с оптимизированными параметрами
    callback(deltaTimeSeconds, frameCount, animationFrameCount);
    
    // Обновляем счетчики
    frameCount++;
    animationFrameCount++;
    
    // Ограничиваем частоту обновления
    if (frameCount % performanceSettings.renderInterval === 0) {
      // Здесь можно вызвать React re-render
    }
    
    return requestAnimationFrame(loop);
  };
  
  return loop;
};

// Оптимизация изображений для мобильных устройств
export const optimizeImageForMobile = (imgElement) => {
  if (!imgElement || !isMobileDevice) return;
  
  // Применяем CSS оптимизации
  imgElement.style.imageRendering = 'optimizeSpeed';
  imgElement.style.imageRendering = '-webkit-optimize-contrast';
  imgElement.style.imageRendering = 'crisp-edges';
  
  // Принудительное включение hardware acceleration
  imgElement.style.transform = 'translateZ(0)';
  imgElement.style.backfaceVisibility = 'hidden';
  imgElement.style.willChange = 'transform';
};

// Оптимизация событий для мобильных устройств
export const optimizeTouchEvents = (element) => {
  if (!element || !isMobileDevice) return;
  
  // Отключаем ненужные события
  element.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  element.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });
  
  // Оптимизируем scroll события
  element.addEventListener('scroll', (e) => {
    e.preventDefault();
  }, { passive: false });
};

// Мониторинг производительности
export const createPerformanceMonitor = () => {
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  
  const updateFPS = () => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime > 0) {
      fps = Math.round(1000 / deltaTime);
    }
    
    lastTime = currentTime;
    frameCount++;
    
    // Логируем FPS каждые 60 кадров
    if (frameCount % 60 === 0) {
      console.log(`FPS: ${fps}`);
    }
  };
  
  return {
    updateFPS,
    getFPS: () => fps,
    getFrameCount: () => frameCount,
  };
};

// Оптимизация для слабых устройств
export const applyWeakDeviceOptimizations = () => {
  if (!isWeakDevice()) return;
  
  // Применяем только базовые оптимизации без изменения масштаба
  const style = document.createElement('style');
  style.textContent = `
    .flappybird-game,
    .doodlejump-game,
    .crossyroad-game,
    .zuma-game {
      will-change: transform;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
  `;
  document.head.appendChild(style);
};

// Автоматическое применение оптимизаций при загрузке
export const autoApplyOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Применяем оптимизации для слабых устройств
  applyWeakDeviceOptimizations();
  
  // Оптимизируем все игровые элементы
  const gameElements = document.querySelectorAll('.flappybird-game, .doodlejump-game, .crossyroad-game, .zuma-game');
  gameElements.forEach(applyMobileOptimizations);
  
  // Оптимизируем все изображения в играх
  const gameImages = document.querySelectorAll('.flappybird-game img, .doodlejump-game img, .crossyroad-game img, .zuma-game img');
  gameImages.forEach(optimizeImageForMobile);
};

// Функция для очистки памяти в играх
export const cleanupGameMemory = (refs, objects) => {
  if (!isMobileDevice) return;
  
  // Очищаем неиспользуемые refs
  Object.keys(refs).forEach(key => {
    if (!objects[parseInt(key)]) {
      delete refs[key];
    }
  });
  
  // Принудительная сборка мусора (если доступно)
  if (window.gc) {
    window.gc();
  }
};

// Экспорт настроек по умолчанию
export const MOBILE_SETTINGS = getPerformanceSettings(); 