// Утилиты для оптимизации производительности React приложения

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Хук для предотвращения лишних re-render'ов
export const useStableCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback((...args) => callbackRef.current(...args), []);
};

// Хук для оптимизированного состояния с debounce
export const useDebouncedState = (initialValue, delay = 100) => {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef();
  
  const debouncedSetValue = useCallback((newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setValue(newValue);
    }, delay);
  }, [delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return [value, debouncedSetValue];
};

// Хук для оптимизированной анимации текста
export const useOptimizedTextAnimation = (text, speed = 80) => {
  const [currentText, setCurrentText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef();
  
  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsAnimating(true);
    setCurrentText('');
    
    let currentIndex = 0;
    let lastTime = performance.now();
    const charInterval = 1000 / speed;
    let accumulatedTime = 0;
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedTime += deltaTime;
      
      // Добавляем символы пакетами для лучшей производительности
      const charsToAdd = Math.floor(accumulatedTime / charInterval);
      
      if (charsToAdd > 0 && currentIndex < text.length) {
        accumulatedTime -= charsToAdd * charInterval;
        currentIndex = Math.min(currentIndex + charsToAdd, text.length);
        setCurrentText(text.slice(0, currentIndex));
      }
      
      if (currentIndex < text.length) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [text, speed]);
  
  const completeAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCurrentText(text);
    setIsAnimating(false);
  }, [text]);
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return {
    currentText,
    isAnimating,
    startAnimation,
    completeAnimation
  };
};

// Компонент для оптимизированного рендеринга изображений
export const OptimizedImage = React.memo(({ src, alt, className, style, ...props }) => {
  const imgRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    
    // Принудительное GPU ускорение после загрузки
    if (imgRef.current) {
      imgRef.current.style.transform = 'translate3d(0, 0, 0)';
      imgRef.current.style.willChange = 'transform';
    }
  }, []);
  
  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.2s ease'
      }}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

// Компонент для оптимизированных анимаций
export const OptimizedMotionDiv = React.memo(({ children, ...motionProps }) => {
  const ref = useRef();
  
  useEffect(() => {
    if (ref.current) {
      // Принудительное GPU ускорение
      ref.current.style.willChange = 'transform';
      ref.current.style.transform = 'translate3d(0, 0, 0)';
      ref.current.style.contain = 'layout style paint';
    }
  }, []);
  
  return (
    <motion.div ref={ref} {...motionProps}>
      {children}
    </motion.div>
  );
});

// Утилита для оптимизации производительности на слабых устройствах
export const isLowEndDevice = () => {
  // Определяем слабое устройство по различным метрикам
  const screenWidth = window.screen ? window.screen.width : window.innerWidth;
  const pixelRatio = window.devicePixelRatio || 1;
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const memory = navigator.deviceMemory || 2;
  
  // Слабое устройство если:
  // - Разрешение экрана меньше 720p
  // - Меньше 4 ядер CPU
  // - Меньше 3 ГБ RAM
  // - Старый браузер без поддержки современных API
  return (
    screenWidth < 720 ||
    hardwareConcurrency < 4 ||
    memory < 3 ||
    !window.requestIdleCallback ||
    !CSS.supports('will-change', 'transform')
  );
};

// Оптимизатор анимаций для слабых устройств
export const optimizeAnimationsForDevice = () => {
  if (isLowEndDevice()) {
    console.log('🐌 Слабое устройство обнаружено - упрощаем анимации');
    
    // Добавляем CSS для упрощения анимаций
    const style = document.createElement('style');
    style.textContent = `
      /* УПРОЩЕНИЕ АНИМАЦИЙ ДЛЯ СЛАБЫХ УСТРОЙСТВ */
      *, *:before, *:after {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      /* Отключаем сложные анимации */
      .pet-avatar img {
        animation: none !important;
      }
      
      /* Упрощаем hover эффекты */
      button:hover, .button:hover {
        transform: none !important;
        opacity: 0.8;
      }
    `;
    document.head.appendChild(style);
    
    return true;
  }
  
  return false;
};

export default {
  useStableCallback,
  useDebouncedState,
  useOptimizedTextAnimation,
  OptimizedImage,
  OptimizedMotionDiv,
  isLowEndDevice,
  optimizeAnimationsForDevice
};