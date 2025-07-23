import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Типы действий
const ACTION_TYPES = {
  SET_ACTIVE_PET: 'SET_ACTIVE_PET',
  UPDATE_PET_STATE: 'UPDATE_PET_STATE',
  ADD_PET_TO_COLLECTION: 'ADD_PET_TO_COLLECTION',
  REMOVE_PET_FROM_COLLECTION: 'REMOVE_PET_FROM_COLLECTION',
  UPDATE_PET_STATS: 'UPDATE_PET_STATS',
  RESET_PET_STATE: 'RESET_PET_STATE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION'
};

// Начальное состояние питомца
const getInitialPetState = () => {
  const now = Date.now();
  return {
    hunger: 100,        // Голод (0-100)
    happiness: 100,     // Счастье (0-100)
    energy: 100,        // Энергия (0-100)
    health: 100,        // Здоровье (0-100)
    lastFed: now,       // Время последнего кормления
    lastPlayed: now,    // Время последней игры
    lastRest: now,      // Время последнего отдыха
    experience: 0,      // Опыт питомца
    level: 1,           // Уровень питомца
    bond: 0,            // Связь с хозяином (0-100)
    lastInteraction: now, // Время последнего взаимодействия
    isSleeping: false,  // Состояние сна
    sleepStartTime: null // Время начала сна
  };
};

