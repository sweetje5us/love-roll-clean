import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getStaticPath } from '../../utils/pathUtils';
import './PetMiniGameModal.css';
import { usePets } from '../../contexts/PetContext';
import Joystick from 'react-nipple';

// Длительность анимаций Zuma (мс)
const ANIMATION_DURATION = 300;

const getGameTypeText = (gameType) => {
  switch (gameType) {
    case 'can_fly':
      return 'Мини-игра: Flappy Bird (летающий питомец)';
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

// --- Flappy Bird MiniGame ---
const GAME_WIDTH = 320;
const GAME_HEIGHT = 420;
const GRAVITY = 0.5;
const JUMP = -7;
const PIPE_WIDTH = 48;
const PIPE_GAP = 160; // увеличено для упрощения игры
const PIPE_INTERVAL = 1400;
const PET_SIZE = 44;

function getRandomPipeY() {
  return 60 + Math.random() * (GAME_HEIGHT - PIPE_GAP - 120);
}

// FlappyBirdGame с forwardRef
const FlappyBirdGame = React.forwardRef(({ petSprite, onClose, petId }, ref) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0); // только для рендера
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  // refs для физики и объектов
  const petY = useRef(GAME_HEIGHT / 2 - PET_SIZE / 2);
  const velocity = useRef(0);
  const pipes = useRef([]);
  const lastPipeTime = useRef(Date.now());

  // Управление прыжком
  const jump = () => {
    console.log('FlappyBirdGame: jump');
    if (!started) setStarted(true);
    if (!gameOver) velocity.current = JUMP;
  };

  // Обработка клавиш
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  // Основной игровой цикл
  useEffect(() => {
    if (gameOver) return;
    let frame;
    const loop = () => {
      if (!started) {
        setRenderTick(t => t + 1);
        frame = requestAnimationFrame(loop);
        return;
      }
      // Физика питомца
      velocity.current += GRAVITY;
      petY.current += velocity.current;
      if (petY.current < 0) {
        petY.current = 0;
        velocity.current = 0;
      }
      if (petY.current > GAME_HEIGHT - PET_SIZE) {
        petY.current = GAME_HEIGHT - PET_SIZE;
        velocity.current = 0;
      }
      // Движение труб
      pipes.current = pipes.current.map(pipe => ({ ...pipe, x: pipe.x - 2 }));
      pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);
      // Добавление новых труб
      if (Date.now() - lastPipeTime.current > PIPE_INTERVAL) {
        pipes.current.push({
          x: GAME_WIDTH,
          y: getRandomPipeY(),
          passed: false
        });
        lastPipeTime.current = Date.now();
      }
      // Проверка столкновений
      for (let pipe of pipes.current) {
        if (
          pipe.x < 60 + PET_SIZE &&
          pipe.x + PIPE_WIDTH > 60 &&
          (petY.current < pipe.y || petY.current + PET_SIZE > pipe.y + PIPE_GAP)
        ) {
          setGameOver(true);
          return;
        }
      }
      if (petY.current >= GAME_HEIGHT - PET_SIZE) {
        setGameOver(true);
        return;
      }
      // Подсчёт очков
      pipes.current = pipes.current.map(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 60) {
          setScore(s => s + 1);
          return { ...pipe, passed: true };
        }
        return pipe;
      });
      setRenderTick(t => t + 1); // триггерим рендер
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [started, gameOver]);

  // Начисление счастья после завершения игры
  useEffect(() => {
    if (gameOver && !rewarded && score > 0) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      const newHappiness = Math.min(100, currentHappiness + 1 * score);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
    }
  }, [gameOver, rewarded, score, updatePetStats, petId, getPetState]);

  // Начальные трубы при старте
  useEffect(() => {
    if (started && pipes.current.length === 0) {
      pipes.current = [
        { x: GAME_WIDTH, y: getRandomPipeY(), passed: false }
      ];
    }
    // eslint-disable-next-line
  }, [started]);

  // Сброс игры
  const restart = () => {
    petY.current = GAME_HEIGHT / 2 - PET_SIZE / 2;
    velocity.current = 0;
    pipes.current = [];
    setScore(0);
    setGameOver(false);
    setStarted(false);
    lastPipeTime.current = Date.now();
    setRenderTick(t => t + 1);
    setRewarded(false);
  };

  React.useImperativeHandle(ref, () => ({ jump }));

  return (
    <div className="flappybird-game" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, position: 'relative', background: '#e0f2fe', borderRadius: 12, overflow: 'hidden', margin: '0 auto' }}
      tabIndex={0}
      onClick={jump}
    >
      {/* Питомец */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: 60,
          top: petY.current,
          width: PET_SIZE,
          height: PET_SIZE,
          zIndex: 2,
          userSelect: 'none',
          pointerEvents: 'none',
          transform: 'scaleX(-1)', // отзеркаливание по горизонтали
        }}
      />
      {/* Трубы */}
      {pipes.current.map((pipe, idx) => (
        <React.Fragment key={idx}>
          {/* Верхняя труба */}
          <div style={{
            position: 'absolute',
            left: pipe.x,
            top: 0,
            width: PIPE_WIDTH,
            height: pipe.y,
            background: '#38bdf8',
            borderRadius: 8,
            border: '2px solid #0284c7',
          }} />
          {/* Нижняя труба */}
          <div style={{
            position: 'absolute',
            left: pipe.x,
            top: pipe.y + PIPE_GAP,
            width: PIPE_WIDTH,
            height: GAME_HEIGHT - (pipe.y + PIPE_GAP),
            background: '#38bdf8',
            borderRadius: 8,
            border: '2px solid #0284c7',
          }} />
        </React.Fragment>
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
        color: '#0284c7',
        textShadow: '1px 1px 2px #fff',
        zIndex: 10
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
          zIndex: 20
        }}>
          Игра окончена!<br />
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#38bdf8', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}
      {/* Кнопка выхода */}
      <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer' }} title="Выйти">
        ×
      </button>
      {/* Инструкция */}
      {!started && !gameOver && (
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '100%', textAlign: 'center', color: '#334155', fontSize: 18, zIndex: 15 }}>
          Кликните или нажмите пробел для прыжка
        </div>
      )}
    </div>
  );
});

