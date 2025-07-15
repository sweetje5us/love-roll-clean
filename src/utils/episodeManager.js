// Универсальный менеджер для загрузки и управления эпизодами
import { getEpisodeSave, saveEpisodeProgress, saveGameState, getLastSave, saveImportantChoice, getImportantChoices } from './saveUtils';
import itemsData from '../data/items.json';

class EpisodeManager {
  constructor() {
    this.currentEpisode = null;
    this.currentChapter = null;
    this.currentScene = null;
    this.episodeData = null;
    this.chapterData = null;
    this.sceneData = null;
    this.playerChoices = new Map(); // История выборов игрока
    this.importantChoices = new Map(); // Важные выборы
    this.episodeProgress = null;
    this.characterManager = null; // Ссылка на менеджер персонажей
    this.relationshipsManager = null; // Ссылка на менеджер отношений
    this.inventoryManager = null; // Ссылка на менеджер инвентаря
  }

  /**
   * Устанавливает менеджер персонажей для работы с опытом
   * @param {Object} characterManager - Менеджер персонажей
   */
  setCharacterManager(characterManager) {
    this.characterManager = characterManager;
  }

  /**
   * Устанавливает менеджер отношений для работы с отношениями
   * @param {Object} relationshipsManager - Менеджер отношений
   */
  setRelationshipsManager(relationshipsManager) {
    this.relationshipsManager = relationshipsManager;
    console.log(`EpisodeManager.setRelationshipsManager - менеджер отношений установлен:`, relationshipsManager ? 'да' : 'нет');
  }

  /**
   * Устанавливает менеджер инвентаря для работы с предметами
   * @param {Object} inventoryManager - Менеджер инвентаря
   */
  setInventoryManager(inventoryManager) {
    this.inventoryManager = inventoryManager;
    console.log(`EpisodeManager.setInventoryManager - менеджер инвентаря установлен:`, inventoryManager ? 'да' : 'нет');
  }

  /**
   * Установка ID персонажа игрока
   * @param {string} characterId - ID персонажа игрока
   */
  setPlayerCharacterId(characterId) {
    // Создаем episodeProgress, если его нет
    if (!this.episodeProgress) {
      this.episodeProgress = {
        currentChapter: 1,
        completedChapters: [],
        progress: {},
        importantChoices: {},
        lastPlayed: new Date().toISOString()
      };
    }
    
    this.episodeProgress.playerCharacterId = characterId;
    console.log(`EpisodeManager.setPlayerCharacterId - установлен ID персонажа игрока: ${characterId}`);
  }

  /**
   * Добавляет опыт персонажу
   * @param {string} characterId - ID персонажа
   * @param {number} amount - Количество опыта
   */
  addExperienceToCharacter(characterId, amount) {
    if (this.characterManager && this.characterManager.addExperience) {
      this.characterManager.addExperience(characterId, amount);
    } else {
      console.warn('CharacterManager не установлен или не имеет метода addExperience');
    }
  }

