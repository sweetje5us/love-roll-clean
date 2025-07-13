import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Система уровней
const LEVEL_SYSTEM = {
  // Опыт для каждого уровня: [уровень]: опыт_для_следующего_уровня
  experienceRequirements: {
    1: 500,
    2: 1500,
    3: 3000,
    4: 5000,
    5: 7500,
    6: 10500,
    7: 14000,
    8: 18000,
    9: 22500,
    10: 27500
  },
  // Очки характеристик за уровень
  statPointsPerLevel: 4,
  // Максимальный уровень
  maxLevel: 10
};

// Типы действий
const ACTION_TYPES = {
  ADD_CHARACTER: 'ADD_CHARACTER',
  REMOVE_CHARACTER: 'REMOVE_CHARACTER',
  UPDATE_CHARACTER: 'UPDATE_CHARACTER',
  SET_CHARACTERS: 'SET_CHARACTERS',
  CLEAR_CHARACTERS: 'CLEAR_CHARACTERS',
  ADD_EXPERIENCE: 'ADD_EXPERIENCE',
  LEVEL_UP: 'LEVEL_UP',
  SHOW_LEVEL_UP_MODAL: 'SHOW_LEVEL_UP_MODAL',
  HIDE_LEVEL_UP_MODAL: 'HIDE_LEVEL_UP_MODAL',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Экспортируем для тестирования
export { ACTION_TYPES };

// Функция для получения начального состояния
const getInitialState = () => {
  try {
    const savedCharacters = localStorage.getItem('gameCharacters');
    if (savedCharacters) {
      const characters = JSON.parse(savedCharacters);
      return {
        characters: characters,
        isLoading: false,
        error: null,
        levelUpModal: {
          isOpen: false,
          characterId: null,
          newLevel: null,
          availablePoints: 0
        }
      };
    }
  } catch (error) {
    console.error('Ошибка при загрузке начального состояния персонажей:', error);
  }
  
  return {
    characters: [],
    isLoading: false,
    error: null,
    levelUpModal: {
      isOpen: false,
      characterId: null,
      newLevel: null,
      availablePoints: 0
    }
  };
};

// Начальное состояние
const initialState = getInitialState();

// Функции для работы с уровнями
const calculateLevel = (experience) => {
  let level = 1;
  let totalExp = 0;
  
  for (let i = 1; i <= LEVEL_SYSTEM.maxLevel; i++) {
    totalExp += LEVEL_SYSTEM.experienceRequirements[i] || 0;
    if (experience >= totalExp) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  return Math.min(level, LEVEL_SYSTEM.maxLevel);
};

const getExperienceForNextLevel = (currentLevel) => {
  if (currentLevel >= LEVEL_SYSTEM.maxLevel) return 0;
  
  let totalExp = 0;
  for (let i = 1; i <= currentLevel; i++) {
    totalExp += LEVEL_SYSTEM.experienceRequirements[i] || 0;
  }
  return totalExp;
};

const getCurrentLevelExperience = (experience, currentLevel) => {
  if (currentLevel <= 1) return experience;
  
  let previousLevelExp = 0;
  for (let i = 1; i < currentLevel; i++) {
    previousLevelExp += LEVEL_SYSTEM.experienceRequirements[i] || 0;
  }
  return experience - previousLevelExp;
};

// Редьюсер
const characterReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.ADD_CHARACTER:
      return {
        ...state,
        characters: [...state.characters, action.payload],
        error: null
      };
    
    case ACTION_TYPES.REMOVE_CHARACTER:
      return {
        ...state,
        characters: state.characters.filter(char => char.id !== action.payload),
        error: null
      };
    
    case ACTION_TYPES.UPDATE_CHARACTER:
      console.log('CharacterContext.reducer - UPDATE_CHARACTER:', action.payload);
      console.log('CharacterContext.reducer - текущее состояние персонажей:', state.characters);
      
      const updatedCharacters = state.characters.map(char => {
        if (char.id === action.payload.id) {
          const updatedChar = { ...char, ...action.payload };
          console.log('CharacterContext.reducer - обновляем персонажа:', {
            id: char.id,
            name: char.name,
            oldGender: char.gender,
            newGender: updatedChar.gender,
            oldAge: char.age,
            newAge: updatedChar.age,
            oldAppearance: char.appearance,
            newAppearance: updatedChar.appearance,
            oldAvailableStatPoints: char.availableStatPoints,
            newAvailableStatPoints: updatedChar.availableStatPoints
          });
          return updatedChar;
        }
        return char;
      });
      
      console.log('CharacterContext.reducer - результат обновления:', updatedCharacters);
      return {
        ...state,
        characters: updatedCharacters,
        error: null
      };
    
    case ACTION_TYPES.SET_CHARACTERS:
      return {
        ...state,
        characters: action.payload,
        error: null
      };
    
    case ACTION_TYPES.CLEAR_CHARACTERS:
      return {
        ...state,
        characters: [],
        error: null
      };

    case ACTION_TYPES.ADD_EXPERIENCE:
      return {
        ...state,
        characters: state.characters.map(char => {
          if (char.id === action.payload.characterId) {
            const newExperience = (char.experience || 0) + action.payload.amount;
            const newLevel = calculateLevel(newExperience);
            
            return {
              ...char,
              experience: newExperience,
              level: newLevel,
              // Сохраняем availableStatPoints, если они есть
              availableStatPoints: char.availableStatPoints || 0
            };
          }
          return char;
        }),
        error: null
      };

    case ACTION_TYPES.LEVEL_UP:
      return {
        ...state,
        characters: state.characters.map(char => {
          if (char.id === action.payload.characterId) {
            return {
              ...char,
              ...action.payload.updates
            };
          }
          return char;
        }),
        error: null
      };

    case ACTION_TYPES.SHOW_LEVEL_UP_MODAL:
      return {
        ...state,
        levelUpModal: {
          isOpen: true,
          characterId: action.payload.characterId,
          newLevel: action.payload.newLevel,
          availablePoints: action.payload.availablePoints
        }
      };

    case ACTION_TYPES.HIDE_LEVEL_UP_MODAL:
      return {
        ...state,
        levelUpModal: {
          isOpen: false,
          characterId: null,
          newLevel: null,
          availablePoints: 0
        }
      };
    
    default:
      return state;
  }
};

