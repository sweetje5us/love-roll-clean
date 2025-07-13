// Универсальный менеджер сцен для автоматической обработки всех эпизодов
import { buildCharacterSprite as buildCharacterSpriteUtil } from './characterUtils';
import { getSuitableEmotion, getEmotionSpritePath, clearEmotionCache } from './emotionSystem.js';
import { getBackgroundPath, getDefaultBackgroundForLocation } from './backgroundUtils.js';
import spriteManager from './spriteManager.js';

class SceneManager {
  constructor() {
    this.currentScene = null;
    this.episodeCharacters = [];
    this.characterEmotions = {};
    this.textAnimationTimer = null;
    this.spriteManager = spriteManager;
    this.sceneAnimations = {
      isTransitioning: false,
      isBackgroundTransitioning: false,
      isDialogueEntering: false
    };
    this.textAnimation = {
      isAnimating: false,
      currentText: '',
      fullText: '',
      isComplete: false
    };
  }

  /**
   * Инициализация менеджера сцен
   * @param {Array} episodeCharacters - Массив персонажей эпизода
   */
  initialize(episodeCharacters = []) {
    // Убеждаемся, что episodeCharacters является массивом
    if (!Array.isArray(episodeCharacters)) {
      this.episodeCharacters = [];
    } else {
      this.episodeCharacters = episodeCharacters;
    }
    
    this.characterEmotions = {};
    this.resetAnimations();
    
    // Очищаем кэш эмоций при инициализации
    clearEmotionCache();
  }

  /**
   * Обработка сцены и автоматическое определение персонажей
   * @param {Object} sceneData - Данные сцены из эпизода
   * @param {Object} selectedCharacter - Данные выбранного персонажа игрока
   * @returns {Promise<Object>} - Обработанные данные сцены
   */
  async processScene(sceneData, selectedCharacter = null) {
    if (!sceneData) {
      return {
        background: null,
        characters: [],
        dialogue: null,
        choices: [],
        processedCharacters: []
      };
    }

    // Определяем текущий диалог
    const currentDialogue = this.getCurrentDialogue(sceneData);
    
    // Сначала обновляем эмоции персонажей (асинхронно) - обрабатываем все диалоги сцены
    await this.updateCharacterEmotions(currentDialogue, sceneData.dialogue, selectedCharacter);
    
    // Затем обрабатываем персонажей сцены с обновленными эмоциями
    const processedCharacters = this.processSceneCharacters(sceneData, selectedCharacter);

    // Обрабатываем фон
    let backgroundPath = null;
    if (sceneData.background) {
      backgroundPath = getBackgroundPath(sceneData.background);
    } else if (sceneData.location) {
      // Если фон не указан, но есть локация, используем фон по умолчанию для локации
      backgroundPath = getDefaultBackgroundForLocation(sceneData.location);
    }
    
    const result = {
      background: backgroundPath,
      characters: processedCharacters,
      dialogue: currentDialogue,
      choices: sceneData.choices || [],
      processedCharacters: processedCharacters
    };
    
    return result;
  }

  /**
   * Обработка персонажей сцены с автоматическим позиционированием
   * @param {Object} sceneData - Данные сцены
   * @param {Object} selectedCharacter - Персонаж игрока
   * @returns {Array} - Массив обработанных персонажей
   */
  processSceneCharacters(sceneData, selectedCharacter) {
    const characters = [];
    
    // Проверяем, есть ли диалоги от персонажей (не только рассказчик)
    const hasCharacterDialogues = sceneData.dialogue && sceneData.dialogue.some(d => 
      d.speaker && d.speaker !== 'narrator'
    );

    // Проверяем, есть ли персонажи в данных сцены
    if (sceneData.characters && sceneData.characters.length > 0) {
      
      // Обрабатываем персонажей из данных сцены
      sceneData.characters.forEach(character => {
        if (character.id === 'player' && selectedCharacter) {
          // Персонаж игрока
          const playerEmotion = this.characterEmotions['player'] || character.emotion || 'normal';
          characters.push({
            id: 'player',
            position: character.position || 'left',
            emotion: playerEmotion,
            type: 'player',
            data: selectedCharacter
          });
        } else {
          // NPC персонаж
          if (!Array.isArray(this.episodeCharacters)) {
            return characters;
          }
          
          const npcData = this.episodeCharacters.find(char => char.id === character.id);
          if (npcData) {
            const npcEmotion = this.characterEmotions[character.id] || character.emotion || 'normal';
            characters.push({
              id: character.id,
              position: character.position || 'center',
              emotion: npcEmotion,
              type: 'npc',
              data: npcData
            });
          }
        }
      });
    } else {
      // Если персонажи не указаны в сцене, определяем их из диалогов
      
      // Определяем говорящих персонажей из диалогов
      const speakingCharacters = new Set();
      sceneData.dialogue.forEach(dialogue => {
        if (dialogue.speaker && dialogue.speaker !== 'narrator') {
          speakingCharacters.add(dialogue.speaker);
        }
      });

      // Автоматическое позиционирование персонажей
      const characterPositions = this.autoPositionCharacters(Array.from(speakingCharacters), selectedCharacter);
      
      // Создаем массив персонажей для отображения
      characterPositions.forEach((position, index) => {
        if (position.characterId === 'player' && selectedCharacter) {
          // Персонаж игрока
          const playerEmotion = this.characterEmotions['player'] || 'normal';
          characters.push({
            id: 'player',
            position: position.position,
            emotion: playerEmotion,
            type: 'player',
            data: selectedCharacter
          });
        } else {
          // NPC персонаж
          if (!Array.isArray(this.episodeCharacters)) {
            return characters;
          }
          
          const npcData = this.episodeCharacters.find(char => char.id === position.characterId);
          if (npcData) {
            const npcEmotion = this.characterEmotions[position.characterId] || 'normal';
            characters.push({
              id: position.characterId,
              position: position.position,
              emotion: npcEmotion,
              type: 'npc',
              data: npcData
            });
          }
        }
      });
    }

    return characters;
  }