  /**
   * Инициализация эпизода с загрузкой сохраненного прогресса
   * @param {string} episodeId - ID эпизода
   * @param {number} startChapter - Начальная глава (по умолчанию 1)
   * @param {string} playerCharacterId - ID персонажа игрока (опционально)
   * @returns {Promise<boolean>} - Успешность инициализации
   */
  async initializeEpisode(episodeId, startChapter = 1, playerCharacterId = null) {
    try {
      // Загружаем конфигурацию эпизода
      const response = await fetch(`/episodes/${episodeId}/config.json`);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить конфигурацию эпизода ${episodeId}`);
      }
      
      this.episodeData = await response.json();
      this.currentEpisode = episodeId;
      
      // Загружаем данные предметов
      try {
        const itemsResponse = await fetch('/src/data/items.json');
        if (itemsResponse.ok) {
          this.itemsData = await itemsResponse.json();
          console.log('EpisodeManager: данные предметов загружены');
        } else {
          console.warn('EpisodeManager: не удалось загрузить данные предметов по пути /src/data/items.json');
          // Пробуем альтернативный путь
          const altItemsResponse = await fetch('./src/data/items.json');
          if (altItemsResponse.ok) {
            this.itemsData = await altItemsResponse.json();
            console.log('EpisodeManager: данные предметов загружены по альтернативному пути');
          } else {
            console.warn('EpisodeManager: не удалось загрузить данные предметов по альтернативному пути');
          }
        }
      } catch (error) {
        console.warn('EpisodeManager: ошибка загрузки данных предметов:', error);
      }
      
      // Загружаем сохраненный прогресс или создаем новый
      const savedProgress = getLastSave(episodeId);
      console.log(`EpisodeManager.initializeEpisode - savedProgress:`, savedProgress);
      console.log(`EpisodeManager.initializeEpisode - playerCharacterId из параметра:`, playerCharacterId);
      
      if (savedProgress) {
        // Восстанавливаем сохраненный прогресс
        this.episodeProgress = {
          currentChapter: savedProgress.currentChapter,
          completedChapters: savedProgress.completedChapters,
          progress: savedProgress.progress,
          playerCharacterId: savedProgress.playerCharacterId,
          lastPlayed: savedProgress.lastPlayed
        };
        console.log(`EpisodeManager.initializeEpisode - восстановлен playerCharacterId: ${savedProgress.playerCharacterId}`);
        
        // Если playerCharacterId не был сохранен, устанавливаем его из параметра
        if (!this.episodeProgress.playerCharacterId && playerCharacterId) {
          this.episodeProgress.playerCharacterId = playerCharacterId;
          console.log(`EpisodeManager.initializeEpisode - установлен playerCharacterId из параметра при восстановлении: ${playerCharacterId}`);
        }
        
        // Восстанавливаем выборы игрока
        this.playerChoices = new Map(Object.entries(savedProgress.playerChoices || {}));
        
        // Восстанавливаем важные выборы
        const importantChoicesMap = new Map();
        if (savedProgress.importantChoices) {
          for (const [choiceId, choiceData] of Object.entries(savedProgress.importantChoices)) {
            // Если choiceData - это объект с метаданными, извлекаем значение
            if (typeof choiceData === 'object' && choiceData.value !== undefined) {
              importantChoicesMap.set(choiceId, choiceData);
            } else {
              // Если choiceData - это просто значение, создаем объект
              importantChoicesMap.set(choiceId, {
                value: choiceData,
                timestamp: new Date().toISOString(),
                chapter: savedProgress.currentChapter,
                scene: savedProgress.currentScene
              });
            }
          }
        }
        this.importantChoices = importantChoicesMap;
        console.log(`Восстановлены важные выборы:`, Object.fromEntries(this.importantChoices));
        
        // Проверяем, есть ли сохраненные отношения в прогрессе
        if (savedProgress.progress) {
          const relationshipKeys = Object.keys(savedProgress.progress).filter(key => key.startsWith('relation_'));
          if (relationshipKeys.length > 0) {
            console.log(`EpisodeManager.initializeEpisode - найдены сохраненные отношения в прогрессе:`, relationshipKeys);
            console.log(`EpisodeManager.initializeEpisode - значения отношений:`, relationshipKeys.map(key => ({
              key,
              value: savedProgress.progress[key]
            })));
          } else {
            console.log(`EpisodeManager.initializeEpisode - сохраненных отношений в прогрессе не найдено`);
          }
        }
        
        // Загружаем сохраненную главу
        await this.loadChapter(savedProgress.currentChapter, false);
        
        // Если есть сохраненная сцена и она принадлежит текущей главе, загружаем её
        if (savedProgress.currentScene && this.chapterData && this.chapterData.scenes && this.chapterData.scenes.includes(savedProgress.currentScene)) {
          await this.loadScene(savedProgress.currentScene);
        }
        
        console.log(`Эпизод ${episodeId} загружен с сохраненного прогресса: глава ${savedProgress.currentChapter}`);
      } else {
        // Создаем новый прогресс
        this.episodeProgress = {
        currentChapter: startChapter,
        completedChapters: [],
        progress: {},
        importantChoices: {},
        lastPlayed: new Date().toISOString()
      };
        
        // Устанавливаем ID персонажа игрока из параметра (если не был установлен ранее)
        if (!this.episodeProgress.playerCharacterId && playerCharacterId) {
          this.episodeProgress.playerCharacterId = playerCharacterId;
          console.log(`EpisodeManager.initializeEpisode - установлен playerCharacterId из параметра: ${playerCharacterId}`);
        }
        
        console.log(`Создан новый прогресс для эпизода ${episodeId}`);

      // Загружаем начальную главу
        await this.loadChapter(startChapter, true);
        
        console.log(`Эпизод ${episodeId} инициализирован с главы ${startChapter}`);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка инициализации эпизода:', error);
      return false;
    }
  }

  /**
   * Загрузка главы
   * @param {number} chapterId - ID главы
   * @param {boolean} showCredits - Показывать ли титры начала главы
   * @returns {Promise<boolean>} - Успешность загрузки
   */
  async loadChapter(chapterId, showCredits = true) {
    try {
      console.log('EpisodeManager.loadChapter - начало выполнения');
      console.log('EpisodeManager.loadChapter - chapterId:', chapterId);
      console.log('EpisodeManager.loadChapter - currentEpisode:', this.currentEpisode);
      
      // Определяем, какую главу загружать на основе выборов игрока
      const actualChapterId = this.resolveChapterId(chapterId);
      console.log('EpisodeManager.loadChapter - actualChapterId:', actualChapterId);
      
      // Загружаем данные главы
      const chapterConfigUrl = `/episodes/${this.currentEpisode}/chapters/chapter${actualChapterId}/config.json`;
      console.log('EpisodeManager.loadChapter - пытаемся загрузить:', chapterConfigUrl);
      
      const response = await fetch(chapterConfigUrl);
      console.log('EpisodeManager.loadChapter - response status:', response.status);
      console.log('EpisodeManager.loadChapter - response ok:', response.ok);
      
      if (!response.ok) {
        console.error('EpisodeManager.loadChapter - HTTP ошибка:', response.status, response.statusText);
        throw new Error(`Не удалось загрузить главу ${actualChapterId}: ${response.status} ${response.statusText}`);
      }
      
      this.chapterData = await response.json();
      console.log('EpisodeManager.loadChapter - chapterData загружена:', this.chapterData);
      
      this.currentChapter = actualChapterId;
      
      // Сбрасываем текущую сцену при переходе к новой главе
      this.currentScene = null;
      
      // Загружаем первую сцену главы
      if (this.chapterData.scenes && this.chapterData.scenes.length > 0) {
        console.log('EpisodeManager.loadChapter - загружаем первую сцену:', this.chapterData.scenes[0]);
        await this.loadScene(this.chapterData.scenes[0]);
      }
      
      // Обновляем прогресс
      this.episodeProgress.currentChapter = actualChapterId;
      this.saveProgress();
      
      console.log(`Глава ${actualChapterId} загружена`);
      return true;
    } catch (error) {
      console.error('Ошибка загрузки главы:', error);
      return false;
    }
  }

  /**
   * Загрузка сцены
   * @param {string} sceneId - ID сцены
   * @returns {Promise<boolean>} - Успешность загрузки
   */
  async loadScene(sceneId) {
    try {
      console.log(`EpisodeManager.loadScene - загрузка сцены: ${sceneId}`);
      const response = await fetch(`/episodes/${this.currentEpisode}/scenes/${sceneId}.json`);
      
      if (!response.ok) {
        console.error(`EpisodeManager.loadScene - HTTP ошибка: ${response.status} ${response.statusText}`);
        throw new Error(`Не удалось загрузить сцену ${sceneId}: ${response.status} ${response.statusText}`);
      }
      
      this.sceneData = await response.json();
      this.currentScene = sceneId;
      
      console.log(`EpisodeManager.loadScene - сцена загружена:`, this.sceneData);
      return true;
    } catch (error) {
      console.error('Ошибка загрузки сцены:', error);
      return false;
    }
  }

  /**
   * Разрешение ID главы на основе выборов игрока
   * @param {number} chapterId - Базовый ID главы
   * @returns {number} - Фактический ID главы
   */
  resolveChapterId(chapterId) {
    // Проверяем, есть ли альтернативные главы для данного выбора
    const chapterVariants = this.episodeData.chapterVariants || {};
    const chapterKey = `chapter${chapterId}`;
    
    if (chapterVariants[chapterKey]) {
      // Проверяем условия для каждой альтернативы
      for (const variant of chapterVariants[chapterKey]) {
        if (this.checkVariantConditions(variant.conditions)) {
          return variant.chapterId;
        }
      }
    }
    
    // Если альтернатив нет или условия не выполнены, возвращаем базовый ID
    return chapterId;
  }

  /**
   * Проверка условий для варианта главы
   * @param {Object} conditions - Условия
   * @returns {boolean} - Выполнены ли условия
   */
  checkVariantConditions(conditions) {
    if (!conditions) return true;
    
    for (const [conditionType, conditionData] of Object.entries(conditions)) {
      switch (conditionType) {
        case 'relationship':
          // Проверка отношений
          if (this.relationshipsManager) {
            const playerCharacterId = this.getCurrentPlayerCharacterId();
            if (!playerCharacterId) {
              console.warn('EpisodeManager.checkVariantConditions - не удалось получить ID персонажа игрока');
              return false;
            }
            
            for (const [characterId, requirements] of Object.entries(conditionData)) {
              console.log(`EpisodeManager.checkVariantConditions - DEBUG: playerCharacterId: ${playerCharacterId}, characterId: ${characterId}`);
              const currentValue = this.relationshipsManager.getRelationship(playerCharacterId, characterId, 'friendship');
              console.log(`EpisodeManager.checkVariantConditions - DEBUG: currentValue: ${currentValue}`);
              
              if (requirements.min !== undefined && currentValue < requirements.min) {
                console.log(`EpisodeManager.checkVariantConditions - отношения ${characterId} слишком низкие: ${currentValue} < ${requirements.min}`);
                return false;
              }
              
              if (requirements.max !== undefined && currentValue > requirements.max) {
                console.log(`EpisodeManager.checkVariantConditions - отношения ${characterId} слишком высокие: ${currentValue} > ${requirements.max}`);
                return false;
              }
              
              console.log(`EpisodeManager.checkVariantConditions - отношения ${characterId} подходят: ${currentValue} (min: ${requirements.min}, max: ${requirements.max})`);
            }
          }
          break;
        default:
          // Проверка важных выборов (старая логика)
          const actualValue = this.playerChoices.get(conditionType);
          if (actualValue !== conditionData) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }

  /**
   * Обработка выбора игрока
   * @param {string} choiceId - ID выбора
   * @param {Object} choiceData - Данные выбора
   * @returns {Promise<Object>} - Результат обработки
   */
  async processChoice(choiceId, choiceData) {
    try {
      console.log(`EpisodeManager.processChoice - начало обработки выбора:`, choiceId);
      console.log(`EpisodeManager.processChoice - данные выбора:`, choiceData);
      console.log(`EpisodeManager.processChoice - текущая сцена:`, this.currentScene);
      console.log(`EpisodeManager.processChoice - выборы в сцене:`, this.sceneData?.choices);
      
      // Находим данные выбора в текущей сцене
      const choice = this.sceneData.choices.find(c => c.id === choiceId);
      if (!choice) {
        throw new Error(`Выбор ${choiceId} не найден в текущей сцене`);
      }
      
      console.log(`EpisodeManager.processChoice - найден выбор:`, choice);
      
      // Проверяем, есть ли результат броска кубика
      if (choiceData.diceRollResult) {
        console.log(`EpisodeManager.processChoice - обрабатываем результат броска кубика:`, choiceData.diceRollResult);
        
        // Сохраняем результат броска в выбор
        const choiceWithRollResult = {
          ...choice,
          diceRollResult: choiceData.diceRollResult
        };
        
        // Начисляем опыт за успешные броски
        const playerCharacterId = this.episodeProgress.playerCharacterId;
        if (playerCharacterId) {
          const result = choiceData.diceRollResult.result;
          if (result === 'critical_success') {
            // 100 опыта за критический успех
            this.addExperienceToCharacter(playerCharacterId, 100);
            console.log(`Начислено 100 опыта за критический успех персонажу ${playerCharacterId}`);
            
            // Показываем уведомление о получении опыта
            if (window.addNotification) {
              window.addNotification('experience_gained', {
                message: '+100 опыта (Критический успех!)',
                amount: 100,
                type: 'critical_success'
              });
            }
          } else if (result === 'success') {
            // 50 опыта за обычный успех
            this.addExperienceToCharacter(playerCharacterId, 50);
            console.log(`Начислено 50 опыта за успех персонажу ${playerCharacterId}`);
            
            // Показываем уведомление о получении опыта
            if (window.addNotification) {
              window.addNotification('experience_gained', {
                message: '+50 опыта (Успех!)',
                amount: 50,
                type: 'success'
              });
            }
          }
        }
        
        // Определяем следующую сцену на основе результата
        let nextScene = choice.nextScene;
        
        // Если есть специальные сцены для результатов, используем их
        if (choice.diceCheck && choice.diceCheck.results) {
          const resultScenes = choice.diceCheck.results;
          switch (choiceData.diceRollResult.result) {
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
        
        // Обновляем выбор с новой сценой
        choice.nextScene = nextScene;
      }
      
      // Сохраняем выбор игрока
      this.playerChoices.set(choiceId, choiceData.value);
      
      // Проверяем, является ли это важным выбором
      if (choice.important) {
        // Используем правильное значение из choice.value, а не из choiceData.value
        const choiceValue = choice.value || choiceData.value;
        
        this.importantChoices.set(choiceId, {
          value: choiceValue,
          timestamp: new Date().toISOString(),
          chapter: this.currentChapter,
          scene: this.currentScene,
          description: choice.description || '',
          consequences: choice.consequences || []
        });
        
        // Сохраняем важный выбор
        saveImportantChoice(this.currentEpisode, choiceId, {
          value: choiceValue,
          description: choice.description || '',
          consequences: choice.consequences || []
        });
        
        console.log(`Важный выбор сохранен: ${choiceId} = ${choiceValue}`);
        console.log(`Текущие важные выборы:`, Object.fromEntries(this.importantChoices));
        
                  // Показываем уведомление о важном выборе
          console.log('EpisodeManager - проверка window.addNotification:', !!window.addNotification);
          if (window.addNotification) {
            const episodeConfig = this.getEpisodeConfig();
            const currentDialogue = this.sceneData?.dialogue?.[0];
            const speakerId = currentDialogue?.speaker;
            const speakerCharacter = episodeConfig.characters.find(char => char.id === speakerId);
            const characterName = speakerCharacter ? speakerCharacter.name : speakerId;
            
            console.log('EpisodeManager - показываем уведомление о важном выборе для:', characterName);
            
            window.addNotification('important_choice', {
              message: `${characterName} это запомнит`,
              characterName: characterName
            });
          } else {
            console.warn('EpisodeManager - window.addNotification не доступна');
          }
      }
      
      // Применяем эффекты выбора
      if (choice.effects) {
    
        this.applyChoiceEffects(choice.effects);
              }
      
      // Сохраняем прогресс
      this.saveProgress();
      
      // Проверяем специальные свойства выбора
      if (choice.endChapter) {
        // Глава завершена
        this.completeChapter();
        return {
          success: true,
          endChapter: true,
          effects: choice.effects
        };
      }
      
      if (choice.nextChapter) {
        // Переход к новой главе
        await this.loadChapter(choice.nextChapter);
        return {
          success: true,
          chapterTransition: true,
          chapterId: this.currentChapter,
          sceneId: this.currentScene,
          effects: choice.effects
        };
      }
      
      if (choice.nextScene === 'episode_complete') {
        // Завершение эпизода
        return {
          success: true,
          nextScene: 'episode_complete',
          effects: choice.effects
        };
      }
      
      return {
        success: true,
        nextScene: choice.nextScene,
        effects: choice.effects
      };
    } catch (error) {
      console.error('Ошибка обработки выбора:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Обработка эффектов выбора (предметы и отношения)
   * @param {Object} choice - Выбор
   */
  processChoiceEffects(choice) {
    const effects = choice.effects || {};
    
    // Обработка предметов
    if (effects.items) {
      this.processItemEffects(effects.items);
    }
    
    // Обработка отношений
    if (effects.relationships) {
      this.processRelationshipEffects(effects.relationships);
    }
  }

  /**
   * Обработка эффектов предметов
   * @param {Object} itemEffects - Эффекты предметов
   */
  processItemEffects(itemEffects) {
    if (!this.inventoryManager) {
      console.warn('inventoryManager не доступен');
      return;
    }

    // Добавление предметов
    if (itemEffects.add) {
      const itemsToAdd = Array.isArray(itemEffects.add) ? itemEffects.add : [itemEffects.add];
      itemsToAdd.forEach(itemId => {
        this.inventoryManager.addItem(itemId, 1);
        
        // Показываем уведомление о получении предмета
        if (window.addNotification) {
          const itemName = this.getItemName(itemId);
          window.addNotification('item_received', {
            message: `Получен предмет "${itemName}"`,
            itemName: itemName
          });
        }
      });
    }

    // Удаление предметов
    if (itemEffects.remove) {
      const itemsToRemove = Array.isArray(itemEffects.remove) ? itemEffects.remove : [itemEffects.remove];
      itemsToRemove.forEach(itemId => {
        this.inventoryManager.removeItem(itemId, 1);
        
        // Показываем уведомление об изъятии предмета
        if (window.addNotification) {
          const itemName = this.getItemName(itemId);
          window.addNotification('item_removed', {
            message: `Изъят предмет "${itemName}"`,
            itemName: itemName
          });
        }
      });
    }
  }

  /**
   * Получение имени предмета по ID
   * @param {string} itemId - ID предмета
   * @returns {string} - Имя предмета
   */
  getItemName(itemId) {
    console.log(`EpisodeManager.getItemName вызвана для: ${itemId}`);
    
    // Проверяем в импортированных данных предметов
    if (itemsData && itemsData.items) {
      console.log('EpisodeManager: импортированные itemsData доступны');
      
      // Проверяем все категории предметов
      const categories = ['consumable', 'material', 'special', 'pet', 'clothing', 'chest', 'key'];
      
      for (const category of categories) {
        const categoryItems = itemsData.items[category];
        if (categoryItems && categoryItems[itemId]) {
          const name = categoryItems[itemId].name || itemId;
          console.log(`EpisodeManager: найден предмет в категории ${category}: ${itemId} -> ${name}`);
          return name;
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в импортированных itemsData`);
    } else {
      console.log('EpisodeManager: импортированные itemsData недоступны');
    }
    
