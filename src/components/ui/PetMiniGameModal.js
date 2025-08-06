import React, { useRef, useEffect, useState } from 'react';
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
        
        // Отладочная информация
        console.log('Container size:', containerWidth, 'x', containerHeight);
        console.log('Game size:', originalWidth, 'x', originalHeight);
        console.log('Scale:', newScale);
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
const DJ_TANK_SCALE = DJ_PLATFORM_WIDTH / DJ_TANK_ORIGINAL_WIDTH;
const DJ_TANK_DISPLAY_WIDTH = DJ_TANK_ORIGINAL_WIDTH * DJ_TANK_SCALE;
const DJ_TANK_DISPLAY_HEIGHT = DJ_TANK_ORIGINAL_HEIGHT * DJ_TANK_SCALE;
// Константы в единицах "на секунду"
const DJ_GRAVITY_PER_SECOND = 400;
const DJ_JUMP_VELOCITY = -300;
const DJ_MOVE_SPEED_PER_SECOND = 240;

function getRandomPlatformX() {
  return Math.random() * (DJ_WIDTH - DJ_PLATFORM_WIDTH);
}

function getRandomTankSprite() {
  return DJ_TANK_SPRITES[Math.floor(Math.random() * DJ_TANK_SPRITES.length)];
}

const DoodleJumpGame = ({ petSprite, onClose, petId }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  
  // Используем масштабирование
  const { scale, containerSize, containerRef, isInMinigameContainer } = useGameScale(DJ_WIDTH, DJ_HEIGHT);


  // refs для физики
  const petX = useRef(DJ_WIDTH / 2 - DJ_PET_SIZE / 2);
  const petY = useRef(DJ_HEIGHT - DJ_PET_SIZE - 10);
  const velocityY = useRef(0);
  const platforms = useRef([]);
  const maxY = useRef(petY.current);
  const moveDir = useRef(0); // -1 влево, 1 вправо
  
  // refs для параллакс фона
  const backgroundY = useRef(0);
  
  // Массивы для хранения позиций фоновых слоев (для бесшовного зацикливания)
  const backgroundLayers = useRef([0, DJ_HEIGHT, DJ_HEIGHT * 2]); // Слои без разрывов
  
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
      if (petX.current < 0) petX.current = 0;
      if (petX.current > DJ_WIDTH - DJ_PET_SIZE) petX.current = DJ_WIDTH - DJ_PET_SIZE;
      
      // Гравитация с deltaTime
      velocityY.current += DJ_GRAVITY_PER_SECOND * deltaTimeSeconds;
      petY.current += velocityY.current * deltaTimeSeconds;
      
      // Прыжок от платформ и начисление очков только за новые платформы
      for (let plat of platforms.current) {
        if (
          petY.current + DJ_PET_SIZE > plat.y &&
          petY.current + DJ_PET_SIZE < plat.y + DJ_PLATFORM_HEIGHT &&
          petX.current + DJ_PET_SIZE > plat.x &&
          petX.current < plat.x + DJ_PLATFORM_WIDTH &&
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
      if (petY.current < DJ_HEIGHT / 2) {
        const diff = DJ_HEIGHT / 2 - petY.current;
        petY.current = DJ_HEIGHT / 2;
        maxY.current -= diff;
        
        // Параллакс эффект для фоновых слоев с бесшовным зацикливанием
        // Задний слой движется медленнее
        for (let i = 0; i < backgroundLayers.current.length; i++) {
          backgroundLayers.current[i] += diff * 0.3;
        }
        
        // Перемещаем задние слои, которые вышли за границу
        for (let i = 0; i < backgroundLayers.current.length; i++) {
          if (backgroundLayers.current[i] >= DJ_HEIGHT) {
            // Находим самый верхний слой
            let minY = Math.min(...backgroundLayers.current);
            backgroundLayers.current[i] = minY - DJ_HEIGHT;
          }
        }
        
        // Проверяем и исправляем разрывы между слоев
        backgroundLayers.current.sort((a, b) => a - b);
        for (let i = 1; i < backgroundLayers.current.length; i++) {
          const gap = backgroundLayers.current[i] - backgroundLayers.current[i - 1];
          if (gap > DJ_HEIGHT) {
            // Если есть разрыв больше высоты слоя, перемещаем слой
            backgroundLayers.current[i] = backgroundLayers.current[i - 1] + DJ_HEIGHT;
          }
        }
        
        // Движение платформ - изменяем in-place
        for (let i = 0; i < platforms.current.length; i++) {
          platforms.current[i].y += diff;
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
          x: getRandomPlatformX(),
          y: minY - 60 - Math.random() * 30,
          sprite: getRandomTankSprite(),
          direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
        });
      }
      
      // Удаление платформ - splice вместо filter
      for (let i = platforms.current.length - 1; i >= 0; i--) {
        if (platforms.current[i].y >= DJ_HEIGHT) {
          platforms.current.splice(i, 1);
        }
      }
      }
      
      // Game over если упал вниз
      if (petY.current > DJ_HEIGHT) {
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

  // Инициализация платформ
  useEffect(() => {
    if (platforms.current.length > 0) return;
    let plats = [];
    for (let i = 0; i < DJ_PLATFORM_COUNT; i++) {
      plats.push({
        x: getRandomPlatformX(),
        y: DJ_HEIGHT - i * 60 - 40,
        visited: i === 0, // первая платформа сразу отмечена как посещённая
        sprite: getRandomTankSprite(),
        direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
      });
    }
    // Первая платформа строго под питомцем
    plats[0].x = DJ_WIDTH / 2 - DJ_PLATFORM_WIDTH / 2;
    plats[0].y = DJ_HEIGHT - DJ_PLATFORM_HEIGHT - 10;
    platforms.current = plats;
    // Питомец стоит на первой платформе
    petX.current = DJ_WIDTH / 2 - DJ_PET_SIZE / 2;
    petY.current = plats[0].y - DJ_PET_SIZE;
    velocityY.current = 0;
  }, []);

  // Сброс игры
  const restart = () => {
    petX.current = DJ_WIDTH / 2 - DJ_PET_SIZE / 2;
    petY.current = DJ_HEIGHT - DJ_PET_SIZE - 10;
    velocityY.current = 0;
    // Пересоздаём платформы и ставим питомца на первую платформу
    let plats = [];
    for (let i = 0; i < DJ_PLATFORM_COUNT; i++) {
      plats.push({
        x: getRandomPlatformX(),
        y: DJ_HEIGHT - i * 60 - 40,
        visited: i === 0,
        sprite: getRandomTankSprite(),
        direction: Math.random() > 0.5 ? 1 : -1 // 1 = вправо, -1 = влево
      });
    }
    plats[0].x = DJ_WIDTH / 2 - DJ_PLATFORM_WIDTH / 2;
    plats[0].y = DJ_HEIGHT - DJ_PLATFORM_HEIGHT - 10;
    platforms.current = plats;
    petX.current = DJ_WIDTH / 2 - DJ_PET_SIZE / 2;
    petY.current = plats[0].y - DJ_PET_SIZE;
    velocityY.current = 0;
    maxY.current = petY.current;
    
    // Сброс параллакс фона - слои располагаются без разрывов
    backgroundY.current = 0;
    backgroundLayers.current = [0, DJ_HEIGHT, DJ_HEIGHT * 2];
    
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'none',
        transition: 'none',
        animation: 'none'
      }}
      tabIndex={0}
      onClick={() => null}
    >
      <div
        style={{
          width: DJ_WIDTH,
          height: DJ_HEIGHT,
          transform: isInMinigameContainer ? `scale(${scale})` : `scale(var(--game-scale, ${scale}))`,
          transformOrigin: 'center center',
          position: 'relative',
          background: '#fef9c3',
          bottom: '0px',
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
            width: '100%',
            height: DJ_HEIGHT,
            backgroundImage: `url(sprites/minigames/doodle-jump/back.png)`,
            backgroundSize: `${DJ_WIDTH}px ${DJ_HEIGHT}px`,
            backgroundRepeat: 'no-repeat',
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
            width: DJ_PET_SIZE,
            height: DJ_PET_SIZE,
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
              left: plat.x - (DJ_TANK_DISPLAY_WIDTH - DJ_PLATFORM_WIDTH) / 2, // центрируем танк относительно физического тела
              top: plat.y - (DJ_TANK_DISPLAY_HEIGHT - DJ_PLATFORM_HEIGHT), // выравниваем по нижней границе
              width: DJ_TANK_DISPLAY_WIDTH,
              height: DJ_TANK_DISPLAY_HEIGHT,
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

// Функция для создания препятствия с спрайтом машины
function createCarObstacle(x, y, dir) {
  // Проверяем корректность параметров
  if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
    console.warn('Некорректные координаты для машины:', x, y);
    return null;
  }
  
  if (dir !== 1 && dir !== -1) {
    console.warn('Некорректное направление для машины:', dir);
    return null;
  }
  
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
  // Базовое количество полос увеличивается с уровнем
  const baseLanes = Math.min(9, 5 + Math.floor(level / 3)); // от 5 до 9 полос
  
  // Определяем количество дорожных полос (от 2 до 5)
  const roadLanesCount = Math.min(5, 2 + Math.floor(level / 2));
  
  // Создаем массив полос (true = дорога, false = безопасная)
  const lanes = new Array(baseLanes).fill(false);
  
  // Гарантируем безопасные полосы: начальная, конечная и еще одна
  lanes[0] = false; // Начальная полоса всегда безопасная
  lanes[baseLanes - 1] = false; // Конечная полоса всегда безопасная
  
  // Выбираем случайную безопасную полосу между начальной и конечной
  const safeLaneIndex = 1 + Math.floor(Math.random() * (baseLanes - 2));
  lanes[safeLaneIndex] = false;
  
  // Теперь размещаем дорожные полосы
  const availableLanes = [];
  for (let i = 1; i < baseLanes - 1; i++) {
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
    safeLanes: [0, safeLaneIndex, baseLanes - 1]
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

const CrossyRoadGame = ({ petSprite, onClose, petId }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [win, setWin] = useState(false);
  const [level, setLevel] = useState(1);
  const [roadTiles] = useState(getRoadTiles()); // Тайлы дороги
  const [backgroundTile, setBackgroundTile] = useState(getRandomBackgroundTile()); // Фоновый тайл
  const [laneConfig, setLaneConfig] = useState(null); // Конфигурация полос (инициализируется позже)
  
  // Используем фиксированный масштаб для minigame-container
  const isInMinigameContainer = true; // Всегда true для CrossyRoad в телефоне
  const containerSize = { width: 288, height: 376 }; // Фиксированный размер экрана телефона
  const scaleX = containerSize.width / CR_WIDTH;
  const scaleY = containerSize.height / CR_HEIGHT;
  const scale = Math.min(scaleX, scaleY); // 288/320 = 0.9, 376/420 = 0.895, берем 0.895
  const containerRef = useRef(null);
  

  


  // refs для физики
  const petX = useRef(containerSize.width / 2 - CR_PET_SIZE * scale / 2);
  const petY = useRef(containerSize.height - CR_PET_SIZE * scale - 8); // Ставим на самую нижнюю безопасную полосу (строка 0)
  const obstacles = useRef([]); // [{x, y, dir, sprite}]
  const moveDir = useRef(0); // -1 влево, 1 вправо
  const moveForward = useRef(false);
  
  // refs для прямого управления DOM элементами машин
  const carRefs = useRef({});
  
  // Улучшенная система респауна
  const spawnTimer = useRef(0);
  const spawnInterval = useRef(1500); // 1.5 секунды между появлением новых машин
  const carGroupTimer = useRef(0); // Таймер для создания групп машин

  // useEffect для отзеркаливания машин
  useEffect(() => {
    obstacles.current.forEach((obs, idx) => {
      if (carRefs.current[idx]) {
        carRefs.current[idx].style.setProperty('transform', obs.dir === 1 ? 'scaleX(-1)' : 'scaleX(1)', 'important');
      }
    });
  }, [renderTick]); // Зависит от renderTick для обновления при изменении направления

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        moveDir.current = -1;
        console.log('LEFT pressed - Pet position:', petX.current, petY.current);
        
        // Определяем, на какой полосе находится питомец
        const petLaneIndex = Math.floor((containerSize.height - petY.current) / (CR_LANE_HEIGHT * scale));
        const isPetOnRoadLane = isLaneRoad(petLaneIndex, laneConfig);
        console.log('Pet lane index:', petLaneIndex, 'Is on road lane:', isPetOnRoadLane);
        
        if (isPetOnRoadLane) {
          const obstaclesOnLane = obstacles.current.filter(obs => 
            Math.floor((containerSize.height - obs.y - CR_OBSTACLE_HEIGHT * scale / 2) / (CR_LANE_HEIGHT * scale)) === petLaneIndex
          );
          console.log('Obstacles on same lane:', obstaclesOnLane.length);
        }
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        moveDir.current = 1;
        console.log('RIGHT pressed - Pet position:', petX.current, petY.current);
        
        // Определяем, на какой полосе находится питомец
        const petLaneIndex = Math.floor((containerSize.height - petY.current) / (CR_LANE_HEIGHT * scale));
        const isPetOnRoadLane = isLaneRoad(petLaneIndex, laneConfig);
        console.log('Pet lane index:', petLaneIndex, 'Is on road lane:', isPetOnRoadLane);
        
        if (isPetOnRoadLane) {
          const obstaclesOnLane = obstacles.current.filter(obs => 
            Math.floor((containerSize.height - obs.y - CR_OBSTACLE_HEIGHT * scale / 2) / (CR_LANE_HEIGHT * scale)) === petLaneIndex
          );
          console.log('Obstacles on same lane:', obstaclesOnLane.length);
        }
      }
      if (e.code === 'ArrowUp' || e.code === 'Space') {
        moveForward.current = true;
        console.log('UP pressed - Pet position:', petX.current, petY.current);
        
        // Определяем, на какой полосе находится питомец
        const petLaneIndex = Math.floor((containerSize.height - petY.current) / (CR_LANE_HEIGHT * scale));
        const isPetOnRoadLane = isLaneRoad(petLaneIndex, laneConfig);
        console.log('Pet lane index:', petLaneIndex, 'Is on road lane:', isPetOnRoadLane);
        
        if (isPetOnRoadLane) {
          const obstaclesOnLane = obstacles.current.filter(obs => 
            Math.floor((containerSize.height - obs.y - CR_OBSTACLE_HEIGHT * scale / 2) / (CR_LANE_HEIGHT * scale)) === petLaneIndex
          );
          console.log('Obstacles on same lane:', obstaclesOnLane.length);
          if (obstaclesOnLane.length > 0) {
            console.log('Car Y positions:', obstaclesOnLane.map(obs => obs.y));
          }
        }
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
      
      // Движение питомца вперёд
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
      
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        obs.x += obs.dir * speed;
        
        // Удаляем машины, которые вышли за пределы экрана
        if (obs.dir > 0 && obs.x > containerSize.width + 60 * scale) {
          obstacles.current.splice(i, 1);
          if (carRefs.current[i]) {
            delete carRefs.current[i];
          }
        } else if (obs.dir < 0 && obs.x < -60 * scale) {
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
      const baseSpawnTime = Math.max(600, 2000 - (level - 1) * 120); // от 2.0 до 0.6 секунды
      const maxCars = Math.min(8 + Math.floor(level / 2), 15); // Больше машин на экране
      
      // Создание групп машин для более динамичного геймплея
      const groupSpawnTime = Math.max(3000, 8000 - (level - 1) * 500); // Группы появляются реже
      
      if (spawnTimer.current >= baseSpawnTime && obstacles.current.length < maxCars) {
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
            
            const minSafeDistance = 120 * scale; // Минимальное безопасное расстояние
            const canSpawn = carsOnLane.every(car => {
              const distance = Math.abs(car.x - spawnX);
              return distance > minSafeDistance;
            });
            
            if (canSpawn) {
              const newCar = createCarObstacle(spawnX, laneY, direction);
              if (newCar) {
                obstacles.current.push(newCar);
                console.log('Car created on lane:', laneIndex, 'at Y:', laneY, 'direction:', direction);
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
          
          // Создаем группу из 2-3 машин
          const groupSize = Math.min(2 + Math.floor(level / 4), 4);
          const minSpacing = 60 * scale;
          
          for (let j = 0; j < groupSize; j++) {
            const spawnX = direction > 0 
              ? -100 * scale - (j * minSpacing)
              : containerSize.width + 100 * scale + (j * minSpacing);
            
            const newCar = createCarObstacle(spawnX, laneY, direction);
            if (newCar) {
              obstacles.current.push(newCar);
              console.log('Group car created on lane:', laneIndex, 'group member:', j + 1);
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
      
      // Проверяем коллизии только если питомец на дорожной полосе
      if (isPetOnRoadLane) {
        for (let obs of obstacles.current) {
          const obsLaneIndex = Math.floor((containerSize.height - obs.y - CR_OBSTACLE_HEIGHT * scale / 2) / (CR_LANE_HEIGHT * scale));
          
          // Проверяем коллизию только если препятствие на той же полосе
          if (obsLaneIndex === petLaneIndex) {
            if (
              petTop < obs.y + obs.sprite.displayHeight * scale &&
              petBottom > obs.y &&
              petLeft < obs.x + obs.sprite.displayWidth * scale &&
              petRight > obs.x
            ) {
              console.log('Collision detected! Pet:', petLeft, petTop, petRight, petBottom, 'Car:', obs.x, obs.y, obs.x + obs.sprite.displayWidth * scale, obs.y + obs.sprite.displayHeight * scale);
              setGameOver(true);
              return;
            }
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
        setLevel(lvl => lvl + 1);
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
    
    console.log('Level', level, 'Lane configuration:', newLaneConfig);
    console.log('Total lanes:', totalLanes, 'Road lanes:', newLaneConfig.roadLanes);
    
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
          
          const newCar = createCarObstacle(spawnX, laneY, direction);
          if (newCar) {
            obsArr.push(newCar);
            console.log('Initial car created on lane:', i, 'at Y:', laneY, 'direction:', direction, 'position:', spawnX);
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
    setScore(0);
    nextLevel();
    // Игра запускается автоматически
    console.log('Игра запущена автоматически');
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
    setScore(0);
    setRewarded(false); // Сбрасываем флаг награды
    // Очищаем refs для машин
    carRefs.current = {};
    // Сбрасываем таймеры респауна
    spawnTimer.current = 0;
    carGroupTimer.current = 0;
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
      onClick={() => {
        if (!gameOver && !win) {
          // Игра уже запущена
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
          border: '2px solid red' // Отладочная рамка
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
      {[...Array(laneConfig ? laneConfig.totalLanes : CR_LANE_COUNT)].map((_, i) => {
        const laneY = containerSize.height - (i + 1) * CR_LANE_HEIGHT * scale;
        const isRoadLane = isLaneRoad(i, laneConfig); // Используем динамическую конфигурацию
        
        // Отладочное логирование для первой итерации
        if (i === 0) {
          console.log('Rendering lanes. LaneConfig:', laneConfig, 'Total lanes:', laneConfig ? laneConfig.totalLanes : CR_LANE_COUNT);
        }
        
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
          Уровень: {level}<br />
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer' }}>Заново</button>
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

      {/* Уровень и скорость */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#334155', fontWeight: 'bold', fontSize: 16, zIndex: 15 }}>
        Уровень: {level}
      </div>
      <div style={{ position: 'absolute', top: 30, left: 10, color: '#64748b', fontWeight: 'bold', fontSize: 14, zIndex: 15 }}>
        Скорость: {CR_OBSTACLE_SPEED_PER_SECOND + (level - 1) * 30}
      </div>
      {/* Не показываем стандартный оверлей победы и кнопку "заново" для Zuma, переход к следующему уровню автоматический */}

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
const ZUMA_BALL_SPACING = ZUMA_BALL_RADIUS * 2 - 2; // уменьшенное расстояние между центрами шаров
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
function getSpriteStyle(sprite, currentFrame = 0, row = 0) {
  if (!sprite) return {};
  
  // Ограничиваем currentFrame количеством кадров в спрайте
  const maxFrames = sprite.frames || 8;
  const clampedFrame = currentFrame % maxFrames;
  
  const frameX = clampedFrame * sprite.frameWidth;
  const frameY = row * sprite.frameHeight;
  return {
    backgroundImage: `url(${getStaticPath(sprite.src)})`,
    backgroundPosition: `-${frameX}px -${frameY}px`,
    backgroundSize: `${sprite.width}px ${sprite.height}px`,
    width: `${sprite.frameWidth}px`,
    height: `${sprite.frameHeight}px`,
    backgroundRepeat: 'no-repeat'
  };
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
  
  // Используем масштабирование
  const { scale, containerSize, containerRef, isInMinigameContainer } = useGameScale(ZUMA_WIDTH, ZUMA_HEIGHT);
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
  const petX = useRef(ZUMA_WIDTH / 2);
  const petY = useRef(ZUMA_HEIGHT - ZUMA_PET_SIZE / 2 - 60); // Подняли питомца выше последней строки шаров
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
    if (gameOver || win) return;
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
        return;
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
          shot.current.x < 0 || shot.current.x > ZUMA_WIDTH ||
          shot.current.y < 0 || shot.current.y > ZUMA_HEIGHT
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
          if (dx * dx + dy * dy < (ZUMA_BALL_RADIUS * 2) ** 2) {

            
            // Сохраняем координаты выстрела ДО сброса shot.current
            const shotPos = { x: shot.current.x, y: shot.current.y, color: shot.current.color };
            // Вставляем шарик в цепочку
            const t = chain.current[i].t;
            const ball = createBallWithSprite(shot.current.color);
            chain.current.splice(i, 0, { t, ...ball });
            
            console.log('  - Created ball:', ball);
            console.log('  - Ball animationOffset:', ball.animationOffset);
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
  }, [gameOver, win, animations]);

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
    aimAngle.current = Math.atan2(mx - petX.current, petY.current - my);
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
          width: ZUMA_WIDTH,
          height: ZUMA_HEIGHT,
          transform: isInMinigameContainer ? `scale(${scale})` : `scale(var(--game-scale, ${scale}))`,
          transformOrigin: 'center center',
          position: 'relative',
          bottom: '0px',
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
        const scale = disappearAnim ? 1 - Math.min(1, (performance.now() - disappearAnim.startTime) / ANIMATION_DURATION) : 1;
        const opacity = disappearAnim ? scale : 1;
        
        // Используем сохраненный спрайт шара с индивидуальным смещением анимации
        const sprite = ball.sprite;
        const frameWithOffset = (spriteFrameRef.current + (ball.animationOffset || 0)) % 8;
        const direction = getBallDirection(ball.t);
        const spriteStyle = getSpriteStyle(sprite, frameWithOffset, sprite.currentRow || 0);
        

        
        // Создаем ref для шара, если его еще нет
        if (!ballRefs[idx]) {
          ballRefs[idx] = React.createRef();
        }
        
        return (
          <div 
            key={`ball-${idx}-${renderTick}`} 
            ref={ballRefs[idx]}
            style={{
              position: 'absolute',
              left: pos.x - (sprite ? sprite.frameWidth / 2 : ZUMA_BALL_RADIUS),
              top: pos.y - (sprite ? sprite.frameHeight / 2 : ZUMA_BALL_RADIUS),
              zIndex: 10,
              transform: `scale(${scale}) ${direction === -1 ? 'scaleX(-1)' : ''}`,
              opacity,
              transition: disappearAnim ? 'none' : 'transform 0.1s',
  
              ...spriteStyle
            }} 
          />
        );
      })}
      {/* Выстрел */}
      {shot.current && (
        <div 
          key={`shot-${renderTick}`}
          style={{
            position: 'absolute',
            left: shot.current.x - ZUMA_BALL_RADIUS,
            top: shot.current.y - ZUMA_BALL_RADIUS,
            width: ZUMA_BALL_RADIUS * 2,
            height: ZUMA_BALL_RADIUS * 2,
            zIndex: 10,
            ...getSpriteStyle(shot.current.sprite, spriteFrameRef.current, shot.current.sprite.currentRow || 0)
          }} 
        />
      )}
      {/* Прицел */}
      <svg width={ZUMA_WIDTH} height={ZUMA_HEIGHT} style={{ position: 'absolute', left: 0, top: 0, zIndex: 10, pointerEvents: 'none' }}>
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
          left: petX.current - ZUMA_PET_SIZE / 2,
          top: petY.current - ZUMA_PET_SIZE / 2,
          width: ZUMA_PET_SIZE,
          height: ZUMA_PET_SIZE,
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
  // Используем масштабирование
  const { scale, containerSize, containerRef, isInMinigameContainer } = useGameScale(GAME_WIDTH, GAME_HEIGHT);

  // refs для физики
  const petX = useRef(GAME_WIDTH / 2 - PET_SIZE / 2);
  const petY = useRef(GAME_HEIGHT / 2);
  const velocityY = useRef(0);
  const obstacles = useRef([]);
  const backgroundLayers = useRef([]);
  const backgroundSet = useRef(getRandomBackgroundSet());
  
  // refs для параллакс фона
  const backgroundY = useRef(0);
  
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
    if (gameOver) return;
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
      if (petY.current > GAME_HEIGHT - PET_SIZE) {
        petY.current = GAME_HEIGHT - PET_SIZE;
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
          obstacles.current[obstacles.current.length - 1].x < GAME_WIDTH - OBSTACLE_INTERVAL) {
        const buildingSprite = getRandomBuildingSprite();
        // Физические координаты Y для столкновений
        // Спрайты отображаются с bottom: -70, поэтому их физическая позиция должна быть на 70px выше
        const physicalY = GAME_HEIGHT + 70 - buildingSprite.height;
        obstacles.current.push({
          x: GAME_WIDTH,
          y: physicalY, // Используем правильные физические координаты
          width: buildingSprite.width,
          height: buildingSprite.height,
          src: buildingSprite.src
        });
      }
      
      // Проверка столкновений
      for (let obstacle of obstacles.current) {
        if (petX.current < obstacle.x + obstacle.width &&
            petX.current + PET_SIZE > obstacle.x &&
            petY.current < obstacle.y + obstacle.height &&
            petY.current + PET_SIZE > obstacle.y) {
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
  }, [gameOver]);

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
    
    // Сброс позиции питомца
    petX.current = GAME_WIDTH / 2 - PET_SIZE / 2;
    petY.current = GAME_HEIGHT / 2;
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
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={() => null}
    >
      <div
        style={{
          width: isInMinigameContainer ? '100%' : GAME_WIDTH,
          height: isInMinigameContainer ? '100%' : GAME_HEIGHT,
          transform: isInMinigameContainer ? 'none' : `scale(var(--game-scale, ${scale}))`,
          transformOrigin: 'center center',
          position: 'relative',
          background: '#87CEEB',
          bottom: '0px',
          overflow: 'hidden'
        }}
      >
      {/* Параллакс фон */}
      {backgroundSet.current.layers.map((layer, index) => (
        <div
          key={`bg-${index}-${renderTick}`}
          style={{
            position: 'absolute',
            left: isInMinigameContainer ? -(backgroundY.current * PARALLAX_SPEEDS[index]) % 100 : -(backgroundY.current * PARALLAX_SPEEDS[index]) % GAME_WIDTH,
            top: index === 4 ? '35px' : 0, // Самый ближний слой (индекс 4) сдвигаем на 35px для мобильного
            width: isInMinigameContainer ? '200%' : GAME_WIDTH * 2,
            height: isInMinigameContainer ? '100%' : GAME_HEIGHT,
            backgroundImage: `url(${layer})`,
            backgroundSize: isInMinigameContainer ? '50% 100%' : `${GAME_WIDTH}px ${GAME_HEIGHT}px`,
            backgroundRepeat: 'repeat-x',
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
          width: PET_SIZE,
          height: PET_SIZE,
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
            bottom: -70, // Размещаем здания у фактической нижней границы
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
        top: 12,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 4px #000',
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
          color: '#fff',
          fontSize: 24,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px #000',
          zIndex: 30
        }}>
          <div>Игра окончена!</div>
          <div style={{ fontSize: 18, marginTop: 8 }}>Счёт: {score}</div>
          <button 
            onClick={restart}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              fontSize: 16,
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Играть снова
          </button>
        </div>
      )}
      

      
      
      </div>
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
                ...getSpriteStyle(zumaNextBall.sprite, zumaSpriteFrame, zumaNextBall.sprite.currentRow || 0)
              }} />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};



// Экспортируем отдельные компоненты игр для использования в других файлах
export { DoodleJumpGame, CrossyRoadGame, ZumaGame, FlyingOverCityGame };

export default PetMiniGameModal; 