// Функция для получения начального состояния
const getInitialState = () => {
  try {
    const savedPetData = localStorage.getItem('gamePetData');
    if (savedPetData) {
      const parsedData = JSON.parse(savedPetData);
      // Убеждаемся что notifications всегда массив и все поля корректны
      return {
        activePetId: parsedData.activePetId || null,
        petCollection: parsedData.petCollection || {},
        isLoading: parsedData.isLoading || false,
        error: parsedData.error || null,
        notifications: Array.isArray(parsedData.notifications) ? parsedData.notifications : []
      };
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных питомцев:', error);
  }
  
  return {
    activePetId: null,
    petCollection: {}, // { petId: { ...petState, name: string } }
    isLoading: false,
    error: null,
    notifications: [] // Массив уведомлений
  };
};

// Начальное состояние
const initialState = getInitialState();

// Функции для работы с питомцами
const calculatePetLevel = (experience) => {
  // Простая формула: каждый уровень требует 100 опыта
  return Math.floor(experience / 100) + 1;
};

// Функция для определения состояния питомца
const calculatePetStatus = (petState) => {
  const statuses = [];
  
  // Если питомец спит, это приоритетное состояние
  if (petState.isSleeping) {
    statuses.push('sleeping');
  }
  
  // Остальные состояния проверяем только если питомец не спит
  if (!petState.isSleeping) {
    if (petState.hunger < 30) statuses.push('hungry');
    if (petState.happiness < 30) statuses.push('sad');
    if (petState.energy < 20) statuses.push('tired');
    if (petState.health < 25) statuses.push('sick');
  }
  
  return statuses;
};

// Функция для получения иконки состояния
const getStatusIconByName = (status) => {
  switch (status) {
    case 'hungry': return 'fas fa-utensils';
    case 'sad': return 'fas fa-frown';
    case 'tired': return 'fas fa-bed';
    case 'sick': return 'fas fa-heartbeat';
    case 'sleeping': return 'fas fa-moon';
    default: return 'fas fa-paw';
  }
};

// Функция для получения цвета состояния
const getStatusColorByName = (status) => {
  switch (status) {
    case 'hungry': return '#ff6b6b';
    case 'sad': return '#4ecdc4';
    case 'tired': return '#f9ca24';
    case 'sick': return '#6c5ce7';
    case 'sleeping': return '#a29bfe';
    default: return '#ff8cc6';
  }
};

// Функция для получения текста состояния
const getStatusTextByName = (status) => {
  switch (status) {
    case 'hungry': return 'Голоден';
    case 'sad': return 'Грустит';
    case 'tired': return 'Устал';
    case 'sick': return 'Болен';
    case 'sleeping': return 'Спит';
    default: return 'Норма';
  }
};

const calculatePetStats = (petState) => {
  const now = Date.now();
  const level = calculatePetLevel(petState.experience);
  
  // Скорость убывания (в часах) - увеличены для более заметных изменений
  const HUNGER_DECAY_RATE = 1; // Голод каждые 1 час
  const HAPPINESS_DECAY_RATE = 1.5; // Счастье каждые 1.5 часа  
  const ENERGY_DECAY_RATE = 2; // Энергия каждые 2 часа
  const HEALTH_DECAY_RATE = 3; // Здоровье каждые 3 часа
  const SLEEP_ENERGY_RECOVERY_RATE = 0.05; // Восстановление энергии во сне каждые 18 минут (быстрее)
  const SLEEP_HAPPINESS_RECOVERY_RATE = 0.1; // Восстановление счастья во сне каждые 2 часа (медленнее)
  
  // Вычисляем время с последнего взаимодействия
  const timeSinceFed = petState.lastFed ? (now - petState.lastFed) / (1000 * 60 * 60) : 0;
  const timeSincePlayed = petState.lastPlayed ? (now - petState.lastPlayed) / (1000 * 60 * 60) : 0;
  const timeSinceRest = petState.lastRest ? (now - petState.lastRest) / (1000 * 60 * 60) : 0;
  const timeSinceInteraction = petState.lastInteraction ? (now - petState.lastInteraction) / (1000 * 60 * 60) : 0;
  
  // Вычисляем убывание характеристик - увеличены значения для более заметных изменений
  const hungerDecay = Math.max(0, (timeSinceFed / HUNGER_DECAY_RATE) * 15); // 15% за период
  const happinessDecay = Math.max(0, (timeSincePlayed / HAPPINESS_DECAY_RATE) * 12); // 12% за период
  const energyDecay = Math.max(0, (timeSinceRest / ENERGY_DECAY_RATE) * 18); // 18% за период
  const healthDecay = Math.max(0, (timeSinceInteraction / HEALTH_DECAY_RATE) * 8); // 8% за период
  
  // Вычисляем восстановление энергии и счастья во сне
  let energyRecovery = 0;
  let happinessRecovery = 0;
  let isSleeping = petState.isSleeping;
  let sleepStartTime = petState.sleepStartTime;
  
  if (petState.isSleeping && petState.sleepStartTime) {
    const timeSinceSleepStart = (now - petState.sleepStartTime) / (1000 * 60 * 60); // в часах
    
    // Восстановление энергии во сне (быстрее)
    energyRecovery = Math.min(100 - petState.energy, (timeSinceSleepStart / SLEEP_ENERGY_RECOVERY_RATE) * 40); // 25% за период
    
    // Восстановление счастья во сне (зависит от других характеристик)
    const currentHunger = Math.max(0, petState.hunger - hungerDecay);
    const currentHealth = Math.max(0, petState.health - healthDecay);
    
    // Базовое восстановление счастья во сне
    let baseHappinessRecovery = (timeSinceSleepStart / SLEEP_HAPPINESS_RECOVERY_RATE) * 5; // 5% за период (медленно)
    
    // Если все характеристики выше 70%, счастье восстанавливается быстро
    if (currentHunger >= 70 && currentHealth >= 70) {
      baseHappinessRecovery = (timeSinceSleepStart / SLEEP_HAPPINESS_RECOVERY_RATE) * 15; // 15% за период (быстро)
    }
    // Если здоровье и голод выше 70%, счастье восстанавливается медленно
    else if (currentHunger >= 70 || currentHealth >= 70) {
      baseHappinessRecovery = (timeSinceSleepStart / SLEEP_HAPPINESS_RECOVERY_RATE) * 8; // 8% за период (средне)
    }
    // Если характеристики низкие, счастье не восстанавливается
    else {
      baseHappinessRecovery = 0;
    }
    
    happinessRecovery = Math.min(100 - petState.happiness, baseHappinessRecovery);
    
    // Если энергия достигла 100%, питомец просыпается
    if (petState.energy + energyRecovery >= 100) {
      energyRecovery = 100 - petState.energy;
      isSleeping = false;
      sleepStartTime = null;
    }
  }
  
  // Дополнительные модификаторы счастья на основе других характеристик
  let happinessModifier = 0;
  
  // Если питомец голоден, счастье уменьшается
  const currentHunger = Math.max(0, petState.hunger - hungerDecay);
  if (currentHunger < 30) {
    happinessModifier -= (30 - currentHunger) * 0.3; // -0.3% за каждый % голода ниже 30 (менее агрессивно)
  }
  
  // Если питомец болен, счастье уменьшается
  const currentHealth = Math.max(0, petState.health - healthDecay);
  if (currentHealth < 50) {
    happinessModifier -= (50 - currentHealth) * 0.2; // -0.2% за каждый % здоровья ниже 50 (менее агрессивно)
  }
  
  // Если питомец устал, счастье уменьшается
  const currentEnergy = Math.min(100, Math.max(0, petState.energy - energyDecay) + energyRecovery);
  if (currentEnergy < 20) {
    happinessModifier -= (20 - currentEnergy) * 0.25; // -0.25% за каждый % энергии ниже 20 (менее агрессивно)
  }
  
  const baseStats = {
    hunger: Math.max(0, petState.hunger - hungerDecay),
    happiness: Math.max(0, Math.min(100, petState.happiness - happinessDecay + happinessRecovery + happinessModifier)),
    energy: Math.min(100, Math.max(0, petState.energy - energyDecay) + energyRecovery),
    health: Math.max(0, petState.health - healthDecay),
    isSleeping: isSleeping,
    sleepStartTime: sleepStartTime
  };
  
  return {
    ...petState,
    ...baseStats,
    level
  };
};

// Редьюсер
const petReducer = (state, action) => {
  // Убеждаемся что notifications всегда массив
  const currentNotifications = Array.isArray(state.notifications) ? state.notifications : [];
  
  switch (action.type) {
    case ACTION_TYPES.SET_ACTIVE_PET:
      return {
        ...state,
        activePetId: action.payload.petId,
        notifications: currentNotifications
      };

    case ACTION_TYPES.UPDATE_PET_STATE:
      const { petId, updates } = action.payload;
      const currentPetState = state.petCollection[petId] || getInitialPetState();
      
      // Сначала применяем обновления
      const updatedPetState = {
        ...currentPetState,
        ...updates
      };
      
      // Затем рассчитываем актуальные значения с учетом времени
      const calculatedStats = calculatePetStats(updatedPetState);
      
      return {
        ...state,
        petCollection: {
          ...state.petCollection,
          [petId]: calculatedStats
        },
        notifications: currentNotifications
      };

    case ACTION_TYPES.ADD_PET_TO_COLLECTION:
      const { petId: newPetId, name } = action.payload;
      if (!state.petCollection[newPetId]) {
        return {
          ...state,
          petCollection: {
            ...state.petCollection,
            [newPetId]: {
              ...getInitialPetState(),
              name: name || ''
            }
          },
          notifications: currentNotifications
        };
      }
      return {
        ...state,
        notifications: currentNotifications
      };

    case ACTION_TYPES.REMOVE_PET_FROM_COLLECTION:
      const { petId: removePetId } = action.payload;
      const newCollection = { ...state.petCollection };
      delete newCollection[removePetId];
      
      return {
        ...state,
        petCollection: newCollection,
        activePetId: state.activePetId === removePetId ? null : state.activePetId,
        notifications: currentNotifications
      };

    case ACTION_TYPES.UPDATE_PET_STATS:
      const { petId: statsPetId, statUpdates } = action.payload;
      const petForStats = state.petCollection[statsPetId];
      if (petForStats) {
        const updatedStats = {
          ...petForStats,
          ...statUpdates,
          lastInteraction: Date.now()
        };
        
        return {
          ...state,
          petCollection: {
            ...state.petCollection,
            [statsPetId]: updatedStats
          },
          notifications: currentNotifications
        };
      }
      return {
        ...state,
        notifications: currentNotifications
      };

    case ACTION_TYPES.RESET_PET_STATE:
      const { petId: resetPetId } = action.payload;
      return {
        ...state,
        petCollection: {
          ...state.petCollection,
          [resetPetId]: {
            ...getInitialPetState(),
            name: state.petCollection[resetPetId]?.name || ''
          }
        },
        notifications: currentNotifications
      };

    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        notifications: currentNotifications
      };

    case ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        notifications: currentNotifications
      };

    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...currentNotifications, action.payload]
      };

    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: currentNotifications.filter(
          (notification) => notification.id !== action.payload
        )
      };

    default:
      return {
        ...state,
        notifications: currentNotifications
      };
  }
};