    // Проверяем в загруженных данных предметов (для обратной совместимости)
    if (this.itemsData && this.itemsData.items) {
      console.log('EpisodeManager: загруженные itemsData доступны');
      
      const categories = ['consumable', 'material', 'special', 'pet', 'clothing', 'chest', 'key'];
      
      for (const category of categories) {
        const categoryItems = this.itemsData.items[category];
        if (categoryItems && categoryItems[itemId]) {
          const name = categoryItems[itemId].name || itemId;
          console.log(`EpisodeManager: найден предмет в загруженных itemsData категории ${category}: ${itemId} -> ${name}`);
          return name;
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в загруженных itemsData`);
    }
    
    // Проверяем в episodeData.items (для обратной совместимости)
    if (this.episodeData && this.episodeData.items && this.episodeData.items.items) {
      console.log('EpisodeManager: episodeData.items доступен');
      
      const categories = ['consumable', 'material', 'special', 'pet', 'clothing', 'chest', 'key'];
      
      for (const category of categories) {
        const categoryItems = this.episodeData.items.items[category];
        if (categoryItems && categoryItems[itemId]) {
          const name = categoryItems[itemId].name || itemId;
          console.log(`EpisodeManager: найден предмет в episodeData.items категории ${category}: ${itemId} -> ${name}`);
          return name;
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в episodeData.items`);
    }
    
    // Если предмет не найден, возвращаем ID как есть
    console.log(`EpisodeManager: предмет ${itemId} не найден, возвращаем ID`);
    return itemId;
  }

