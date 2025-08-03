/**
 * Оптимизации для Cordova приложений
 */

// Определяем, что приложение запущено в Cordova
const isCordova = () => {
  return typeof cordova !== 'undefined' || 
         document.URL.indexOf('http') === -1 && 
         document.URL.indexOf('https') === -1;
};

// Определяем мобильное устройство
const isMobileDevice = () => {
  return window.innerWidth < 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Оптимизации для Cordova
export const initializeCordovaOptimizations = () => {
  if (!isCordova() || !isMobileDevice()) return;

  console.log('Инициализация оптимизаций для Cordova');

  // Отключаем зум на мобильных устройствах
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.head.appendChild(meta);

  // Отключаем выделение текста
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());

  // Оптимизируем скроллинг
  document.body.style.webkitOverflowScrolling = 'touch';
  document.body.style.overflowScrolling = 'touch';

  // Отключаем нативные жесты браузера
  document.body.style.webkitTouchCallout = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.body.style.webkitTapHighlightColor = 'transparent';

  // Принудительное GPU ускорение
  document.body.style.transform = 'translateZ(0)';
  document.body.style.webkitTransform = 'translateZ(0)';
};

// Оптимизация загрузки изображений
export const optimizeImageLoading = () => {
  if (!isCordova() || !isMobileDevice()) return;

  // Предзагрузка критичных изображений
  const criticalImages = [
    '/sprites/characters/body/Female body.png',
    '/sprites/characters/body/Male body.png',
    '/sprites/episodes/locations/school/school_class.png',
    '/sprites/episodes/locations/mansion/mansion_outside.png'
  ];

  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Оптимизация памяти
export const optimizeMemory = () => {
  if (!isCordova() || !isMobileDevice()) return;

  // Очистка кэша изображений
  const clearImageCache = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.offsetParent) { // Если изображение не видимо
        img.src = '';
        img.removeAttribute('src');
      }
    });
  };

  // Очистка каждые 30 секунд
  setInterval(clearImageCache, 30000);
};

// Оптимизация производительности анимаций
export const optimizeAnimations = () => {
  if (!isCordova() || !isMobileDevice()) return;

  // Отключаем сложные CSS анимации
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      * {
        animation-duration: 0.2s !important;
        transition-duration: 0.2s !important;
      }
      
      .pet-avatar img,
      .character-avatar img {
        animation: none !important;
      }
      
      .fade-enter,
      .fade-exit {
        transition: opacity 0.15s ease-in-out !important;
      }
    }
  `;
  document.head.appendChild(style);
};

// Оптимизация сетевых запросов
export const optimizeNetworkRequests = () => {
  if (!isCordova() || !isMobileDevice()) return;

  // Кэширование fetch запросов
  const originalFetch = window.fetch;
  const cache = new Map();

  window.fetch = async (url, options = {}) => {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // Проверяем кэш для GET запросов
    if (options.method === 'GET' || !options.method) {
      if (cache.has(cacheKey)) {
        console.log(`Используем кэшированный запрос: ${url}`);
        return cache.get(cacheKey);
      }
    }

    try {
      const response = await originalFetch(url, options);
      
      // Кэшируем успешные GET запросы
      if (options.method === 'GET' || !options.method) {
        if (response.ok) {
          const clonedResponse = response.clone();
          cache.set(cacheKey, clonedResponse);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Ошибка fetch запроса:', error);
      throw error;
    }
  };
};

// Инициализация всех оптимизаций
export const initializeAllOptimizations = () => {
  if (!isCordova()) return;

  console.log('Применение оптимизаций для Cordova');

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeCordovaOptimizations();
      optimizeImageLoading();
      optimizeMemory();
      optimizeAnimations();
      optimizeNetworkRequests();
    });
  } else {
    initializeCordovaOptimizations();
    optimizeImageLoading();
    optimizeMemory();
    optimizeAnimations();
    optimizeNetworkRequests();
  }
};

// Экспортируем функции для использования в других модулях
export { isCordova, isMobileDevice }; 