// --- Doodle Jump MiniGame ---
const DJ_WIDTH = 320;
const DJ_HEIGHT = 420;
const DJ_PET_SIZE = 44;
const DJ_PLATFORM_WIDTH = 60;
const DJ_PLATFORM_HEIGHT = 12;
const DJ_PLATFORM_COUNT = 8;
const DJ_GRAVITY = 0.25;
const DJ_JUMP_VELOCITY = -7.5;
const DJ_MOVE_SPEED = 4;

function getRandomPlatformX() {
  return Math.random() * (DJ_WIDTH - DJ_PLATFORM_WIDTH);
}

const DoodleJumpGame = ({ petSprite, onClose, petId }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [started, setStarted] = useState(false);

  // refs для физики
  const petX = useRef(DJ_WIDTH / 2 - DJ_PET_SIZE / 2);
  const petY = useRef(DJ_HEIGHT - DJ_PET_SIZE - 10);
  const velocityY = useRef(0);
  const platforms = useRef([]);
  const maxY = useRef(petY.current);
  const moveDir = useRef(0); // -1 влево, 1 вправо

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

  // Основной игровой цикл
  useEffect(() => {
    if (gameOver) return;
    let frame;
    const loop = () => {
      if (!started) {
        setRenderTick(t => t + 1);
        frame = requestAnimationFrame(loop);
        return;
      }
      // Движение по горизонтали
      const currentMoveDir = window.doodleJumpMoveDir || moveDir.current;
      petX.current += currentMoveDir * DJ_MOVE_SPEED;
      if (petX.current < 0) petX.current = 0;
      if (petX.current > DJ_WIDTH - DJ_PET_SIZE) petX.current = DJ_WIDTH - DJ_PET_SIZE;
      // Гравитация
      velocityY.current += DJ_GRAVITY;
      petY.current += velocityY.current;
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
        platforms.current = platforms.current.map(plat => ({ ...plat, y: plat.y + diff }));
        maxY.current -= diff;
        // Добавляем платформы
        while (platforms.current.length < DJ_PLATFORM_COUNT) {
          const lastY = Math.min(...platforms.current.map(p => p.y));
          platforms.current.push({
            x: getRandomPlatformX(),
            y: lastY - 60 - Math.random() * 30
          });
        }
        // Удаляем ушедшие платформы
        platforms.current = platforms.current.filter(plat => plat.y < DJ_HEIGHT);
      }
      // Game over если упал вниз
      if (petY.current > DJ_HEIGHT) {
        setGameOver(true);
        return;
      }
      setRenderTick(t => t + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [started, gameOver]);

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

  // Инициализация платформ
  useEffect(() => {
    if (!started || platforms.current.length > 0) return;
    let plats = [];
    for (let i = 0; i < DJ_PLATFORM_COUNT; i++) {
      plats.push({
        x: getRandomPlatformX(),
        y: DJ_HEIGHT - i * 60 - 40,
        visited: i === 0 // первая платформа сразу отмечена как посещённая
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
  }, [started]);

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
        visited: i === 0
      });
    }
    plats[0].x = DJ_WIDTH / 2 - DJ_PLATFORM_WIDTH / 2;
    plats[0].y = DJ_HEIGHT - DJ_PLATFORM_HEIGHT - 10;
    platforms.current = plats;
    petX.current = DJ_WIDTH / 2 - DJ_PET_SIZE / 2;
    petY.current = plats[0].y - DJ_PET_SIZE;
    velocityY.current = 0;
    maxY.current = petY.current;
    setScore(0);
    setGameOver(false);
    setStarted(false);
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
    <div className="doodlejump-game" style={{ width: DJ_WIDTH, height: DJ_HEIGHT, position: 'relative', background: '#fef9c3', borderRadius: 12, overflow: 'hidden', margin: '0 auto' }}
      tabIndex={0}
      onClick={() => setStarted(true)}
    >
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
      {/* Платформы */}
      {platforms.current.map((plat, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          left: plat.x,
          top: plat.y,
          width: DJ_PLATFORM_WIDTH,
          height: DJ_PLATFORM_HEIGHT,
          background: '#fde047',
          borderRadius: 6,
          border: '2px solid #facc15',
        }} />
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
        zIndex: 10
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
          zIndex: 20
        }}>
          Игра окончена!<br />
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#fde047', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}
      {/* Кнопка выхода */}
      <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer' }} title="Выйти">
        ×
      </button>
      {/* Инструкция */}
      {!started && !gameOver && (
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '100%', textAlign: 'center', color: '#a16207', fontSize: 18, zIndex: 15 }}>
          Кликните или нажмите стрелки/A/D для управления
        </div>
      )}

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
const CR_OBSTACLE_SPEED = 2.5;

