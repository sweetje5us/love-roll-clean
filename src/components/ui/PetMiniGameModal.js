import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getStaticPath } from '../../utils/pathUtils';
import './PetMiniGameModal.css';
import { usePets } from '../../contexts/PetContext';
// Убираем импорт мобильных оптимизаций для лучшего игрового процесса

// Функция для вычисления масштаба игры под размер контейнера
const useGameScale = (originalWidth, originalHeight) => {
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: originalWidth, height: originalHeight });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Проверяем, находимся ли мы внутри minigame-container
      const isInMinigameContainer = container.closest('.minigame-container');
      
      if (isInMinigameContainer) {
        // Внутри телефона - вычисляем масштаб для правильного размера
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const newScale = Math.min(scaleX, scaleY); // Масштабируем под размер контейнера
        setScale(newScale);
        setContainerSize({ width: containerWidth, height: containerHeight });
        
        // Устанавливаем CSS переменную для масштабирования
        if (container) {
          container.style.setProperty('--game-scale', newScale.toString());
        }
        

      } else {
        // Вне телефона - используем оригинальную логику масштабирования
        const scaleX = containerWidth / originalWidth;
        const scaleY = containerHeight / originalHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // Не увеличиваем больше оригинального размера
        setScale(newScale);
        setContainerSize({ width: containerWidth, height: containerHeight });
      }
    };

    updateScale();
    
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [originalWidth, originalHeight]);

  return { scale, containerSize, containerRef, isInMinigameContainer: containerRef.current?.closest('.minigame-container') };
};

// Функция для масштабирования размеров объектов
const useScaledDimensions = (originalWidth, originalHeight) => {
  const { scale, isInMinigameContainer } = useGameScale(originalWidth, originalHeight);
  
  const getScaledSize = (size) => {
    if (isInMinigameContainer) {
      return size * scale;
    }
    return size;
  };
  
  const getScaledPosition = (pos) => {
    if (isInMinigameContainer) {
      return pos * scale;
    }
    return pos;
  };
  
  return { getScaledSize, getScaledPosition, scale, isInMinigameContainer };
};

// Длительность анимаций Zuma (мс)
const ANIMATION_DURATION = 300;

// Настройки производительности (убраны все мобильные оптимизации)
const MOBILE_SETTINGS = {
  renderInterval: 1, // каждый кадр
  maxDeltaTime: 1000, // без ограничения deltaTime
  animationThrottle: 1, // без пропуска кадров
};

const getGameTypeText = (gameType) => {
  switch (gameType) {
    case 'can_fly':
      return 'Мини-игра: Полет над городом (летающий питомец)';
    case 'can_jump':
      return 'Мини-игра: Doodle Jump (прыгающий питомец)';
    case 'can_walk':
      return 'Мини-игра: Crossy Road (ходящий питомец)';
    case 'can_swim':
      return 'Мини-игра: Zuma (плавающий питомец)';
    default:
      return 'Мини-игра: Неизвестный тип';
  }
};

// --- Полет над городом MiniGame ---
const GAME_WIDTH = 320;
const GAME_HEIGHT = 420;
// Константы в единицах "на секунду"
const GRAVITY_PER_SECOND = 600;
const JUMP_VELOCITY = -240;
const OBSTACLE_SPEED_PER_SECOND = 120;
const OBSTACLE_INTERVAL = 1400;
const PET_SIZE = 44;

// Параллакс фон константы
const BACKGROUND_WIDTH = 576;
const BACKGROUND_HEIGHT = 324;
const PARALLAX_LAYERS = 5;
const PARALLAX_SPEEDS = [0.1, 0.2, 0.3, 0.5, 0.8]; // Скорости для каждого слоя (относительно скорости препятствий)

// Система фонов
const BACKGROUND_SETS = {
  1: {
    name: 'Городской пейзаж',
    layers: [
      'sprites/minigames/flappy-bird/backgrounds/1/1.png',
      'sprites/minigames/flappy-bird/backgrounds/1/2.png',
      'sprites/minigames/flappy-bird/backgrounds/1/3.png',
      'sprites/minigames/flappy-bird/backgrounds/1/4.png',
      'sprites/minigames/flappy-bird/backgrounds/1/5.png'
    ]
  },
  2: {
    name: 'Природный пейзаж',
    layers: [
      'sprites/minigames/flappy-bird/backgrounds/2/1.png',
      'sprites/minigames/flappy-bird/backgrounds/2/2.png',
      'sprites/minigames/flappy-bird/backgrounds/2/3.png',
      'sprites/minigames/flappy-bird/backgrounds/2/4.png',
      'sprites/minigames/flappy-bird/backgrounds/2/5.png'
    ]
  },
  3: {
    name: 'Фантастический пейзаж',
    layers: [
      'sprites/minigames/flappy-bird/backgrounds/3/1.png',
      'sprites/minigames/flappy-bird/backgrounds/3/2.png',
      'sprites/minigames/flappy-bird/backgrounds/3/3.png',
      'sprites/minigames/flappy-bird/backgrounds/3/4.png',
      'sprites/minigames/flappy-bird/backgrounds/3/5.png'
    ]
  }
};

function getRandomBackgroundSet() {
  const setKeys = Object.keys(BACKGROUND_SETS);
  const randomKey = setKeys[Math.floor(Math.random() * setKeys.length)];
  return BACKGROUND_SETS[randomKey];
}

// Система спрайтов зданий
const BUILDING_SPRITES = {
  building_01: {
    width: 48,
    height: 125,
    variants: [
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Blue_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Blue_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Green_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Green_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Red_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_01_Red_Nighttime_01.png'
    ]
  },
  building_02: {
    width: 72,
    height: 237,
    variants: [
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Blue_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Blue_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Green_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Green_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Red_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_02_Red_Nighttime_01.png'
    ]
  },
  building_04: {
    width: 48,
    height: 89,
    variants: [
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Blue_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Blue_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Green_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Green_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Nighttime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Red_Daytime_01.png',
      'sprites/minigames/flappy-bird/objects/SCS_Building_04_Red_Nighttime_01.png'
    ]
  }
};

const FLYING_OBJECT_SIZE = 32;
const FLYING_OBJECT_GAP = 100; // Расстояние между летящими объектами

function getRandomBuildingSprite() {
  const buildingTypes = Object.keys(BUILDING_SPRITES);
  const randomType = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
  const building = BUILDING_SPRITES[randomType];
  const randomVariant = building.variants[Math.floor(Math.random() * building.variants.length)];
  
  // Масштабируем здания для лучшего соответствия размеру игры
  const scale = 0.6; // Уменьшаем все здания на 40%
  
  return {
    type: randomType,
    src: randomVariant,
    width: building.width * scale,
    height: building.height * scale
  };
}

function getRandomFlyingObjectY() {
  return 40 + Math.random() * (GAME_HEIGHT / 2 - FLYING_OBJECT_SIZE - 40);
}

function getRandomBuildingY() {
  // Функция больше не используется, так как здания позиционируются через bottom: 0
  return 0;
}

// --- Doodle Jump MiniGame ---
const DJ_WIDTH = 320;
const DJ_HEIGHT = 420;
const DJ_PET_SIZE = 44;
const DJ_PLATFORM_WIDTH = 60;
const DJ_PLATFORM_HEIGHT = 12;
const DJ_PLATFORM_COUNT = 8;

// Константы для танков-платформ
const DJ_TANK_SPRITES = [
  'sprites/minigames/doodle-jump/Props/tank-1.png',
  'sprites/minigames/doodle-jump/Props/tank-2.png',
  'sprites/minigames/doodle-jump/Props/tank-3.png'
];
const DJ_TANK_ORIGINAL_WIDTH = 122;
const DJ_TANK_ORIGINAL_HEIGHT = 48;
// Константы в единицах "на секунду"
const DJ_GRAVITY_PER_SECOND = 400;
const DJ_JUMP_VELOCITY = -300;
const DJ_MOVE_SPEED_PER_SECOND = 240;

// Функции для получения масштабированных размеров
function getScaledPetSize(scale) {
  return DJ_PET_SIZE * scale;
}

function getScaledPlatformWidth(scale) {
  return DJ_PLATFORM_WIDTH * scale;
}

function getScaledPlatformHeight(scale) {
  return DJ_PLATFORM_HEIGHT * scale;
}

function getScaledTankScale(scale) {
  return getScaledPlatformWidth(scale) / DJ_TANK_ORIGINAL_WIDTH;
}

function getScaledTankDisplayWidth(scale) {
  return DJ_TANK_ORIGINAL_WIDTH * getScaledTankScale(scale);
}

function getScaledTankDisplayHeight(scale) {
  return DJ_TANK_ORIGINAL_HEIGHT * getScaledTankScale(scale);
}

function getRandomPlatformX(containerWidth, platformWidth) {
  return Math.random() * (containerWidth - platformWidth);
}

function getRandomTankSprite() {
  return DJ_TANK_SPRITES[Math.floor(Math.random() * DJ_TANK_SPRITES.length)];
}

// Функции для получения масштабированных размеров Flappy Bird
function getScaledFlappyPetSize(scale) {
  return PET_SIZE * scale;
}

function getScaledFlappyObstacleInterval(scale) {
  return OBSTACLE_INTERVAL * scale;
}

