// Универсальный менеджер для загрузки и управления эпизодами
import { getEpisodeSave, saveEpisodeProgress, saveGameState, getLastSave, saveImportantChoice, getImportantChoices, validateAndRepairSaves } from './saveUtils';
import itemsData from '../data/items.json';
import { isCustomQuestItem } from './questItemUtils';

// Определяем мобильное устройство
const isMobileDevice = () => {
  return window.innerWidth < 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Кэш для загруженных эпизодов
const episodeCache = new Map();
const sceneCache = new Map();

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
      // Проверяем и исправляем поврежденные сохранения
      const { valid, repaired } = validateAndRepairSaves();
      if (repaired) {
        console.log('EpisodeManager.initializeEpisode - поврежденные сохранения исправлены');
      }
      
      // Проверяем кэш для мобильных устройств
      if (isMobileDevice() && episodeCache.has(episodeId)) {
        console.log(`EpisodeManager.initializeEpisode - используем кэшированные данные для эпизода ${episodeId}`);
        this.episodeData = episodeCache.get(episodeId);
        this.currentEpisode = episodeId;
      } else {
        // Загружаем конфигурацию эпизода с нормальным кэшированием
        const configResponse = await fetch(`/episodes/${episodeId}/config.json`);
        if (!configResponse.ok) {
          throw new Error(`Не удалось загрузить конфигурацию эпизода ${episodeId}`);
        }
        
        const episodeData = await configResponse.json();
        this.episodeData = episodeData;
        this.currentEpisode = episodeId;
        
        // Кэшируем для мобильных устройств
        if (isMobileDevice()) {
          episodeCache.set(episodeId, episodeData);
        }
      }
      
      console.log('EpisodeManager.initializeEpisode - загруженные данные эпизода:', {
        id: this.episodeData.id,
        name: this.episodeData.name,
        chapters: this.episodeData.chapters,
        charactersCount: this.episodeData.characters ? this.episodeData.characters.length : 0
      });
      
      // Загружаем данные предметов
      try {
        const itemsResponse = await fetch('/src/data/items.json');
        if (itemsResponse.ok) {
          this.itemsData = await itemsResponse.json();
          console.log('EpisodeManager: данные предметов загружены');
        } else {
          console.warn('EpisodeManager: не удалось загрузить данные предметов');
          this.itemsData = itemsData; // Используем импортированные данные
        }
      } catch (itemsError) {
        console.warn('EpisodeManager: ошибка загрузки предметов, используем импортированные данные');
        this.itemsData = itemsData;
      }
      
      // Загружаем сохраненный прогресс
      console.log(`EpisodeManager.initializeEpisode - ищем сохранение для эпизода ${episodeId} и персонажа ${playerCharacterId}`);
      const savedProgress = getEpisodeSave(episodeId, playerCharacterId);
      console.log(`EpisodeManager.initializeEpisode - результат поиска сохранения:`, savedProgress ? 'найдено' : 'не найдено');
      
      if (savedProgress) {
        // Очищаем циклические ссылки в сохраненном прогрессе
        const { progress: progressField, ...cleanProgress } = savedProgress;
        this.episodeProgress = cleanProgress;
        
        // Восстанавливаем поле progress как пустой объект
        if (!this.episodeProgress.progress) {
          this.episodeProgress.progress = {};
        }
      }
      
      if (this.episodeProgress) {
        console.log(`EpisodeManager.initializeEpisode - загружен прогресс для эпизода ${episodeId}:`, this.episodeProgress);
        
        // Инициализируем недостающие поля
        if (!this.episodeProgress.progress) {
          this.episodeProgress.progress = {};
        }
        if (!this.episodeProgress.stats) {
          this.episodeProgress.stats = {};
        }
        if (!this.episodeProgress.completedChapters) {
          this.episodeProgress.completedChapters = [];
        }
        
        // Проверяем, есть ли персонаж игрока в прогрессе
        if (!this.episodeProgress.playerCharacterId && playerCharacterId) {
          this.episodeProgress.playerCharacterId = playerCharacterId;
          console.log(`EpisodeManager.initializeEpisode - установлен playerCharacterId из параметра: ${playerCharacterId}`);
        }
        
        // Загружаем важные выборы из сохранения в Map
        if (this.episodeProgress.importantChoices) {
          console.log(`EpisodeManager.initializeEpisode - загружаем важные выборы из сохранения:`, this.episodeProgress.importantChoices);
          for (const [choiceId, choiceData] of Object.entries(this.episodeProgress.importantChoices)) {
            this.importantChoices.set(choiceId, choiceData);
            console.log(`EpisodeManager.initializeEpisode - загружен важный выбор: ${choiceId} =`, choiceData);
          }
        }
        
        // Загружаем последнюю главу из прогресса
        const lastChapter = this.episodeProgress.currentChapter || startChapter;
        await this.loadChapter(lastChapter, false);
        
        console.log(`Эпизод ${episodeId} инициализирован с главы ${lastChapter}`);
      } else {
        // Создаем новый прогресс
        this.episodeProgress = {
          episodeId: episodeId,
          currentChapter: startChapter,
          currentScene: null,
          playerChoices: {},
          importantChoices: {},
          relationships: {},
          inventory: [],
          progress: {},
          stats: {},
          completedChapters: [],
          lastPlayed: new Date().toISOString(),
          playerCharacterId: playerCharacterId
        };
        
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
      
      // Загружаем данные главы из конфигурации эпизода
      if (!this.episodeData || !this.episodeData.chapters) {
        throw new Error('Данные эпизода не загружены или не содержат глав');
      }
      
      console.log('EpisodeManager.loadChapter - episodeData.chapters:', this.episodeData.chapters);
      console.log('EpisodeManager.loadChapter - ищем главу с ID:', actualChapterId);
      
      // Ищем главу в конфигурации эпизода
      const chapterData = this.episodeData.chapters.find(ch => ch.id.toString() === actualChapterId.toString());
      if (!chapterData) {
        console.error('EpisodeManager.loadChapter - доступные главы:', this.episodeData.chapters.map(ch => ({ id: ch.id, name: ch.name })));
        throw new Error(`Глава ${actualChapterId} не найдена в конфигурации эпизода`);
      }
      
      this.chapterData = chapterData;
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
      
      // Проверяем кэш для мобильных устройств
      const cacheKey = `${this.currentEpisode}_${sceneId}`;
      if (isMobileDevice() && sceneCache.has(cacheKey)) {
        console.log(`EpisodeManager.loadScene - используем кэшированную сцену: ${sceneId}`);
        this.sceneData = sceneCache.get(cacheKey);
        this.currentScene = sceneId;
        return true;
      }
      
      // Пытаемся загрузить сцену из папки scenes эпизода
      let response = await fetch(`/episodes/${this.currentEpisode}/scenes/${sceneId}.json`);
      
      if (!response.ok) {
        // Если не найдено в папке scenes, пробуем найти в папке chapters
        console.log(`Сцена не найдена в /episodes/${this.currentEpisode}/scenes/, пробуем в chapters`);
        response = await fetch(`/episodes/${this.currentEpisode}/chapters/chapter${this.currentChapter}/scenes/${sceneId}.json`);
      }
      
      if (!response.ok) {
        console.error(`EpisodeManager.loadScene - HTTP ошибка: ${response.status} ${response.statusText}`);
        throw new Error(`Не удалось загрузить сцену ${sceneId}: ${response.status} ${response.statusText}`);
      }
      
      this.sceneData = await response.json();
      this.currentScene = sceneId;
      
      // Кэшируем для мобильных устройств
      if (isMobileDevice()) {
        sceneCache.set(cacheKey, this.sceneData);
      }
      
      console.log(`EpisodeManager.loadScene - сцена загружена:`, this.sceneData);
      
      // Проверяем важные выборы в сцене
      if (this.sceneData.choices) {
        console.log(`Проверяем важные выборы в сцене ${sceneId}:`);
        this.sceneData.choices.forEach(choice => {
          if (choice.important) {
            console.log(`Важный выбор в сцене: ${choice.id} = ${choice.value}`);
          }
          if (choice.requirements && choice.requirements.importantChoice) {
            console.log(`Требования важных выборов для ${choice.id}:`, choice.requirements.importantChoice);
          }
        });
      }
      
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
        // Используем ID персонажа из данных выбора, если он есть, иначе из прогресса
        const playerCharacterId = choiceData.playerCharacterId || this.episodeProgress.playerCharacterId;
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
        if (choice.diceCheck) {
          // Поддержка нового формата с объектом results
          if (choice.diceCheck.results) {
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
          // Поддержка старого формата с отдельными полями
          else {
            switch (choiceData.diceRollResult.result) {
              case 'critical_success':
                nextScene = choice.diceCheck.critical_success || nextScene;
                break;
              case 'success':
                nextScene = choice.diceCheck.successScene || nextScene;
                break;
              case 'failure':
                nextScene = choice.diceCheck.failureScene || nextScene;
                break;
              case 'critical_failure':
                nextScene = choice.diceCheck.critical_failure || nextScene;
                break;
            }
          }
        }
        
        // Обновляем выбор с новой сценой
        choice.nextScene = nextScene;
      }
      
      // Сохраняем выбор игрока
      this.playerChoices.set(choiceId, choiceData.value);
      
      // Проверяем, является ли это важным выбором
      if (choice.important) {
        // Используем значение из choice.value для важного выбора
        const choiceValue = choice.value;
        
        console.log(`Обработка важного выбора: ${choiceId}`);
        console.log(`choice.value: ${choice.value} (тип: ${typeof choice.value})`);
        console.log(`choiceData.value: ${choiceData.value} (тип: ${typeof choiceData.value})`);
        console.log(`Используемое значение: ${choiceValue} (тип: ${typeof choiceValue})`);
        console.log(`Персонажи в сцене:`, this.sceneData?.characters);
        
        // Определяем связанных персонажей для важного выбора
        let relatedCharacters = [];
        
        // ПРИОРИТЕТ 1: Явно указанный characterId в выборе
        if (choice.characterId) {
          relatedCharacters = [choice.characterId];
          console.log(`Используем явно указанный characterId: ${choice.characterId}`);
        } 
        // ПРИОРИТЕТ 2: Персонажи из массива characters сцены
        else if (this.sceneData?.characters && this.sceneData.characters.length > 0) {
          relatedCharacters = this.sceneData.characters
            .filter(char => char.id !== 'player') // Исключаем игрока
            .map(char => char.id);
          console.log(`Используем персонажей из массива characters:`, relatedCharacters);
        }
        // ПРИОРИТЕТ 3: Персонажи из диалогов сцены
        else if (this.sceneData?.dialogue) {
          const speakersFromDialogue = this.sceneData.dialogue
            .map(line => line.speaker)
            .filter(speaker => speaker && speaker !== 'player') // Исключаем игрока и пустые значения
            .filter((speaker, index, array) => array.indexOf(speaker) === index); // Убираем дубликаты
          
          relatedCharacters = speakersFromDialogue;
          console.log(`Используем персонажей из диалогов:`, relatedCharacters);
        }
        // ПРИОРИТЕТ 4: Анализ ID выбора
        else {
          const knownCharacters = ['peter', 'oleg', 'anna', 'artess', 'evgeny', 'nick', 'dimitrio'];
          const characterFromChoiceId = knownCharacters.find(charId => choiceId.toLowerCase().includes(charId));
          
          if (characterFromChoiceId) {
            relatedCharacters = [characterFromChoiceId];
            console.log(`Используем персонажа из ID выбора:`, characterFromChoiceId);
          }
        }
        
        console.log(`Связанные персонажи для выбора ${choiceId}:`, relatedCharacters);

        this.importantChoices.set(choiceId, {
          value: choiceValue,
          timestamp: new Date().toISOString(),
          chapter: this.currentChapter,
          scene: this.currentScene,
          text: choice.text || '',
          description: choice.description || '',
          consequences: choice.consequences || [],
          relatedCharacters: relatedCharacters
        });
        
        // Сохраняем важный выбор
        saveImportantChoice(this.currentEpisode, choiceId, {
          value: choiceValue,
          text: choice.text || '',
          description: choice.description || '',
          consequences: choice.consequences || [],
          relatedCharacters: relatedCharacters
        }, this.episodeProgress.playerCharacterId);
        
        console.log(`Важный выбор сохранен: ${choiceId} = ${choiceValue}`);
        console.log(`Текущие важные выборы:`, Object.fromEntries(this.importantChoices));
        
                  // Показываем уведомление о важном выборе
          console.log('EpisodeManager - проверка window.addNotification:', !!window.addNotification);
          if (window.addNotification) {
            const episodeConfig = this.getEpisodeConfig();
            
            // Определяем персонажа для уведомления
            let characterName = 'Кто-то';
            let notificationCharacterId = null;
            
            // ПРИОРИТЕТ 1: Используем characterId из выбора
            if (choice.characterId) {
              notificationCharacterId = choice.characterId;
            }
            // ПРИОРИТЕТ 2: Используем первого связанного персонажа
            else if (relatedCharacters.length > 0) {
              notificationCharacterId = relatedCharacters[0];
            }
            // ПРИОРИТЕТ 3: Используем спикера из первого диалога (как было раньше)
            else {
              const currentDialogue = this.sceneData?.dialogue?.[0];
              notificationCharacterId = currentDialogue?.speaker;
            }
            
            // Получаем имя персонажа для отображения
            if (notificationCharacterId) {
              const speakerCharacter = episodeConfig.characters?.find(char => char.id === notificationCharacterId);
              characterName = speakerCharacter ? speakerCharacter.name : notificationCharacterId;
            }
            
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
      itemsToAdd.forEach(item => {
        let itemId, itemData;
        
        if (typeof item === 'string') {
          // Старый формат: передается только ID
          itemId = item;
          itemData = this.getItemById(itemId);
        } else if (typeof item === 'object' && isCustomQuestItem(item)) {
          // Новый формат: передается объект кастомного квестового предмета
          itemId = item.id;
          itemData = item;
        } else {
          console.warn('Неподдерживаемый формат предмета:', item);
          return;
        }
        
        if (!itemId) {
          console.warn('Не удалось определить ID предмета');
          return;
        }
        
        // Добавляем предмет с полными данными
        if (itemData && typeof itemData === 'object' && itemData.name && isCustomQuestItem(itemData)) {
          console.log('Добавляем кастомный квестовый предмет:', { itemId, itemData });
          console.log('EpisodeManager.processItemEffects - передаем в addItem:', itemData);
          // Передаем объект кастомного квестового предмета как первый параметр
          this.inventoryManager.addItem(itemData, 1);
          
          // Показываем квестовое уведомление
          if (window.addNotification) {
            window.addNotification('quest_item_received', {
              message: `Получен квестовый предмет "${itemData.name}"`,
              itemName: itemData.name
            });
          }
        } else {
          // Обычный предмет - добавляем только по ID
          console.log('Добавляем обычный предмет по ID:', itemId);
          this.inventoryManager.addItem(itemId, 1);
          
          // Показываем обычное уведомление
          if (window.addNotification) {
            const itemName = this.getItemName(itemId);
            window.addNotification('item_received', {
              message: `Получен предмет "${itemName}"`,
              itemName: itemName
            });
          }
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

    // Удаление квестовых предметов по ID
    if (itemEffects.removeQuestItems) {
      const questItemsToRemove = Array.isArray(itemEffects.removeQuestItems) ? itemEffects.removeQuestItems : [itemEffects.removeQuestItems];
      questItemsToRemove.forEach(itemId => {
        this.inventoryManager.removeItem(itemId, 1);
        
        // Показываем уведомление об изъятии квестового предмета
        if (window.addNotification) {
          // Пытаемся получить имя предмета из инвентаря
          const currentInventory = this.getCurrentInventory();
          const itemData = currentInventory[itemId];
          let itemName = itemId;
          
          if (itemData && typeof itemData === 'object' && itemData.name) {
            itemName = itemData.name;
          }
          
          window.addNotification('quest_item_removed', {
            message: `Изъят квестовый предмет "${itemName}"`,
            itemName: itemName
          });
        }
      });
    }
  }

  /**
   * Получение предмета по ID
   * @param {string} itemId - ID предмета
   * @returns {Object|null} - Объект предмета или null
   */
  getItemById(itemId) {
    console.log(`EpisodeManager.getItemById вызвана для: ${itemId}`);
    
    // Проверяем в импортированных данных предметов
    if (itemsData && itemsData.items) {
      console.log('EpisodeManager: импортированные itemsData доступны');
      
      // Проверяем все категории предметов
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
      for (const category of categories) {
        const categoryItems = itemsData.items[category];
        if (categoryItems && categoryItems[itemId]) {
          console.log(`EpisodeManager: найден предмет в категории ${category}: ${itemId}`);
          return categoryItems[itemId];
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в импортированных itemsData`);
    } else {
      console.log('EpisodeManager: импортированные itemsData недоступны');
    }
    
    // Проверяем в загруженных данных предметов (для обратной совместимости)
    if (this.itemsData && this.itemsData.items) {
      console.log('EpisodeManager: загруженные itemsData доступны');
      
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
      for (const category of categories) {
        const categoryItems = this.itemsData.items[category];
        if (categoryItems && categoryItems[itemId]) {
          console.log(`EpisodeManager: найден предмет в загруженных itemsData категории ${category}: ${itemId}`);
          return categoryItems[itemId];
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в загруженных itemsData`);
    }
    
    // Проверяем в episodeData.items (для обратной совместимости)
    if (this.episodeData && this.episodeData.items && this.episodeData.items.items) {
      console.log('EpisodeManager: episodeData.items доступен');
      
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
      for (const category of categories) {
        const categoryItems = this.episodeData.items.items[category];
        if (categoryItems && categoryItems[itemId]) {
          console.log(`EpisodeManager: найден предмет в episodeData.items категории ${category}: ${itemId}`);
          return categoryItems[itemId];
        }
      }
      console.log(`EpisodeManager: предмет ${itemId} не найден в episodeData.items`);
    }
    
    return null;
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
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
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
      
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
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
      
      const categories = ['consumable', 'quest', 'pet', 'clothing', 'chest', 'key', 'gifts'];
      
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
    
    // Проверяем, является ли effects массивом (старая структура)
    if (Array.isArray(effects)) {
      // Старая структура: массив эффектов
      effects.forEach(effect => {
        switch (effect.type) {
          case 'item':
            // Обрабатываем обычный предмет (добавление)
            if (this.inventoryManager && effect.targetId) {
              this.inventoryManager.addItem(effect.targetId, effect.value || 1);
              
              // Показываем уведомление о получении предмета
              if (window.addNotification) {
                const itemName = this.getItemName(effect.targetId);
                window.addNotification('item_received', {
                  message: `Получен предмет "${itemName}"`,
                  itemName: itemName
                });
              }
            }
            break;

          case 'relationship':
            // Обрабатываем отношения
            if (this.relationshipsManager && effect.targetId) {
              this.relationshipsManager.changeRelationship(
                this.episodeProgress.playerCharacterId,
                effect.targetId,
                'friendship',
                effect.value || 0
              );
            }
            break;
          default:
            console.warn(`Неизвестный тип эффекта: ${effect.type}`);
        }
      });
    } else {
      // Новая структура: объект с items/relationships
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
            console.log(`EpisodeManager: обновлена характеристика ${statName}: ${currentValue} -> ${currentValue + change} (+${change})`);
          }
          break;
        default:
          console.log(`EpisodeManager: неизвестный тип эффекта: ${effectType}`);
          break;
        }
      }
    }
    
    // Сохраняем прогресс
    this.saveProgress();
  }

  /**
   * Завершение главы
   */
  completeChapter() {
    // Инициализируем массив завершенных глав, если его нет
    if (!this.episodeProgress.completedChapters) {
      this.episodeProgress.completedChapters = [];
    }
    
    if (!this.episodeProgress.completedChapters.includes(this.currentChapter)) {
      this.episodeProgress.completedChapters.push(this.currentChapter);
    }
    this.saveProgress();
  }

  /**
   * Завершение эпизода
   */
  completeEpisode() {
    // Сначала завершаем текущую главу, если она еще не завершена
    if (!this.episodeProgress.completedChapters.includes(this.currentChapter)) {
      this.completeChapter();
    }
    
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
    // Сначала копируем существующие важные выборы из episodeProgress
    const existingImportantChoices = { ...this.episodeProgress.importantChoices };
    
    // Затем добавляем/обновляем важные выборы из Map
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      existingImportantChoices[choiceId] = choiceData;
    }
    
    this.episodeProgress.importantChoices = existingImportantChoices;
    
    console.log(`EpisodeManager.saveProgress - сохраняем episodeProgress:`, this.episodeProgress);
    console.log(`EpisodeManager.saveProgress - важные выборы в Map:`, Object.fromEntries(this.importantChoices));
    saveEpisodeProgress(this.currentEpisode, this.currentChapter, this.episodeProgress, this.episodeProgress.playerCharacterId);
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
      progress: {
        ...this.episodeProgress.progress,
        completedChapters: this.episodeProgress.completedChapters
      },
      playerCharacterId: this.episodeProgress.playerCharacterId
    };
    
    // Сохраняем важные выборы с полными данными
    for (const [choiceId, choiceData] of this.importantChoices.entries()) {
      gameState.importantChoices[choiceId] = choiceData;
    }
    
    return saveGameState(this.currentEpisode, gameState, this.episodeProgress.playerCharacterId);
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
      const inventory = this.inventoryManager.getAllItems();
      console.log(`EpisodeManager.getCurrentInventory - получен инвентарь:`, inventory);
      return inventory;
    }
    
    // Fallback - возвращаем пустой инвентарь
    console.log(`EpisodeManager.getCurrentInventory - inventoryManager недоступен, возвращаем пустой инвентарь`);
    return {};
  }

  /**
   * Принудительное обновление инвентаря
   */
  refreshInventory() {
    if (this.inventoryManager && this.inventoryManager.getAllItems) {
      // Принудительно получаем актуальный инвентарь
      const inventory = this.inventoryManager.getAllItems();
      console.log(`EpisodeManager.refreshInventory - обновлен инвентарь:`, inventory);
      return inventory;
    }
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
    
    // Принудительно обновляем инвентарь перед проверкой
    const currentInventory = this.refreshInventory();
    // Проверяем все выборы
    const availableChoices = this.sceneData.choices.filter(choice => {
      // Проверяем требуемые предметы (старый формат)
      if (choice.requiredItem) {
        const itemQuantity = currentInventory[choice.requiredItem];
        let hasItem = false;
        
        if (typeof itemQuantity === 'number') {
          // Простой формат: { itemId: number }
          hasItem = itemQuantity > 0;
        } else if (itemQuantity && typeof itemQuantity === 'object') {
          // Сложный формат: { itemId: { quantity: number, ... } }
          if (itemQuantity.quantity !== undefined) {
            // Если есть поле quantity, проверяем его
            hasItem = itemQuantity.quantity > 0;
          } else if (itemQuantity.id) {
            // Если есть поле id, значит предмет существует (количество по умолчанию 1)
            hasItem = true;
          } else {
            // Если объект существует, но нет ни quantity ни id, считаем что предмет есть
            hasItem = true;
          }
        } else {
          // Предмет не найден
          hasItem = false;
        }
        
        console.log(`Выбор ${choice.id} требует предмет ${choice.requiredItem}: ${hasItem ? 'есть' : 'нет'}`);
        if (!hasItem) return false;
      }
      
      // Проверяем требуемые квестовые предметы
      if (choice.requirements && choice.requirements.questItem) {
        // Определяем ID предмета для проверки
        let itemIdToCheck = choice.requirements.questItem;
        
        // Если указан конкретный ID квестового предмета, используем его
        if (choice.requirements.questItemId && choice.requirements.questItemId.trim() !== '') {
          itemIdToCheck = choice.requirements.questItemId;
        }
        
        const itemQuantity = currentInventory[itemIdToCheck];
        let hasQuestItem = false;
        
        if (typeof itemQuantity === 'number') {
          // Простой формат: { itemId: number }
          hasQuestItem = itemQuantity > 0;
        } else if (itemQuantity && typeof itemQuantity === 'object') {
          // Сложный формат: { itemId: { quantity: number, ... } }
          if (itemQuantity.quantity !== undefined) {
            // Если есть поле quantity, проверяем его
            hasQuestItem = itemQuantity.quantity > 0;
          } else if (itemQuantity.id) {
            // Если есть поле id, значит предмет существует (количество по умолчанию 1)
            hasQuestItem = true;
          } else {
            // Если объект существует, но нет ни quantity ни id, считаем что предмет есть
            hasQuestItem = true;
          }
        } else {
          // Предмет не найден
          hasQuestItem = false;
        }
        
        if (!hasQuestItem) return false;
      }
      
      // Проверяем требуемые отношения
      if (choice.requiredRelationship) {
        const hasRelationship = this.checkRelationshipRequirement(choice.requiredRelationship);
        if (!hasRelationship) return false;
      }
      
      // Проверяем условия (старая система)
      if (choice.conditions) {
        const isAvailable = this.checkVariantConditions(choice.conditions);
        if (!isAvailable) return false;
      }
      
      // Проверяем требования (старая система)
      if (choice.requirements) {
        const isAvailable = this.checkChoiceRequirements(choice.requirements);
        if (!isAvailable) return false;
      }
      
      return true;
    });
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
          if (this.relationshipsManager) {
            // Используем глобальную систему отношений
            const playerCharacterId = this.getCurrentPlayerCharacterId();
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
          console.log(`EpisodeManager.checkChoiceRequirements - проверка важных выборов для требования:`, value);
          console.log(`EpisodeManager.checkChoiceRequirements - текущие важные выборы:`, Object.fromEntries(this.importantChoices));
          
          // Если Map пустой, попробуем загрузить из episodeProgress
          if (this.importantChoices.size === 0 && this.episodeProgress.importantChoices) {
            console.log(`EpisodeManager.checkChoiceRequirements - Map пустой, загружаем из episodeProgress:`, this.episodeProgress.importantChoices);
            for (const [choiceId, choiceData] of Object.entries(this.episodeProgress.importantChoices)) {
              this.importantChoices.set(choiceId, choiceData);
            }
            console.log(`EpisodeManager.checkChoiceRequirements - загружены важные выборы в Map:`, Object.fromEntries(this.importantChoices));
          }
          
          for (const [choiceId, expectedValue] of Object.entries(value)) {
            const actualValue = this.importantChoices.get(choiceId)?.value;
            console.log(`EpisodeManager.checkChoiceRequirements - проверка ${choiceId}: ожидается ${expectedValue} (тип: ${typeof expectedValue}), получено ${actualValue} (тип: ${typeof actualValue})`);
            
            // Специальная обработка для проверки отсутствия важного выбора
            if (expectedValue === "" || expectedValue === null || expectedValue === "missing") {
              // Если ожидается пустая строка, null или "missing", то важный выбор не должен быть сделан
              if (actualValue !== null && actualValue !== undefined) {
                console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: ${choiceId} - выбор не должен быть сделан, но он есть (${actualValue})`);
                return false;
              } else {
                console.log(`EpisodeManager.checkChoiceRequirements - требование выполнено: ${choiceId} - выбор не сделан, как и требуется`);
              }
            } else if (typeof expectedValue === 'string' && expectedValue.startsWith('!')) {
              // Отрицание: если ожидается "!value", то важный выбор не должен быть равен "value"
              const targetValue = expectedValue.substring(1);
              if (actualValue === targetValue) {
                console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: ${choiceId} - выбор не должен быть равен ${targetValue}`);
                return false;
              } else {
                console.log(`EpisodeManager.checkChoiceRequirements - требование выполнено: ${choiceId} - выбор не равен ${targetValue}`);
              }
            } else {
              // Обычная проверка точного совпадения
              if (actualValue !== expectedValue) {
                console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: ${choiceId} - значения не совпадают (ожидается ${expectedValue}, получено ${actualValue})`);
                return false;
              } else {
                console.log(`EpisodeManager.checkChoiceRequirements - требование выполнено: ${choiceId} - значения совпадают`);
              }
            }
          }
          console.log(`EpisodeManager.checkChoiceRequirements - все требования важных выборов выполнены`);
          break;
        case 'item':
          // Проверяем наличие обычного предмета в инвентаре
          console.log(`EpisodeManager.checkChoiceRequirements - проверка обычного предмета:`, value);
          const regularItemInventory = this.refreshInventory();
          const regularItemQuantity = regularItemInventory[value];
          console.log(`EpisodeManager.checkChoiceRequirements - обычный предмет ${value} в инвентаре:`, regularItemQuantity);
          
          let hasRegularItem = false;
          if (typeof regularItemQuantity === 'number') {
            // Простой формат: { itemId: number }
            hasRegularItem = regularItemQuantity > 0;
          } else if (regularItemQuantity && typeof regularItemQuantity === 'object') {
            // Сложный формат: { itemId: { quantity: number, ... } }
            if (regularItemQuantity.quantity !== undefined) {
              // Если есть поле quantity, проверяем его
              hasRegularItem = regularItemQuantity.quantity > 0;
            } else if (regularItemQuantity.id) {
              // Если есть поле id, значит предмет существует (количество по умолчанию 1)
              hasRegularItem = true;
            } else {
              // Если объект существует, но нет ни quantity ни id, считаем что предмет есть
              hasRegularItem = true;
            }
          } else {
            // Предмет не найден
            hasRegularItem = false;
          }
          
          console.log(`EpisodeManager.checkChoiceRequirements - обычный предмет ${value}: ${hasRegularItem ? 'есть' : 'нет'}`);
          if (!hasRegularItem) {
            console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: обычный предмет ${value} отсутствует`);
            return false;
          }
          console.log(`EpisodeManager.checkChoiceRequirements - требование выполнено: обычный предмет ${value} найден`);
          break;
        case 'items':
          // Здесь можно добавить проверку предметов в инвентаре
          break;
        case 'questItem':
          // Проверяем наличие квестового предмета в инвентаре
          console.log(`EpisodeManager.checkChoiceRequirements - проверка квестового предмета:`, value);
          const currentInventory = this.refreshInventory();
          
          // Определяем ID предмета для проверки
          let itemIdToCheck = value;
          
          // Если есть поле questItemId в requirements, используем его
          if (requirements.questItemId && requirements.questItemId.trim() !== '') {
            itemIdToCheck = requirements.questItemId;
            console.log(`EpisodeManager.checkChoiceRequirements - проверяем конкретный экземпляр квестового предмета: ${itemIdToCheck}`);
          }
          
          const itemQuantity = currentInventory[itemIdToCheck];
          console.log(`EpisodeManager.checkChoiceRequirements - квестовый предмет ${itemIdToCheck} в инвентаре:`, itemQuantity);
          
          let hasQuestItem = false;
          if (typeof itemQuantity === 'number') {
            // Простой формат: { itemId: number }
            hasQuestItem = itemQuantity > 0;
          } else if (itemQuantity && typeof itemQuantity === 'object') {
            // Сложный формат: { itemId: { quantity: number, ... } }
            if (itemQuantity.quantity !== undefined) {
              // Если есть поле quantity, проверяем его
              hasQuestItem = itemQuantity.quantity > 0;
            } else if (itemQuantity.id) {
              // Если есть поле id, значит предмет существует (количество по умолчанию 1)
              hasQuestItem = true;
            } else {
              // Если объект существует, но нет ни quantity ни id, считаем что предмет есть
              hasQuestItem = true;
            }
          } else {
            // Предмет не найден
            hasQuestItem = false;
          }
          
          console.log(`EpisodeManager.checkChoiceRequirements - квестовый предмет ${itemIdToCheck}: ${hasQuestItem ? 'есть' : 'нет'}`);
          if (!hasQuestItem) {
            console.log(`EpisodeManager.checkChoiceRequirements - требование не выполнено: квестовый предмет ${itemIdToCheck} отсутствует`);
            return false;
          }
          console.log(`EpisodeManager.checkChoiceRequirements - требование выполнено: квестовый предмет ${itemIdToCheck} найден`);
          break;
        case 'questItemId':
          // Пропускаем проверку questItemId, так как она обрабатывается в case 'questItem'
          console.log(`EpisodeManager.checkChoiceRequirements - пропускаем проверку questItemId: ${value}`);
          break;
        default:
          break;
      }
    }
    console.log(`EpisodeManager.checkChoiceRequirements - все требования выполнены, возвращаем true`);
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
    const completedChapters = this.episodeProgress?.completedChapters?.length || 0;
    
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
    if (this._nextChapterInProgress || EpisodeManager._globalNextChapterInProgress) {
      console.log('EpisodeManager.nextChapter: уже выполняется, пропускаем');
      return false;
    }
    
    this._nextChapterInProgress = true;
    EpisodeManager._globalNextChapterInProgress = true;
    console.log('EpisodeManager.nextChapter - начало выполнения');
    console.log('EpisodeManager.nextChapter - episodeData:', this.episodeData);
    console.log('EpisodeManager.nextChapter - currentChapter:', this.currentChapter);
    
    if (!this.episodeData || !this.episodeData.chapters) {
      console.log('EpisodeManager.nextChapter - нет данных эпизода или глав');
      this._nextChapterInProgress = false;
      EpisodeManager._globalNextChapterInProgress = false;
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
      EpisodeManager._globalNextChapterInProgress = false;
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
    EpisodeManager._globalNextChapterInProgress = false;
    return true;
  }

  /**
   * Предварительная загрузка сцен для мобильных устройств
   * @param {string} episodeId - ID эпизода
   * @param {Array} sceneIds - Массив ID сцен для предзагрузки
   */
  async preloadScenes(episodeId, sceneIds) {
    if (!isMobileDevice()) return;
    
    console.log(`EpisodeManager.preloadScenes - предзагрузка ${sceneIds.length} сцен для эпизода ${episodeId}`);
    
    const preloadPromises = sceneIds.map(async (sceneId) => {
      try {
        const cacheKey = `${episodeId}_${sceneId}`;
        if (sceneCache.has(cacheKey)) return; // Уже загружено
        
        const response = await fetch(`/episodes/${episodeId}/scenes/${sceneId}.json`);
        if (response.ok) {
          const sceneData = await response.json();
          sceneCache.set(cacheKey, sceneData);
          console.log(`EpisodeManager.preloadScenes - предзагружена сцена: ${sceneId}`);
        }
      } catch (error) {
        console.warn(`EpisodeManager.preloadScenes - не удалось предзагрузить сцену ${sceneId}:`, error);
      }
    });
    
    await Promise.allSettled(preloadPromises);
  }

  /**
   * Очистка кэша для освобождения памяти
   */
  clearCache() {
    if (isMobileDevice()) {
      episodeCache.clear();
      sceneCache.clear();
      console.log('EpisodeManager.clearCache - кэш очищен');
    }
  }
}

// Создаем единственный экземпляр менеджера
const episodeManager = new EpisodeManager();

export default episodeManager; 