function getRandomObstacleX() {
  return Math.random() * (CR_WIDTH - CR_OBSTACLE_WIDTH);
}

const CrossyRoadGame = ({ petSprite, onClose, petId }) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [started, setStarted] = useState(false);
  const [win, setWin] = useState(false);
  const [level, setLevel] = useState(1);

  // refs для физики
  const petX = useRef(CR_WIDTH / 2 - CR_PET_SIZE / 2);
  const petY = useRef(CR_HEIGHT - CR_PET_SIZE - 8);
  const obstacles = useRef([]); // [{x, y, dir}]
  const moveDir = useRef(0); // -1 влево, 1 вправо
  const moveForward = useRef(false);

  // Управление
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir.current = -1;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir.current = 1;
      if (e.code === 'ArrowUp' || e.code === 'Space') moveForward.current = true;
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

  // Основной игровой цикл
  useEffect(() => {
    if (gameOver || win) return;
    let frame;
    const loop = () => {
      if (!started) {
        setRenderTick(t => t + 1);
        frame = requestAnimationFrame(loop);
        return;
      }
      // Движение питомца по горизонтали
      const currentMoveDir = window.crossyMoveDir || moveDir.current;
      petX.current += currentMoveDir * 5;
      if (petX.current < 0) petX.current = 0;
      if (petX.current > CR_WIDTH - CR_PET_SIZE) petX.current = CR_WIDTH - CR_PET_SIZE;
      // Движение питомца вперёд
      if (window.crossyMoveForward) {
        petY.current -= CR_LANE_HEIGHT;
        if (petY.current < 0) petY.current = 0;
        window.crossyMoveForward = false;
        window.crossyMoveForwardTime = null;
      }
      if (moveForward.current) {
        petY.current -= CR_LANE_HEIGHT;
        if (petY.current < 0) petY.current = 0;
        moveForward.current = false;
      }
      // Движение препятствий
      const speed = CR_OBSTACLE_SPEED + (level - 1) * 0.7;
      obstacles.current = obstacles.current.map(obs => {
        let newX = obs.x + obs.dir * speed;
        if (newX < -CR_OBSTACLE_WIDTH) newX = CR_WIDTH;
        if (newX > CR_WIDTH) newX = -CR_OBSTACLE_WIDTH;
        return { ...obs, x: newX };
      });
      // Проверка столкновений
      for (let obs of obstacles.current) {
        if (
          petY.current < obs.y + CR_OBSTACLE_HEIGHT &&
          petY.current + CR_PET_SIZE > obs.y &&
          petX.current < obs.x + CR_OBSTACLE_WIDTH &&
          petX.current + CR_PET_SIZE > obs.x
        ) {
          setGameOver(true);
          return;
        }
      }
      // Победа — дошёл до верхней границы
      if (petY.current <= 0) {
        setWin(true);
        setScore(s => s + 1);
        return;
      }
      setRenderTick(t => t + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [started, gameOver, win, level]);

  // Начисление счастья за победу и переход на следующий уровень
  useEffect(() => {
    if (win && !rewarded) {
      const petState = getPetState(petId);
      const currentHappiness = petState?.happiness || 0;
      const newHappiness = Math.min(100, currentHappiness + 10);
      updatePetStats(petId, { happiness: newHappiness });
      setRewarded(true);
      // Через короткую паузу — следующий уровень
      setTimeout(() => {
        setLevel(lvl => lvl + 1);
        nextLevel();
      }, 1200);
    }
  }, [win, rewarded, updatePetStats, petId, getPetState]);

  // Функция перехода на следующий уровень
  const nextLevel = () => {
    // Увеличиваем сложность: больше полос с препятствиями, выше скорость
    let obsArr = [];
    const lanes = Math.min(CR_LANE_COUNT, 3 + level); // от 3 до 7 полос
    // Выбираем случайную безопасную дорогу (индекс полосы), не совпадающую со стартовой
    let safeLane = Math.floor(Math.random() * (lanes - 1)); // исключаем стартовую
    const startLane = lanes - 1;
    // Стартовая полоса всегда самая нижняя
    const startLaneY = CR_HEIGHT - CR_LANE_HEIGHT;
    const safeLaneY = CR_HEIGHT - (safeLane + 1) * CR_LANE_HEIGHT;
    for (let i = 0; i < lanes; i++) {
      const laneY = CR_HEIGHT - (i + 1) * CR_LANE_HEIGHT;
      // Исключаем случайную безопасную и стартовую (нижнюю) полосу по y
      if (laneY !== safeLaneY && laneY !== startLaneY) {
        // На более высоких уровнях — больше препятствий на полосу
        const obsPerLane = 1 + Math.floor(level / 2);
        for (let j = 0; j < obsPerLane; j++) {
          obsArr.push({
            x: getRandomObstacleX(),
            y: laneY,
            dir: i % 2 === 0 ? 1 : -1
          });
        }
      }
    }
    obstacles.current = obsArr;
    petX.current = CR_WIDTH / 2 - CR_PET_SIZE / 2;
    petY.current = CR_HEIGHT - CR_PET_SIZE - 8;
    setGameOver(false);
    setStarted(false);
    setWin(false);
    setRewarded(false);
    setRenderTick(t => t + 1);
  };

  // Инициализация препятствий
  useEffect(() => {
    if (!started || obstacles.current.length > 0) return;
    nextLevel();
    setLevel(1);
    setScore(0);
  }, [started]);

  // Сброс игры
  const restart = () => {
    setLevel(1);
    setScore(0);
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
    <div className="crossyroad-game" style={{ width: CR_WIDTH, height: CR_HEIGHT, position: 'relative', background: '#e0e7ef', borderRadius: 12, overflow: 'hidden', margin: '0 auto' }}
      tabIndex={0}
      onClick={() => setStarted(true)}
    >
      {/* Дороги (фон) */}
      {[...Array(CR_LANE_COUNT)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0,
          top: CR_HEIGHT - (i + 1) * CR_LANE_HEIGHT,
          width: CR_WIDTH,
          height: CR_LANE_HEIGHT,
          background: i % 2 === 1 ? '#cbd5e1' : 'transparent',
          zIndex: 0
        }} />
      ))}
      {/* Препятствия */}
      {obstacles.current.map((obs, idx) => (
        <div key={idx} style={{
          position: 'absolute',
          left: obs.x,
          top: obs.y,
          width: CR_OBSTACLE_WIDTH,
          height: CR_OBSTACLE_HEIGHT,
          background: '#64748b',
          borderRadius: 8,
          border: '2px solid #334155',
          zIndex: 2
        }} />
      ))}
      {/* Питомец */}
      <img
        src={petSprite}
        alt="pet"
        style={{
          position: 'absolute',
          left: petX.current,
          top: petY.current,
          width: CR_PET_SIZE,
          height: CR_PET_SIZE,
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
          <button onClick={restart} style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: '#64748b', color: '#fff', cursor: 'pointer' }}>Заново</button>
        </div>
      )}
      {/* Кнопка выхода */}
      <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer' }} title="Выйти">
        ×
      </button>
      {/* Инструкция */}
      {!started && !gameOver && !win && (
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '100%', textAlign: 'center', color: '#334155', fontSize: 18, zIndex: 15 }}>
          Кликните или используйте стрелки/A/D для управления, стрелка вверх/пробел — вперёд
        </div>
      )}
      {/* Уровень и кнопка следующий уровень */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
        Уровень: {level}
      </div>
      {/* Не показываем стандартный оверлей победы и кнопку "заново" для Zuma, переход к следующему уровню автоматический */}

    </div>
  );
};