  /**
   * Применение эффектов выбора
   * @param {Object} effects - Эффекты
   */
  applyChoiceEffects(effects) {
    if (!effects) return;
    
    for (const [effectType, value] of Object.entries(effects)) {
      switch (effectType) {
        case 'experience':
          if (this.characterManager && value.characterId && value.amount) {
            this.addExperienceToCharacter(value.characterId, value.amount);
          }
          break;
        case 'relationship':
        case 'relationships':
          // Обновляем отношения с персонажами
          if (this.relationshipsManager) {
            // Используем глобальную систему отношений
            for (const [characterId, change] of Object.entries(value)) {
              // Получаем ID текущего персонажа игрока
              const playerCharacterId = this.getCurrentPlayerCharacterId();
              
              if (playerCharacterId) {
                const oldValue = this.relationshipsManager.getRelationship(playerCharacterId, characterId, 'friendship');
                this.relationshipsManager.changeRelationship(playerCharacterId, characterId, 'friendship', change);
                // Читаем актуальное значение из localStorage после изменения
                const newValue = this.relationshipsManager.getRelationship(playerCharacterId, characterId, 'friendship');
                console.log(`RELATIONSHIP: ${playerCharacterId} -> ${characterId}: ${oldValue} -> ${newValue} (+${change})`);
              } else {
                console.warn(`EpisodeManager: не удалось получить ID персонажа игрока`);
              }
            }
          } else {
            // Fallback на локальную систему прогресса
            for (const [characterId, change] of Object.entries(value)) {
              const currentValue = this.episodeProgress.progress[`relation_${characterId}`] || 0;
              this.episodeProgress.progress[`relation_${characterId}`] = currentValue + change;
            }
          }
          break;
        case 'items':
          // Обрабатываем предметы
          this.processItemEffects(value);
          break;
        case 'stats':
          // Обновляем характеристики
          for (const [statName, change] of Object.entries(value)) {
            const currentValue = this.episodeProgress.progress[`stat_${statName}`] || 0;
            this.episodeProgress.progress[`stat_${statName}`] = currentValue + change;
          }
          break;
        default:
          console.log(`EpisodeManager: неизвестный тип эффекта: ${effectType}`);
          break;
      }
    }
    
    // Сохраняем прогресс
    this.saveProgress();
  }