const DoodleJumpGame = ({ petSprite, onClose, petId }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  
  // Динамическое вычисление масштаба для minigame-container
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 288, height: 376 });
  const [scale, setScale] = useState(1);
  
  // Динамическое вычисление размера контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width || 288;
      const height = rect.height || 376;
      
      setContainerSize({ width, height });
      
      // Вычисляем масштаб
      const scaleX = width / DJ_WIDTH;
      const scaleY = height / DJ_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  const isInMinigameContainer = true; // Всегда true для DoodleJump в телефоне


  // refs для физики
  const petX = useRef(0);
  const petY = useRef(0);
  const velocityY = useRef(0);
  const platforms = useRef([]);
  const maxY = useRef(0);
  const moveDir = useRef(0); // -1 влево, 1 вправо
  
  // Инициализация позиции питомца после получения размеров контейнера
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && scale > 0) {
      petX.current = containerSize.width / 2 - getScaledPetSize(scale) / 2;
      petY.current = containerSize.height - getScaledPetSize(scale) - 10 * scale;
      maxY.current = petY.current;
    }
  }, [containerSize.width, containerSize.height, scale]);
  
  // refs для параллакс фона
  const backgroundY = useRef(0);
  
  // Массивы для хранения позиций фоновых слоев (для бесшовного зацикливания)
  const backgroundLayers = useRef([]); // Будет инициализирован позже
  
  // refs для платформ-танков
  const platformRefs = useRef([]);

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir.current = -1;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir.current = 1;
    };
    const handleKeyUp = (e) => {
      if (
        e.code === 'ArrowLeft' || e.code === 'KeyA' ||
        e.code === 'ArrowRight' || e.code === 'KeyD'
      ) moveDir.current = 0;
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);



  // Игровой цикл
  useEffect(() => {
    if (gameOver) return;
    let frame;
    let lastTime = performance.now();
    
    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaTimeSeconds = deltaTime / 1000;
      
      // Движение по горизонтали с deltaTime
      const currentMoveDir = window.doodleJumpMoveDir || moveDir.current;
      petX.current += currentMoveDir * DJ_MOVE_SPEED_PER_SECOND * deltaTimeSeconds;
      
      // Ограничиваем движение питомца в пределах контейнера
      if (petX.current < 0) petX.current = 0;
      if (petX.current > containerSize.width - getScaledPetSize(scale)) {
        petX.current = containerSize.width - getScaledPetSize(scale);
      }
      
      // Гравитация с deltaTime
      velocityY.current += DJ_GRAVITY_PER_SECOND * deltaTimeSeconds;
      petY.current += velocityY.current * deltaTimeSeconds;
      
      // Прыжок от платформ и начисление очков только за новые платформы
      for (let plat of platforms.current) {
        if (
          petY.current + getScaledPetSize(scale) > plat.y &&
          petY.current + getScaledPetSize(scale) < plat.y + getScaledPlatformHeight(scale) &&
          petX.current + getScaledPetSize(scale) > plat.x &&
          petX.current < plat.x + getScaledPlatformWidth(scale) &&
          velocityY.current > 0
        ) {
          velocityY.current = DJ_JUMP_VELOCITY;
          if (!plat.visited) {
            plat.visited = true;
            setScore(s => s + 1);
          }
          break;
        }
      }
      
      // Движение платформ вниз, если питомец поднимается выше середины
      if (petY.current < containerSize.height / 2) {
        const diff = containerSize.height / 2 - petY.current;
        petY.current = containerSize.height / 2;
        maxY.current -= diff;
        
        // Параллакс эффект для фоновых слоев с бесшовным зацикливанием
        // Задний слой движется медленнее
        for (let i = 0; i < backgroundLayers.current.length; i++) {
          backgroundLayers.current[i] += diff * 0.3;
        }
        
        // Перемещаем задние слои, которые вышли за границу
        for (let i = 0; i < backgroundLayers.current.length; i++) {
          if (backgroundLayers.current[i] >= containerSize.height) {
            // Находим самый верхний слой
            let minY = Math.min(...backgroundLayers.current);
            backgroundLayers.current[i] = minY - containerSize.height;
          }
        }
        
        // Проверяем и исправляем разрывы между слоев
        backgroundLayers.current.sort((a, b) => a - b);
        for (let i = 1; i < backgroundLayers.current.length; i++) {
          const gap = backgroundLayers.current[i] - backgroundLayers.current[i - 1];
          if (gap > containerSize.height) {
            // Если есть разрыв больше высоты слоя, перемещаем слой
            backgroundLayers.current[i] = backgroundLayers.current[i - 1] + containerSize.height;
          }
        }
        
        // Добавляем дополнительные слои, если их недостаточно
        while (backgroundLayers.current.length < 5) {
          let minY = Math.min(...backgroundLayers.current);
          backgroundLayers.current.push(minY - containerSize.height);
        }
        
        // Движение платформ - изменяем in-place
        for (let i = 0; i < platforms.current.length; i++) {
          platforms.current[i].y += diff;
        }
      }
      
      // Добавляем платформы
      while (platforms.current.length < DJ_PLATFORM_COUNT) {
        let minY = platforms.current[0]?.y || 0;
        for (let i = 1; i < platforms.current.length; i++) {
          if (platforms.current[i].y < minY) {
            minY = platforms.current[i].y;
          }
        }
        platforms.current.push({
          x: getRandomPlatformX(containerSize.width, getScaledPlatformWidth(scale)),
          y: minY - 60 * scale - Math.random() * 30 * scale,
          sprite: getRandomTankSprite(),
          direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
        });
      }
      
      // Удаление платформ - splice вместо filter
      for (let i = platforms.current.length - 1; i >= 0; i--) {
        if (platforms.current[i].y >= containerSize.height) {
          platforms.current.splice(i, 1);
        }
      }
      
      // Game over если упал вниз
      if (petY.current > containerSize.height) {
        setGameOver(true);
        return;
      }
      
      // Обновление рендера - обновляем каждый кадр для плавной анимации
      setRenderTick(t => t + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameOver]);

  // Начисление счастья
  useEffect(() => {
    if (gameOver && !rewarded && score > 0) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      const newHappiness = Math.min(100, currentHappiness + 1 * score);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
    }
  }, [gameOver, rewarded, score, updatePetStats, petId, getPetState]);

  // Применение отзеркаливания к платформам
  useEffect(() => {
    platforms.current.forEach((plat, idx) => {
      if (platformRefs.current[idx]) {
        platformRefs.current[idx].style.setProperty('transform', plat.direction === 1 ? 'scaleX(-1)' : 'scaleX(1)', 'important');
      }
    });
  }, [renderTick]);

  // Инициализация платформ и фоновых слоев
  useEffect(() => {
    if (platforms.current.length > 0) return;
    
    // Инициализация фоновых слоев
    if (backgroundLayers.current.length === 0) {
      backgroundLayers.current = [
        0, 
        containerSize.height, 
        containerSize.height * 2,
        containerSize.height * 3,
        containerSize.height * 4
      ];
    }
    
    let plats = [];
    for (let i = 0; i < DJ_PLATFORM_COUNT; i++) {
      plats.push({
        x: getRandomPlatformX(containerSize.width, getScaledPlatformWidth(scale)),
        y: containerSize.height - i * 60 * scale - 40 * scale,
        visited: i === 0, // первая платформа сразу отмечена как посещённая
        sprite: getRandomTankSprite(),
        direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
      });
    }
    // Первая платформа строго под питомцем
    plats[0].x = containerSize.width / 2 - getScaledPlatformWidth(scale) / 2;
    plats[0].y = containerSize.height - getScaledPlatformHeight(scale) - 10 * scale;
    platforms.current = plats;
    // Питомец стоит на первой платформе
    petX.current = containerSize.width / 2 - getScaledPetSize(scale) / 2;
    petY.current = plats[0].y - getScaledPetSize(scale);
    velocityY.current = 0;
  }, [containerSize, scale]);

  // Сброс игры
  const restart = () => {
    petX.current = containerSize.width / 2 - getScaledPetSize(scale) / 2;
    petY.current = containerSize.height - getScaledPetSize(scale) - 10 * scale;
    velocityY.current = 0;
    // Пересоздаём платформы и ставим питомца на первую платформу
    let plats = [];
    for (let i = 0; i < DJ_PLATFORM_COUNT; i++) {
      plats.push({
        x: getRandomPlatformX(containerSize.width, getScaledPlatformWidth(scale)),
        y: containerSize.height - i * 60 * scale - 40 * scale,
        visited: i === 0,
        sprite: getRandomTankSprite(),
        direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
      });
    }
    plats[0].x = containerSize.width / 2 - getScaledPlatformWidth(scale) / 2;
    plats[0].y = containerSize.height - getScaledPlatformHeight(scale) - 10 * scale;
    platforms.current = plats;
    petX.current = containerSize.width / 2 - getScaledPetSize(scale) / 2;
    petY.current = plats[0].y - getScaledPetSize(scale);
    velocityY.current = 0;
    maxY.current = petY.current;
    
    // Сброс параллакс фона - слои располагаются без разрывов
    backgroundY.current = 0;
    backgroundLayers.current = [
      0, 
      containerSize.height, 
      containerSize.height * 2,
      containerSize.height * 3,
      containerSize.height * 4
    ];
    
    setScore(0);
    setGameOver(false);
    setRenderTick(t => t + 1);
    setRewarded(false);
  };

  // Определяем мобильное устройство по ширине экрана
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  return (
    <div 
      ref={containerRef}
      key={renderTick}
      className="doodlejump-game" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        background: '#fef9c3', 
        overflow: 'hidden',
        transform: 'none',
        transition: 'none',
        animation: 'none'
      }}
      tabIndex={0}
      onClick={() => null}
    >
      <div
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          transform: 'none',
          transformOrigin: 'top left',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fef9c3',
          overflow: 'hidden'
        }}
      >
      {/* Задние слои параллакс фона */}
      {backgroundLayers.current.map((y, index) => (
        <div
          key={`background-${index}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: `${containerSize.width}px`,
            height: `${containerSize.height}px`,
            backgroundImage: `url(sprites/minigames/doodle-jump/back.png)`,
            backgroundSize: `${containerSize.width}px ${containerSize.height}px`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            zIndex: 0,
          }}
        />
      ))}
      
      {/* Питомец */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: petX.current,
          top: petY.current,
          width: getScaledPetSize(scale),
          height: getScaledPetSize(scale),
          zIndex: 2,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      
      {/* Платформы-танки */}
      {platforms.current.map((plat, idx) => (
        <img
          key={idx}
          ref={el => platformRefs.current[idx] = el}
          src={plat.sprite}
          alt="tank platform"
          style={{
            position: 'absolute',
            left: plat.x - (getScaledTankDisplayWidth(scale) - getScaledPlatformWidth(scale)) / 2, // центрируем танк относительно физического тела
            top: plat.y - (getScaledTankDisplayHeight(scale) - getScaledPlatformHeight(scale)), // выравниваем по нижней границе
            width: getScaledTankDisplayWidth(scale),
            height: getScaledTankDisplayHeight(scale),
            zIndex: 3,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
      

      

      {/* Счёт */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f59e42',
        textShadow: '1px 1px 2px #fff',
        zIndex: 20
      }}>{score}</div>
      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          width: '100%',
          textAlign: 'center',
          color: '#dc2626',
          fontSize: 32,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #fff',
          zIndex: 25
        }}>
          Игра окончена!<br />
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#fde047', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}


      </div>
    </div>
  );
};

// --- Crossy Road MiniGame ---
const CR_WIDTH = 320;
const CR_HEIGHT = 420;
const CR_PET_SIZE = 44;
const CR_LANE_HEIGHT = 48;
const CR_LANE_COUNT = 7;
const CR_OBSTACLE_WIDTH = 60;
const CR_OBSTACLE_HEIGHT = 36;
// Константы теперь в единицах "на секунду"
const CR_OBSTACLE_SPEED_PER_SECOND = 150;

// --- Crossy Road Road Tiles System ---
const CR_ROAD_TILES = {
  road: {
    src: 'sprites/minigames/crossy-road/Road_01_Tile_03.png',
    width: 512,
    height: 688,
    displayWidth: 160, // Размер одного блока дороги
    displayHeight: CR_LANE_HEIGHT
  },
  roadAlt: {
    src: 'sprites/minigames/crossy-road/Road_01_Tile_04.png',
    width: 512,
    height: 688,
    displayWidth: 160, // Размер одного блока дороги
    displayHeight: CR_LANE_HEIGHT
  }
};

// --- Crossy Road Background Tiles System ---
const CR_BACKGROUND_TILES = {
  grass: {
    src: 'sprites/minigames/crossy-road/Grass_Tile.png',
    width: 512,
    height: 512,
    displayWidth: CR_WIDTH,
    displayHeight: CR_LANE_HEIGHT
  },
  soil: {
    src: 'sprites/minigames/crossy-road/Soil_Tile.png',
    width: 512,
    height: 512,
    displayWidth: CR_WIDTH,
    displayHeight: CR_LANE_HEIGHT
  }
};

// --- Crossy Road Car Sprites System ---
const CR_CAR_SPRITES = {
  bubblecar: {
    src: 'sprites/minigames/crossy-road/spr_bubblecar_0.png',
    width: 288,
    height: 147,
    displayWidth: 60,
    displayHeight: 36
  },
  camper: {
    src: 'sprites/minigames/crossy-road/spr_camper_0.png',
    width: 288,
    height: 144,
    displayWidth: 60,
    displayHeight: 36
  },
  car4: {
    src: 'sprites/minigames/crossy-road/spr_car4_0.png',
    width: 288,
    height: 123,
    displayWidth: 60,
    displayHeight: 36
  },
  classiccar: {
    src: 'sprites/minigames/crossy-road/spr_classiccar_0.png',
    width: 288,
    height: 105,
    displayWidth: 60,
    displayHeight: 36
  },
  estatecar: {
    src: 'sprites/minigames/crossy-road/spr_estatecar_0.png',
    width: 294,
    height: 144,
    displayWidth: 60,
    displayHeight: 36
  },
  rally: {
    src: 'sprites/minigames/crossy-road/spr_rally_0.png',
    width: 288,
    height: 135,
    displayWidth: 60,
    displayHeight: 36
  },
  turbo: {
    src: 'sprites/minigames/crossy-road/spr_turbo_0.png',
    width: 288,
    height: 117,
    displayWidth: 60,
    displayHeight: 36
  },
  van: {
    src: 'sprites/minigames/crossy-road/spr_van_0.png',
    width: 288,
    height: 153,
    displayWidth: 60,
    displayHeight: 36
  }
};

// Функция для получения тайлов дороги (теперь только один набор)
function getRoadTiles() {
  return CR_ROAD_TILES;
}

// Функция для получения случайного фонового тайла
function getRandomBackgroundTile() {
  const backgroundTypes = Object.keys(CR_BACKGROUND_TILES);
  const randomType = backgroundTypes[Math.floor(Math.random() * backgroundTypes.length)];
  return CR_BACKGROUND_TILES[randomType];
}

// Функция для получения случайного спрайта машины
function getRandomCarSprite() {
  const carTypes = Object.keys(CR_CAR_SPRITES);
  const randomType = carTypes[Math.floor(Math.random() * carTypes.length)];
  return CR_CAR_SPRITES[randomType];
}

// Функция для создания специальной машины
function createSpecialCar(x, y, dir, level) {
  const carSprite = getRandomCarSprite();
  
  // Шанс для диагональных машин (5% + бонус за уровень)
  const diagonalBaseChance = 0.05; // 5% базовый шанс
  const diagonalLevelBonus = Math.min(0.01 * level, 0.05); // +1% за уровень, максимум 5%
  const diagonalTotalChance = diagonalBaseChance + diagonalLevelBonus;
  
  // Шанс для преследователей (0.5% + бонус за уровень)
  const hunterBaseChance = 0.005; // 0.5% базовый шанс
  const hunterLevelBonus = Math.min(0.002 * level, 0.01); // +0.2% за уровень, максимум 1%
  const hunterTotalChance = hunterBaseChance + hunterLevelBonus;
  
  // Проверяем шанс диагональной машины
  if (Math.random() < diagonalTotalChance) {
    return {
      x,
      y,
      dir,
      sprite: carSprite,
      special: 'diagonal',
      originalLane: y, // Запоминаем исходную полосу
      targetX: null, // Для диагонального движения
      targetY: null, // Для диагонального движения
      huntTimer: 0, // Для преследования
      state: 'normal', // normal, braking, diagonal, hunting
      brakeTimer: 0, // Таймер торможения
      brakeDuration: 1000, // Длительность торможения (1 секунда)
      angle: 0, // Угол поворота спрайта (в градусах)
      hasBraked: false // Флаг, что торможение уже произошло
    };
  }
  
  // Проверяем шанс преследователя
  if (Math.random() < hunterTotalChance) {
    return {
      x,
      y,
      dir,
      sprite: carSprite,
      special: 'hunter',
      originalLane: y, // Запоминаем исходную полосу
      targetX: null, // Для диагонального движения
      targetY: null, // Для диагонального движения
      huntTimer: 0, // Для преследования
      state: 'normal' // normal, diagonal, hunting
    };
  }
  
  return null; // Обычная машина
}

// Функция для создания препятствия с спрайтом машины
function createCarObstacle(x, y, dir, level = 1) {
  // Проверяем корректность параметров
  if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
    console.warn('Некорректные координаты для машины:', x, y);
    return null;
  }
  
  if (dir !== 1 && dir !== -1) {
    console.warn('Некорректное направление для машины:', dir);
    return null;
  }
  
  // Пытаемся создать специальную машину
  const specialCar = createSpecialCar(x, y, dir, level);
  if (specialCar) {
    return specialCar;
  }
  
  // Обычная машина
  const carSprite = getRandomCarSprite();
  return {
    x,
    y,
    dir,
    sprite: carSprite
  };
}

// Функция для генерации позиций машин без наложений
function generateCarPositions(laneY, carCount, carWidth = 60, direction = 1) {
  const positions = [];
  const minSpacing = carWidth + 20; // Минимальное расстояние между машинами
  const laneWidth = CR_WIDTH; // Используем оригинальную ширину для вычислений
  
  for (let i = 0; i < carCount; i++) {
    let x;
    
    // Для машин, движущихся справа налево (direction < 0)
    if (direction < 0) {
      // Начинаем за правой границей экрана
      x = CR_WIDTH + 100 + (i * minSpacing * 2);
    } else {
      // Для машин, движущихся слева направо (direction > 0)
      // Начинаем за левой границей экрана
      x = -100 - (i * minSpacing * 2);
    }
    
    positions.push(x);
  }
  
  return positions;
}

function getRandomObstacleX() {
  return Math.random() * (CR_WIDTH - 60); // Используем стандартную ширину спрайта машины
}

// Функция для генерации динамической конфигурации полос
function generateLaneConfiguration(level) {
  // Определяем количество дорожных полос (от 2 до 6)
  const roadLanesCount = Math.min(6, 2 + Math.floor(level / 2));
  
  // Базовое количество полос: дорожные + 2 безопасные (начальная + одна случайная)
  const baseLanes = Math.max(roadLanesCount + 2, 5 + Math.floor(level / 3));
  
  // Создаем массив полос (true = дорога, false = безопасная)
  const lanes = new Array(baseLanes).fill(false);
  
  // Гарантируем безопасные полосы: только начальная и еще одна
  lanes[0] = false; // Начальная полоса всегда безопасная
  
  // Выбираем случайную безопасную полосу между начальной и конечной
  const safeLaneIndex = 1 + Math.floor(Math.random() * (baseLanes - 1));
  lanes[safeLaneIndex] = false;
  
  // Теперь размещаем дорожные полосы
  const availableLanes = [];
  for (let i = 1; i < baseLanes; i++) {
    if (i !== safeLaneIndex) {
      availableLanes.push(i);
    }
  }
  
  // Выбираем случайные полосы для дорог
  const selectedRoadLanes = [];
  for (let i = 0; i < Math.min(roadLanesCount, availableLanes.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableLanes.length);
    const laneIndex = availableLanes.splice(randomIndex, 1)[0];
    selectedRoadLanes.push(laneIndex);
  }
  
  // Отмечаем выбранные полосы как дорожные
  selectedRoadLanes.forEach(laneIndex => {
    lanes[laneIndex] = true;
  });
  
  return {
    lanes: lanes,
    totalLanes: baseLanes,
    roadLanes: selectedRoadLanes,
    safeLanes: [0, safeLaneIndex]
  };
}

// Функция для определения, является ли полоса дорожной
function isLaneRoad(laneIndex, laneConfig) {
  if (!laneConfig || !laneConfig.lanes) {
    // Если конфигурация не загружена, используем старую логику для совместимости
    return laneIndex % 2 === 1;
  }
  return laneConfig.lanes[laneIndex] === true;
}

const CrossyRoadGame = ({ petSprite, onClose, petId, onLevelChange }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [win, setWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [roadTiles] = useState(getRoadTiles()); // Тайлы дороги
  const [backgroundTile, setBackgroundTile] = useState(getRandomBackgroundTile()); // Фоновый тайл
  const [laneConfig, setLaneConfig] = useState(() => generateLaneConfiguration(1)); // Инициализируем сразу конфигурацию для первого уровня
  
  // Динамическое вычисление масштаба для minigame-container
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 288, height: 376 });
  const [scale, setScale] = useState(1);
  
  // Динамическое вычисление размера контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width || 288;
      const height = rect.height || 376;
      
      setContainerSize({ width, height });
      
      // Вычисляем масштаб
      const scaleX = width / CR_WIDTH;
      const scaleY = height / CR_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  const isInMinigameContainer = true; // Всегда true для CrossyRoad в телефоне
  

  


  // refs для физики
  const petX = useRef(0);
  const petY = useRef(0);
  
  // Инициализация позиции питомца после получения размеров контейнера
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && scale > 0) {
      petX.current = containerSize.width / 2 - CR_PET_SIZE * scale / 2;
      petY.current = containerSize.height - CR_PET_SIZE * scale - 8; // Ставим на самую нижнюю безопасную полосу (строка 0)
    }
  }, [containerSize.width, containerSize.height, scale]);
  const obstacles = useRef([]); // [{x, y, dir, sprite}]
  const moveDir = useRef(0); // -1 влево, 1 вправо
  const moveForward = useRef(false);
  
  // refs для прямого управления DOM элементами машин
  const carRefs = useRef({});
  
  // Улучшенная система респауна
  const spawnTimer = useRef(0);
  const spawnInterval = useRef(1500); // 1.5 секунды между появлением новых машин
  const carGroupTimer = useRef(0); // Таймер для создания групп машин

  // useEffect для поворота машин
  useEffect(() => {
    obstacles.current.forEach((obs, idx) => {
      if (carRefs.current[idx]) {
        let transform = '';
        
        if (obs.special === 'hunter' && obs.huntTimer > 2) {
          // Машина-преследователь: поворачиваем в направлении движения к игроку
          const targetX = petX.current;
          const targetY = petY.current;
          const dx = targetX - obs.x;
          const dy = targetY - obs.y;
          
          if (Math.abs(dx) > 5) { // Если есть значительное движение по X
            transform = dx > 0 ? 'scaleX(-1)' : 'scaleX(1)';
          } else if (Math.abs(dy) > 5) { // Если движемся в основном по Y
            // Для движения вверх/вниз можно добавить специальную логику
            transform = obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
          } else {
            transform = obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
          }
        } else if (obs.special === 'diagonal') {
          // Диагональная машина: поворачиваем спрайт под углом движения
          if (obs.state === 'diagonal' && obs.angle !== undefined) {
            // Применяем поворот на вычисленный угол
            const rotation = obs.angle;
            transform = `rotate(${rotation}deg)`;
          } else if (obs.state === 'braking') {
            // Во время торможения - стандартный поворот
            transform = obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
          } else {
            // В обычном состоянии - стандартный поворот
            transform = obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
          }
        } else {
          // Обычные машины: стандартный поворот
          transform = obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)';
        }
        
        carRefs.current[idx].style.setProperty('transform', transform, 'important');
      }
    });
  }, [renderTick]); // Зависит от renderTick для обновления при изменении направления

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      // Предотвращаем повторяющиеся события при зажатии клавиши
      if (e.repeat) return;
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        moveDir.current = -1;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        moveDir.current = 1;
      }
      if (e.code === 'ArrowUp' || e.code === 'Space') {
        moveForward.current = true;
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowRight' || e.code === 'KeyD') moveDir.current = 0;
      if (e.code === 'ArrowUp' || e.code === 'Space') moveForward.current = false;
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Простой игровой цикл
  useEffect(() => {
    let frame;
    let lastTime = performance.now();
    
    const loop = (currentTime) => {
      // Игровой цикл работает всегда
      if (gameOver || win) {
        frame = requestAnimationFrame(loop);
        return;
      }
      

      
      // Отладочная информация - убрана для уменьшения логов
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaTimeSeconds = deltaTime / 1000; // без ограничений для лучшего игрового процесса
      
      // Движение питомца
      const currentMoveDir = window.crossyMoveDir || moveDir.current;
              petX.current += currentMoveDir * 300 * deltaTimeSeconds;
        if (petX.current < 0) petX.current = 0;
        if (petX.current > containerSize.width - CR_PET_SIZE * scale) petX.current = containerSize.width - CR_PET_SIZE * scale;
      
      // Движение питомца вперёд (одно нажатие = одно движение)
      if (window.crossyMoveForward) {
        petY.current -= CR_LANE_HEIGHT * scale;
        if (petY.current < 0) petY.current = 0;
        window.crossyMoveForward = false;
      }
      if (moveForward.current) {
        petY.current -= CR_LANE_HEIGHT * scale;
        if (petY.current < 0) petY.current = 0;
        moveForward.current = false;
      }
      
      // Движение машин с прогрессивной сложностью
      const baseSpeed = CR_OBSTACLE_SPEED_PER_SECOND;
      const speedIncrease = Math.min((level - 1) * 25, 200); // Ограничиваем максимальное увеличение скорости
      const speed = (baseSpeed + speedIncrease) * deltaTimeSeconds;
      
      // Проверяем столкновения между машинами
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        for (let j = i - 1; j >= 0; j--) {
          const car1 = obstacles.current[i];
          const car2 = obstacles.current[j];
          
          // Проверяем столкновение между машинами
          if (car1 && car2) {
            const car1Left = car1.x;
            const car1Right = car1.x + car1.sprite.displayWidth * scale;
            const car1Top = car1.y;
            const car1Bottom = car1.y + car1.sprite.displayHeight * scale;
            
            const car2Left = car2.x;
            const car2Right = car2.x + car2.sprite.displayWidth * scale;
            const car2Top = car2.y;
            const car2Bottom = car2.y + car2.sprite.displayHeight * scale;
            
            if (car1Top < car2Bottom && car1Bottom > car2Top &&
                car1Left < car2Right && car1Right > car2Left) {
              // Столкновение! Удаляем обе машины
              obstacles.current.splice(i, 1);
              obstacles.current.splice(j, 1);
              if (carRefs.current[i]) delete carRefs.current[i];
              if (carRefs.current[j]) delete carRefs.current[j];
              break; // Выходим из внутреннего цикла
            }
          }
        }
      }
      
      // Движение машин
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        
        // Обычное движение
        if (!obs.special) {
          obs.x += obs.dir * speed;
        } else {
          // Специальное движение
          if (obs.special === 'diagonal' && obs.state === 'normal') {
            // Диагональная машина - движется по прямой, пока не достигнет центра экрана
            obs.x += obs.dir * speed;
            
            // Когда машина достигает центра экрана и еще не тормозила, начинаем торможение
            if (!obs.hasBraked && obs.dir > 0 && obs.x > containerSize.width * 0.4) {
              obs.state = 'braking';
              obs.brakeTimer = 0;
              obs.hasBraked = true; // Отмечаем, что торможение произошло
              obs.targetX = obs.x + 100 * scale;
              obs.targetY = obs.y + CR_LANE_HEIGHT * scale;
            } else if (!obs.hasBraked && obs.dir < 0 && obs.x < containerSize.width * 0.6) {
              obs.state = 'braking';
              obs.brakeTimer = 0;
              obs.hasBraked = true; // Отмечаем, что торможение произошло
              obs.targetX = obs.x - 100 * scale;
              obs.targetY = obs.y + CR_LANE_HEIGHT * scale;
            }
          } else if (obs.special === 'diagonal' && obs.state === 'braking') {
            // Состояние торможения - машина замедляется и начинает поворачивать
            obs.brakeTimer += deltaTime;
            
            // Вычисляем прогресс торможения (от 0 до 1)
            const brakeProgress = Math.min(obs.brakeTimer / obs.brakeDuration, 1);
            
            // Замедляем движение во время торможения
            const brakeSpeed = speed * (1 - brakeProgress * 0.6); // Постепенно замедляемся до 40% от обычной скорости
            
            // Вычисляем угол поворота во время торможения
            const dx = obs.targetX - obs.x;
            const dy = obs.targetY - obs.y;
            const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            // Плавно поворачиваем от 0 до целевого угла
            obs.angle = targetAngle * brakeProgress;
            
            // Движемся в направлении поворота
            const moveSpeed = brakeSpeed * 0.8; // Немного медленнее во время поворота
            obs.x += Math.cos(targetAngle * Math.PI / 180) * moveSpeed;
            obs.y += Math.sin(targetAngle * Math.PI / 180) * moveSpeed;
            
            // После завершения торможения переходим к диагональному движению
            if (obs.brakeTimer >= obs.brakeDuration) {
              obs.state = 'diagonal';
            }
          } else if (obs.special === 'diagonal' && obs.state === 'diagonal') {
            // Диагональное движение - продолжаем движение в том же направлении
            const dx = obs.targetX - obs.x;
            const dy = obs.targetY - obs.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
              const moveSpeed = speed * 0.7; // Медленнее обычного движения
              obs.x += (dx / distance) * moveSpeed;
              obs.y += (dy / distance) * moveSpeed;
              
              // Сохраняем текущий угол поворота
              const angleRadians = Math.atan2(dy, dx);
              obs.angle = angleRadians * (180 / Math.PI);
            } else {
              // Достигли цели, возвращаемся к обычному движению
              obs.state = 'normal';
              obs.x = obs.targetX;
              obs.y = obs.targetY;
              obs.angle = 0; // Сбрасываем угол
              // НЕ сбрасываем hasBraked - торможение должно произойти только один раз
            }
          } else if (obs.special === 'hunter') {
            // Машина-охотник
            obs.huntTimer += deltaTimeSeconds;
            
            if (obs.huntTimer > 2) { // Начинаем преследование через 2 секунды
              // Очень медленно движемся к игроку
              const targetX = petX.current;
              const targetY = petY.current;
              
              const dx = targetX - obs.x;
              const dy = targetY - obs.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 10) {
                const huntSpeed = speed * 0.15; // Очень медленно (15% от обычной скорости)
                obs.x += (dx / distance) * huntSpeed;
                obs.y += (dy / distance) * huntSpeed;
              }
            } else {
              // Обычное движение до начала преследования
              obs.x += obs.dir * speed * 0.3; // Очень медленно (30% от обычной скорости)
            }
          }
        }
        
        // Удаляем машины, которые вышли за пределы экрана
        if (obs.x > containerSize.width + 100 * scale || obs.x < -100 * scale ||
            obs.y > containerSize.height + 100 * scale || obs.y < -100 * scale) {
          obstacles.current.splice(i, 1);
          if (carRefs.current[i]) {
            delete carRefs.current[i];
          }
        }
      }
      
      // Улучшенная система спавна машин
      spawnTimer.current += deltaTime;
      carGroupTimer.current += deltaTime;
      
      // Прогрессивная сложность: увеличиваем частоту спавна с уровнем
      const baseSpawnTime = Math.max(400, 1500 - (level - 1) * 80); // от 1.5 до 0.4 секунды (быстрее)
      const maxCars = Math.min(12 + Math.floor(level / 2), 20); // Еще больше машин на экране
      
      // Создание групп машин для более динамичного геймплея
      const groupSpawnTime = Math.max(2000, 6000 - (level - 1) * 300); // Группы появляются чаще
      
              // Добавляем случайность в спавн для непредсказуемости
        const randomSpawnTime = baseSpawnTime + (Math.random() - 0.5) * 200; // ±100ms случайности
        if (spawnTimer.current >= randomSpawnTime && obstacles.current.length < maxCars) {
        spawnTimer.current = 0;
        
        // Определяем активные дорожные полосы из текущей конфигурации
        let roadLanes = [];
        if (laneConfig && laneConfig.roadLanes) {
          roadLanes = laneConfig.roadLanes.slice(); // Копируем массив дорожных полос
        } else {
          // Если конфигурация не загружена, используем старую логику
          const lanes = Math.min(CR_LANE_COUNT, 3 + Math.floor(level / 3));
          for (let i = 0; i < lanes; i++) {
            if (i % 2 === 1) roadLanes.push(i);
          }
        }
        
        if (roadLanes.length > 0) {
          // Выбираем полосу с наименьшим количеством машин
          const laneCarCounts = {};
          roadLanes.forEach(laneIndex => {
            const laneY = containerSize.height - (laneIndex + 1) * CR_LANE_HEIGHT * scale;
            laneCarCounts[laneIndex] = obstacles.current.filter(obs => 
              Math.abs(obs.y - laneY) < CR_LANE_HEIGHT * scale / 2
            ).length;
          });
          
          // Находим полосы с наименьшим количеством машин
          const minCars = Math.min(...Object.values(laneCarCounts));
          const availableLanes = roadLanes.filter(laneIndex => laneCarCounts[laneIndex] === minCars);
          
          if (availableLanes.length > 0) {
            const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            const laneY = containerSize.height - (laneIndex + 1) * CR_LANE_HEIGHT * scale;
            const direction = laneIndex % 4 === 1 ? 1 : -1;
            const spawnX = direction > 0 ? -100 * scale : containerSize.width + 100 * scale;
            
            // Проверяем безопасное расстояние от других машин на той же полосе
            const carsOnLane = obstacles.current.filter(obs => 
              Math.abs(obs.y - laneY) < CR_LANE_HEIGHT * scale / 2
            );
            
            const minSafeDistance = 80 * scale; // Уменьшенное минимальное безопасное расстояние для более плотного потока
            const canSpawn = carsOnLane.every(car => {
              const distance = Math.abs(car.x - spawnX);
              return distance > minSafeDistance;
            });
            
            if (canSpawn) {
              const newCar = createCarObstacle(spawnX, laneY, direction, level);
              if (newCar) {
                obstacles.current.push(newCar);
              }
            }
          }
        }
      }
      
      // Создание групп машин для создания "потоков"
      if (carGroupTimer.current >= groupSpawnTime && obstacles.current.length < maxCars - 2) {
        carGroupTimer.current = 0;
        
        let roadLanes = [];
        if (laneConfig && laneConfig.roadLanes) {
          roadLanes = laneConfig.roadLanes.slice(); // Используем текущую конфигурацию полос
        } else {
          // Если конфигурация не загружена, используем старую логику
          const lanes = Math.min(CR_LANE_COUNT, 3 + Math.floor(level / 3));
          for (let i = 0; i < lanes; i++) {
            if (i % 2 === 1) roadLanes.push(i);
          }
        }
        
        if (roadLanes.length > 0) {
          const laneIndex = roadLanes[Math.floor(Math.random() * roadLanes.length)];
          const laneY = containerSize.height - (laneIndex + 1) * CR_LANE_HEIGHT * scale;
          const direction = laneIndex % 4 === 1 ? 1 : -1;
          
          // Создаем группу из 3-5 машин (более плотные группы)
          const groupSize = Math.min(3 + Math.floor(level / 3), 6);
          const minSpacing = 40 * scale; // Более плотное расположение машин в группе
          
          for (let j = 0; j < groupSize; j++) {
            const spawnX = direction > 0 
              ? -100 * scale - (j * minSpacing)
              : containerSize.width + 100 * scale + (j * minSpacing);
            
            const newCar = createCarObstacle(spawnX, laneY, direction, level);
            if (newCar) {
              obstacles.current.push(newCar);
            }
          }
        }
      }
      
      // Проверка столкновений
      const petLeft = petX.current;
      const petRight = petX.current + CR_PET_SIZE * scale;
      const petTop = petY.current;
      const petBottom = petY.current + CR_PET_SIZE * scale;
      
      // Определяем, на какой полосе находится питомец
      const petLaneIndex = Math.floor((containerSize.height - petY.current - CR_PET_SIZE * scale / 2) / (CR_LANE_HEIGHT * scale));
      const isPetOnRoadLane = isLaneRoad(petLaneIndex, laneConfig); // Используем динамическую конфигурацию
      
      // Проверяем коллизии с машинами
      for (let obs of obstacles.current) {
        // Для обычных машин проверяем только если питомец на дорожной полосе
        if (!obs.special && isPetOnRoadLane) {
          const obsLaneIndex = Math.floor((containerSize.height - obs.y - CR_OBSTACLE_HEIGHT * scale / 2) / (CR_LANE_HEIGHT * scale));
          
          // Проверяем коллизию только если препятствие на той же полосе
          if (obsLaneIndex === petLaneIndex) {
            if (
              petTop < obs.y + obs.sprite.displayHeight * scale &&
              petBottom > obs.y &&
              petLeft < obs.x + obs.sprite.displayWidth * scale &&
              petRight > obs.x
            ) {
              setGameOver(true);
              return;
            }
          }
        }
        // Для специальных машин (преследователи, диагональные) проверяем всегда
        else if (obs.special) {
          if (
            petTop < obs.y + obs.sprite.displayHeight * scale &&
            petBottom > obs.y &&
            petLeft < obs.x + obs.sprite.displayWidth * scale &&
            petRight > obs.x
          ) {
            setGameOver(true);
            return;
          }
        }
      }
      
      // Победа
      if (petY.current <= 0) {
        setWin(true);
        setScore(s => s + 1);
        return;
      }
      
      // Обновление рендера - обновляем каждый кадр для плавной анимации
      setRenderTick(t => t + 1);
      
      frame = requestAnimationFrame(loop);
    };
    
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameOver, win, level]);

  // Начисление счастья за победу и переход на следующий уровень
  useEffect(() => {
    if (win && !rewarded) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      // Начисляем 5% счастья за уровень
      const happinessGain = Math.floor(5 * level);
      const newHappiness = Math.min(100, currentHappiness + happinessGain);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
      // Через короткую паузу — следующий уровень
      setTimeout(() => {
        const newLevel = level + 1;
        setLevel(newLevel);
        if (onLevelChange) onLevelChange(newLevel);
        nextLevel();
      }, 1200);
    }
  }, [win, rewarded, updatePetStats, petId, getPetState, level]);

  // Начисление счастья при game over
  useEffect(() => {
    if (gameOver && !rewarded && score > 0) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      // Начисляем 5% счастья за уровень
      const happinessGain = Math.floor(5 * level);
      const newHappiness = Math.min(100, currentHappiness + happinessGain);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
    }
  }, [gameOver, rewarded, score, level, updatePetStats, petId, getPetState]);

  // Функция перехода на следующий уровень
  const nextLevel = () => {
    // Выбираем новый фоновый тайл
    setBackgroundTile(getRandomBackgroundTile());
    
    // Генерируем новую конфигурацию полос для этого уровня
    const newLaneConfig = generateLaneConfiguration(level);
    setLaneConfig(newLaneConfig);
    
    // Увеличиваем сложность: больше полос с препятствиями, выше скорость
    let obsArr = [];
    const totalLanes = newLaneConfig.totalLanes;
    

    
    for (let i = 0; i < totalLanes; i++) {
      const laneY = containerSize.height - (i + 1) * CR_LANE_HEIGHT * scale;
      const isRoadLane = newLaneConfig.lanes[i]; // Используем динамическую конфигурацию
      
      // Размещаем машины только на дорожных полосах
      if (isRoadLane) {
        // Улучшенное размещение машин с прогрессивной сложностью
        const baseCarsPerLane = Math.min(3 + Math.floor(level / 2), 6); // Больше машин на полосу
        const direction = i % 2 === 1 ? 1 : -1; // Чередуем направление движения для разнообразия
        
        // Создаем машины с лучшим распределением
        for (let j = 0; j < baseCarsPerLane; j++) {
          let spawnX;
          const minSpacing = 80 * scale; // Минимальное расстояние между машинами
          
          if (direction < 0) {
            // Машины справа налево
            spawnX = containerSize.width + 100 * scale + (j * minSpacing * 1.5);
          } else {
            // Машины слева направо
            spawnX = -100 * scale - (j * minSpacing * 1.5);
          }
          
          const newCar = createCarObstacle(spawnX, laneY, direction, level);
          if (newCar) {
            obsArr.push(newCar);

          }
        }
      }
    }
    obstacles.current = obsArr;
    // Очищаем refs для машин
    carRefs.current = {};
    petX.current = containerSize.width / 2 - CR_PET_SIZE * scale / 2;
    // Ставим питомца на самую нижнюю безопасную полосу (индекс 0)
    petY.current = containerSize.height - CR_PET_SIZE * scale - 8;
    setGameOver(false);
    setWin(false);
    setRewarded(false); // Сбрасываем флаг награды для нового уровня
    // Сбрасываем таймеры респауна
    spawnTimer.current = 0;
    carGroupTimer.current = 0;
    setRenderTick(t => t + 1);
  };

  // Инициализация игры
  useEffect(() => {
    if (obstacles.current.length > 0) return;
    console.log('Инициализация игры...');
    setLevel(1);
    if (onLevelChange) onLevelChange(1);
    setScore(0);
    // Принудительно обновляем конфигурацию полос для первого уровня
    setLaneConfig(generateLaneConfiguration(1));
    nextLevel();
    // Игра запускается автоматически

  }, []);

  // Игра запускается автоматически
  useEffect(() => {
    if (obstacles.current.length > 0) {
      // Игра уже запущена
    }
  }, [obstacles.current.length]);

  // Сброс игры
  const restart = () => {
    setLevel(1);
    if (onLevelChange) onLevelChange(1);
    setScore(0);
    setRewarded(false); // Сбрасываем флаг награды
    // Очищаем refs для машин
    carRefs.current = {};
    // Сбрасываем таймеры респауна
    spawnTimer.current = 0;
    carGroupTimer.current = 0;
    // Принудительно обновляем конфигурацию полос для первого уровня
    setLaneConfig(generateLaneConfiguration(1));
    nextLevel();
  };

  // Определяем мобильное устройство по ширине экрана
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  return (
    <div 
      ref={containerRef}
      key={renderTick}
      className="crossyroad-game" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        transform: 'none',
        transition: 'none',
        animation: 'none',

      }}
      tabIndex={0}
      onClick={(e) => {
        if (!gameOver && !win) {
          // Мобильное управление
          if (isMobile) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const width = rect.width;
            const height = rect.height;
            
            // Разделяем экран на области
            const isTopHalf = y < height / 2;
            const isLeftQuarter = x < width / 2;
            
            if (isTopHalf) {
              // Верхняя половина - движение вверх
              window.crossyMoveForward = true;
            } else {
              // Нижняя половина
              if (isLeftQuarter) {
                // Левая четвертинка - движение влево
                window.crossyMoveDir = -1;
                // Сбрасываем направление через короткое время
                setTimeout(() => {
                  window.crossyMoveDir = 0;
                }, 100);
              } else {
                // Правая четвертинка - движение вправо
                window.crossyMoveDir = 1;
                // Сбрасываем направление через короткое время
                setTimeout(() => {
                  window.crossyMoveDir = 0;
                }, 100);
              }
            }
          }
        }
      }}
    >
      <div
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          transform: 'none',
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',

        }}
      >
      {/* Фоновый спрайт для всей игры */}
      <img
        src={backgroundTile.src}
        alt="background"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          zIndex: 0,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      
      {/* Дороги (состоящие из нескольких блоков) */}
      {laneConfig && laneConfig.lanes && laneConfig.totalLanes > 0 && [...Array(laneConfig.totalLanes)].map((_, i) => {
        const laneY = containerSize.height - (i + 1) * CR_LANE_HEIGHT * scale;
        const isRoadLane = isLaneRoad(i, laneConfig); // Используем динамическую конфигурацию
        

        
        if (isRoadLane) {
          // Чередуем два типа дорожных тайлов для разнообразия
          const tileSprite = i % 2 === 1 ? roadTiles.road : roadTiles.roadAlt;
          
          // Создаем несколько блоков дороги для покрытия всей ширины
          const blocksNeeded = Math.ceil(containerSize.width / (tileSprite.displayWidth * scale)) + 1; // +1 для перекрытия
          
                      return [...Array(blocksNeeded)].map((_, blockIndex) => (
            <img
              key={`road-${i}-${blockIndex}`}
              src={tileSprite.src}
              alt="road tile"
              style={{
                position: 'absolute',
                left: blockIndex * tileSprite.displayWidth * scale,
                top: laneY,
                width: tileSprite.displayWidth * scale,
                height: tileSprite.displayHeight * scale,
                zIndex: 1,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          ));
        } else {
          return null; // Четные полосы теперь используют общий фоновый спрайт
        }
      })}
      {/* Препятствия - машины */}
      {obstacles.current.map((obs, idx) => (
        <img
          key={idx}
          ref={(el) => {
            if (el) {
              carRefs.current[idx] = el;
            }
          }}
          src={obs.sprite.src}
          alt="car"
          style={{
            position: 'absolute',
            left: obs.x,
            top: obs.y,
            width: obs.sprite.displayWidth * scale,
            height: obs.sprite.displayHeight * scale,
            zIndex: 2,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Питомец */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: petX.current,
          top: petY.current,
          width: CR_PET_SIZE * scale,
          height: CR_PET_SIZE * scale,
          zIndex: 3,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      {/* Победа */}
      {win && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          width: '100%',
          textAlign: 'center',
          color: '#22c55e',
          fontSize: 32,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #fff',
          zIndex: 20
        }}>
          Победа!<br />
          Уровень: {level}
        </div>
      )}
      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          width: '100%',
          textAlign: 'center',
          color: '#dc2626',
          fontSize: 32,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #fff',
          zIndex: 20
        }}>
          Проигрыш!<br />
          <div style={{ fontSize: 18, color: '#f59e0b', marginTop: 8 }}>
            Достигнут уровень: {level}<br />
            {score > 0 && `+${Math.floor(5 * level)} счастья`}
          </div>
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#64748b', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}


      {/* Не показываем стандартный оверлей победы и кнопку "заново" для Zuma, переход к следующему уровню автоматический */}

      {/* Визуальные индикаторы областей для мобильного управления */}
      {isMobile && !gameOver && !win && (
        <>
          {/* Верхняя половина - движение вверх */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderBottom: 'none',
            pointerEvents: 'none',
            zIndex: 15
          }}>
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              ↑ ВВЕРХ
            </div>
          </div>
          
          {/* Нижняя левая четвертинка - движение влево */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '50%',
            height: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: 'none',
            borderRight: 'none',
            pointerEvents: 'none',
            zIndex: 15
          }}>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              ← ВЛЕВО
            </div>
          </div>
          
          {/* Нижняя правая четвертинка - движение вправо */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '50%',
            height: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: 'none',
            borderLeft: 'none',
            pointerEvents: 'none',
            zIndex: 15
          }}>
            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              ВПРАВО →
            </div>
          </div>
        </>
      )}

      </div>
    </div>
  );
};

// --- Zuma MiniGame ---
const ZUMA_WIDTH = 320;
const ZUMA_HEIGHT = 420;
const ZUMA_PET_SIZE = 44;
const ZUMA_BALL_RADIUS = 16;
const ZUMA_BALL_COLORS = ['blue', 'orange', 'red', 'green'];
function getRandomBallColor() {
  return ZUMA_BALL_COLORS[Math.floor(Math.random() * ZUMA_BALL_COLORS.length)];
}
const ZUMA_CHAIN_LENGTH = 16;
// Константы теперь в единицах "на секунду"
const ZUMA_CHAIN_SPEED_PER_SECOND = 24;
// ZUMA_BALL_SPACING будет вычисляться динамически в компоненте
// Адаптивный зигзагообразный путь внутри контейнера
const PADDING_X = 30;
const PADDING_Y = 30;
const ROWS = 5; // последний ряд не входит в путь
const ZUMA_PATH = [];
for (let row = 0; row < ROWS; row++) {
  const y = PADDING_Y + row * ((ZUMA_HEIGHT - 2 * PADDING_Y) / (ROWS - 1));
  if (row % 2 === 0) {
    // слева направо
    ZUMA_PATH.push({ x: PADDING_X, y });
    ZUMA_PATH.push({ x: ZUMA_WIDTH - PADDING_X, y });
  } else {
    // справа налево
    ZUMA_PATH.push({ x: ZUMA_WIDTH - PADDING_X, y });
    ZUMA_PATH.push({ x: PADDING_X, y });
  }
}

// Функция для интерполяции по пути и вычисления длины пути
function getPathSegments(path) {
  let total = 0;
  const segLens = [];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i + 1].x - path[i].x;
    const dy = path[i + 1].y - path[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    total += len;
  }
  return { segLens, total };
}
function getPointOnPath(path, t) {
  // t: 0..1 по всей длине пути
  const { segLens, total } = getPathSegments(path);
  let dist = t * total;
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      const ratio = dist / segLens[i];
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * ratio,
        y: path[i].y + (path[i + 1].y - path[i].y) * ratio
      };
    }
    dist -= segLens[i];
  }
  // конец пути
  return { ...path[path.length - 1] };
}

// --- Zuma Sprite System ---
const ZUMA_SPRITES = {
  blue: {
    sawShark: {
      src: 'sprites/minigames/zuma/blue/SawShark.png',
      frames: 8,
      width: 384,
      height: 64,
      frameWidth: 48,
      frameHeight: 32,
      rows: 2
    },
    seaAngler: {
      src: 'sprites/minigames/zuma/blue/SeaAngler.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 32,
      rows: 2
    },
    shark: {
      src: 'sprites/minigames/zuma/blue/Shark.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 32,
      rows: 2
    }
  },
  green: {
    green: {
      src: 'sprites/minigames/zuma/green/Green.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 16,
      rows: 4
    }
  },
  orange: {
    orange1: {
      src: 'sprites/minigames/zuma/orange/1.png',
      frames: 8,
      width: 128,
      height: 64,
      frameWidth: 16,
      frameHeight: 16,
      rows: 4
    },
    orange2: {
      src: 'sprites/minigames/zuma/orange/2.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 16,
      rows: 4
    },
    orange3: {
      src: 'sprites/minigames/zuma/orange/3.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 16,
      rows: 4
    }
  },
  pink: {
    pink1: {
      src: 'sprites/minigames/zuma/pink/1.png',
      frames: 8,
      width: 128,
      height: 64,
      frameWidth: 16,
      frameHeight: 16,
      rows: 4
    }
  },
  purple: {
    purple1: {
      src: 'sprites/minigames/zuma/purple/1.png',
      frames: 8,
      width: 128,
      height: 64,
      frameWidth: 16,
      frameHeight: 16,
      rows: 4
    },
    purple2: {
      src: 'sprites/minigames/zuma/purple/2.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 16,
      rows: 4
    }
  },
  red: {
    red1: {
      src: 'sprites/minigames/zuma/red/1.png',
      frames: 8,
      width: 128,
      height: 64,
      frameWidth: 16,
      frameHeight: 16,
      rows: 4
    },
    red2: {
      src: 'sprites/minigames/zuma/red/2.png',
      frames: 8,
      width: 256,
      height: 64,
      frameWidth: 32,
      frameHeight: 16,
      rows: 4
    }
  }
};

// Функция для получения случайного спрайта по цвету
function getRandomSpriteForColor(color) {
  const colorSprites = ZUMA_SPRITES[color];
  if (!colorSprites) return null;
  
  const spriteNames = Object.keys(colorSprites);
  const randomSpriteName = spriteNames[Math.floor(Math.random() * spriteNames.length)];
  const sprite = colorSprites[randomSpriteName];
  
  // Добавляем случайный ряд для спрайтов с несколькими рядами
  if (sprite.rows && sprite.rows > 1) {
    const randomRow = Math.floor(Math.random() * sprite.rows);
    return { ...sprite, currentRow: randomRow };
  }
  
  return sprite;
}

// Функция для создания шара с фиксированным спрайтом
function createBallWithSprite(color) {
  const sprite = getRandomSpriteForColor(color);
  return {
    color: color,
    sprite: sprite,
    animationOffset: Math.floor(Math.random() * 8) // Случайное смещение анимации
  };
}

// Функция для определения направления движения шара на основе его позиции на пути
function getBallDirection(t) {
  // Определяем, на каком сегменте пути находится шар
  const { segLens, total } = getPathSegments(ZUMA_PATH);
  let dist = t * total;
  let segmentIndex = 0;
  
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      segmentIndex = i;
      break;
    }
    dist -= segLens[i];
  }
  
  // Определяем направление сегмента
  const segment = ZUMA_PATH[segmentIndex + 1];
  const prevSegment = ZUMA_PATH[segmentIndex];
  return segment.x > prevSegment.x ? 1 : -1; // 1 = вправо, -1 = влево
}

// Функция для получения CSS для анимированного спрайта
function getSpriteStyle(sprite, currentFrame = 0, row = 0, scale = 1) {
  if (!sprite) return {};
  
  // Ограничиваем currentFrame количеством кадров в спрайте
  const maxFrames = sprite.frames || 8;
  const clampedFrame = currentFrame % maxFrames;
  
  const frameX = clampedFrame * sprite.frameWidth;
  const frameY = row * sprite.frameHeight;
  

  
  const style = {
    backgroundImage: `url(${getStaticPath(sprite.src)})`,
    backgroundPosition: `-${frameX * scale}px -${frameY * scale}px`,
    backgroundSize: `${sprite.frameWidth * sprite.frames * scale}px ${sprite.frameHeight * sprite.rows * scale}px`,
    width: `${sprite.frameWidth * scale}px`,
    height: `${sprite.frameHeight * scale}px`,
    backgroundRepeat: 'no-repeat'
  };
  
  
  
  return style;
}

// ZumaGame с forwardRef
const ZumaGame = React.forwardRef(({ petSprite, onClose, petId, onLevelChange, onNextBallChange, onSpriteFrameChange }, ref) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [score, setScore] = useState(0);
  const [animations, setAnimations] = useState([]);
  const [level, setLevel] = useState(1);
  
  // Динамическое вычисление масштаба для minigame-container
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 288, height: 376 });
  const [scale, setScale] = useState(1);
  
  // Динамическое вычисление размера контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width || 288;
      const height = rect.height || 376;
      
      // Определяем, мобильная это версия или десктопная по размеру окна
      const isMobile = window.innerWidth < 700;
      
      if (isMobile) {
        // Мобильная версия - используем фиксированные размеры
        setContainerSize({ width: 288, height: 376 });
        const scaleX = 288 / ZUMA_WIDTH;
        const scaleY = 376 / ZUMA_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
      } else {
        // Десктопная версия - используем динамические размеры
        setContainerSize({ width, height });
        const scaleX = width / ZUMA_WIDTH;
        const scaleY = height / ZUMA_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
      }
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  const isInMinigameContainer = true; // Всегда true для Zuma в телефоне
  
  // Создаем динамический путь ZUMA_PATH для новых размеров
  const ZUMA_PATH = useMemo(() => {
    const path = [];
    const PADDING_X = 30 * scale;
    const PADDING_Y = 30 * scale;
    const ROWS = 5; // последний ряд не входит в путь
    
    for (let row = 0; row < ROWS; row++) {
      const y = PADDING_Y + row * ((containerSize.height - 2 * PADDING_Y) / (ROWS - 1));
      if (row % 2 === 0) {
        // слева направо
        path.push({ x: PADDING_X, y });
        path.push({ x: containerSize.width - PADDING_X, y });
      } else {
        // справа налево
        path.push({ x: containerSize.width - PADDING_X, y });
        path.push({ x: PADDING_X, y });
      }
    }
    return path;
  }, [containerSize.width, containerSize.height, scale]);
  
  // Динамическое вычисление расстояния между шарами
  const ZUMA_BALL_SPACING = ZUMA_BALL_RADIUS * 2 * scale - 2 * scale;
  
  // Функция для вычисления параметров уровня
  const getLevelParams = (currentLevel) => {
    const BASE_CHAIN_LENGTH = 12;
    const BASE_ROWS = 4;
    const BASE_SPEED = 0.4;
    const MAX_CHAIN_LENGTH = 24;
    const MAX_ROWS = 7;
    const MAX_SPEED = BASE_SPEED * 1.5;
    
    const chainLength = Math.min(BASE_CHAIN_LENGTH + (currentLevel - 1) * 2, MAX_CHAIN_LENGTH);
    const rows = Math.min(BASE_ROWS + Math.floor((currentLevel - 1) / 2), MAX_ROWS);
    const speed = Math.min(BASE_SPEED * (1 + 0.05 * (currentLevel - 1)), MAX_SPEED);
    
    return {
      chainLength,
      rows,
      speed: speed * 60 // конвертируем скорость "на кадр" в "на секунду"
    };
  };

  // Состояние для параметров уровня
  const [levelParams, setLevelParams] = useState(getLevelParams(level));
  const ZUMA_CHAIN_LENGTH = levelParams.chainLength;
  const ZUMA_CHAIN_SPEED = levelParams.speed;
  const ROWS = levelParams.rows;

  // Обновляем параметры уровня при изменении уровня
  useEffect(() => {
    setLevelParams(getLevelParams(level));
  }, [level]);

  // refs для физики
  const petX = useRef(0);
  const petY = useRef(0);
  
  // Инициализация позиции питомца после получения размеров контейнера
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && scale > 0) {
      petX.current = containerSize.width / 2;
      petY.current = containerSize.height - ZUMA_PET_SIZE * scale / 2 - 60 * scale; // Подняли питомца выше последней строки шаров
    }
  }, [containerSize.width, containerSize.height, scale]);
  const aimAngle = useRef(0); // угол прицеливания (радианы)
  const chain = useRef([]); // [{t, color}]
  const shot = useRef(null); // {x, y, dx, dy, color}
  const chainHeadT = useRef(0); // прогресс головы цепочки (0..1)
  const nextBallRef = useRef((() => {
    const color = getRandomBallColor();
    const ball = createBallWithSprite(color);
    return ball;
  })());
  
  const [nextBall, setNextBall] = useState(nextBallRef.current);
  // ref для позиции головы цепочки (в пикселях по длине пути)
  const headDistRef = useRef(0);
  const [joystickActive, setJoystickActive] = useState(false);

  // Определяем мобильное устройство по ширине экрана
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Переменные для анимации 2-го слоя фона
  const [layer2Position, setLayer2Position] = useState(0);
  const [layer2DirectionState, setLayer2DirectionState] = useState(-1); // Состояние для React
  const layer2Speed = 20; // пикселей в секунду
  const layer2Ref = useRef(null); // Ref для прямого управления DOM
  
  // Состояние для анимации спрайтов
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [spriteAnimationTime, setSpriteAnimationTime] = useState(0);
  const [ballAnimationOffsets, setBallAnimationOffsets] = useState({});
  const [ballRefs, setBallRefs] = useState({});
  const frameCountRef = useRef(0);
  const spriteFrameRef = useRef(0); // Добавляем ref для spriteFrame

  // Простая анимация для 2-го слоя фона
  useEffect(() => {
    let frame;
    let lastTime = performance.now();
    let currentDirection = -1; // -1 = влево, +1 = вправо
    let currentPosition = 0;
    
    const animateLayer2 = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaTimeSeconds = deltaTime / 1000;
      
      // Движение слоя
      const movement = layer2Speed * deltaTimeSeconds * currentDirection;
      currentPosition += movement;
      
      // Проверяем границы
      if (currentPosition <= -50) {
        // Достигли левой границы - отражаемся вправо
        currentDirection = 1;
        currentPosition = -50;
      } else if (currentPosition >= 50) {
        // Достигли правой границы - отражаемся влево
        currentDirection = -1;
        currentPosition = 50;
      }
      
      // Обновляем состояние React
      setLayer2Position(currentPosition);
      setLayer2DirectionState(currentDirection);
      
      // Обновляем состояние React для отражения
      setLayer2DirectionState(currentDirection);
      
      frame = requestAnimationFrame(animateLayer2);
    };
    
    frame = requestAnimationFrame(animateLayer2);
    
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []); // Пустой массив зависимостей - запускается только один раз

  // useEffect для отзеркаливания шаров
  useEffect(() => {
    chain.current.forEach((ball, idx) => {
      if (ballRefs[idx] && ballRefs[idx].current) {
        const direction = getBallDirection(ball.t);
        ballRefs[idx].current.style.setProperty('transform', direction === -1 ? 'scaleX(-1)' : 'scaleX(1)', 'important');
      }
    });
  }, [spriteFrame, ballRefs]); // Зависит от кадра анимации и refs

  // Обработчики для react-joystick-component джойстика
  const handleJoystickMove = (evt, data) => {
    
    // react-joystick-component может передавать данные в разных форматах
    let x, y;
    
    if (data && typeof data.x === 'number' && typeof data.y === 'number') {
      // Формат: { x, y }
      x = data.x;
      y = data.y;
    } else if (data && data.direction && data.direction.x !== undefined && data.direction.y !== undefined) {
      // Формат: { direction: { x, y } }
      x = data.direction.x;
      y = data.direction.y;
    } else if (evt && evt.x !== undefined && evt.y !== undefined) {
      // Формат: данные прямо в событии
      x = evt.x;
      y = evt.y;
    } else {
      return;
    }
    
    // Вычисляем угол из координат
    const angle = Math.atan2(y, x);
    // Наша система: 0 = вверх, π/2 = вправо
    // Инвертируем для правильного соответствия
    const correctedAngle = -angle + Math.PI / 2;
    aimAngle.current = correctedAngle;
    setJoystickActive(true);
  };

  const handleJoystickEnd = (evt) => {
    setJoystickActive(false);
  };
  const handleMobileShootWrapped = (e) => {
    if (e.stopPropagation) e.stopPropagation();
    shoot();
  };

  // Кнопка стрельбы для мобильных
  const handleMobileShoot = (e) => {
    // Не используем preventDefault для touch событий (они passive по умолчанию)
    shoot();
  };

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') aimAngle.current -= Math.PI / 36;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') aimAngle.current += Math.PI / 36;
      if (e.code === 'Space') shoot();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Выстрел
  const shoot = () => {
    if (shot.current || gameOver || win) return;
    

    
    const angle = aimAngle.current;
    const speed = 7;
    shot.current = {
      x: petX.current,
      y: petY.current,
      dx: Math.sin(angle) * speed,
      dy: -Math.cos(angle) * speed,
      color: nextBallRef.current.color,
      sprite: nextBallRef.current.sprite
    };
    
    // Создаем новый шар для следующего выстрела
    const newColor = getRandomBallColor();
    const newBall = createBallWithSprite(newColor);
    
    // Обновляем ref и состояние
    nextBallRef.current = newBall;
    setNextBall(newBall);
    
    // Уведомляем родительский компонент о смене шара
    if (onNextBallChange) {
      onNextBallChange(newBall);
    }
  };

  // Игровой цикл без мобильных оптимизаций
  useEffect(() => {
    // Анимация спрайтов должна работать всегда, независимо от состояния игры
    // if (gameOver || win) return;
    let frame;
    let lastTime = performance.now();
    
    const loop = (currentTime) => {

      
      const currentFrameCount = frameCountRef.current + 1;
      frameCountRef.current = currentFrameCount;
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      // Убираем ограничение deltaTime для лучшего игрового процесса
      const deltaTimeSeconds = deltaTime / 1000;
      
      // Движение цепочки - без пропуска кадров
      const { total: totalLength } = getPathSegments(ZUMA_PATH);
      headDistRef.current += ZUMA_CHAIN_SPEED * deltaTimeSeconds;
      for (let i = 0; i < chain.current.length; i++) {
        const t = (headDistRef.current - i * ZUMA_BALL_SPACING) / totalLength;
        chain.current[i].t = Math.max(0, t);
      }
      // Проверка проигрыша: если головной шар дошёл до конца пути
      if (chain.current.length > 0 && chain.current[0].t >= 1) {
        setGameOver(true);
        // НЕ ПРЕРЫВАЕМ ЦИКЛ - анимация спрайтов должна работать всегда
        // return;
      }
      // Анимация вставки
      if (animations.length > 0) {
        let changed = false;
        const now = performance.now();
        setAnimations(prev => prev.filter(anim => {
          if (anim.type === 'insert') {
            const { index, fromT, toT, startTime } = anim;
            const progress = Math.min(1, (now - startTime) / ANIMATION_DURATION);
            if (chain.current[index]) {
              chain.current[index].t = fromT + (toT - fromT) * progress;
              changed = true;
            }
            if (progress >= 1) return false;
            return true;
          }
          if (anim.type === 'disappear') {
            // handled in render
            const progress = Math.min(1, (now - anim.startTime) / ANIMATION_DURATION);
            if (progress >= 1) return false;
            return true;
          }
          if (anim.type === 'collapse') {
            // сжатие всей цепочки
            const { fromTs, toTs, startTime, onEnd } = anim;
            const progress = Math.min(1, (now - startTime) / ANIMATION_DURATION);
            for (let j = 0; j < fromTs.length; j++) {
              if (chain.current[anim.startIndex + j]) {
                chain.current[anim.startIndex + j].t = fromTs[j] + (toTs[j] - fromTs[j]) * progress;
                changed = true;
              }
            }
            if (progress >= 1) {
              if (onEnd) onEnd();
              return false;
            }
            return true;
          }
          return false;
        }));
              // Убираем дополнительные ререндеры для анимаций
      if (changed) setRenderTick(t => t + 1);
      }
      // Движение выстрела - всегда активно
      if (shot.current) {
        shot.current.x += shot.current.dx;
        shot.current.y += shot.current.dy;
        // Проверка выхода за пределы
        if (
          shot.current.x < 0 || shot.current.x > containerSize.width ||
          shot.current.y < 0 || shot.current.y > containerSize.height
        ) {
          shot.current = null;
        }
      }
      // Проверка попадания выстрела в цепочку
      if (shot.current) {
        for (let i = 0; i < chain.current.length; i++) {
          if (!shot.current) break;
          const ballPos = getPointOnPath(ZUMA_PATH, chain.current[i].t);
          const dx = shot.current.x - ballPos.x;
          const dy = shot.current.y - ballPos.y;
          if (dx * dx + dy * dy < (ZUMA_BALL_RADIUS * scale * 2) ** 2) {

            
            // Сохраняем координаты выстрела ДО сброса shot.current
            const shotPos = { x: shot.current.x, y: shot.current.y, color: shot.current.color };
            // Вставляем шарик в цепочку
            const t = chain.current[i].t;
            const ball = createBallWithSprite(shot.current.color);
            chain.current.splice(i, 0, { t, ...ball });
            

            // Анимация вставки
            setAnimations(prev => [...prev, {
              type: 'insert',
              index: i,
              fromT: t, // shotPos.x/y можно использовать для визуальной анимации, если нужно
              toT: t,
              startTime: performance.now()
            }]);
            // Пересчитать t для всей цепочки, чтобы не было наложения
            let headDist2 = headDistRef.current;
            for (let j = 0; j < chain.current.length; j++) {
              chain.current[j].t = Math.max(0, (headDist2 - j * ZUMA_BALL_SPACING) / totalLength);
            }
            // Проверка совпадений
            let left = i, right = i;
            while (left > 0 && chain.current[left - 1].color === shot.current.color) left--;
            while (right < chain.current.length - 1 && chain.current[right + 1].color === shot.current.color) right++;
            if (right - left + 1 >= 3) {
              // Анимация исчезновения
              setAnimations(prev => [...prev, ...Array.from({length: right - left + 1}, (_, k) => ({
                type: 'disappear',
                index: left + k,
                startTime: performance.now()
              }))]);
              setTimeout(() => {
                // Сохраняем старые t для всех оставшихся шаров (все, кроме удаляемых)
                const fromTs = [];
                for (let i = 0; i < chain.current.length; i++) {
                  if (i < left || i > right) fromTs.push(chain.current[i].t);
                }
                // Удаляем совпавшие шары
                chain.current.splice(left, right - left + 1);
                setScore(s => s + (right - left + 1));
                // Пересчитываем новые t для head и tail
                const ballsLeft = chain.current.length;
                const totalLength = getPathSegments(ZUMA_PATH).total;
                // Индекс первого шара хвоста после splice
                const tailStartIdx = left;
                let newHeadT = 0;
                if (chain.current[tailStartIdx]) {
                  // Есть хвост: позиция головы = t первого шара хвоста
                  newHeadT = chain.current[tailStartIdx].t;
                } else if (chain.current.length > 0) {
                  // Хвоста нет: позиция головы = t последнего head
                  newHeadT = chain.current[chain.current.length - 1].t;
                }
                // Новые t для head: head сдвигается к хвосту, tail остаётся
                const toTs = [];
                for (let j = 0; j < chain.current.length; j++) {
                  if (j < tailStartIdx) {
                    // head: новые t = newHeadT + spacing * (tailStartIdx - 1 - j)
                    toTs.push(Math.max(0, newHeadT + (tailStartIdx - 1 - j) * ZUMA_BALL_SPACING / totalLength));
                  } else {
                    // tail: t не меняется
                    toTs.push(chain.current[j].t);
                  }
                }
                if (fromTs.length > 0 && toTs.length > 0) {
                  setAnimations(prev => [...prev, {
                    type: 'collapse',
                    startIndex: 0,
                    fromTs,
                    toTs,
                    startTime: performance.now(),
                    onEnd: () => {
                      // После сжатия: позиция головы = newHeadT + (tailStartIdx - 1) * spacing
                      headDistRef.current = (newHeadT * totalLength) + (tailStartIdx - 1) * ZUMA_BALL_SPACING;
                    }
                  }]);
                } else {
                  headDistRef.current = (newHeadT * totalLength) + (tailStartIdx - 1) * ZUMA_BALL_SPACING;
                }
              }, ANIMATION_DURATION);
            }
            shot.current = null;
            break;
          }
        }
      }
      
      // Победа
      if (chain.current.length === 0) {
        setWin(true);
        // Уведомляем родительский компонент об изменении уровня
        if (onLevelChange) {
          onLevelChange(level + 1);
        }
        return;
      }
      // Обновление рендера - только при необходимости
      if (frameCountRef.current % 2 === 0) { // Обновляем каждые 2 кадра для плавности
        setRenderTick(t => t + 1);
      }
      

      
      // Анимация спрайтов - всегда активна
      setSpriteAnimationTime(prev => {
        const newTime = prev + deltaTimeSeconds;
        if (newTime >= 0.2) { // Смена кадра каждые 0.2 секунды
          const newFrame = (spriteFrameRef.current + 1) % 8;
          spriteFrameRef.current = newFrame;
          setSpriteFrame(newFrame);
          
          // Принудительно обновляем renderTick для перерисовки
          setRenderTick(prev => prev + 1);
          
          console.log('ANIMATION FRAME UPDATE:', {
            newFrame,
            spriteFrame,
            renderTick
          });
          
          // Уведомляем родительский компонент о смене кадра
          if (onSpriteFrameChange) {
            onSpriteFrameChange(newFrame);
          }
          return 0;
        }
        return newTime;
      });
      
      // Принудительное обновление анимации для мобильных устройств - убрано, так как вызывает проблемы
      
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameOver, win, animations, renderTick, spriteFrame]);

  // Начисление счастья за победу
  useEffect(() => {
    if (win && !rewarded) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      const newHappiness = Math.min(100, currentHappiness + 30);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
    }
  }, [win, rewarded, updatePetStats, petId, getPetState]);

  // После победы (win === true)
  useEffect(() => {
    if (win && !rewarded) {
      // Начислить счастье питомцу за уровень
      if (petId) {
        const pet = getPetState(petId);
        if (pet) {
          const newHappiness = Math.min(100, (pet.happiness || 0) + 50);
          updatePetStats(petId, { happiness: newHappiness });
        }
      }
      setRewarded(true);
    }
  }, [win, rewarded, petId, getPetState, updatePetStats]);

  // Сброс rewarded при старте нового уровня или рестарте
  useEffect(() => {
    if (!win) setRewarded(false);
  }, [win, level]);

  // Автоматический переход на следующий уровень после победы
  useEffect(() => {
    if (win) {
      const timer = setTimeout(() => {
        setWin(false); // Сбросить win до перехода, чтобы автопереход не повторялся
        handleNextLevel();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [win]);

  // Инициализация цепочки
  useEffect(() => {
    if (chain.current.length > 0) return;
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < ZUMA_CHAIN_LENGTH; i++) {
      const color = getRandomBallColor();
      const ball = createBallWithSprite(color);
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        ...ball
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0; // Инициализация headDistRef
    setScore(0);
  }, []);

  // Сброс игры
  const restart = () => {
    setLevel(1);
    const currentLevelParams = getLevelParams(1);
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < currentLevelParams.chainLength; i++) {
      const color = getRandomBallColor();
      const ball = createBallWithSprite(color);
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        ...ball
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0; // Сброс headDistRef
    setScore(0);
    setGameOver(false);
    setWin(false);
    setRewarded(false);
    const newColor = getRandomBallColor();
    const newBall = createBallWithSprite(newColor);
    nextBallRef.current = newBall;
    setNextBall(newBall);
    setRenderTick(t => t + 1);
  };

  // Управление мышью (прицеливание и выстрел)
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Масштабируем координаты мыши под размер контейнера
    const scaledMx = mx * (containerSize.width / rect.width);
    const scaledMy = my * (containerSize.height / rect.height);
    aimAngle.current = Math.atan2(scaledMx - petX.current, petY.current - scaledMy);
  };
  const handleMouseDown = () => {
    shoot();
  };

  // Кнопка для перехода к следующему уровню
  const handleNextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    // Уведомляем родительский компонент об изменении уровня
    if (onLevelChange) {
      onLevelChange(newLevel);
    }
    
    setWin(false);
    setGameOver(false);
    setScore(0);
    setRewarded(false);
    setAnimations([]);
    // Сбросить цепочку и выстрел с новыми параметрами уровня
    const currentLevelParams = getLevelParams(newLevel);
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < currentLevelParams.chainLength; i++) {
      const color = getRandomBallColor();
      const ball = createBallWithSprite(color);
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        ...ball
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0;
    const newColor = getRandomBallColor();
    const newBall = createBallWithSprite(newColor);
    nextBallRef.current = newBall;
    setNextBall(newBall);
    
    // Уведомляем родительский компонент о смене шара
    if (onNextBallChange) {
      onNextBallChange(newBall);
    }
  };



  React.useImperativeHandle(ref, () => ({
    handleJoystickMove,
    handleJoystickEnd,
    handleMobileShoot,
  }));

  // Уведомляем родительский компонент об изменениях
  useEffect(() => { 
    if (onLevelChange) onLevelChange(level); 
  }, [level, onLevelChange]);
  
  useEffect(() => { 
    if (onNextBallChange && nextBall) {
      onNextBallChange(nextBall);
    }
  }, [nextBall, onNextBallChange]);
  
  useEffect(() => { 
    if (onSpriteFrameChange) {
      onSpriteFrameChange(spriteFrame);
    }
  }, [spriteFrame, onSpriteFrameChange]);

  return (
    <div
      ref={containerRef}
      key={renderTick}
      className="zuma-game"
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        overflow: 'hidden',
        transform: 'none',
        transition: 'none',
        animation: 'none'
      }}
      tabIndex={0}
      onClick={undefined}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          width: `${containerSize.width}px`,
          height: `${containerSize.height}px`,
          transform: 'none',
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden'
        }}
      >
      {/* Многослойный анимированный фон */}
      {/* Слой 1 - статичный фон */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${getStaticPath('sprites/minigames/zuma/background/1.png')})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        zIndex: 0,
      }} />
      
      {/* Слой 2 - анимированный слой */}
      <div 
        key={`layer2-${layer2DirectionState}-${renderTick}`}
        style={{
          position: 'absolute',
          top: 0,
          left: layer2Position,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${getStaticPath('sprites/minigames/zuma/background/2.png')})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          zIndex: 1,
          transform: layer2DirectionState === 1 ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-in-out', // Плавный переход для отзеркаливания
        }} 
        onError={(e) => {
          console.error('Ошибка загрузки изображения 2-го слоя:', e);
        }}
        ref={layer2Ref}
      />
      
      {/* Слой 3 - статичный слой */}
      <div style={{
        position: 'absolute',
        top: 68,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${getStaticPath('sprites/minigames/zuma/background/3.png')})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        zIndex: 2,
      }} />
      
      {/* Слой 4 - статичный слой - УБРАН для мобильного представления */}
      {/* <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${getStaticPath('sprites/minigames/zuma/background/4.png')})`,
        backgroundSize: `${ZUMA_WIDTH}px ${ZUMA_HEIGHT}px`,
        backgroundPosition: 'center',
        zIndex: 3,
      }} /> */}

      {/* Цепочка */}
      {chain.current.map((ball, idx) => {
        const pos = getPointOnPath(ZUMA_PATH, ball.t);
        // Анимация исчезновения
        const disappearAnim = animations.find(a => a.type === 'disappear' && a.index === idx);
        const disappearScale = disappearAnim ? 1 - Math.min(1, (performance.now() - disappearAnim.startTime) / ANIMATION_DURATION) : 1;
        const opacity = disappearAnim ? disappearScale : 1;
        
        // Используем сохраненный спрайт шара с индивидуальным смещением анимации
        const sprite = ball.sprite;
        const frameWithOffset = (spriteFrame + (ball.animationOffset || 0)) % 8;
        const direction = getBallDirection(ball.t);
        

        

        
        // Создаем ref для шара, если его еще нет
        if (!ballRefs[idx]) {
          ballRefs[idx] = React.createRef();
        }
        
        return (
          <div 
            key={`ball-${idx}-${renderTick}`} 
            ref={ballRefs[idx]}
            className="zuma-sprite-animation"
            style={{
              position: 'absolute',
              left: pos.x - (sprite ? sprite.frameWidth * scale / 2 : ZUMA_BALL_RADIUS * scale),
              top: pos.y - (sprite ? sprite.frameHeight * scale / 2 : ZUMA_BALL_RADIUS * scale),
              zIndex: 10,
              transform: `${direction === -1 ? 'scaleX(-1)' : ''}`,
              opacity,
              transition: disappearAnim ? 'none' : 'transform 0.1s',
  
              ...getSpriteStyle(sprite, frameWithOffset, sprite.currentRow || 0, 1)
            }} 
          />
        );
      })}
      {/* Выстрел */}
      {shot.current && (
        <div 
          key={`shot-${renderTick}`}
          className="zuma-sprite-animation"
          style={{
            position: 'absolute',
            left: shot.current.x - ZUMA_BALL_RADIUS * scale,
            top: shot.current.y - ZUMA_BALL_RADIUS * scale,
            width: ZUMA_BALL_RADIUS * 2 * scale,
            height: ZUMA_BALL_RADIUS * 2 * scale,
            zIndex: 10,
            ...getSpriteStyle(shot.current.sprite, spriteFrame, shot.current.sprite.currentRow || 0, 1)
          }} 
        />
      )}
      {/* Прицел */}
      <svg width={containerSize.width} height={containerSize.height} style={{ position: 'absolute', left: 0, top: 0, zIndex: 10, pointerEvents: 'none' }}>
        <line
          x1={petX.current}
          y1={petY.current}
          x2={petX.current + Math.sin(aimAngle.current) * 80}
          y2={petY.current - Math.cos(aimAngle.current) * 80}
          stroke="#ffffff"
          strokeWidth={3}
          strokeDasharray="8 8"
        />
      </svg>

      {/* Питомец-стрелок */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: petX.current - ZUMA_PET_SIZE * scale / 2,
          top: petY.current - ZUMA_PET_SIZE * scale / 2,
          width: ZUMA_PET_SIZE * scale,
          height: ZUMA_PET_SIZE * scale,
          zIndex: 10,
          userSelect: 'none',
          pointerEvents: 'none',
          transform: `rotate(${aimAngle.current * 180 / Math.PI}deg)`,
        }}
      />
      {/* Победа и кнопка Заново не отображаются для Zuma, переход к следующему уровню автоматический */}
      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          width: '100%',
          textAlign: 'center',
          color: '#dc2626',
          fontSize: 32,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px #fff',
          zIndex: 20
        }}>
          Проигрыш!<br />
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#64748b', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}



      </div>
    </div>
  );
});

