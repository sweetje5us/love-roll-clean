import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Типы отношений
export const RELATIONSHIP_TYPES = {
  FRIENDSHIP: 'friendship',
  ROMANCE: 'romance'
};

// Уровни отношений (единая шкала)
export const RELATIONSHIP_LEVELS = [
  { min: -100, max: -60, name: 'Вражда', color: '#dc143c' },
  { min: -59, max: -20, name: 'Неприязнь', color: '#ff6347' },
  { min: -19, max: 19, name: 'Нейтрально', color: '#808080' },
  { min: 20, max: 59, name: 'Дружба', color: '#32cd32' },
  { min: 60, max: 100, name: 'Близкая дружба', color: '#228b22' },
  // Романтические уровни — только если доступно
  { min: 101, max: 120, name: 'Симпатия', color: '#ff69b4', romance: true },
  { min: 121, max: 140, name: 'Любовь', color: '#ff1493', romance: true },
  { min: 141, max: 160, name: 'Страсть', color: '#ff0066', romance: true }
];

// Типы действий
const ACTION_TYPES = {
  INITIALIZE_RELATIONSHIPS: 'INITIALIZE_RELATIONSHIPS',
  UPDATE_RELATIONSHIP: 'UPDATE_RELATIONSHIP',
  BATCH_UPDATE_RELATIONSHIPS: 'BATCH_UPDATE_RELATIONSHIPS',
  RESET_RELATIONSHIPS: 'RESET_RELATIONSHIPS'
};

// Функция для получения начального состояния
const getInitialState = () => {
  try {
    const savedRelationships = localStorage.getItem('gameRelationships');
    
    if (savedRelationships) {
      const parsed = JSON.parse(savedRelationships);
      return parsed;
    }
  } catch (error) {
    console.error('Ошибка при загрузке отношений:', error);
  }
  
  return {
    relationships: {},
    episodeId: null
  };
};

// Начальное состояние
const initialState = getInitialState();

// Редьюсер
const relationshipsReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.INITIALIZE_RELATIONSHIPS:
      return {
        ...state,
        relationships: action.payload.relationships,
        episodeId: action.payload.episodeId
      };
    
    case ACTION_TYPES.UPDATE_RELATIONSHIP:
      const { characterId, targetId, type, value } = action.payload;
      const relationshipKey = `${characterId}_${targetId}_${type}`;
      
      const newState = {
        ...state,
        relationships: {
          ...state.relationships,
          [relationshipKey]: {
            characterId,
            targetId,
            type,
            value: Math.max(-100, Math.min(160, value)), // Ограничиваем значения от -100 до 160
            lastUpdated: Date.now()
          }
        }
      };
      
      return newState;
    
    case ACTION_TYPES.BATCH_UPDATE_RELATIONSHIPS:
      const updates = action.payload;
      const newRelationships = { ...state.relationships };
      
      updates.forEach(update => {
        const { characterId, targetId, type, value } = update;
        const relationshipKey = `${characterId}_${targetId}_${type}`;
        
        newRelationships[relationshipKey] = {
          characterId,
          targetId,
          type,
          value: Math.max(-100, Math.min(160, value)),
          lastUpdated: Date.now()
        };
      });
      
      return {
        ...state,
        relationships: newRelationships
      };
    
    case ACTION_TYPES.RESET_RELATIONSHIPS:
      return {
        ...state,
        relationships: {},
        episodeId: null
      };
    
    default:
      return state;
  }
};

// Контекст
const RelationshipsContext = createContext();