// --- Zuma MiniGame ---
const ZUMA_WIDTH = 320;
const ZUMA_HEIGHT = 420;
const ZUMA_PET_SIZE = 44;
const ZUMA_BALL_RADIUS = 16;
const ZUMA_BALL_COLORS = ['#60a5fa', '#fbbf24', '#f87171', '#34d399'];
function getRandomBallColor() {
  return ZUMA_BALL_COLORS[Math.floor(Math.random() * ZUMA_BALL_COLORS.length)];
}
const ZUMA_CHAIN_LENGTH = 16;
const ZUMA_CHAIN_SPEED = 0.4;
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

// ZumaGame с forwardRef
const ZumaGame = React.forwardRef(({ petSprite, onClose, petId }, ref) => {
  const { updatePetStats, getPetState } = usePets();
  const [renderTick, setRenderTick] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [animations, setAnimations] = useState([]); // [{type, index, start, end, startTime}]
  const [level, setLevel] = useState(1);
  // параметры, зависящие от уровня
  const BASE_CHAIN_LENGTH = 12;
  const BASE_ROWS = 4;
  const BASE_SPEED = 0.4;
  const MAX_CHAIN_LENGTH = 24;
  const MAX_ROWS = 7;
  const MAX_SPEED = BASE_SPEED * 1.5;
  const chainLength = Math.min(BASE_CHAIN_LENGTH + (level - 1) * 2, MAX_CHAIN_LENGTH);
  const rows = Math.min(BASE_ROWS + Math.floor((level - 1) / 2), MAX_ROWS);
  const speed = Math.min(BASE_SPEED * (1 + 0.05 * (level - 1)), MAX_SPEED);

  const ZUMA_CHAIN_LENGTH = chainLength;
  const ZUMA_CHAIN_SPEED = speed;
  const ROWS = rows;

  // refs для физики
  const petX = useRef(ZUMA_WIDTH / 2);
  const petY = useRef(ZUMA_HEIGHT - ZUMA_PET_SIZE / 2 - 60); // Подняли питомца выше последней строки шаров
  const aimAngle = useRef(0); // угол прицеливания (радианы)
  const chain = useRef([]); // [{t, color}]
  const shot = useRef(null); // {x, y, dx, dy, color}
  const chainHeadT = useRef(0); // прогресс головы цепочки (0..1)
  const [nextBallColor, setNextBallColor] = useState(getRandomBallColor());
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

  // Обработчики для react-nipple джойстика
  const handleJoystickMove = (evt, data) => {
    if (data && data.angle && typeof data.angle.radian === 'number' && !isNaN(data.angle.radian)) {
      // react-nipple возвращает угол где 0 = вправо, π/2 = вниз
      // Наша система: 0 = вверх, π/2 = вправо
      // Инвертируем оба направления для правильного соответствия
      const correctedAngle = -data.angle.radian + Math.PI / 2;
      aimAngle.current = correctedAngle;
      setJoystickActive(true);
    }
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
    e.preventDefault();
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
      color: nextBallColor
    };
    setNextBallColor(getRandomBallColor());
  };

  // Основной игровой цикл
  useEffect(() => {
    if (gameOver || win) return;
    let frame;
    const loop = () => {
      if (!started) {
        setRenderTick(t => t + 1);
        frame = requestAnimationFrame(loop);
        return;
      }
      // Движение цепочки по пути
      const { total: totalLength } = getPathSegments(ZUMA_PATH);
      headDistRef.current += ZUMA_CHAIN_SPEED;
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
        if (changed) setRenderTick(t => t + 1);
      }
      // Движение выстрела
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
            chain.current.splice(i, 0, { t, color: shot.current.color });
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
        return;
      }
      setRenderTick(t => t + 1);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [started, gameOver, win, animations]);

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
    if (!started || chain.current.length > 0) return;
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < ZUMA_CHAIN_LENGTH; i++) {
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        color: getRandomBallColor()
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0; // Инициализация headDistRef
    setScore(0);
  }, [started]);

  // Сброс игры
  const restart = () => {
    setLevel(1);
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < ZUMA_CHAIN_LENGTH; i++) {
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        color: getRandomBallColor()
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0; // Сброс headDistRef
    setScore(0);
    setGameOver(false);
    setStarted(false);
    setWin(false);
    setRewarded(false);
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
    setLevel(lvl => lvl + 1);
    // сбросить состояние игры, цепочку, счёт, win/gameOver и т.д.
    // (реализовать сброс как в начале игры)
    // ...
    setWin(false);
    setGameOver(false);
    setStarted(false);
    setScore(0);
    setRewarded(false);
    setAnimations([]);
    // Сбросить цепочку и выстрел
    const { total: totalLength } = getPathSegments(ZUMA_PATH);
    let arr = [];
    for (let i = 0; i < ZUMA_CHAIN_LENGTH; i++) {
      arr.push({
        t: Math.max(0, (-(i * ZUMA_BALL_SPACING)) / totalLength),
        color: getRandomBallColor()
      });
    }
    chain.current = arr;
    aimAngle.current = 0;
    shot.current = null;
    chainHeadT.current = 0;
    headDistRef.current = 0;
  };



  React.useImperativeHandle(ref, () => ({
    handleJoystickMove,
    handleJoystickEnd,
    handleMobileShoot,
  }));

  return (
    <div
      className="zuma-game"
      style={{ width: ZUMA_WIDTH, height: ZUMA_HEIGHT, position: 'relative', background: '#e0f2fe', borderRadius: 12, overflow: 'hidden', margin: '0 auto' }}
      tabIndex={0}
      onClick={!isMobile ? () => setStarted(true) : undefined}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseDown={!isMobile ? handleMouseDown : undefined}
    >
      {/* Цепочка */}
      {chain.current.map((ball, idx) => {
        const pos = getPointOnPath(ZUMA_PATH, ball.t);
        // Анимация исчезновения
        const disappearAnim = animations.find(a => a.type === 'disappear' && a.index === idx);
        const scale = disappearAnim ? 1 - Math.min(1, (performance.now() - disappearAnim.startTime) / ANIMATION_DURATION) : 1;
        const opacity = disappearAnim ? scale : 1;
        return (
          <div key={idx} style={{
            position: 'absolute',
            left: pos.x - ZUMA_BALL_RADIUS,
            top: pos.y - ZUMA_BALL_RADIUS,
            width: ZUMA_BALL_RADIUS * 2,
            height: ZUMA_BALL_RADIUS * 2,
            background: ball.color,
            borderRadius: '50%',
            border: '2px solid #fff',
            zIndex: 2,
            transform: `scale(${scale})`,
            opacity,
            transition: disappearAnim ? 'none' : 'transform 0.1s',
          }} />
        );
      })}
      {/* Выстрел */}
      {shot.current && (
        <div style={{
          position: 'absolute',
          left: shot.current.x - ZUMA_BALL_RADIUS,
          top: shot.current.y - ZUMA_BALL_RADIUS,
          width: ZUMA_BALL_RADIUS * 2,
          height: ZUMA_BALL_RADIUS * 2,
          background: shot.current.color,
          borderRadius: '50%',
          border: '2px solid #fff',
          zIndex: 3
        }} />
      )}
      {/* Прицел */}
      <svg width={ZUMA_WIDTH} height={ZUMA_HEIGHT} style={{ position: 'absolute', left: 0, top: 0, zIndex: 1, pointerEvents: 'none' }}>
        <line
          x1={petX.current}
          y1={petY.current}
          x2={petX.current + Math.sin(aimAngle.current) * 80}
          y2={petY.current - Math.cos(aimAngle.current) * 80}
          stroke="#64748b"
          strokeWidth={3}
          strokeDasharray="8 8"
        />
      </svg>
      {/* Следующий шар для выстрела */}
      <div style={{
        position: 'absolute',
        left: petX.current - ZUMA_BALL_RADIUS,
        top: petY.current - ZUMA_PET_SIZE / 2 - ZUMA_BALL_RADIUS - 18,
        width: ZUMA_BALL_RADIUS * 2,
        height: ZUMA_BALL_RADIUS * 2,
        background: nextBallColor,
        borderRadius: '50%',
        border: '2px solid #fff',
        zIndex: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }} />
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
          zIndex: 4,
          userSelect: 'none',
          pointerEvents: 'none',
          transform: `rotate(${aimAngle.current * 180 / Math.PI}deg)`
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
      {/* Кнопка выхода */}
      <button onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer' }} title="Выйти">
        ×
      </button>
      {/* Инструкция */}
      {!started && !gameOver && !win && (
        <div style={{ position: 'absolute', top: '45%', left: 0, width: '100%', textAlign: 'center', color: '#334155', fontSize: 18, zIndex: 15 }}>
          Кликните или используйте стрелки/A/D для прицеливания, пробел/клик — выстрел
        </div>
      )}
      {/* Уровень и кнопка следующий уровень */}
      <div style={{ position: 'absolute', top: 10, left: 10, color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
        Уровень: {level}
      </div>
      {/* Не показываем стандартный оверлей победы и кнопку "заново" для Zuma, переход к следующему уровню автоматический */}

      {/* Кнопка Старт для мобильных */}
      {isMobile && !started && (
        <button
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 28,
            padding: '18px 48px',
            borderRadius: 16,
            background: '#38bdf8',
            color: '#fff',
            border: 'none',
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
          onClick={() => setStarted(true)}
          onTouchStart={e => { e.stopPropagation(); setStarted(true); }}
        >
          Старт
        </button>
      )}
    </div>
  );
});