// Создание контекста
const CharacterContext = createContext();

// Провайдер контекста
export const CharacterProvider = ({ children }) => {
  const [state, dispatch] = useReducer(characterReducer, initialState);

  // Загрузка персонажей из localStorage при инициализации (если не загружены в начальном состоянии)
  useEffect(() => {
    if (state.characters.length === 0) {
      const savedCharacters = localStorage.getItem('gameCharacters');
      if (savedCharacters) {
        try {
          const characters = JSON.parse(savedCharacters);
          dispatch({ type: ACTION_TYPES.SET_CHARACTERS, payload: characters });
        } catch (error) {
          console.error('Ошибка при загрузке персонажей:', error);
        }
      }
    }
  }, [state.characters.length]);

  // Сохранение персонажей в localStorage при изменении
  useEffect(() => {
    // Защита от случайной очистки - не сохраняем пустой массив, если это не явная очистка
    if (state.characters.length > 0 || localStorage.getItem('gameCharacters') === null) {
      localStorage.setItem('gameCharacters', JSON.stringify(state.characters));
    }
  }, [state.characters]);

  // Функции для работы с персонажами
  const addCharacter = (character) => {
    const newCharacter = {
      ...character,
      id: Date.now().toString(), // Простой способ генерации ID
      createdAt: new Date().toISOString(),
      level: 1,
      experience: 0,
      availableStatPoints: 0,
      romanceAvailable: character.romanceAvailable || false // Добавляем флаг доступности романтики
    };
    dispatch({ type: ACTION_TYPES.ADD_CHARACTER, payload: newCharacter });
    return newCharacter;
  };

  const removeCharacter = (characterId) => {
    dispatch({ type: ACTION_TYPES.REMOVE_CHARACTER, payload: characterId });
  };

  const updateCharacter = (characterId, updates) => {
    console.log('CharacterContext.updateCharacter - входные данные:', { characterId, updates });
    
    // Если обновляются характеристики, убеждаемся, что они валидные
    if (updates.stats) {
      const validStats = [
        'charisma', 'coldness', 'sensitivity', 'cunning', 
        'determination', 'intelligence'
      ];
      
      const filteredStats = {};
      validStats.forEach(stat => {
        if (updates.stats[stat] !== undefined) {
          filteredStats[stat] = updates.stats[stat];
        }
      });
      
      updates = {
        ...updates,
        stats: filteredStats
      };
      
      console.log('CharacterContext.updateCharacter - отфильтрованные характеристики:', filteredStats);
    }
    
    const payload = { id: characterId, ...updates };
    console.log('CharacterContext.updateCharacter - отправляем в dispatch:', payload);
    
    dispatch({ 
      type: ACTION_TYPES.UPDATE_CHARACTER, 
      payload: payload
    });
  };

  const getCharacter = (characterId) => {
    return state.characters.find(char => char.id === characterId);
  };

  const getAllCharacters = () => {
    return state.characters;
  };

  const clearCharacters = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_CHARACTERS });
  };

  // Функции для работы с опытом и уровнями
  const addExperience = (characterId, amount) => {
    const character = getCharacter(characterId);
    if (!character) return;

    const oldLevel = character.level || 1;
    const oldExperience = character.experience || 0;
    const newExperience = oldExperience + amount;
    const newLevel = calculateLevel(newExperience);

    console.log('addExperience:', {
      characterId,
      characterName: character.name,
      oldLevel,
      newLevel,
      oldExperience,
      newExperience,
      willLevelUp: newLevel > oldLevel
    });

    // Если уровень повысился, показываем модальное окно ПЕРЕД обновлением персонажа
    if (newLevel > oldLevel) {
      // Добавляем новые очки к существующим
      const newPoints = LEVEL_SYSTEM.statPointsPerLevel * (newLevel - oldLevel);
      addAvailableStatPoints(characterId, newPoints);
      
      // Получаем общее количество доступных очков после добавления
      const totalAvailablePoints = getAvailableStatPoints(characterId);
      
      console.log('Показываем модальное окно повышения уровня:', {
        characterId,
        newLevel,
        newPoints,
        totalAvailablePoints
      });
      
      // Сначала показываем модальное окно с правильным количеством очков
      dispatch({
        type: ACTION_TYPES.SHOW_LEVEL_UP_MODAL,
        payload: {
          characterId,
          newLevel,
          availablePoints: totalAvailablePoints
        }
      });
      
      console.log('Модальное окно отправлено в dispatch');
      
      // Затем с небольшой задержкой обновляем персонажа
      setTimeout(() => {
        console.log('Обновляем персонажа после показа модального окна');
        dispatch({ 
          type: ACTION_TYPES.ADD_EXPERIENCE, 
          payload: { characterId, amount } 
        });
      }, 200);
    } else {
      // Если уровень не повысился, сразу обновляем персонажа
      dispatch({ 
        type: ACTION_TYPES.ADD_EXPERIENCE, 
        payload: { characterId, amount } 
      });
    }
  };

  const levelUp = (characterId, statUpdates) => {
    const character = getCharacter(characterId);
    if (!character) return;

    // Определяем правильные характеристики для нашей системы
    const validStats = [
      'charisma', 'coldness', 'sensitivity', 'cunning', 
      'determination', 'intelligence'
    ];

    // Функция для расчета стоимости характеристики
    const getStatCost = (currentValue) => {
      if (currentValue <= 15) return 1;
      if (currentValue <= 20) return 2;
      return 0; // Максимум достигнут
    };

    // Рассчитываем общую стоимость распределенных очков
    let totalCost = 0;
    const updatedStats = {};
    
    Object.keys(statUpdates).forEach(stat => {
      if (validStats.includes(stat) && statUpdates[stat] > 0) {
        const currentValue = character.stats?.[stat] || 0;
        const newValue = currentValue + statUpdates[stat];
        
        // Рассчитываем стоимость для каждого уровня характеристики
        for (let i = currentValue; i < newValue; i++) {
          totalCost += getStatCost(i);
        }
        
        updatedStats[stat] = newValue;
      }
    });

    // Создаем обновленные характеристики, сохраняя только валидные
    const finalStats = {};
    validStats.forEach(stat => {
      finalStats[stat] = updatedStats[stat] || character.stats?.[stat] || 0;
    });

    // Используем единую систему для установки очков в 0
    setAvailableStatPoints(characterId, 0);

    const updates = {
      stats: finalStats
      // availableStatPoints устанавливается через setAvailableStatPoints
    };

    console.log('levelUp: Обновляем характеристики:', {
      characterId,
      statUpdates,
      totalCost,
      finalStats
    });

    dispatch({
      type: ACTION_TYPES.LEVEL_UP,
      payload: { characterId, updates }
    });
  };

  const hideLevelUpModal = () => {
    dispatch({ type: ACTION_TYPES.HIDE_LEVEL_UP_MODAL });
  };

  // Функция для сохранения состояния модального окна повышения уровня
  const saveLevelUpState = (characterId, statAllocation, remainingPoints) => {
    const character = getCharacter(characterId);
    if (!character) return;

    // Сохраняем состояние в localStorage для синхронизации с редактором персонажа
    const levelUpState = {
      characterId,
      statAllocation,
      remainingPoints,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`levelUpState_${characterId}`, JSON.stringify(levelUpState));
    
    console.log('Сохраняем состояние повышения уровня:', levelUpState);
  };

  // Функция для загрузки состояния модального окна повышения уровня
  const loadLevelUpState = (characterId) => {
    try {
      const savedState = localStorage.getItem(`levelUpState_${characterId}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Проверяем, что состояние не устарело (старше 1 часа)
        if (Date.now() - state.timestamp < 3600000) {
          console.log('Загружаем состояние повышения уровня:', state);
          return state;
        } else {
          // Удаляем устаревшее состояние
          localStorage.removeItem(`levelUpState_${characterId}`);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке состояния повышения уровня:', error);
    }
    return null;
  };

  // Функция для очистки состояния модального окна повышения уровня
  const clearLevelUpState = (characterId) => {
    localStorage.removeItem(`levelUpState_${characterId}`);
    console.log('Очищаем состояние повышения уровня для персонажа:', characterId);
  };

  // Функция для отмены модального окна повышения уровня (возвращает очки персонажу)
  const cancelLevelUp = (characterId) => {
    const character = getCharacter(characterId);
    if (!character) return;

    const savedState = loadLevelUpState(characterId);
    if (savedState) {
      // Возвращаем нераспределенные очки персонажу через единую систему
      const totalReturnedPoints = savedState.remainingPoints;
      
      console.log('Отмена повышения уровня, возвращаем очки:', totalReturnedPoints);
      
      // Используем единую систему для установки очков
      setAvailableStatPoints(characterId, totalReturnedPoints);
    } else {
      // Если нет сохраненного состояния, просто очищаем
      clearLevelUpState(characterId);
    }
  };

  // Функции для получения информации об уровне
  const getLevelInfo = (character) => {
    const level = character.level || 1;
    const experience = character.experience || 0;
    const expForNext = getExperienceForNextLevel(level);
    const currentLevelExp = getCurrentLevelExperience(experience, level);
    const nextLevelExp = LEVEL_SYSTEM.experienceRequirements[level] || 0;
    
    return {
      level,
      experience,
      expForNext,
      currentLevelExp,
      nextLevelExp,
      progress: nextLevelExp > 0 ? (currentLevelExp / nextLevelExp) * 100 : 100,
      isMaxLevel: level >= LEVEL_SYSTEM.maxLevel
    };
  };

  // Функция валидации персонажа
  const validateCharacter = (character, remainingPoints = 0) => {
    const errors = [];

    // Проверка имени
    if (!character.name || character.name.trim() === '') {
      errors.push('Имя персонажа обязательно');
    }

    // Проверка пола
    if (!character.gender) {
      errors.push('Пол персонажа обязателен');
    }

    // Проверка характеристик - только для создания нового персонажа
    // При редактировании нераспределенные очки разрешены
    if (!character.id && remainingPoints !== 0) {
      errors.push(`Должно быть распределено ровно 10 очков характеристик (осталось: ${remainingPoints})`);
    }

    // Проверка питомца - учитываем структуру characterData
    const petId = character.petId || (character.pet && character.pet.id);
    if (!petId) {
      errors.push('Питомец обязателен');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Единая система управления нераспределенными очками
  const getAvailableStatPoints = (characterId) => {
    const character = getCharacter(characterId);
    if (!character) return 0;
    
    // Проверяем сохраненное состояние модального окна
    const savedState = loadLevelUpState(characterId);
    if (savedState) {
      return savedState.remainingPoints;
    }
    
    // Возвращаем очки персонажа
    return character.availableStatPoints || 0;
  };

  const setAvailableStatPoints = (characterId, points) => {
    const character = getCharacter(characterId);
    if (!character) return;

    console.log(`setAvailableStatPoints: ${character.name} - ${points} очков`);

    // Обновляем очки персонажа
    dispatch({
      type: ACTION_TYPES.UPDATE_CHARACTER,
      payload: {
        id: characterId,
        availableStatPoints: points
      }
    });

    // Очищаем состояние модального окна
    clearLevelUpState(characterId);
    
    console.log(`Установлены нераспределенные очки для ${character.name}: ${points}`);
  };

  const addAvailableStatPoints = (characterId, points) => {
    const character = getCharacter(characterId);
    if (!character) return;

    const currentPoints = getAvailableStatPoints(characterId);
    const newPoints = currentPoints + points;
    
    setAvailableStatPoints(characterId, newPoints);
    
    console.log(`Добавлены нераспределенные очки для ${character.name}: ${points} (всего: ${newPoints})`);
  };

  const spendAvailableStatPoints = (characterId, points) => {
    const character = getCharacter(characterId);
    if (!character) return;

    const currentPoints = getAvailableStatPoints(characterId);
    const newPoints = Math.max(0, currentPoints - points);
    
    setAvailableStatPoints(characterId, newPoints);
    
    console.log(`Потрачены нераспределенные очки для ${character.name}: ${points} (осталось: ${newPoints})`);
  };

  const value = {
    ...state,
    addCharacter,
    removeCharacter,
    updateCharacter,
    getCharacter,
    getAllCharacters,
    clearCharacters,
    validateCharacter,
    addExperience,
    levelUp,
    hideLevelUpModal,
    getLevelInfo,
    LEVEL_SYSTEM,
    dispatch,
    saveLevelUpState,
    loadLevelUpState,
    clearLevelUpState,
    cancelLevelUp,
    getAvailableStatPoints,
    setAvailableStatPoints,
    addAvailableStatPoints,
    spendAvailableStatPoints
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

// Хук для использования контекста
export const useCharacters = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacters должен использоваться внутри CharacterProvider');
  }
  return context;
}; 