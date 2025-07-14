import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useRelationships } from '../../contexts/RelationshipsContext';
import { getStaticPath } from '../../utils/pathUtils';
import episodeManager from '../../utils/episodeManager';
import sceneManager from '../../utils/sceneManager';
import CharacterPreview from '../ui/CharacterPreview';
import ChapterCredits from '../ui/ChapterCredits';
import CharacterEditModal from '../ui/CharacterEditModal';
import RelationshipsWindow from '../ui/RelationshipsWindow';
import ShopModal from '../ui/ShopModal';
import InventoryModal from '../ui/InventoryModal';
import PauseMenuModal from '../ui/PauseMenuModal';
import NotificationSystem from '../ui/NotificationSystem';
import InlineDiceRoll from '../ui/InlineDiceRoll';
import EpisodeCompleteScreen from '../ui/EpisodeCompleteScreen';
import { buildCharacterSprite } from '../../utils/characterUtils';
import { clearEpisodeSaves } from '../../utils/saveUtils';
import { processChoiceEffects, isChoiceAvailable } from '../../utils/dialogueItemSystem';
import { hasDiceCheck } from '../../utils/diceSystem';
import { getPetSpecialText } from '../../utils/itemUtils';
import itemsData from '../../data/items.json';
import './GameScreen.css';