  /**
   * Автоматическое позиционирование персонажей
   * @param {Array} speakingCharacters - Массив ID говорящих персонажей
   * @param {Object} selectedCharacter - Персонаж игрока
   * @returns {Array} - Массив с позициями персонажей
   */
  autoPositionCharacters(speakingCharacters, selectedCharacter) {
    const positions = [];
    const hasPlayer = selectedCharacter && speakingCharacters.includes('player');
    const npcCharacters = speakingCharacters.filter(id => id !== 'player');

    if (speakingCharacters.length === 1) {
      // Один персонаж - в центре
      const characterId = speakingCharacters[0];
      positions.push({
        characterId: characterId,
        position: 'center'
      });
    } else if (speakingCharacters.length === 2) {
      // Два персонажа - игрок слева, NPC справа
      if (hasPlayer) {
        positions.push({
          characterId: 'player',
          position: 'left'
        });
        positions.push({
          characterId: npcCharacters[0],
          position: 'right'
        });
      } else {
        // Два NPC - левый и правый
        positions.push({
          characterId: npcCharacters[0],
          position: 'left'
        });
        positions.push({
          characterId: npcCharacters[1],
          position: 'right'
        });
      }
    } else if (speakingCharacters.length === 3) {
      // Три персонажа - игрок слева, NPC в центре, дополнительный NPC справа
      if (hasPlayer) {
        positions.push({
          characterId: 'player',
          position: 'left'
        });
        positions.push({
          characterId: npcCharacters[0],
          position: 'center'
        });
        positions.push({
          characterId: npcCharacters[1],
          position: 'right'
        });
      } else {
        // Три NPC - левый, центр, правый
        positions.push({
          characterId: npcCharacters[0],
          position: 'left'
        });
        positions.push({
          characterId: npcCharacters[1],
          position: 'center'
        });
        positions.push({
          characterId: npcCharacters[2],
          position: 'right'
        });
      }
    }

    return positions;
  }

  /**
   * Получение текущего диалога
   * @param {Object} sceneData - Данные сцены
   * @returns {Object|null} - Текущий диалог
   */
  getCurrentDialogue(sceneData) {
    if (!sceneData.dialogue || sceneData.dialogue.length === 0) {
      return null;
    }

    // Возвращаем первый диалог (можно расширить для поддержки индекса)
    const firstDialogue = sceneData.dialogue[0];
    return firstDialogue;
  }

  /**
   * Обновление эмоций персонажей на основе диалогов сцены
   * @param {Object} currentDialogue - Текущий диалог
   * @param {Array} allDialogues - Все диалоги сцены (опционально)
   * @param {Object} selectedCharacter - Данные персонажа игрока (опционально)
   */
  async updateCharacterEmotions(currentDialogue, allDialogues = null, selectedCharacter = null) {
    // Обрабатываем текущий диалог
    if (currentDialogue && currentDialogue.speaker && currentDialogue.speaker !== 'narrator') {
      await this.processCharacterEmotion(currentDialogue, selectedCharacter);
    }
    
    // Если переданы все диалоги, обрабатываем их тоже
    if (allDialogues && Array.isArray(allDialogues)) {
      for (const dialogue of allDialogues) {
        if (dialogue.speaker && dialogue.speaker !== 'narrator') {
          await this.processCharacterEmotion(dialogue, selectedCharacter);
        }
      }
    }
  }