  /**
   * Завершение главы
   */
  completeChapter() {
    if (!this.episodeProgress.completedChapters.includes(this.currentChapter)) {
      this.episodeProgress.completedChapters.push(this.currentChapter);
    }
    this.saveProgress();
  }

  /**
   * Завершение эпизода
   */
  completeEpisode() {
    // Отмечаем эпизод как завершенный
    this.episodeProgress.completed = true;
    this.episodeProgress.completedAt = new Date().toISOString();
    
    // Отмечаем все главы как завершенные
    if (this.episodeData && this.episodeData.chapters) {
      this.episodeData.chapters.forEach(chapter => {
        if (!this.episodeProgress.completedChapters.includes(chapter.id)) {
          this.episodeProgress.completedChapters.push(chapter.id);
        }
      });
    }
    
    this.saveProgress();
    console.log(`Эпизод ${this.currentEpisode} завершен`);
  }

  /**
   * Сохранение прогресса
   */
  saveProgress() {
    this.episodeProgress.lastPlayed = new Date().toISOString();
    this.episodeProgress.currentScene = this.currentScene; // Сохраняем текущую сцену
    
    // Сохраняем важные выборы в прогресс
    this.episodeProgress.importantChoices = {};
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      this.episodeProgress.importantChoices[choiceId] = choiceData;
    }
    