// Контекст
const PetContext = createContext();

// Провайдер
export const PetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(petReducer, initialState);

  // Сохраняем состояние в localStorage при изменениях
  useEffect(() => {
    try {
      localStorage.setItem('gamePetData', JSON.stringify(state));
    } catch (error) {
      console.error('Ошибка при сохранении данных питомцев:', error);
    }
  }, [state]);

  // Функции для работы с питомцами
  const setActivePet = (petId) => {
    dispatch({ type: ACTION_TYPES.SET_ACTIVE_PET, payload: { petId } });
  };

  const addPetToCollection = (petId, name = '') => {
    // Проверяем, есть ли уже питомец в коллекции
    const existingPet = state.petCollection[petId];
    if (existingPet) {
      // Если питомец уже есть, но у него нет временных меток, инициализируем их
      const now = Date.now();
      const needsInitialization = !existingPet.lastFed || !existingPet.lastPlayed || 
                                 !existingPet.lastRest || !existingPet.lastInteraction;
      
      if (needsInitialization) {
        updatePetState(petId, {
          lastFed: now,
          lastPlayed: now,
          lastRest: now,
          lastInteraction: now
        });
      }
      return;
    }
    
    dispatch({ type: ACTION_TYPES.ADD_PET_TO_COLLECTION, payload: { petId, name } });
  };

  const removePetFromCollection = (petId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_PET_FROM_COLLECTION, payload: { petId } });
  };

  const updatePetState = (petId, updates) => {
    dispatch({ type: ACTION_TYPES.UPDATE_PET_STATE, payload: { petId, updates } });
  };

  const updatePetStats = (petId, statUpdates) => {
    dispatch({ type: ACTION_TYPES.UPDATE_PET_STATS, payload: { petId, statUpdates } });
  };

  const addNotification = (notification) => {
    dispatch({ type: ACTION_TYPES.ADD_NOTIFICATION, payload: notification });
  };

  const removeNotification = (id) => {
    dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
  };

  // Функции для действий с питомцем
  const feedPet = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState) return;

    const now = Date.now();
    const hungerIncrease = Math.min(100 - petState.hunger, 30); // Увеличиваем голод на 30, но не больше 100
    const experienceGain = 5; // Получаем опыт за кормление

    updatePetState(petId, {
      hunger: Math.min(100, petState.hunger + hungerIncrease),
      experience: petState.experience + experienceGain,
      lastFed: now,
      lastInteraction: now,
      isSleeping: false, // Будим питомца
      sleepStartTime: null
    });

    // Добавляем уведомление
    addNotification({
      id: Date.now(),
      type: 'success',
      message: `Питомец покормлен! Голод +${hungerIncrease}%`,
      icon: 'fas fa-utensils',
      duration: 3000
    });
  };

  const playWithPet = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState) return;

    const now = Date.now();
    const happinessIncrease = Math.min(100 - petState.happiness, 25); // Увеличиваем счастье на 25
    const energyDecrease = Math.max(0, petState.energy - 15); // Тратим энергию на игру
    const experienceGain = 8; // Получаем больше опыта за игру

    updatePetState(petId, {
      happiness: Math.min(100, petState.happiness + happinessIncrease),
      energy: energyDecrease,
      experience: petState.experience + experienceGain,
      lastPlayed: now,
      lastInteraction: now,
      isSleeping: false, // Будим питомца
      sleepStartTime: null
    });

    // Добавляем уведомление
    addNotification({
      id: Date.now(),
      type: 'success',
      message: `Поиграли с питомцем! Счастье +${happinessIncrease}%`,
      icon: 'fas fa-gamepad',
      duration: 3000
    });
  };

  const restPet = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState) return;

    const now = Date.now();
    const experienceGain = 3; // Получаем опыт за отдых

    updatePetState(petId, {
      isSleeping: true,
      sleepStartTime: now,
      experience: petState.experience + experienceGain,
      lastRest: now,
      lastInteraction: now
    });

    // Добавляем уведомление
    addNotification({
      id: Date.now(),
      type: 'success',
      message: 'Питомец лег спать! Энергия будет восстанавливаться во сне.',
      icon: 'fas fa-bed',
      duration: 3000
    });
  };

  const healPet = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState) return;

    const now = Date.now();
    const healthIncrease = Math.min(100 - petState.health, 35); // Восстанавливаем здоровье на 35
    const experienceGain = 6; // Получаем опыт за лечение

    updatePetState(petId, {
      health: Math.min(100, petState.health + healthIncrease),
      experience: petState.experience + experienceGain,
      lastInteraction: now,
      isSleeping: false, // Будим питомца
      sleepStartTime: null
    });

    // Добавляем уведомление
    addNotification({
      id: Date.now(),
      type: 'success',
      message: `Питомец вылечен! Здоровье +${healthIncrease}%`,
      icon: 'fas fa-heartbeat',
      duration: 3000
    });
  };

  const wakeUpPet = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState || !petState.isSleeping) return;

    const now = Date.now();
    const experienceGain = 2; // Получаем небольшой опыт за пробуждение

    updatePetState(petId, {
      isSleeping: false,
      sleepStartTime: null,
      experience: petState.experience + experienceGain,
      lastInteraction: now
    });

    // Добавляем уведомление
    addNotification({
      id: Date.now(),
      type: 'info',
      message: 'Питомец проснулся!',
      icon: 'fas fa-sun',
      duration: 3000
    });
  };

  const resetPetState = (petId) => {
    dispatch({ type: ACTION_TYPES.RESET_PET_STATE, payload: { petId } });
  };

  const getActivePet = () => {
    if (!state.activePetId) return null;
    const petState = state.petCollection[state.activePetId];
    if (!petState) return null;
    
    // Всегда возвращаем актуальное состояние с учетом времени
    return calculatePetStats(petState);
  };

  const getPetState = (petId) => {
    const petState = state.petCollection[petId];
    if (!petState) return null;
    
    // Всегда возвращаем актуальное состояние с учетом времени
    return calculatePetStats(petState);
  };

  const getAllPets = () => {
    return state.petCollection;
  };

  const getPetCollection = () => {
    return Object.keys(state.petCollection).map(petId => ({
      id: petId,
      ...state.petCollection[petId]
    }));
  };

  const setError = (error) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  };

  // Функция для инициализации временных меток всех питомцев
  const initializeAllPets = () => {
    const now = Date.now();
    Object.keys(state.petCollection).forEach(petId => {
      const pet = state.petCollection[petId];
      if (pet) {
        const needsInitialization = !pet.lastFed || !pet.lastPlayed || 
                                   !pet.lastRest || !pet.lastInteraction;
        
        if (needsInitialization) {
          updatePetState(petId, {
            lastFed: now,
            lastPlayed: now,
            lastRest: now,
            lastInteraction: now
          });
        }
      }
    });
  };

  // Функции для работы с состоянием питомца
  const getPetStatusById = (petId) => {
    const petState = getPetState(petId);
    if (!petState) return [];
    return calculatePetStatus(petState);
  };

  const getActivePetStatus = () => {
    const petState = getActivePet();
    if (!petState) return [];
    return calculatePetStatus(petState);
  };

  // Автоматическое обновление состояния питомцев каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(state.petCollection).forEach(petId => {
        const petState = state.petCollection[petId];
        if (petState) {
          // Принудительно обновляем состояние для пересчета значений
          updatePetState(petId, {});
        }
      });
    }, 10000); // Каждые 10 секунд

    return () => clearInterval(interval);
  }, [state.petCollection]);

  // Инициализация питомцев при загрузке
  useEffect(() => {
    if (Object.keys(state.petCollection).length > 0) {
      initializeAllPets();
    }
  }, []); // Выполняется только при монтировании компонента

  const value = {
    // Состояние
    activePetId: state.activePetId,
    petCollection: state.petCollection,
    isLoading: state.isLoading,
    error: state.error,
    notifications: state.notifications,
    
    // Функции
    setActivePet,
    addPetToCollection,
    removePetFromCollection,
    updatePetState,
    updatePetStats,
    feedPet,
    playWithPet,
    restPet,
    healPet,
    wakeUpPet,
    resetPetState,
    getActivePet,
    getPetState,
    getAllPets,
    getPetCollection,
    setError,
    clearError,
    initializeAllPets,
    addNotification,
    removeNotification,
    getPetStatusById,
    getActivePetStatus,
    getStatusIconByName,
    getStatusColorByName,
    getStatusTextByName
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};

// Хук для использования контекста
export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets должен использоваться внутри PetProvider');
  }
  return context;
};

export { ACTION_TYPES }; 