// Провайдер
export const RelationshipsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(relationshipsReducer, initialState);

  // Инициализация отношений для эпизода
  const initializeRelationships = (episodeId, characters, playerCharacterId = null, chapterConfig = null) => {
    // Проверяем, есть ли уже сохраненные отношения для этого эпизода
    const existingRelationships = state.relationships;
    const hasExistingRelationships = Object.keys(existingRelationships).length > 0 && state.episodeId === episodeId;
    
    // Если уже есть отношения для этого эпизода, не инициализируем повторно
    if (hasExistingRelationships) {
      return;
    }
    
    const relationships = {};
    
    // Создаем полный список персонажей, включая игрока
    const allCharacters = [...characters];
    if (playerCharacterId) {
              // Добавляем персонажа игрока, если его нет в списке
        const playerExists = characters.some(char => char.id === playerCharacterId);
        if (!playerExists) {
          // Создаем базовый объект персонажа игрока
          allCharacters.push({
            id: playerCharacterId,
            name: 'Игрок',
            gender: 'unknown' // Будет определено позже
          });
        }
      }
      
      // Получаем начальные значения отношений из конфигурации главы
      const initialRelationships = chapterConfig?.rewards?.relationship || {};
    
    // Создаем начальные отношения для всех персонажей
    allCharacters.forEach(character => {
      allCharacters.forEach(targetCharacter => {
        if (character.id !== targetCharacter.id) {
          // Дружба
          const friendshipKey = `${character.id}_${targetCharacter.id}_${RELATIONSHIP_TYPES.FRIENDSHIP}`;
          
          // Если есть существующие отношения, используем их, иначе создаем новые
          if (hasExistingRelationships && existingRelationships[friendshipKey]) {
            relationships[friendshipKey] = existingRelationships[friendshipKey];
          } else {
            // Определяем начальное значение отношения
            let initialValue = 0; // По умолчанию нейтральные отношения
            
            // Если это отношение игрока к персонажу главы, используем значение из конфигурации
            if (playerCharacterId && character.id === playerCharacterId && initialRelationships[targetCharacter.id]) {
              initialValue = initialRelationships[targetCharacter.id];
            }
            
            relationships[friendshipKey] = {
              characterId: character.id,
              targetId: targetCharacter.id,
              type: RELATIONSHIP_TYPES.FRIENDSHIP,
              value: initialValue,
              lastUpdated: Date.now()
            };
          }
          
          // Романтика (только для персонажей разного пола и если у игрока определен пол)
          if (character.gender !== targetCharacter.gender && character.gender !== 'unknown' && targetCharacter.gender !== 'unknown') {
            const romanceKey = `${character.id}_${targetCharacter.id}_${RELATIONSHIP_TYPES.ROMANCE}`;
            
                      if (hasExistingRelationships && existingRelationships[romanceKey]) {
            relationships[romanceKey] = existingRelationships[romanceKey];
          } else {
            relationships[romanceKey] = {
              characterId: character.id,
              targetId: targetCharacter.id,
              type: RELATIONSHIP_TYPES.ROMANCE,
              value: 0, // Нейтральные отношения
              lastUpdated: Date.now()
            };
          }
          }
        }
      });
    });
    
    dispatch({
      type: ACTION_TYPES.INITIALIZE_RELATIONSHIPS,
      payload: { relationships, episodeId }
    });
    

  };

  // Получение значения отношения
  const getRelationship = (characterId, targetId, type = RELATIONSHIP_TYPES.FRIENDSHIP) => {
    const relationshipKey = `${characterId}_${targetId}_${type}`;
    
    // Всегда сначала проверяем в localStorage (это гарантированно актуальные данные)
    try {
      const savedRelationships = localStorage.getItem('gameRelationships');
      if (savedRelationships) {
        const parsed = JSON.parse(savedRelationships);
        const relationship = parsed.relationships[relationshipKey];
        
        if (relationship) {
          return relationship.value;
        }
      }
    } catch (error) {
      console.error('Ошибка при чтении отношений из localStorage:', error);
    }
    
    // Если не найдено в localStorage, проверяем в состоянии React
    let relationship = state.relationships[relationshipKey];
    
    if (relationship) {
      return relationship.value;
    }
    
    // Если отношение не найдено нигде, возвращаем 0
    return 0;
  };

  // Обновление отношения
  const updateRelationship = (characterId, targetId, type, value) => {
    // Обновляем состояние React
    dispatch({
      type: ACTION_TYPES.UPDATE_RELATIONSHIP,
      payload: { characterId, targetId, type, value }
    });
    
    // Сохраняем в localStorage
    try {
      const relationshipKey = `${characterId}_${targetId}_${type}`;
      
      // Получаем актуальное состояние из localStorage или создаем новое
      let currentState;
      try {
        const savedState = localStorage.getItem('gameRelationships');
        currentState = savedState ? JSON.parse(savedState) : { relationships: {}, episodeId: state.episodeId };
      } catch (error) {
        currentState = { relationships: {}, episodeId: state.episodeId };
      }
      
      // Обновляем отношения в актуальном состоянии
      const updatedRelationships = {
        ...currentState.relationships,
        [relationshipKey]: {
          characterId,
          targetId,
          type,
          value: Math.max(-100, Math.min(160, value)),
          lastUpdated: Date.now()
        }
      };
      
      const updatedState = {
        ...currentState,
        relationships: updatedRelationships
      };
      
      localStorage.setItem('gameRelationships', JSON.stringify(updatedState));
    } catch (error) {
      console.error('Ошибка при сохранении в localStorage:', error);
    }
  };

  // Изменение отношения (добавление/вычитание)
  const changeRelationship = (characterId, targetId, type, change) => {
    // Получаем текущее значение из localStorage (гарантированно актуальные данные)
    const relationshipKey = `${characterId}_${targetId}_${type}`;
    let currentValue = 0;
    
    // Сначала проверяем в localStorage
    try {
      const savedRelationships = localStorage.getItem('gameRelationships');
      if (savedRelationships) {
        const parsed = JSON.parse(savedRelationships);
        const relationship = parsed.relationships[relationshipKey];
        if (relationship) {
          currentValue = relationship.value;
        }
      }
    } catch (error) {
      console.error('Ошибка при чтении отношений из localStorage:', error);
    }
    
    // Если не найдено в localStorage, проверяем в состоянии React
    if (currentValue === 0) {
      const currentRelationship = state.relationships[relationshipKey];
      if (currentRelationship) {
        currentValue = currentRelationship.value;
      }
    }
    
    const newValue = currentValue + change;
    
    // Если изменение равно 0, не обновляем отношение
    if (change === 0) {
      return;
    }
    
    // Обновляем состояние React напрямую
    dispatch({
      type: ACTION_TYPES.UPDATE_RELATIONSHIP,
      payload: { characterId, targetId, type, value: newValue }
    });
    
    // Сохраняем в localStorage
    try {
      let currentState;
      try {
        const savedState = localStorage.getItem('gameRelationships');
        currentState = savedState ? JSON.parse(savedState) : { relationships: {}, episodeId: state.episodeId };
      } catch (error) {
        currentState = { relationships: {}, episodeId: state.episodeId };
      }
      
      const updatedRelationships = {
        ...currentState.relationships,
        [relationshipKey]: {
          characterId,
          targetId,
          type,
          value: Math.max(-100, Math.min(160, newValue)),
          lastUpdated: Date.now()
        }
      };
      
      const updatedState = {
        ...currentState,
        relationships: updatedRelationships
      };
      
      localStorage.setItem('gameRelationships', JSON.stringify(updatedState));
    } catch (error) {
      console.error('Ошибка при сохранении в localStorage:', error);
    }
  };

  // Пакетное обновление отношений
  const batchUpdateRelationships = (updates) => {
    dispatch({
      type: ACTION_TYPES.BATCH_UPDATE_RELATIONSHIPS,
      payload: updates
    });
    

  };

  // Получение всех отношений для персонажа
  const getCharacterRelationships = (characterId) => {
    const characterRelationships = {};
    
    Object.keys(state.relationships).forEach(key => {
      const relationship = state.relationships[key];
      if (relationship.characterId === characterId) {
        if (!characterRelationships[relationship.targetId]) {
          characterRelationships[relationship.targetId] = {};
        }
        characterRelationships[relationship.targetId][relationship.type] = relationship.value;
      }
    });
    
    return characterRelationships;
  };

  // Получение уровня отношения (текстовое описание)
  const getRelationshipLevel = (value, romanceAvailable = false) => {
    // Если романтика недоступна и значение больше 100, ограничиваем его до 100
    const adjustedValue = !romanceAvailable && value > 100 ? 100 : value;
    
    for (const level of RELATIONSHIP_LEVELS) {
      if (adjustedValue >= level.min && adjustedValue <= level.max) {
        if (level.romance && !romanceAvailable) continue; // Пропускаем романтические уровни если не доступно
        return { level: level.name, color: level.color };
      }
    }
    // Fallback
    return { level: 'Нейтрально', color: '#808080' };
  };

  // Сброс отношений
  const resetRelationships = () => {
    dispatch({ type: ACTION_TYPES.RESET_RELATIONSHIPS });

  };

  const value = {
    ...state,
    initializeRelationships,
    getRelationship,
    updateRelationship,
    changeRelationship,
    batchUpdateRelationships,
    getCharacterRelationships,
    getRelationshipLevel,
    resetRelationships,
    RELATIONSHIP_TYPES
  };

  return (
    <RelationshipsContext.Provider value={value}>
      {children}
    </RelationshipsContext.Provider>
  );
};

// Хук для использования контекста
export const useRelationships = () => {
  const context = useContext(RelationshipsContext);
  if (!context) {
    throw new Error('useRelationships должен использоваться внутри RelationshipsProvider');
  }
  return context;
}; 