const FlyingOverCityGame = React.forwardRef(({ petSprite, onClose, petId }, ref) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  
  // Динамическое вычисление масштаба для minigame-container
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 288, height: 376 });
  const [scale, setScale] = useState(1);
  
  // Динамическое вычисление размера контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const width = rect.width || 288;
      const height = rect.height || 376;
      
      // Определяем, мобильная это версия или десктопная по размеру окна
      const isMobile = window.innerWidth < 700;
      
      if (isMobile) {
        // Мобильная версия - используем фиксированные размеры
        setContainerSize({ width: 288, height: 376 });
        const scaleX = 288 / GAME_WIDTH;
        const scaleY = 376 / GAME_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
      } else {
        // Десктопная версия - используем динамические размеры
        setContainerSize({ width, height });
        const scaleX = width / GAME_WIDTH;
        const scaleY = height / GAME_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
      }
    };
    
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  const isInMinigameContainer = true; // Всегда true для FlyingOverCity в телефоне

  // refs для физики - инициализируем после получения containerSize
  const petX = useRef(0);
  const petY = useRef(0);
  const velocityY = useRef(0);
  const obstacles = useRef([]);
  const backgroundLayers = useRef([]);
  const backgroundSet = useRef(getRandomBackgroundSet());
  
  // refs для параллакс фона
  const backgroundY = useRef(0);
  
  // Инициализация позиции питомца после получения размеров контейнера
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0 && scale > 0) {
      petX.current = containerSize.width / 2 - getScaledFlappyPetSize(scale) / 2;
      petY.current = containerSize.height / 2;
    }
  }, [containerSize.width, containerSize.height, scale]);
  
  // Экспортируем функцию прыжка через ref
  React.useImperativeHandle(ref, () => ({
    jump: () => {
      if (!gameOver) {
        velocityY.current = JUMP_VELOCITY;
      }
    }
  }));

  // Награждение питомца
  useEffect(() => {
    if (gameOver && !rewarded && score > 0) {
      const petState = getPetState(petId);
      if (petState) {
        const newHappiness = Math.min(100, petState.happiness + Math.floor(score / 10));
        updatePetStats(petId, { happiness: newHappiness });
        setRewarded(true);
      }
    }
  }, [gameOver, rewarded, score, updatePetStats, petId, getPetState]);

  // Игровой цикл
  useEffect(() => {
    if (gameOver || containerSize.width === 0 || containerSize.height === 0) return;
    let frame;
    let lastTime = performance.now();
    
    const loop = (currentTime) => {
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaTimeSeconds = deltaTime / 1000;
      
      // Гравитация
      velocityY.current += GRAVITY_PER_SECOND * deltaTimeSeconds;
      petY.current += velocityY.current * deltaTimeSeconds;
      
      // Ограничения по высоте
      if (petY.current < 0) {
        petY.current = 0;
        velocityY.current = 0;
      }
      if (petY.current > containerSize.height - getScaledFlappyPetSize(scale)) {
        petY.current = containerSize.height - getScaledFlappyPetSize(scale);
        velocityY.current = 0;
        setGameOver(true);
      }
      
      // Обновление препятствий
      for (let obstacle of obstacles.current) {
        obstacle.x -= OBSTACLE_SPEED_PER_SECOND * deltaTimeSeconds;
      }
      
      // Удаление препятствий за пределами экрана
      obstacles.current = obstacles.current.filter(obstacle => obstacle.x > -obstacle.width);
      
      // Создание новых препятствий
      if (obstacles.current.length === 0 || 
          obstacles.current[obstacles.current.length - 1].x < containerSize.width - getScaledFlappyObstacleInterval(scale)) {
        const buildingSprite = getRandomBuildingSprite();
        // Физические координаты Y для столкновений - здания должны быть видимы в контейнере
        const physicalY = containerSize.height - buildingSprite.height * scale;
        obstacles.current.push({
          x: containerSize.width,
          y: physicalY, // Используем правильные физические координаты
          width: buildingSprite.width * scale,
          height: buildingSprite.height * scale,
          src: buildingSprite.src
        });
      }
      
      // Проверка столкновений
      for (let obstacle of obstacles.current) {
        if (petX.current < obstacle.x + obstacle.width &&
            petX.current + getScaledFlappyPetSize(scale) > obstacle.x &&
            petY.current < obstacle.y + obstacle.height &&
            petY.current + getScaledFlappyPetSize(scale) > obstacle.y) {
          setGameOver(true);
          break;
        }
      }
      
      // Начисление очков
      for (let obstacle of obstacles.current) {
        if (!obstacle.passed && obstacle.x + obstacle.width < petX.current) {
          obstacle.passed = true;
          setScore(s => s + 1);
        }
      }
      
      // Обновление параллакс фона - исправлено для устранения разрывов и скачков
      backgroundY.current += OBSTACLE_SPEED_PER_SECOND * deltaTimeSeconds * 0.5;
      // Убираем сброс backgroundY - пусть он растет бесконечно, а позиция вычисляется через модуль
      
      setRenderTick(t => t + 1);
      frame = requestAnimationFrame(loop);
    };
    
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameOver, containerSize.width, containerSize.height, scale]);

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' && !gameOver) {
        velocityY.current = JUMP_VELOCITY;
      }
    };
    
    const handleClick = () => {
      if (!gameOver) {
        velocityY.current = JUMP_VELOCITY;
      }
    };
    
    window.addEventListener('keydown', handleKey);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('click', handleClick);
    };
  }, [gameOver]);

  const restart = () => {
    setScore(0);
    setGameOver(false);
    setRenderTick(t => t + 1);
    setRewarded(false);
    
    // Сброс позиции питомца только если контейнер имеет размеры
    if (containerSize.width > 0 && containerSize.height > 0) {
      petX.current = containerSize.width / 2 - getScaledFlappyPetSize(scale) / 2;
      petY.current = containerSize.height / 2;
    }
    velocityY.current = 0;
    
    // Очистка препятствий
    obstacles.current = [];
    
    // Сброс параллакс фона
    backgroundY.current = 0;
    
    // Новый фон
    backgroundSet.current = getRandomBackgroundSet();
  };

  return (
    <div 
      ref={containerRef}
      key={renderTick}
      className="flappybird-game" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        background: '#87CEEB', 
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={() => null}
    >
      {/* Параллакс фон */}
      {backgroundSet.current.layers.map((layer, index) => {
        const layerOffset = -(backgroundY.current * PARALLAX_SPEEDS[index]) % containerSize.width;
        return (
          <React.Fragment key={`bg-${index}-${renderTick}`}>
            {/* Первый элемент слоя */}
            <div
              style={{
                position: 'absolute',
                left: layerOffset,
                top: index === 4 ? 35 * scale : 0, // Самый ближний слой (индекс 4) сдвигаем на 35px
                width: containerSize.width,
                height: containerSize.height,
                backgroundImage: `url(${layer})`,
                backgroundSize: `${containerSize.width}px ${containerSize.height}px`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 0',
                zIndex: 0,
              }}
            />
            {/* Второй элемент слоя для бесшовного перехода */}
            <div
              style={{
                position: 'absolute',
                left: layerOffset + containerSize.width,
                top: index === 4 ? 35 * scale : 0, // Самый ближний слой (индекс 4) сдвигаем на 35px
                width: containerSize.width,
                height: containerSize.height,
                backgroundImage: `url(${layer})`,
                backgroundSize: `${containerSize.width}px ${containerSize.height}px`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 0',
                zIndex: 0,
              }}
            />
          </React.Fragment>
        );
      })}
      
      {/* Питомец */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: petX.current,
          top: petY.current,
          width: getScaledFlappyPetSize(scale),
          height: getScaledFlappyPetSize(scale),
          zIndex: 2,
          userSelect: 'none',
          pointerEvents: 'none',
          transform: 'scaleX(-1)', // Отзеркаливаем питомца
        }}
      />
      
      {/* Препятствия */}
      {obstacles.current.map((obstacle, idx) => (
        <img
          key={idx}
          src={obstacle.src}
          alt="obstacle"
          style={{
            position: 'absolute',
            left: obstacle.x,
            top: obstacle.y, // Используем top вместо bottom для правильного позиционирования
            width: obstacle.width,
            height: obstacle.height,
            zIndex: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
      
      {/* Счёт */}
      <div style={{
        position: 'absolute',
        top: 12 * scale,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontSize: 28 * scale,
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px #000',
        zIndex: 20
      }}>{score}</div>
      
      {/* Game Over */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
          fontSize: 24 * scale,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px #000',
          zIndex: 30
        }}>
          <div>Игра окончена!</div>
          <div style={{ fontSize: 18 * scale, marginTop: 8 * scale }}>Счёт: {score}</div>
          <button 
            onClick={restart}
            style={{
              marginTop: 16 * scale,
              padding: `${8 * scale}px ${16 * scale}px`,
              fontSize: 16 * scale,
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: 8 * scale,
              cursor: 'pointer'
            }}
          >
            Играть снова
          </button>
        </div>
      )}
    </div>
  );
});