  /**
   * Обработка эмоции для одного персонажа
   * @param {Object} dialogue - Диалог персонажа
   * @param {Object} selectedCharacter - Данные персонажа игрока (опционально)
   */
  async processCharacterEmotion(dialogue, selectedCharacter = null) {
    const requestedEmotion = dialogue.emotion || 'normal';
    
    // Получаем данные персонажа для определения подходящей эмоции
    let characterData = null;
    if (dialogue.speaker === 'player') {
      // Для игрока используем данные selectedCharacter
      characterData = selectedCharacter;
    } else {
      // Для NPC ищем в конфигурации эпизода
      characterData = this.episodeCharacters.find(char => char.id === dialogue.speaker);
    }

    if (characterData) {
      try {
        // Получаем подходящую эмоцию для персонажа
        const suitableEmotion = await getSuitableEmotion(
          requestedEmotion, 
          characterData.gender, 
          characterData.age, 
          characterData.eyeColor || 'pink_eyes'
        );
        
        this.characterEmotions[dialogue.speaker] = suitableEmotion;
      } catch (error) {
        this.characterEmotions[dialogue.speaker] = 'normal';
      }
    } else {
      // Если персонаж не найден, используем запрашиваемую эмоцию
      this.characterEmotions[dialogue.speaker] = requestedEmotion;
    }
  }

  /**
   * Получение имени говорящего персонажа
   * @param {string} speakerId - ID говорящего
   * @param {Object} selectedCharacter - Персонаж игрока
   * @returns {string} - Имя персонажа
   */
  getSpeakerName(speakerId, selectedCharacter) {
    if (speakerId === 'narrator') {
      return 'Рассказчик';
    }

    if (speakerId === 'player') {
      return selectedCharacter?.name || 'Игрок';
    }

    // Ищем NPC в конфигурации эпизода
    const npcCharacter = this.episodeCharacters.find(char => char.id === speakerId);
    return npcCharacter?.name || speakerId;
  }

  /**
   * Сборка спрайта персонажа для сцены
   * @param {Object} characterData - Данные персонажа
   * @param {string} emotion - Эмоция
   * @param {Object} inventory - Инвентарь (для персонажа игрока)
   * @returns {Array} - Массив слоев спрайта
   */
  buildCharacterSprite(characterData, emotion = 'normal', inventory = null) {
    try {
      const characterWithEmotion = {
        ...characterData,
        emotion: emotion
      };

      let spriteLayers;
      if (inventory) {
        // Для персонажа игрока используем инвентарь
        spriteLayers = buildCharacterSpriteUtil(characterWithEmotion, inventory);
      } else {
        // Для NPC используем spriteManager, который не проверяет инвентарь
        spriteLayers = this.spriteManager.buildEpisodeCharacterSprite(characterWithEmotion, emotion);
      }
      
      return spriteLayers;
    } catch (error) {
      console.error('Ошибка при сборке спрайта персонажа:', error);
      return [];
    }
  }

  /**
   * Анимация текста
   * @param {string} text - Текст для анимации
   * @param {number} speed - Скорость анимации (символов в секунду)
   * @param {Function} onUpdate - Callback для обновления состояния
   */
  animateText(text, speed = 50, onUpdate) {
    // Останавливаем предыдущую анимацию, если она запущена
    if (this.textAnimationTimer) {
      clearTimeout(this.textAnimationTimer);
    }
    
    // Сбрасываем предыдущую анимацию
    this.textAnimation = {
      isAnimating: true,
      currentText: '',
      fullText: text,
      isComplete: false
    };

    // Немедленно обновляем состояние
    if (onUpdate) {
      onUpdate({ ...this.textAnimation });
    }

    let currentIndex = 0;
    const interval = 1000 / speed; // Интервал между символами в миллисекундах

    const animate = () => {
      if (currentIndex >= text.length) {
        // Анимация завершена
        this.textAnimation.isAnimating = false;
        this.textAnimation.isComplete = true;
        this.textAnimationTimer = null;
        
        if (onUpdate) {
          onUpdate({ ...this.textAnimation });
        }
        return;
      }

      // Добавляем следующий символ
      this.textAnimation.currentText = text.slice(0, currentIndex + 1);
      currentIndex++;
      
      if (onUpdate) {
        onUpdate({ ...this.textAnimation });
      }

      // Планируем следующий шаг анимации
      this.textAnimationTimer = setTimeout(animate, interval);
    };

    // Запускаем анимацию
    animate();
  }