    console.log(`EpisodeManager.saveProgress - сохраняем episodeProgress:`, this.episodeProgress);
    saveEpisodeProgress(this.currentEpisode, this.currentChapter, this.episodeProgress);
    console.log(`Прогресс сохранен. Важные выборы:`, this.episodeProgress.importantChoices);
    console.log(`Прогресс сохранен. playerCharacterId:`, this.episodeProgress.playerCharacterId);
  }

  /**
   * Сохранение детального состояния игры
   */
  saveGameState() {
    const gameState = {
      currentChapter: this.currentChapter,
      currentScene: this.currentScene,
      playerChoices: Object.fromEntries(this.playerChoices),
      importantChoices: {},
      progress: this.episodeProgress.progress,
      playerCharacterId: this.episodeProgress.playerCharacterId
    };
    
    // Сохраняем важные выборы с полными данными
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      gameState.importantChoices[choiceId] = choiceData;
    }
    
    return saveGameState(this.currentEpisode, gameState);
  }

  /**
   * Получение текущих данных
   */
  getCurrentData() {
    const importantChoicesData = {};
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      importantChoicesData[choiceId] = choiceData;
    }
    
    return {
      episode: this.episodeData,
      chapter: this.chapterData,
      scene: this.sceneData,
      progress: this.episodeProgress,
      choices: Object.fromEntries(this.playerChoices),
      importantChoices: importantChoicesData
    };
  }

  /**
   * Получение текущего инвентаря
   */
  getCurrentInventory() {
    // Получаем инвентарь из менеджера инвентаря
    if (this.inventoryManager) {
      return this.inventoryManager.getInventory();
    }
    
    // Fallback - возвращаем пустой инвентарь
    return {};
  }

  /**
   * Проверка требований отношений
   */
  checkRelationshipRequirement(requiredRelationship) {
    if (!this.relationshipsManager) {
      console.warn('relationshipsManager не доступен для проверки отношений');
      return false;
    }

    const [characterId, requiredLevel] = Object.entries(requiredRelationship)[0];
    const playerCharacterId = this.getCurrentPlayerCharacterId();
    
    if (!playerCharacterId) {
      console.warn('Не удалось получить ID персонажа игрока');
      return false;
    }

    const currentValue = this.relationshipsManager.getRelationship(playerCharacterId, characterId, 'friendship');
    
    // Определяем уровень отношений
    let currentLevel;
    if (currentValue >= 80) currentLevel = 'love';
    else if (currentValue >= 60) currentLevel = 'friendship';
    else if (currentValue >= 40) currentLevel = 'acquaintance';
    else if (currentValue >= 20) currentLevel = 'neutral';
    else if (currentValue >= 0) currentLevel = 'stranger';
    else currentLevel = 'hostile';
    
    const levelHierarchy = {
      'hostile': 0,
      'stranger': 1,
      'neutral': 2,
      'acquaintance': 3,
      'friendship': 4,
      'love': 5
    };
    
    return levelHierarchy[currentLevel] >= levelHierarchy[requiredLevel];
  }

  /**
   * Получение доступных выборов для текущей сцены
   */
  getAvailableChoices() {
    if (!this.sceneData || !this.sceneData.choices) {
      return [];
    }
    
    console.log(`Проверка доступных выборов для сцены ${this.currentScene}:`, this.sceneData.choices);
    
    // Получаем текущий инвентарь
    const currentInventory = this.getCurrentInventory();
    
    // Проверяем все выборы
    const availableChoices = this.sceneData.choices.filter(choice => {
      // Проверяем требуемые предметы
      if (choice.requiredItem) {
        const itemQuantity = currentInventory[choice.requiredItem];
        let hasItem = false;
        
        if (typeof itemQuantity === 'number') {
          // Простой формат: { itemId: number }
          hasItem = itemQuantity > 0;
        } else if (itemQuantity && typeof itemQuantity === 'object' && itemQuantity.quantity !== undefined) {
          // Сложный формат: { itemId: { quantity: number, ... } }
          hasItem = itemQuantity.quantity > 0;
        } else {
          // Предмет не найден
          hasItem = false;
        }
        
        console.log(`Выбор ${choice.id} требует предмет ${choice.requiredItem}: ${hasItem ? 'есть' : 'нет'}`);
        if (!hasItem) return false;
      }
      
      // Проверяем требуемые отношения
      if (choice.requiredRelationship) {
        const hasRelationship = this.checkRelationshipRequirement(choice.requiredRelationship);
        console.log(`Выбор ${choice.id} требует отношения: ${hasRelationship ? 'выполнено' : 'не выполнено'}`);
        if (!hasRelationship) return false;
      }
      
      // Проверяем условия (старая система)
      if (choice.conditions) {
        const isAvailable = this.checkVariantConditions(choice.conditions);
        console.log(`Выбор ${choice.id} с условиями: ${isAvailable ? 'доступен' : 'недоступен'}`);
        if (!isAvailable) return false;
      }
      
      // Проверяем требования (старая система)
      if (choice.requirements && !choice.conditions) {
        const isAvailable = this.checkChoiceRequirements(choice.requirements);
        console.log(`Выбор ${choice.id} с требованиями: ${isAvailable ? 'доступен' : 'недоступен'}`);
        if (!isAvailable) return false;
      }
      
      return true;
    });
    
    console.log(`Доступные выборы:`, availableChoices.map(c => c.id));
    return availableChoices;
  }

  /**
   * Проверка требований для выбора
   * @param {Object} requirements - Требования
   * @returns {boolean} - Доступен ли выбор
   */
  checkChoiceRequirements(requirements) {
    for (const [requirementType, value] of Object.entries(requirements)) {
      switch (requirementType) {
        case 'stats':
          for (const [statName, minValue] of Object.entries(value)) {
            const currentStat = this.episodeProgress.progress[`stat_${statName}`] || 0;
            if (currentStat < minValue) {
              return false;
            }
          }
          break;
        case 'relationship':
          console.log(`EpisodeManager.checkChoiceRequirements - проверка требований отношений:`, value);
          if (this.relationshipsManager) {
            // Используем глобальную систему отношений
            const playerCharacterId = this.getCurrentPlayerCharacterId();
            console.log(`EpisodeManager.checkChoiceRequirements - playerCharacterId: ${playerCharacterId}`);
            if (playerCharacterId) {
              for (const [characterId, minValue] of Object.entries(value)) {
                const currentRelation = this.relationshipsManager.getRelationship(playerCharacterId, characterId, 'friendship');
                console.log(`EpisodeManager.checkChoiceRequirements - отношения ${playerCharacterId} -> ${characterId}: текущее ${currentRelation}, требуется ${minValue}`);
                if (currentRelation < minValue) {
                  console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: ${currentRelation} < ${minValue}`);
                  return false;
                }
              }
            } else {
              console.warn(`EpisodeManager.checkChoiceRequirements - не удалось получить ID персонажа игрока`);
            }
          } else {
            // Fallback на локальную систему прогресса
            console.log(`EpisodeManager.checkChoiceRequirements - используем локальную систему отношений`);
            for (const [characterId, minValue] of Object.entries(value)) {
              const currentRelation = this.episodeProgress.progress[`relation_${characterId}`] || 0;
              console.log(`EpisodeManager.checkChoiceRequirements - локальные отношения ${characterId}: текущее ${currentRelation}, требуется ${minValue}`);
              if (currentRelation < minValue) {
                console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: ${currentRelation} < ${minValue}`);
                return false;
              }
            }
          }
          console.log(`EpisodeManager.checkChoiceRequirements - все требования отношений выполнены`);
          break;
        case 'importantChoice':
          // Проверяем важные выборы
          console.log(`Проверка важных выборов для требования:`, value);
          console.log(`Текущие важные выборы:`, Object.fromEntries(this.importantChoices));
          for (const [choiceId, expectedValue] of Object.entries(value)) {
            const actualValue = this.importantChoices.get(choiceId)?.value;
            console.log(`Проверка ${choiceId}: ожидается ${expectedValue}, получено ${actualValue}`);
            
            // Специальная обработка для проверки отсутствия важного выбора
            if (expectedValue === "" || expectedValue === null || expectedValue === "missing") {
              // Если ожидается пустая строка, null или "missing", то важный выбор не должен быть сделан
              if (actualValue !== null && actualValue !== undefined) {
                console.log(`Требование не выполнено: ${choiceId} - выбор не должен быть сделан, но он есть (${actualValue})`);
                return false;
              }
            } else if (typeof expectedValue === 'string' && expectedValue.startsWith('!')) {
              // Отрицание: если ожидается "!value", то важный выбор не должен быть равен "value"
              const targetValue = expectedValue.substring(1);
              if (actualValue === targetValue) {
                console.log(`Требование не выполнено: ${choiceId} - выбор не должен быть равен ${targetValue}`);
                return false;
              }
            } else {
              // Обычная проверка точного совпадения
              if (actualValue !== expectedValue) {
                console.log(`Требование не выполнено: ${choiceId} - значения не совпадают (ожидается ${expectedValue}, получено ${actualValue})`);
                return false;
              }
            }
          }
          console.log(`Все требования важных выборов выполнены`);
          break;
        case 'items':
          // Здесь можно добавить проверку предметов в инвентаре
          break;
        default:
          break;
      }
    }
    return true;
  }

  /**
   * Получение важных выборов
   */
  getImportantChoices() {
    const importantChoicesData = {};
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      importantChoicesData[choiceId] = choiceData;
    }
    return importantChoicesData;
  }

  /**
   * Проверка важного выбора
   */
  hasImportantChoice(choiceId) {
    return this.importantChoices.has(choiceId);
  }

  /**
   * Получение значения важного выбора
   */
  getImportantChoiceValue(choiceId) {
    return this.importantChoices.get(choiceId)?.value || null;
  }

  /**
   * Сброс эпизода
   */
  resetEpisode() {
    this.currentEpisode = null;
    this.currentChapter = null;
    this.currentScene = null;
    this.episodeData = null;
    this.chapterData = null;
    this.sceneData = null;
    this.playerChoices.clear();
    this.importantChoices.clear();
    this.episodeProgress = null;
    console.log('Эпизод сброшен');
  }

  /**
   * Получение статистики эпизода
   */
  getEpisodeStats() {
    if (!this.episodeData) return null;
    
    const totalChapters = this.episodeData.chapters.length;
    const completedChapters = this.episodeProgress?.completedChapters.length || 0;
    
    return {
      totalChapters,
      completedChapters,
      progressPercentage: totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0,
      currentChapter: this.currentChapter,
      isCompleted: completedChapters === totalChapters && totalChapters > 0,
      importantChoicesCount: this.importantChoices.size,
      importantChoices: this.getImportantChoices()
    };
  }

  /**
   * Получение конфигурации эпизода
   * @returns {Object} - Конфигурация эпизода
   */
  getEpisodeConfig() {
    return this.episodeData;
  }

  /**
   * Получение ID текущего персонажа игрока
   * @returns {string|null} - ID персонажа игрока
   */
  getCurrentPlayerCharacterId() {
    console.log(`EpisodeManager.getCurrentPlayerCharacterId - episodeProgress:`, this.episodeProgress);
    
    // Сначала проверяем в episodeProgress
    if (this.episodeProgress && this.episodeProgress.playerCharacterId) {
      console.log(`EpisodeManager.getCurrentPlayerCharacterId - получен из прогресса: ${this.episodeProgress.playerCharacterId}`);
      return this.episodeProgress.playerCharacterId;
    }
    
    console.warn(`EpisodeManager.getCurrentPlayerCharacterId - ID персонажа игрока не найден`);
    return null;
  }

  /**
   * Получение данных для титров начала главы
   * @returns {Object} - Данные для титров
   */
  getChapterStartCredits() {
    if (!this.episodeData || !this.chapterData) {
      return null;
    }

    return {
      episodeTitle: this.episodeData.name,
      chapterNumber: this.currentChapter,
      chapterTitle: this.chapterData.name
    };
  }

  /**
   * Получение данных для титров конца главы
   * @returns {Object} - Данные для титров
   */
  getChapterEndCredits() {
    if (!this.episodeData || !this.chapterData) {
      return null;
    }

    return {
      episodeTitle: this.episodeData.name,
      chapterNumber: this.currentChapter,
      chapterTitle: this.chapterData.name
    };
  }

  /**
   * Проверка, является ли текущая сцена последней в главе
   * @returns {boolean} - Является ли сцена последней
   */
  isLastSceneInChapter() {
    if (!this.chapterData || !this.chapterData.scenes) {
      return false;
    }

    const currentSceneIndex = this.chapterData.scenes.indexOf(this.currentScene);
    return currentSceneIndex === this.chapterData.scenes.length - 1;
  }

  /**
   * Переход к следующей главе
   * @returns {Promise<boolean>} - Успешность перехода
   */
  async nextChapter() {
    // Защита от повторного вызова
    if (this._nextChapterInProgress) {
      console.log('EpisodeManager.nextChapter: уже выполняется, пропускаем');
      return false;
    }
    
    this._nextChapterInProgress = true;
    console.log('EpisodeManager.nextChapter - начало выполнения');
    console.log('EpisodeManager.nextChapter - episodeData:', this.episodeData);
    console.log('EpisodeManager.nextChapter - currentChapter:', this.currentChapter);
    
    if (!this.episodeData || !this.episodeData.chapters) {
      console.log('EpisodeManager.nextChapter - нет данных эпизода или глав');
      return false;
    }

    console.log('EpisodeManager.nextChapter - chapters:', this.episodeData.chapters);

    const currentChapterIndex = this.episodeData.chapters.findIndex(
      chapter => chapter.id === this.currentChapter
    );

    console.log('EpisodeManager.nextChapter - currentChapterIndex:', currentChapterIndex);

    if (currentChapterIndex === -1 || currentChapterIndex >= this.episodeData.chapters.length - 1) {
      // Это последняя глава эпизода
      console.log('EpisodeManager.nextChapter - это последняя глава эпизода');
      this._nextChapterInProgress = false;
      return false;
    }

    const nextChapter = this.episodeData.chapters[currentChapterIndex + 1];
    console.log('EpisodeManager.nextChapter - nextChapter:', nextChapter);
    
    // Обновляем прогресс для следующей главы
    this.currentChapter = nextChapter.id;
    this.currentScene = null;
    this.episodeProgress.currentChapter = nextChapter.id;
    this.episodeProgress.currentScene = null;
    
    // Сохраняем прогресс
    this.saveProgress();
    
    console.log('EpisodeManager.nextChapter - прогресс обновлен для главы:', nextChapter.id);
    
    this._nextChapterInProgress = false;
    return true;
  }
}

// Создаем единственный экземпляр менеджера
const episodeManager = new EpisodeManager();

export default episodeManager; 