const PetMiniGameModal = ({ isOpen, pet, onClose }) => {
  if (!isOpen || !pet) return null;
  
  // Убираем все мобильные оптимизации для лучшего игрового процесса
  
  const petSprite = getStaticPath(pet.sprite);
  // Определяем мобильное устройство по ширине экрана
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  // Высота модального окна: увеличиваем для мобильных
  const modalBodyStyle = isMobile
    ? { padding: 0, minHeight: 520, height: 520 + 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }
    : { padding: 0, minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' };

  const flappyRef = React.useRef();
  const zumaRef = React.useRef();
  
  // Состояния для Zuma
  const [zumaLevel, setZumaLevel] = useState(1);
  const [zumaNextBall, setZumaNextBall] = useState(null);
  const [zumaSpriteFrame, setZumaSpriteFrame] = useState(0);

  return (
    <motion.div
      className="pet-minigame-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="pet-minigame-modal-content"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pet-minigame-modal-header">
          <h2>Мини-игра для питомца</h2>
          <button className="pet-minigame-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="pet-minigame-modal-body" style={modalBodyStyle}>
          {/* Отображение уровня для Zuma */}
          {pet.gameType === 'can_swim' && (
            <div style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold', fontSize: 20, marginBottom: 8 }}>
              Уровень: {zumaLevel}
            </div>
          )}
          <div style={{ flex: 1, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            {pet.gameType === 'can_fly' ? (
              <FlyingOverCityGame ref={flappyRef} petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_jump' ? (
              <DoodleJumpGame petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_walk' ? (
              <CrossyRoadGame petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_swim' ? (
              <ZumaGame ref={zumaRef} petSprite={petSprite} onClose={onClose} petId={pet.id} onLevelChange={setZumaLevel} onNextBallChange={setZumaNextBall} onSpriteFrameChange={setZumaSpriteFrame} />
            ) : (
              <div style={{ padding: 32, textAlign: 'center' }}>Мини-игра для этого питомца не реализована</div>
            )}
          </div>

          {/* Отображение следующего шара для Zuma */}
          {pet.gameType === 'can_swim' && zumaNextBall && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <div style={{
                width: 32, height: 32,
                ...getSpriteStyle(zumaNextBall.sprite, zumaSpriteFrame, zumaNextBall.sprite.currentRow || 0, 1)
              }} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};



// Экспортируем отдельные компоненты игр для использования в других файлах
export { DoodleJumpGame, CrossyRoadGame, ZumaGame, FlyingOverCityGame, getSpriteStyle };

export default PetMiniGameModal; 