  /**
   * Завершение анимации текста (показать весь текст сразу)
   * @param {Function} onUpdate - Callback для обновления состояния
   */
  completeTextAnimation(onUpdate) {
    if (this.textAnimationTimer) {
      clearTimeout(this.textAnimationTimer);
      this.textAnimationTimer = null;
    }

    this.textAnimation = {
      isAnimating: false,
      currentText: this.textAnimation.fullText,
      fullText: this.textAnimation.fullText,
      isComplete: true
    };

    if (onUpdate) {
      onUpdate({ ...this.textAnimation });
    }
  }

  /**
   * Анимация переключения сцен
   * @param {Function} onUpdate - Callback для обновления состояния
   */
  animateSceneTransition(onUpdate) {
    this.sceneAnimations.isTransitioning = true;
    
    if (onUpdate) {
      onUpdate(this.sceneAnimations);
    }
    
    setTimeout(() => {
      this.sceneAnimations.isTransitioning = false;
      if (onUpdate) {
        onUpdate(this.sceneAnimations);
      }
    }, 600);
  }

  /**
   * Анимация смены фона
   * @param {Function} onUpdate - Callback для обновления состояния
   */
  animateBackgroundTransition(onUpdate) {
    this.sceneAnimations.isBackgroundTransitioning = true;
    
    if (onUpdate) {
      onUpdate(this.sceneAnimations);
    }
    
    setTimeout(() => {
      this.sceneAnimations.isBackgroundTransitioning = false;
      if (onUpdate) {
        onUpdate(this.sceneAnimations);
      }
    }, 800);
  }

  /**
   * Анимация появления диалогового окна
   * @param {Function} onUpdate - Callback для обновления состояния
   */
  animateDialogueEnter(onUpdate) {
    this.sceneAnimations.isDialogueEntering = true;
    
    if (onUpdate) {
      onUpdate(this.sceneAnimations);
    }
    
    setTimeout(() => {
      this.sceneAnimations.isDialogueEntering = false;
      if (onUpdate) {
        onUpdate(this.sceneAnimations);
      }
    }, 500);
  }

  /**
   * Сброс всех анимаций
   */
  resetAnimations() {
    this.sceneAnimations = {
      isTransitioning: false,
      isBackgroundTransitioning: false,
      isDialogueEntering: false
    };
    
    this.textAnimation = {
      isAnimating: false,
      currentText: '',
      fullText: '',
      isComplete: false
    };
  }

  /**
   * Получение CSS классов для диалогового окна
   * @param {Object} sceneData - Данные сцены
   * @param {Object} textAnimation - Состояние анимации текста
   * @param {Object} sceneAnimation - Состояние анимации сцены
   * @returns {string} - CSS классы
   */
  getDialogueBoxClasses(sceneData, textAnimation, sceneAnimation) {
    const hasCharacters = sceneData.characters && sceneData.characters.length > 0;
    const isNarratorOnly = !hasCharacters;
    
    let classes = `dialogue-box ${isNarratorOnly ? 'narrator-only' : 'with-characters'}`;
    
    if (textAnimation.isAnimating) {
      classes += ' animating';
    }
    
    if (sceneAnimation.isDialogueEntering) {
      classes += ' entering';
    }

    // Добавляем класс позиции для уголка диалогового окна
    if (!isNarratorOnly && sceneData.dialogue && sceneData.dialogue[0]) {
      const speaker = sceneData.dialogue[0].speaker;
      if (speaker && speaker !== 'narrator') {
        const speakingCharacter = sceneData.characters.find(char => char.id === speaker);
        if (speakingCharacter) {
          classes += ` character-${speakingCharacter.position || 'center'}`;
        }
      }
    }

    return classes;
  }

  /**
   * Получение CSS классов для основной игровой области
   * @param {Object} sceneAnimation - Состояние анимации сцены
   * @returns {string} - CSS классы
   */
  getMainAreaClasses(sceneAnimation) {
    let classes = 'game-main-area';
    
    if (sceneAnimation.isTransitioning) {
      classes += ' scene-transition';
    }
    
    return classes;
  }

  /**
   * Получение CSS классов для фонового слоя
   * @param {Object} sceneAnimation - Состояние анимации сцены
   * @returns {string} - CSS классы
   */
  getBackgroundLayerClasses(sceneAnimation) {
    let classes = 'background-layer';
    
    if (sceneAnimation.isBackgroundTransitioning) {
      classes += ' transitioning';
    }
    
    return classes;
  }
}

// Создаем единственный экземпляр менеджера сцен
const sceneManager = new SceneManager();

export default sceneManager; 