// Компонент для отображения персонажа в сцене
const SceneCharacter = ({ characterId, position = 'center', emotion = 'normal', episodeCharacters, characterType = '' }) => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!characterId || !episodeCharacters) {
      setLayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Находим данные персонажа в конфиге эпизода
      const characterData = episodeCharacters.find(char => char.id === characterId);
      
      if (!characterData) {
        console.warn(`Персонаж с ID ${characterId} не найден в конфиге эпизода`);
        setError(`Персонаж ${characterId} не найден`);
        setLoading(false);
        return;
      }

      // Собираем спрайт персонажа для эпизода через sceneManager
      const spriteLayers = sceneManager.buildCharacterSprite(characterData, emotion);
      setLayers(spriteLayers);
      setLoading(false);
    } catch (err) {
      console.error(`Ошибка при сборке спрайта для персонажа ${characterId}:`, err);
      setError(`Ошибка загрузки спрайта: ${err.message}`);
      setLoading(false);
    }
  }, [characterId, emotion, episodeCharacters]);

  if (loading) {
    return (
      <div className={`scene-character-loading scene-character-${position}`}>
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`scene-character-error scene-character-${position}`}>
        <i className="fas fa-exclamation-triangle"></i>
        <span>{error}</span>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className={`scene-character-placeholder scene-character-${position}`}>
        <i className="fas fa-user"></i>
      </div>
    );
  }

  // Определяем дополнительные классы для персонажа
  const getCharacterClasses = () => {
    const characterData = episodeCharacters.find(char => char.id === characterId);
    let classes = `scene-character-container scene-character-${position} ${characterType}`;
    
    // Добавляем класс для взрослых женских персонажей
    if (characterData && characterData.gender === 'female' && (characterData.age === '2' || characterData.age === 'mature')) {
      classes += ' female-mature';
    }
    
    return classes;
  };

  return (
    <div className={getCharacterClasses()}>
      <div className="game-avatar-container">
        {layers.map((layer, index) => (
          <img
            key={`scene-layer-${layer.zIndex}-${index}-${layer.src}`}
            src={layer.src}
            alt={`Слой ${layer.zIndex}`}
            className="game-avatar-layer"
            style={{
              zIndex: layer.zIndex,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.warn(`Ошибка загрузки изображения персонажа: ${layer.src}`);
              e.target.style.display = 'none';
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Компонент для отображения аватара в верхней панели и в сцене
const GameCharacterAvatar = ({ characterData, inventory, emotion = 'normal', isInScene = false }) => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Мемоизируем функцию сборки спрайта
  const buildSprite = useCallback(() => {
    if (!characterData) {
      setLayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let spriteLayers;
      
      if (isInScene) {
        // В сцене используем sceneManager для сборки спрайта
        spriteLayers = sceneManager.buildCharacterSprite(characterData, emotion, inventory);
      } else {
        // В верхней панели используем обычный buildCharacterSprite
        spriteLayers = buildCharacterSprite(characterData, inventory);
      }
      
      setLayers(spriteLayers);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при сборке спрайта для аватара:', err);
      setLoading(false);
    }
  }, [characterData, inventory, emotion, isInScene, characterData?.gender, characterData?.age, characterData?.appearance]);

  useEffect(() => {
    buildSprite();
  }, [buildSprite]);

  if (loading) {
    return (
      <div className="game-avatar-loading">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className="game-avatar-placeholder">
        <i className="fas fa-user"></i>
      </div>
    );
  }

  // Определяем классы для контейнера аватара
  const getAvatarClasses = () => {
    let classes = "game-avatar-container";
    
    // Добавляем класс для взрослых женских персонажей
    if (characterData && characterData.gender === 'female' && (characterData.age === '2' || characterData.age === 'mature')) {
      classes += ' female-mature';
    }
    
    return classes;
  };

  return (
    <div className={getAvatarClasses()}>
      {layers.map((layer, index) => (
        <img
          key={`avatar-layer-${layer.zIndex}-${index}-${layer.src}`}
          src={layer.src}
          alt={`Слой ${layer.zIndex}`}
          className="game-avatar-layer"
          style={{
            zIndex: layer.zIndex,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onError={(e) => {
            console.warn(`Ошибка загрузки изображения аватара: ${layer.src}`);
            e.target.style.display = 'none';
          }}
        />
      ))}
    </div>
  );
};

const GameScreen = () => {
  const { goBack, navigateTo, getNavigationParams } = useScreen();
  const { addExperience, getCharacter, getLevelInfo } = useCharacters();
  const { inventory, updateInventory, addItem, removeItem } = useInventory();
  const { initializeRelationships, changeRelationship, getRelationship, updateRelationship } = useRelationships();
  const [gameState, setGameState] = useState({
    isLoaded: false,
    isLoading: true,
    currentScene: null,
    characters: [],
    background: null,
    dialogue: null,
    choices: [],
    error: null,
    forceUpdate: null
  });

  // Состояние для анимации текста (управляется sceneManager)
  const [textAnimation, setTextAnimation] = useState({
    isAnimating: false,
    currentText: '',
    fullText: '',
    isComplete: false
  });

  // Состояние для анимаций сцен (управляется sceneManager)
  const [sceneAnimation, setSceneAnimation] = useState({
    isTransitioning: false,
    isBackgroundTransitioning: false,
    isDialogueEntering: false
  });

  // Состояние для титров
  const [creditsState, setCreditsState] = useState({
    showStartCredits: false,
    showEndCredits: false,
    creditsData: null,
    isTransitioning: false
  });

  // Получаем данные выбранного персонажа
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [characterLevelInfo, setCharacterLevelInfo] = useState(null);
  
  // Состояние для модального окна редактирования персонажа
  const [isCharacterEditModalOpen, setIsCharacterEditModalOpen] = useState(false);
  
  // Состояние для окна отношений
  const [isRelationshipsWindowOpen, setIsRelationshipsWindowOpen] = useState(false);
  
  // Состояние для модального окна магазина
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  
  // Состояние для модального окна инвентаря
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  
  // Состояние для модального окна паузы
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  
  // Состояние для отслеживания изменений отношений
  const [hasNewRelationshipChanges, setHasNewRelationshipChanges] = useState(false);
  const [lastRelationshipState, setLastRelationshipState] = useState({});
  
  // Состояние для отслеживания новых предметов
  const [hasNewItems, setHasNewItems] = useState(false);
  const [lastInventoryState, setLastInventoryState] = useState({});
  
  // Состояние для модального окна броска кубика
  const [inlineDiceRoll, setInlineDiceRoll] = useState({
    isVisible: false,
    choice: null
  });

  // Состояние для экрана завершения эпизода
  const [episodeCompleteState, setEpisodeCompleteState] = useState({
    isVisible: false,
    effects: null,
    pendingEffects: null
  });

  useEffect(() => {
    // Устанавливаем менеджер персонажей в EpisodeManager
    episodeManager.setCharacterManager({ addExperience });
  }, [addExperience]);

  useEffect(() => {
    // Получаем выбранного персонажа
    const params = getNavigationParams();
    const { characterId } = params;
    
    if (characterId) {
      const character = getCharacter(characterId);
      
      if (character) {
        setSelectedCharacter(character);
        const levelInfo = getLevelInfo(character);
        setCharacterLevelInfo(levelInfo);
      } else {
        console.warn('GameScreen - Персонаж не найден для ID:', characterId);
      }
    } else {
      console.warn('GameScreen - characterId не передан');
    }
  }, [getNavigationParams, getCharacter, getLevelInfo]);

  // Отслеживание изменений в инвентаре
  useEffect(() => {
    const currentInventory = Object.keys(inventory);
    const lastInventory = Object.keys(lastInventoryState);
    
    // Проверяем, есть ли новые предметы
    const hasNewItemsInInventory = currentInventory.some(itemId => !lastInventory.includes(itemId));
    
    if (hasNewItemsInInventory && !hasNewItems) {
      setHasNewItems(true);
    }
    
    // Обновляем состояние последнего инвентаря
    setLastInventoryState(inventory);
  }, [inventory, lastInventoryState, hasNewItems]);

  // Отслеживаем изменения в selectedCharacter для принудительного обновления
  useEffect(() => {
    if (selectedCharacter) {
      console.log('GameScreen: selectedCharacter изменился:', selectedCharacter);
      
      // Обновляем персонажа игрока в gameState.characters
      setGameState(prev => {
        const updatedCharacters = prev.characters.map(character => {
          if (character.type === 'player') {
            return {
              ...character,
              data: selectedCharacter // Обновляем данные персонажа игрока
            };
          }
          return character;
        });
        
        console.log('GameScreen: Обновлены персонажи в сцене:', updatedCharacters);
        
        return {
          ...prev,
          characters: updatedCharacters,
          forceUpdate: Date.now()
        };
      });
    }
  }, [selectedCharacter?.gender, selectedCharacter?.age, selectedCharacter?.appearance]);

  // Инициализация игры с эпизодом
  const initGame = async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const params = getNavigationParams();
      const { episodeId, chapterId } = params;
      
      console.log('GameScreen.initGame - параметры:', { episodeId, chapterId, selectedCharacter });
      
      // Если нет параметров эпизода, значит мы вернулись в главное меню
      if (!episodeId) {
        console.log('GameScreen.initGame - нет параметров эпизода, возвращаемся в главное меню');
        setGameState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Устанавливаем менеджер персонажей для episodeManager
      episodeManager.setCharacterManager({
        addExperience: (characterId, amount) => {
          addExperience(characterId, amount);
          setCharacterLevelInfo(getLevelInfo(characterId));
        }
      });

      // Устанавливаем менеджер отношений для episodeManager
      episodeManager.setRelationshipsManager({
        changeRelationship: (characterId, targetId, type, change) => {
          // Получаем текущее значение отношения
          const currentValue = getRelationship(characterId, targetId, type);
          const newValue = currentValue + change;
          
          // Изменяем отношение
          changeRelationship(characterId, targetId, type, change);
          
          // Показываем уведомление
          console.log('GameScreen - проверка window.addNotification:', !!window.addNotification);
          console.log('GameScreen - тип window.addNotification:', typeof window.addNotification);
          if (window.addNotification) {
            const episodeConfig = episodeManager.getEpisodeConfig();
            const targetCharacter = episodeConfig.characters.find(char => char.id === targetId);
            const characterName = targetCharacter ? targetCharacter.name : targetId;
            

            
            if (change > 0) {
              window.addNotification('relationship_positive', {
                message: `${characterName} это понравилось`,
                characterName: characterName
              });
            } else if (change < 0) {
              window.addNotification('relationship_negative', {
                message: `${characterName} это не понравилось`,
                characterName: characterName
              });
            }
          } else {
            console.warn('GameScreen - window.addNotification не доступна');
          }
          
          // Устанавливаем флаг новых изменений
          setHasNewRelationshipChanges(true);
        },
        getRelationship: (characterId, targetId, type) => {
          return getRelationship(characterId, targetId, type);
        }
      });

      // Устанавливаем менеджер инвентаря для episodeManager
      episodeManager.setInventoryManager({
        addItem: (itemId, count = 1) => {
          console.log(`EpisodeManager.addItem - добавляем ${count} ${itemId}`);
          // Используем addItem из InventoryContext
          addItem(itemId, count);
        },
        removeItem: (itemId, count = 1) => {
          console.log(`EpisodeManager.removeItem - убираем ${count} ${itemId}`);
          // Используем removeItem из InventoryContext
          removeItem(itemId, count);
        },
        getInventory: () => {
          // Преобразуем формат инвентаря для совместимости с episodeManager
          const simpleInventory = {};
          Object.entries(inventory).forEach(([itemId, itemData]) => {
            simpleInventory[itemId] = itemData.quantity || 0;
          });
          console.log(`EpisodeManager.getInventory - текущий инвентарь:`, simpleInventory);
          return simpleInventory;
        }
      });

      // Инициализируем эпизод
      console.log('GameScreen.initGame - инициализация эпизода:', episodeId);
      console.log('GameScreen.initGame - characterId из параметров:', params.characterId);
      
      // Устанавливаем characterId в episodeManager перед инициализацией
      if (params.characterId) {
        episodeManager.setPlayerCharacterId(params.characterId);
      }
      
      const success = await episodeManager.initializeEpisode(episodeId, chapterId || 1, params.characterId);
      
      if (!success) {
        throw new Error('Не удалось инициализировать эпизод');
      }

      // Получаем текущие данные
      const currentData = episodeManager.getCurrentData();
      console.log('GameScreen.initGame - данные эпизода:', currentData);
      
      if (currentData.scene) {
        // Инициализируем менеджер сцен
        const episodeConfig = episodeManager.getEpisodeConfig();
        console.log('GameScreen.initGame - конфигурация эпизода:', episodeConfig);
        console.log('GameScreen.initGame - персонажи эпизода:', episodeConfig.characters);
        sceneManager.initialize(episodeConfig.characters || []);
        
        // Инициализируем систему отношений для эпизода
        if (episodeConfig.characters && episodeConfig.characters.length > 0) {
          // Добавляем персонажа игрока в список персонажей для инициализации отношений
          const allCharacters = [...episodeConfig.characters];
          if (selectedCharacter && !allCharacters.find(char => char.id === selectedCharacter.id)) {
            allCharacters.push(selectedCharacter);
          }
          
          // Сначала инициализируем отношения
          console.log('GameScreen.initGame - инициализация отношений для персонажей:', allCharacters);
          const playerCharacterId = currentData.progress?.playerCharacterId;
          initializeRelationships(episodeId, allCharacters, playerCharacterId, currentData.chapter);
        }
        
        // Обрабатываем сцену через менеджер сцен (асинхронно)
        console.log('GameScreen.initGame - обработка сцены:', currentData.scene);
        const processedScene = await sceneManager.processScene(currentData.scene, selectedCharacter);
        console.log('GameScreen.initGame - сцена обработана:', processedScene);
        
        setGameState(prev => ({
          ...prev,
          isLoaded: true,
          isLoading: false,
          currentScene: currentData.scene,
          background: processedScene.background,
          characters: processedScene.characters,
          dialogue: processedScene.dialogue,
          choices: processedScene.choices
        }));
        
        // Показываем титры начала главы, если это первая сцена главы
        if (currentData.scene.id === currentData.chapter.scenes[0]) {
          showChapterStartCredits();
        }
        
        // Запускаем анимацию появления первой сцены и текста
        setTimeout(() => {
          sceneManager.animateDialogueEnter(setSceneAnimation);
          
          // Запускаем анимацию текста, если есть диалог
          if (processedScene.dialogue && processedScene.dialogue.text) {
            console.log('Запуск анимации текста:', processedScene.dialogue.text);
            sceneManager.animateText(processedScene.dialogue.text, 60, setTextAnimation);
          } else {
            console.log('Диалог не найден или пуст:', processedScene.dialogue);
          }
        }, 100);
      } else {
        throw new Error('Не удалось загрузить сцену');
      }
    } catch (error) {
      console.error('Ошибка инициализации игры:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  useEffect(() => {
    // Инициализация игры при монтировании компонента
    initGame();
  }, [getNavigationParams]);

  // Предоставляем функции для episodeManager через window
  useEffect(() => {
    window.getInventory = () => inventory;
    window.updateInventory = updateInventory;
    
    return () => {
      delete window.getInventory;
      delete window.updateInventory;
    };
  }, [inventory, updateInventory]);

  const handleChoice = async (choiceId) => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      // Получаем текущую сцену и выбор
      const currentData = episodeManager.getCurrentData();
      const choice = currentData.scene.choices.find(c => c.id === choiceId);
      
             // Специальная обработка для pet_play
       if (choice && choice.specialInteraction === 'pet_play') {
         const petId = selectedCharacter?.petId || selectedCharacter?.pet?.id;
         const pet = petId && Object.values(itemsData.items.pet || {}).find(p => 
           p.id === petId && p.special?.type === 'relation'
         );
         
         if (pet && pet.special?.increase) {
           console.log(`PET_PLAY: Найден питомец ${pet.name} с бонусом +${pet.special.increase} к отношениям`);
           // Создаем модифицированный выбор с правильным значением отношений
           const modifiedChoice = {
             ...choice,
             effects: {
               ...choice.effects,
               relationship: {
                 anna: pet.special.increase
               }
             }
           };
           
           // Заменяем оригинальный выбор на модифицированный
           const choiceIndex = currentData.scene.choices.findIndex(c => c.id === choiceId);
           if (choiceIndex !== -1) {
             currentData.scene.choices[choiceIndex] = modifiedChoice;
           }
         }
       }
      
      // Проверяем, есть ли проверка характеристики
      if (choice && hasDiceCheck(choice)) {
        // Открываем встроенный интерфейс броска кубика
        setInlineDiceRoll({
          isVisible: true,
          choice: choice
        });
        setGameState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      // Обрабатываем обычный выбор
      const result = await episodeManager.processChoice(choiceId, {
        value: choiceId,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        // Сохраняем прогресс после каждого выбора
        episodeManager.saveGameState();
        
        if (result.endChapter) {
          // Глава завершена
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          // Показываем титры конца главы
          showChapterEndCredits();
        } else if (result.chapterTransition) {
          // Переход к новой главе
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          // Показываем титры начала новой главы
          showChapterStartCredits();
        } else if (result.nextScene === 'episode_complete') {
          // Завершение эпизода
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          // Сначала показываем титры конца главы, затем экран завершения эпизода
          showChapterEndCredits();
          // Сохраняем эффекты для использования после титров
          setEpisodeCompleteState(prev => ({
            ...prev,
            pendingEffects: result.effects
          }));
        } else if (result.nextScene) {
        // Запускаем анимацию переключения сцен только при реальной смене сцены
        animateSceneTransition();
          
          // Загружаем следующую сцену
          await episodeManager.loadScene(result.nextScene);
        
        // Получаем обновленные данные
        const updatedData = episodeManager.getCurrentData();
        
        // Запускаем анимацию смены фона, если фон изменился
        const newBackground = updatedData.scene.background;
        if (newBackground !== gameState.background) {
          animateBackgroundTransition();
        }
        
        // Обрабатываем новую сцену через sceneManager (асинхронно)
        const processedScene = await sceneManager.processScene(updatedData.scene, selectedCharacter);
        
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          currentScene: updatedData.scene,
          background: processedScene.background,
          characters: processedScene.characters,
          dialogue: processedScene.dialogue,
          choices: [] // Очищаем выборы, так как переходим к новой сцене
        }));
        
        // Запускаем анимацию появления диалогового окна
        setTimeout(() => {
          animateDialogueEnter();
        }, 200);
        } else {
          // Обычная обработка выбора (например, изменение отношений без смены сцены)
        setGameState(prev => ({
          ...prev,
          isLoading: false
        }));
        }
      } else {
        // Ошибка обработки выбора
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Ошибка обработки выбора'
        }));
      }
      
    } catch (error) {
      console.error('Ошибка обработки выбора:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  const handleNext = async () => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      // Переходим к следующему диалогу
      const currentData = episodeManager.getCurrentData();
      const currentDialogueIndex = currentData.scene.dialogue.findIndex(
        d => d === gameState.dialogue
      );
      
      if (currentDialogueIndex < currentData.scene.dialogue.length - 1) {
        // Есть следующий диалог в той же сцене - НЕ запускаем анимацию переключения сцен
        const nextDialogue = currentData.scene.dialogue[currentDialogueIndex + 1];
        
        // Обновляем эмоции персонажей через sceneManager (асинхронно)
        await sceneManager.updateCharacterEmotions(nextDialogue, null, selectedCharacter);
        
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          dialogue: nextDialogue,
          choices: [] // Очищаем выборы, так как переходим к диалогу
        }));
        
        // Запускаем только анимацию появления диалогового окна
        setTimeout(() => {
          animateDialogueEnter();
        }, 100);
      } else {
        // Диалог закончился, показываем выборы
        const availableChoices = episodeManager.getAvailableChoices();
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          choices: availableChoices
        }));
      }
      
    } catch (error) {
      console.error('Ошибка перехода к следующему диалогу:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  const handleBackToMenu = () => {
    // Сбрасываем менеджер эпизода
    episodeManager.resetEpisode();
    goBack();
  };

  const handleClearSaves = () => {
    if (window.confirm('Вы уверены, что хотите очистить все сохранения? Это действие нельзя отменить.')) {
      clearEpisodeSaves();
      alert('Сохранения очищены. Игра будет перезапущена.');
      window.location.reload();
    }
  };

  // Обработчик клика по аватару персонажа
  const handleCharacterAvatarClick = () => {
    setIsCharacterEditModalOpen(true);
  };

  // Обработчик закрытия модального окна редактирования персонажа
  const handleCloseCharacterEditModal = () => {
    setIsCharacterEditModalOpen(false);
  };

  // Обработчик открытия окна отношений
  const handleOpenRelationshipsWindow = () => {
    setIsRelationshipsWindowOpen(true);
    setHasNewRelationshipChanges(false); // Сбрасываем флаг при открытии окна
  };

  // Обработчик закрытия окна отношений
  const handleCloseRelationshipsWindow = () => {
    setIsRelationshipsWindowOpen(false);
  };

  // Обработчик открытия модального окна магазина
  const handleOpenShopModal = () => {
    setIsShopModalOpen(true);
  };

  // Обработчик закрытия модального окна магазина
  const handleCloseShopModal = () => {
    setIsShopModalOpen(false);
  };

  // Обработчик открытия модального окна инвентаря
  const handleOpenInventoryModal = () => {
    setIsInventoryModalOpen(true);
    setHasNewItems(false); // Сбрасываем флаг при открытии инвентаря
  };

  // Обработчик закрытия модального окна инвентаря
  const handleCloseInventoryModal = () => {
    setIsInventoryModalOpen(false);
  };

  // Обработчик открытия модального окна паузы
  const handleOpenPauseMenu = () => {
    setIsPauseMenuOpen(true);
  };

  // Обработчик закрытия модального окна паузы
  const handleClosePauseMenu = () => {
    setIsPauseMenuOpen(false);
  };

  // Обработчик закрытия встроенного интерфейса броска кубика
  const handleCloseInlineDiceRoll = () => {
    setInlineDiceRoll({
      isVisible: false,
      choice: null
    });
  };

  // Обработчик результата броска кубика
  const handleDiceRollResult = async (rollResult) => {
    try {
      setGameState(prev => ({ ...prev, isLoading: true }));
      
      const { choice } = inlineDiceRoll;
      
      // Определяем следующую сцену на основе результата
      let nextScene = choice.nextScene;
      
      // Если есть специальные сцены для результатов, используем их
      if (choice.diceCheck.results) {
        const resultScenes = choice.diceCheck.results;
        switch (rollResult.result) {
          case 'critical_success':
            nextScene = resultScenes.critical_success || nextScene;
            break;
          case 'success':
            nextScene = resultScenes.success || nextScene;
            break;
          case 'failure':
            nextScene = resultScenes.failure || nextScene;
            break;
          case 'critical_failure':
            nextScene = resultScenes.critical_failure || nextScene;
            break;
        }
      }
      
      // Обрабатываем выбор с результатом броска
      const result = await episodeManager.processChoice(choice.id, {
        value: choice.id,
        timestamp: new Date().toISOString(),
        diceRollResult: rollResult
      });
      
      if (result.success) {
        // Сохраняем прогресс после каждого выбора
        episodeManager.saveGameState();
        
        if (result.endChapter) {
          // Глава завершена
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          showChapterEndCredits();
        } else if (result.chapterTransition) {
          // Переход к новой главе
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          showChapterStartCredits();
        } else if (result.nextScene === 'episode_complete') {
          // Завершение эпизода
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
          // Сначала показываем титры конца главы, затем экран завершения эпизода
          showChapterEndCredits();
          // Сохраняем эффекты для использования после титров
          setEpisodeCompleteState(prev => ({
            ...prev,
            pendingEffects: result.effects
          }));
        } else if (nextScene) {
          // Запускаем анимацию переключения сцен
          animateSceneTransition();
          
          // Загружаем следующую сцену
          await episodeManager.loadScene(nextScene);
          
          // Получаем обновленные данные
          const updatedData = episodeManager.getCurrentData();
          
          // Запускаем анимацию смены фона, если фон изменился
          const newBackground = updatedData.scene.background;
          if (newBackground !== gameState.background) {
            animateBackgroundTransition();
          }
          
          // Обрабатываем новую сцену через sceneManager
          const processedScene = await sceneManager.processScene(updatedData.scene, selectedCharacter);
          
          setGameState(prev => ({
            ...prev,
            isLoading: false,
            currentScene: updatedData.scene,
            background: processedScene.background,
            characters: processedScene.characters,
            dialogue: processedScene.dialogue,
            choices: []
          }));
          
          // Запускаем анимацию появления диалогового окна
          setTimeout(() => {
            animateDialogueEnter();
          }, 200);
        } else {
          // Обычная обработка выбора
          setGameState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } else {
        // Ошибка обработки выбора
        setGameState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Ошибка обработки выбора'
        }));
      }
      
    } catch (error) {
      console.error('Ошибка обработки результата броска кубика:', error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Обработчик продолжения игры
  const handleContinueGame = () => {
    setIsPauseMenuOpen(false);
  };

  // Обработка клавиши Escape
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        if (isPauseMenuOpen) {
          setIsPauseMenuOpen(false);
        } else {
          setIsPauseMenuOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPauseMenuOpen]);

  // Функция для обновления персонажей в сцене после изменения внешности
  const handleCharacterUpdate = () => {
    console.log('GameScreen: Обновление персонажей в сцене');
    
    // Просто обновляем данные выбранного персонажа из контекста
    const params = getNavigationParams();
    const { characterId } = params;
    if (characterId) {
      const updatedCharacter = getCharacter(characterId);
      if (updatedCharacter) {
        setSelectedCharacter(updatedCharacter);
        const levelInfo = getLevelInfo(updatedCharacter);
        setCharacterLevelInfo(levelInfo);
        console.log('GameScreen: Обновлены данные персонажа:', updatedCharacter);
      }
    }
  };

  // Функция для обработки динамического текста диалогов
  const processDialogueText = (text, character) => {
    if (!text || !character) return text;
    
    let processedText = text;
    
    // Заменяем плейсхолдеры питомца
    // Проверяем новую структуру (petId, petName) и старую (pet.id, pet.name)
    const petId = character.petId || character.pet?.id;
    const petName = character.petName || character.pet?.name;
    
    if (petId) {
      const pet = Object.values(itemsData.items.pet || {}).find(p => p.id === petId);
      if (pet) {
        // Используем petName если есть, иначе имя из items.json
        const finalPetName = petName || pet.name;
        processedText = processedText.replace(/\[PET_NAME\]/g, finalPetName);
        processedText = processedText.replace(/\[PET_ABILITY\]/g, getPetSpecialText(pet));
        
        // Реакция на пугающего питомца
        if (pet.scary) {
          processedText = processedText.replace(/\[PET_REACTION\]/g, 'испугалась');
        } else {
          processedText = processedText.replace(/\[PET_REACTION\]/g, 'умилилась');
        }
      }
    }
    
    return processedText;
  };

  // Функция для анимации текста (использует sceneManager)
  const animateText = (text, speed = 60) => {
    sceneManager.animateText(text, speed, setTextAnimation);
  };

  // Функция для анимации переключения сцен (использует sceneManager)
  const animateSceneTransition = () => {
    sceneManager.animateSceneTransition(setSceneAnimation);
  };

  // Функция для анимации смены фона (использует sceneManager)
  const animateBackgroundTransition = () => {
    sceneManager.animateBackgroundTransition(setSceneAnimation);
  };

  // Функция для расчета позиции диалогового окна над персонажами
  const calculateDialoguePosition = () => {
    if (!gameState.characters || gameState.characters.length === 0) {
      return { top: '10%', bottom: 'auto' };
    }

    // Находим говорящего персонажа
    const speaker = gameState.dialogue?.speaker;
    if (!speaker || speaker === 'narrator') {
      return { top: '10%', bottom: 'auto' };
    }

    const speakingCharacter = gameState.characters.find(char => char.id === speaker);
    if (!speakingCharacter) {
      return { top: '10%', bottom: 'auto' };
    }

    // Рассчитываем позицию на основе позиции персонажа
    const characterHeight = 350; // Высота контейнера персонажа
    const dialogueOffset = 20; // Отступ от персонажа
    
    // Учитываем высоту контейнера с вариантами ответов
    let choicesContainerHeight = 0;
    if (gameState.choices.length > 0) {
      // Более точный расчет высоты контейнера выборов
      const baseHeight = 80; // Базовая высота (padding + label)
      const choiceHeight = 50; // Высота одной кнопки выбора
      const gap = 10; // Отступ между кнопками
      choicesContainerHeight = baseHeight + (gameState.choices.length * choiceHeight) + ((gameState.choices.length - 1) * gap);
    }
    
    const bottomPosition = characterHeight + dialogueOffset + choicesContainerHeight;

    return {
      top: 'auto',
      bottom: `${bottomPosition}px`
    };
  };

  // Функция для определения позиции уголка диалогового окна
  const getDialogueArrowPosition = (speakerId) => {
    if (!gameState.characters) return '50%';
    
    const speakingCharacter = gameState.characters.find(char => char.id === speakerId);
    if (!speakingCharacter) return '50%';
    
    switch (speakingCharacter.position) {
      case 'left':
        return '25%';
      case 'right':
        return '75%';
      case 'center':
      default:
        return '50%';
    }
  };

  // Функция для анимации появления диалогового окна (использует sceneManager)
  const animateDialogueEnter = () => {
    sceneManager.animateDialogueEnter(setSceneAnimation);
  };

  // Обработчик клика по диалоговому окну
  const handleDialogueClick = () => {
    if (textAnimation.isAnimating) {
      // Прерываем анимацию и показываем весь текст
      sceneManager.completeTextAnimation(setTextAnimation);
    } else if (textAnimation.isComplete && !gameState.choices.length) {
      // Если анимация завершена и нет выборов, переходим к следующему диалогу
      handleNext();
    }
  };

  // Показать титры начала главы
  const showChapterStartCredits = () => {
    const creditsData = episodeManager.getChapterStartCredits();
    if (creditsData) {
      setCreditsState({
        showStartCredits: true,
        showEndCredits: false,
        creditsData
      });
    }
  };

  // Показать титры конца главы
  const showChapterEndCredits = () => {
    // Отмечаем главу как завершенную
    episodeManager.completeChapter();
    
    // Сохраняем прогресс при завершении главы
    episodeManager.saveGameState();
    
    const creditsData = episodeManager.getChapterEndCredits();
    if (creditsData) {
      setCreditsState({
        showStartCredits: false,
        showEndCredits: true,
        creditsData
      });
    }
  };

  // Показать экран завершения эпизода
  const showEpisodeCompleteScreen = (effects) => {
    // Применяем награды за завершение эпизода
    if (effects && effects.episode_complete) {
      const { experience, coins } = effects.episode_complete;
      
      if (experience && selectedCharacter) {
        addExperience(selectedCharacter.id, experience);
      }
      
      if (coins && window.addCoins) {
        window.addCoins(coins);
      }
    }
    
    // Отмечаем эпизод как завершенный (глава уже завершена в showChapterEndCredits)
    episodeManager.completeEpisode();
    
    // Показываем экран завершения
    setEpisodeCompleteState({
      isVisible: true,
      effects
    });
  };

  // Обработчик возврата в главное меню с экрана завершения эпизода
  const handleEpisodeCompleteBackToMenu = () => {
    // Сбрасываем менеджер эпизода
    episodeManager.resetEpisode();
    
    // Скрываем экран завершения
    setEpisodeCompleteState({
      isVisible: false,
      effects: null,
      pendingEffects: null
    });
    
    // Переходим в главное меню напрямую
    navigateTo(SCREEN_TYPES.MAIN_MENU, {}, 'fade');
  };

  // Обработка завершения титров начала главы
  const handleStartCreditsComplete = () => {
    setCreditsState(prev => ({ ...prev, showStartCredits: false }));
    
    // После показа титров начала главы загружаем первую сцену новой главы
    const currentData = episodeManager.getCurrentData();
    if (currentData && currentData.scene) {
      // Обрабатываем новую сцену через sceneManager (асинхронно)
      sceneManager.processScene(currentData.scene, selectedCharacter).then(processedScene => {
        setGameState(prev => ({
          ...prev,
          currentScene: currentData.scene,
          background: processedScene.background,
          characters: processedScene.characters,
          dialogue: processedScene.dialogue,
          choices: []
        }));
        
        // Запускаем анимацию появления диалогового окна
        setTimeout(() => {
          animateDialogueEnter();
        }, 200);
      }).catch(error => {
        console.error('Ошибка обработки сцены после перехода к новой главе:', error);
      });
    }
  };

  // Обработка завершения титров конца главы
  const handleEndCreditsComplete = () => {
    // Защита от повторного вызова
    if (gameState.isLoading || creditsState.isTransitioning) {
      console.log('handleEndCreditsComplete: уже выполняется, пропускаем');
      return;
    }
    
    console.log('handleEndCreditsComplete: начало выполнения');
    
    // Устанавливаем флаг перехода
    setCreditsState(prev => ({ 
      ...prev, 
      showEndCredits: false,
      isTransitioning: true 
    }));
    
    // Устанавливаем флаг загрузки
    setGameState(prev => ({ ...prev, isLoading: true }));
    
    // Сохраняем прогресс перед переходом к следующей главе
    episodeManager.saveGameState();
    
    // Переходим к следующей главе
    episodeManager.nextChapter().then(success => {
      if (success) {
        // Загружаем новую главу напрямую, без переинициализации
        const currentData = episodeManager.getCurrentData();
        const nextChapterId = currentData.progress.currentChapter;
        
        episodeManager.loadChapter(nextChapterId, true).then(() => {
          // Получаем обновленные данные
          const updatedData = episodeManager.getCurrentData();
          
          // Обрабатываем новую сцену через sceneManager
          sceneManager.processScene(updatedData.scene, selectedCharacter).then(processedScene => {
            setGameState(prev => ({
              ...prev,
              currentScene: updatedData.scene,
              background: processedScene.background,
              characters: processedScene.characters,
              dialogue: processedScene.dialogue,
              choices: [],
              isLoading: false
            }));
            
            // Запускаем анимацию появления диалогового окна
            setTimeout(() => {
              animateDialogueEnter();
            }, 200);
          });
        });
      } else {
        // Это последняя глава эпизода
        setGameState(prev => ({ ...prev, isLoading: false }));
        
        // Проверяем, есть ли ожидающие эффекты завершения эпизода
        if (episodeCompleteState.pendingEffects) {
          // Показываем экран завершения эпизода
          showEpisodeCompleteScreen(episodeCompleteState.pendingEffects);
          // Очищаем ожидающие эффекты
          setEpisodeCompleteState(prev => ({
            ...prev,
            pendingEffects: null
          }));
        } else {
          goBack();
        }
      }
      
      // Сбрасываем флаг перехода
      setCreditsState(prev => ({ ...prev, isTransitioning: false }));
    });
  };

  // Функция для обновления эмоций персонажей (использует sceneManager)
  const updateCharacterEmotions = async (dialogue) => {
    await sceneManager.updateCharacterEmotions(dialogue, null, selectedCharacter);
  };

  // Функция для обновления высоты контейнера с вариантами выбора
  const updateChoicesContainerHeight = () => {
    const choicesContainer = document.querySelector('.choices-container');
    const charactersLayer = document.querySelector('.characters-layer');
    const gameMainArea = document.querySelector('.game-main-area');
    
    if (choicesContainer && charactersLayer && gameMainArea) {
      const height = choicesContainer.offsetHeight;
      gameMainArea.style.setProperty('--choices-container-height', `${height}px`);
      charactersLayer.classList.add('with-choices');
    } else if (charactersLayer && gameMainArea) {
      gameMainArea.style.setProperty('--choices-container-height', '0px');
      charactersLayer.classList.remove('with-choices');
    }
  };

  // Отслеживаем изменения в choices
  useEffect(() => {
    if (gameState.choices.length > 0 && textAnimation.isComplete) {
      // Небольшая задержка для рендеринга
      setTimeout(updateChoicesContainerHeight, 100);
    } else {
      updateChoicesContainerHeight();
    }
  }, [gameState.choices, textAnimation.isComplete]);

  // Отслеживаем изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      updateChoicesContainerHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Эффект для запуска анимации при изменении диалога
  useEffect(() => {
    if (gameState.dialogue && gameState.dialogue.text && gameState.isLoaded) {
      // Запускаем анимацию только если игра уже загружена (не при инициализации)
      animateText(gameState.dialogue.text);
      updateCharacterEmotions(gameState.dialogue).catch(error => {
        console.error('Ошибка обновления эмоций персонажей:', error);
      });
    }
  }, [gameState.dialogue, gameState.isLoaded]);

  if (gameState.isLoading) {
    return (
      <div className="game-screen loading">
        <div className="game-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Загрузка игры...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="game-screen error">
        <div className="game-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <h3>Ошибка загрузки</h3>
            <p>{gameState.error}</p>
            <button onClick={handleBackToMenu} className="back-button">
              <i className="fas fa-arrow-left"></i>
              Вернуться в меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState.isLoaded) {
    return (
      <div className="game-screen loading">
        <div className="game-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Загрузка игры...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      key={`game-screen-${selectedCharacter?.id}-${gameState.forceUpdate || 0}`}
      className="game-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="game-container">
      {/* Верхняя панель UI */}
      <div className="game-top-panel">
        {/* Блок персонажа */}
        <div className="game-character-info-block">
          {/* Аватар персонажа */}
          <div className="game-character-avatar" onClick={handleCharacterAvatarClick} style={{ cursor: 'pointer' }}>
            {selectedCharacter ? (
              <div className="game-character-preview">
                <GameCharacterAvatar 
                  key={`top-avatar-${gameState.forceUpdate || 0}`}
                  characterData={selectedCharacter} 
                  inventory={inventory} 
                  isInScene={false} 
                />
              </div>
            ) : (
              <div className="game-default-avatar">
                <i className="fas fa-user"></i>
              </div>
            )}
            {characterLevelInfo && (
              <div className="game-character-level-badge">
                {characterLevelInfo.level}
              </div>
            )}
          </div>
          
          {/* Имя и шкала опыта */}
          <div className="game-character-details">
            <div className="game-character-name">
              {selectedCharacter?.name || 'Неизвестный'}
            </div>
            {characterLevelInfo && (
              <div className="game-experience-section">
                <div className="game-experience-bar">
                  <div 
                    className="game-experience-bar-fill"
                    style={{ width: `${characterLevelInfo.progress}%` }}
                  ></div>
                </div>
                <div className="game-experience-text">
                  {characterLevelInfo.currentLevelExp}/{characterLevelInfo.nextLevelExp} XP
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Кнопки навигации */}
        <div className="game-navigation-buttons">
          <button className="game-nav-button pulse" onClick={handleOpenRelationshipsWindow} title="Отношения">
            <i className="fas fa-heart"></i>
            {hasNewRelationshipChanges && (
              <div className="notification-badge">
                <i className="fas fa-exclamation"></i>
              </div>
            )}
          </button>
          <button className="game-nav-button pulse" onClick={handleOpenInventoryModal} title="Инвентарь">
            <i className="fas fa-bag-shopping"></i>
            {hasNewItems && (
              <div className="notification-badge">
                <i className="fas fa-gift"></i>
              </div>
            )}
          </button>
          <button className="game-nav-button pulse" onClick={handleOpenShopModal} title="Магазин">
            <i className="fas fa-store"></i>
          </button>
          <button className="game-nav-button pulse" onClick={handleOpenPauseMenu} title="Пауза">
            <i className="fas fa-pause"></i>
          </button>
        </div>
      </div>

      {/* Основная игровая область с диалогом */}
      <div className={sceneManager.getMainAreaClasses(sceneAnimation)}>
        {/* Фон */}
        <div className={sceneManager.getBackgroundLayerClasses(sceneAnimation)}>
          {gameState.background ? (
            <img src={gameState.background} alt="Background" />
          ) : (
            // Фон по умолчанию для сцены обучения
            <img 
              src={getStaticPath('sprites/episodes/locations/school/school_building.png')} 
              alt="School Background" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                console.error('Ошибка загрузки фона:', e.target.src);
                e.target.style.display = 'none';
              }}

            />
          )}
        </div>

        {/* Персонажи - показываем только если есть диалоги с персонажами и персонажи в сцене */}
        {gameState.characters && gameState.characters.length > 0 && (
          <div className="characters-layer">
            {gameState.characters.map((character, index) => {
              if (character.type === 'player') {
                // Персонаж игрока
                const characterType = character.data.gender === 'female' && (character.data.age === '2' || character.data.age === 'mature') ? 'female-mature' : '';
                
                return (
                  <div key={`player-${character.id}-${index}`} className={`scene-character-container scene-character-${character.position} ${characterType}`}>
                    <GameCharacterAvatar 
                      key={`player-avatar-${character.id}-${index}`}
                      characterData={character.data} 
                      inventory={inventory} 
                      emotion={character.emotion}
                      isInScene={true} 
                    />
                  </div>
                );
              } else {
                // NPC персонаж
                const characterType = character.data.gender === 'female' && (character.data.age === '2' || character.data.age === 'mature') ? 'female-mature' : '';
                
                return (
                  <SceneCharacter
                    key={`npc-${character.id}-${index}`}
                    characterId={character.id}
                    position={character.position}
                    emotion={character.emotion}
                    episodeCharacters={sceneManager.episodeCharacters}
                    characterType={characterType}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Диалоговое окно - занимает всю игровую область */}
        <div 
          className={sceneManager.getDialogueBoxClasses(gameState, textAnimation, sceneAnimation)}
          style={calculateDialoguePosition()}
          onClick={handleDialogueClick}
        >
          {gameState.dialogue ? (
            <div className="dialogue-content">
              <div className="dialogue-header">
                <div className="dialogue-indicator"></div>
                <span className="dialogue-speaker">
                  {sceneManager.getSpeakerName(gameState.dialogue.speaker, selectedCharacter)}
                </span>
              </div>
              <p className="dialogue-text">
                {processDialogueText(textAnimation.currentText, selectedCharacter)}
                {textAnimation.isAnimating && <span className="text-cursor">|</span>}
              </p>
            </div>
          ) : (
            <div className="dialogue-content">
              <div className="dialogue-header">
                <div className="dialogue-indicator"></div>
                <span className="dialogue-speaker">Рассказчик</span>
              </div>
              <p className="dialogue-text">
                {processDialogueText(textAnimation.currentText, selectedCharacter)}
                {textAnimation.isAnimating && <span className="text-cursor">|</span>}
              </p>
            </div>
          )}
          
          {/* Уголок диалогового окна */}
          {gameState.dialogue && gameState.dialogue.speaker && gameState.dialogue.speaker !== 'narrator' && (
            <div 
              className="dialogue-arrow"
              style={{
                left: getDialogueArrowPosition(gameState.dialogue.speaker)
              }}
            />
          )}
        </div>
      </div>

      {/* Выборы - всегда внизу экрана */}
      {textAnimation.isComplete && gameState.choices.length > 0 && (
        <div className="choices-container">
          <p className="choices-label">Выберите ответ:</p>
          <div className="choices-list">
            {gameState.choices.map((choice, index) => {
              // Проверяем доступность выбора
              const isAvailable = isChoiceAvailable(choice, inventory);
              
              // Обрабатываем динамический текст выбора
              let choiceText = choice.text;
              
              // Заменяем плейсхолдеры питомца
              const petId = selectedCharacter?.petId || selectedCharacter?.pet?.id;
              const petName = selectedCharacter?.petName || selectedCharacter?.pet?.name;
              
              if (petId) {
                const pet = Object.values(itemsData.items.pet || {}).find(p => p.id === petId);
                if (pet) {
                  const finalPetName = petName || pet.name;
                  choiceText = choiceText.replace('[PET_NAME]', finalPetName);
                  choiceText = choiceText.replace('[PET_ABILITY]', getPetSpecialText(pet));
                }
              }
              
              // Проверяем специальное взаимодействие с питомцем
              const petWithRelationAbility = petId && 
                Object.values(itemsData.items.pet || {}).find(p => 
                  p.id === petId && 
                  p.special?.type === 'relation'
                );
              
              // Если это специальное взаимодействие с питомцем
              if (choice.specialInteraction === 'pet_play') {
                const hasPetWithRelationAbility = !!petWithRelationAbility;
                
                return (
                  <motion.button
                    key={`${choice.id}-pet-play`}
                    className={`choice-button ${hasPetWithRelationAbility ? 'choice-button-special' : 'choice-button-disabled'}`}
                    onClick={hasPetWithRelationAbility ? () => handleChoice(choice.id) : undefined}
                    whileHover={hasPetWithRelationAbility ? { scale: 1.02 } : {}}
                    whileTap={hasPetWithRelationAbility ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: hasPetWithRelationAbility ? 1 : 0.5, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    disabled={!hasPetWithRelationAbility}
                  >
                    <i className="fas fa-paw"></i>
                    Предложить Анне поиграть с питомцем
                    {!hasPetWithRelationAbility && (
                      <span className="choice-requirement">
                        (требуется питомец со способностью улучшения отношений)
                      </span>
                    )}
                  </motion.button>
                );
              }
              
              return (
                <motion.button
                  key={choice.id || `choice-${index}`}
                  className={`choice-button ${!isAvailable ? 'choice-button-disabled' : ''}`}
                  onClick={isAvailable ? () => handleChoice(choice.id) : undefined}
                  whileHover={isAvailable ? { scale: 1.02 } : {}}
                  whileTap={isAvailable ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isAvailable ? 1 : 0.5, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  disabled={!isAvailable}
                >
                  {choiceText}
                  {!isAvailable && choice.requiredItem && (
                    <span className="choice-requirement">
                      (требуется: {episodeManager.getItemName ? episodeManager.getItemName(choice.requiredItem) : choice.requiredItem})
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Титры начала главы */}
      {creditsState.showStartCredits && creditsState.creditsData && (
        <ChapterCredits
          type="start"
          chapterNumber={creditsState.creditsData.chapterNumber}
          chapterTitle={creditsState.creditsData.chapterTitle}
          episodeTitle={creditsState.creditsData.episodeTitle}
          onComplete={handleStartCreditsComplete}
          duration={4000}
        />
      )}

      {/* Титры конца главы */}
      {creditsState.showEndCredits && creditsState.creditsData && (
        <ChapterCredits
          type="end"
          chapterNumber={creditsState.creditsData.chapterNumber}
          chapterTitle={creditsState.creditsData.chapterTitle}
          episodeTitle={creditsState.creditsData.episodeTitle}
          onComplete={handleEndCreditsComplete}
          duration={5000}
        />
      )}

      {/* Модальное окно редактирования персонажа */}
      <CharacterEditModal
        isOpen={isCharacterEditModalOpen}
        onClose={handleCloseCharacterEditModal}
        characterId={selectedCharacter?.id}
        onCharacterUpdate={handleCharacterUpdate}
      />

      {/* Окно отношений */}
      <RelationshipsWindow
        isOpen={isRelationshipsWindowOpen}
        onClose={handleCloseRelationshipsWindow}
        episodeCharacters={sceneManager.episodeCharacters || []}
      />

      {/* Модальное окно магазина */}
      <ShopModal
        isOpen={isShopModalOpen}
        onClose={handleCloseShopModal}
      />

      {/* Модальное окно инвентаря */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={handleCloseInventoryModal}
      />

      {/* Модальное окно паузы */}
      <PauseMenuModal
        isOpen={isPauseMenuOpen}
        onClose={handleClosePauseMenu}
        onContinue={handleContinueGame}
      />

      {/* Встроенный интерфейс броска кубика */}
      <InlineDiceRoll
        isVisible={inlineDiceRoll.isVisible}
        onClose={handleCloseInlineDiceRoll}
        onRollResult={handleDiceRollResult}
        choice={inlineDiceRoll.choice}
        character={selectedCharacter}
        removeItem={removeItem}
      />

      {/* Система уведомлений */}
      <NotificationSystem hasChoices={gameState.choices.length > 0} />

      {/* Экран завершения эпизода */}
      <EpisodeCompleteScreen
        isVisible={episodeCompleteState.isVisible}
        effects={episodeCompleteState.effects}
        onBackToMenu={handleEpisodeCompleteBackToMenu}
      />
      </div>
    </motion.div>
  );
};

export default GameScreen; 