const PetMiniGameModal = ({ isOpen, onClose, pet }) => {
  if (!isOpen || !pet) return null;
  const petSprite = getStaticPath(pet.sprite);
  // Определяем мобильное устройство по ширине экрана
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  // Высота модального окна: увеличиваем для мобильных
  const modalBodyStyle = isMobile
    ? { padding: 0, minHeight: 520, height: 520 + 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }
    : { padding: 0, minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' };

  const flappyRef = React.useRef();
  const zumaRef = React.useRef();

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
          <div style={{ flex: 1, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            {pet.gameType === 'can_fly' ? (
              <FlappyBirdGame ref={flappyRef} petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_jump' ? (
              <DoodleJumpGame petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_walk' ? (
              <CrossyRoadGame petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : pet.gameType === 'can_swim' ? (
              <ZumaGame ref={zumaRef} petSprite={petSprite} onClose={onClose} petId={pet.id} />
            ) : (
              <div style={{ padding: 32, textAlign: 'center' }}>Мини-игра для этого питомца не реализована</div>
            )}
          </div>
          {/* Панель управления для мобильных — рендерится под сценой */}
          {pet.gameType === 'can_fly' && isMobile && (
            <FlappyBirdMobileControls onJump={() => flappyRef.current?.jump()} />
          )}
          {pet.gameType === 'can_jump' && isMobile && <DoodleJumpMobileControls />}
          {pet.gameType === 'can_walk' && isMobile && <CrossyRoadMobileControls />}
          {pet.gameType === 'can_swim' && isMobile && (
            <ZumaMobileControls
              onJoystickMove={(evt, data) => zumaRef.current?.handleJoystickMove(evt, data)}
              onJoystickEnd={evt => zumaRef.current?.handleJoystickEnd(evt)}
              onShoot={e => zumaRef.current?.handleMobileShoot(e)}
              style={{ pointerEvents: 'auto', zIndex: 200 }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Компоненты мобильного управления
const DoodleJumpMobileControls = () => {
  const handleLeftDown = (e) => { e.stopPropagation(); window.doodleJumpMoveDir = -1; };
  const handleLeftUp = (e) => { e.stopPropagation(); window.doodleJumpMoveDir = 0; };
  const handleRightDown = (e) => { e.stopPropagation(); window.doodleJumpMoveDir = 1; };
  const handleRightUp = (e) => { e.stopPropagation(); window.doodleJumpMoveDir = 0; };
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 12px 8px 12px', boxSizing: 'border-box', pointerEvents: 'none' }}>
      <button style={{ width: 52, height: 52, borderRadius: '50%', background: '#fbbf24', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto' }}
        onTouchStart={handleLeftDown} onTouchEnd={handleLeftUp} onMouseDown={handleLeftDown} onMouseUp={handleLeftUp}>
        <i className="fas fa-arrow-left"></i>
      </button>
      <div style={{ flex: 1 }} />
      <button style={{ width: 52, height: 52, borderRadius: '50%', background: '#fbbf24', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto' }}
        onTouchStart={handleRightDown} onTouchEnd={handleRightUp} onMouseDown={handleRightDown} onMouseUp={handleRightUp}>
        <i className="fas fa-arrow-right"></i>
      </button>
    </div>
  );
};

// Универсальная кнопка для однократного действия
const OneShotButton = ({ onAction, children, style }) => {
  const isTouchDevice = React.useMemo(() => (
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  ), []);
  const pressedRef = React.useRef(false);

  const handleTouchStart = (e) => {
    e.stopPropagation();
    if (!pressedRef.current) {
      pressedRef.current = true;
      onAction(e);
    }
  };
  const handleTouchEnd = (e) => {
    e.stopPropagation();
    pressedRef.current = false;
  };
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (!pressedRef.current) {
      pressedRef.current = true;
      onAction(e);
    }
  };
  const handleMouseUp = (e) => {
    e.stopPropagation();
    pressedRef.current = false;
  };

  if (isTouchDevice) {
    return (
      <button
        style={style}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </button>
    );
  } else {
    return (
      <button
        style={style}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {children}
      </button>
    );
  }
};

const CrossyRoadMobileControls = () => {
  const handleLeftDown = (e) => { e.stopPropagation(); window.crossyMoveDir = -1; };
  const handleLeftUp = (e) => { e.stopPropagation(); window.crossyMoveDir = 0; };
  const handleRightDown = (e) => { e.stopPropagation(); window.crossyMoveDir = 1; };
  const handleRightUp = (e) => { e.stopPropagation(); window.crossyMoveDir = 0; };
  const handleUpAction = (e) => {
    window.crossyMoveForward = true;
  };
  return (
    <>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 12px 8px 12px', boxSizing: 'border-box', pointerEvents: 'none' }}>
        <button style={{ width: 52, height: 52, borderRadius: '50%', background: '#64748b', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto' }}
          onTouchStart={handleLeftDown} onTouchEnd={handleLeftUp} onMouseDown={handleLeftDown} onMouseUp={handleLeftUp}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ width: 52, height: 52, borderRadius: '50%', background: '#64748b', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto' }}
          onTouchStart={handleRightDown} onTouchEnd={handleRightUp} onMouseDown={handleRightDown} onMouseUp={handleRightUp}>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 4, pointerEvents: 'none' }}>
        <OneShotButton
          style={{ width: 52, height: 52, borderRadius: '50%', background: '#22c55e', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto' }}
          onAction={handleUpAction}
        >
          <i className="fas fa-arrow-up"></i>
        </OneShotButton>
      </div>
    </>
  );
};

const ZumaMobileControls = ({ onJoystickMove, onJoystickEnd, onShoot }) => (
  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px 8px 12px', boxSizing: 'border-box', pointerEvents: 'none', zIndex: 200 }}>
    {/* Джойстик */}
    <div style={{ width: 100, height: 100, position: 'relative', pointerEvents: 'auto' }}>
      <Joystick
        options={{ 
          mode: 'static', 
          position: { left: '50%', top: '50%' }, 
          color: '#64748b'
        }}
        style={{ width: 100, height: 100 }}
        onMove={onJoystickMove}
        onEnd={onJoystickEnd}
      />
    </div>
    <div style={{ flex: 1 }} />
    <OneShotButton
      onAction={onShoot}
      style={{ width: 60, height: 60, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 24, border: 'none', pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
    >
      <i className="fas fa-crosshairs"></i>
    </OneShotButton>
  </div>
);

// Flappy Bird Mobile Controls
const FlappyBirdMobileControls = ({ onJump }) => (
  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 0 12px 0', pointerEvents: 'none', zIndex: 200 }}>
    <OneShotButton
      onAction={onJump}
      style={{ width: 60, height: 60, borderRadius: '50%', background: '#38bdf8', color: '#fff', fontSize: 28, border: 'none', pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
    >
      <i className="fas fa-arrow-up"></i>
    </OneShotButton>
  </div>
);

export default PetMiniGameModal; 