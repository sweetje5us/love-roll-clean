import characterSprites from '../data/character_sprites.json';

/**
 * Универсальный менеджер спрайтов для персонажей в эпизодах
 */
class SpriteManager {
  constructor() {
    this.cache = new Map(); // Кэш для загруженных изображений
  }

  /**
   * Получение типа персонажа на основе пола и возраста
   * @param {string} gender - Пол персонажа ('male' или 'female')
   * @param {string} age - Возраст персонажа ('young' или 'mature')
   * @returns {string} - Тип персонажа
   */
  getCharacterType(gender, age) {
    if (age === 'mature') {
      return `${gender}_mature`;
    }
    return gender;
  }

  /**
   * Сборка спрайта персонажа из слоев для эпизода
   * @param {Object} characterData - Данные персонажа из конфига эпизода
   * @param {string} emotion - Эмоция персонажа (по умолчанию 'normal')
   * @param {boolean} showBush - Показывать ли смущение (только для женских персонажей)
   * @returns {Array} - Массив слоев спрайта
   */
  buildEpisodeCharacterSprite(characterData, emotion = 'normal', showBush = false) {
    const { gender, age, appearance } = characterData;
    const type = this.getCharacterType(gender, age);
    const layers = [];
    


    // 0. Волосы сзади (если выбраны)
    if (appearance.hairBehind && typeof appearance.hairBehind === 'string') {
      const hairBehindPath = characterSprites.hair_behind[type]?.[appearance.hairBehind]?.[appearance.hairColor];
      if (hairBehindPath) {
        layers.push({
          src: `sprites/characters/${hairBehindPath}`,
          zIndex: 0
        });
      }
    }

    // 1. Тело
    const bodyData = characterSprites.base_body[type];
    if (bodyData) {
      layers.push({
        src: `sprites/characters/${bodyData.file}`,
        zIndex: 1,
        size: bodyData.size
      });
    }

    // 2. Эмоция
    const emotionPath = characterSprites.emotion[type]?.pink_eyes?.[emotion];
    if (emotionPath) {
      layers.push({
        src: `sprites/characters/${emotionPath}`,
        zIndex: 2
      });
    }

    // 3. Смущение (только для женских персонажей в определённых сценах)
    if (gender === 'female' && showBush && appearance.bush && characterSprites.bush[type]?.[appearance.bush]) {
      const bushPath = characterSprites.bush[type][appearance.bush];
      layers.push({
        src: `sprites/characters/${bushPath}`,
        zIndex: 3
      });
    }

    // 4. Одежда
    let dressPath = null;
    if (appearance.dressPaid) {
      // Платная одежда
      dressPath = characterSprites.dresses[type]?.paid?.[appearance.dress];
    } else {
      // Сначала проверяем бесплатную одежду
      dressPath = characterSprites.dresses[type]?.free?.[appearance.dress];
      
      // Если не найдено в бесплатной, проверяем в сценах
      if (!dressPath) {
        dressPath = characterSprites.dresses[type]?.scenes?.[appearance.dress];
      }
    }

    if (dressPath) {
      layers.push({
        src: `sprites/characters/${dressPath}`,
        zIndex: 4
      });
    }

    // 5. Причёска
    const hairPath = characterSprites.hairs[type]?.[appearance.hairStyle]?.[appearance.hairColor];
    if (hairPath) {
      layers.push({
        src: `sprites/characters/${hairPath}`,
        zIndex: 5
      });
    }

    // 6. Аксессуары (если есть)
    if (appearance.accessory) {
      let accessoryPath = null;
      if (appearance.accessoryPaid) {
        // Платный аксессуар
        accessoryPath = characterSprites.accessories[type]?.paid?.[appearance.accessory];
      } else {
        // Бесплатный аксессуар
        accessoryPath = characterSprites.accessories[type]?.free?.[appearance.accessory];
      }

      if (accessoryPath) {
        layers.push({
          src: `sprites/characters/${accessoryPath}`,
          zIndex: 6
        });
      } else {
        console.warn(`Аксессуар ${appearance.accessory} не найден для типа ${type}`);
      }
    }

    const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
    return sortedLayers;
  }

  /**
   * Получение доступных эмоций для персонажа
   * @param {Object} characterData - Данные персонажа
   * @returns {Array} - Массив доступных эмоций
   */
  getAvailableEmotions(characterData) {
    const { gender, age } = characterData;
    const type = this.getCharacterType(gender, age);
    return Object.keys(characterSprites.emotion[type]?.pink_eyes || {});
  }

  /**
   * Получение размера персонажа
   * @param {Object} characterData - Данные персонажа
   * @returns {Array} - Размер [ширина, высота]
   */
  getCharacterSize(characterData) {
    const { gender, age } = characterData;
    const type = this.getCharacterType(gender, age);
    const bodyData = characterSprites.base_body[type];
    return bodyData?.size || [800, 1000];
  }

  /**
   * Предзагрузка изображений для персонажа
   * @param {Object} characterData - Данные персонажа
   * @param {Array} emotions - Список эмоций для предзагрузки
   * @returns {Promise} - Promise завершения загрузки
   */
  async preloadCharacterImages(characterData, emotions = ['normal']) {
    const promises = [];
    
    // Загружаем базовый спрайт
    const baseLayers = this.buildEpisodeCharacterSprite(characterData, 'normal');
    baseLayers.forEach(layer => {
      promises.push(this.preloadImage(layer.src));
    });

    // Загружаем эмоции
    emotions.forEach(emotion => {
      if (emotion !== 'normal') {
        const emotionLayers = this.buildEpisodeCharacterSprite(characterData, emotion);
        emotionLayers.forEach(layer => {
          if (layer.zIndex === 2) { // Только слой эмоции
            promises.push(this.preloadImage(layer.src));
          }
        });
      }
    });

    return Promise.all(promises);
  }

  /**
   * Предзагрузка одного изображения
   * @param {string} src - Путь к изображению
   * @returns {Promise} - Promise завершения загрузки
   */
  preloadImage(src) {
    if (this.cache.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Не удалось загрузить изображение: ${src}`);
        reject(new Error(`Не удалось загрузить изображение: ${src}`));
      };
      img.src = src;
    });
  }

  /**
   * Очистка кэша
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Сборка спрайта персонажа игрока в сцене
   * @param {Object} characterData - Данные персонажа игрока
   * @param {string} emotion - Эмоция персонажа
   * @returns {Array} - Массив слоев спрайта
   */
  buildPlayerSprite(characterData, emotion = 'normal') {
    try {
      // Используем тот же метод, что и для персонажей эпизода, но с данными игрока
      const { gender, age, appearance } = characterData;
      const type = this.getCharacterType(gender, age);
      const layers = [];

      // 0. Волосы сзади (если выбраны)
      if (appearance?.hairBehind && typeof appearance.hairBehind === 'string') {
        const hairBehindPath = characterSprites.hair_behind[type]?.[appearance.hairBehind]?.[appearance.hairColor];
        if (hairBehindPath) {
          layers.push({
            src: `sprites/characters/${hairBehindPath}`,
            zIndex: 0
          });
        }
      }

      // 1. Тело
      const bodyData = characterSprites.base_body[type];
      if (bodyData) {
        layers.push({
          src: `sprites/characters/${bodyData.file}`,
          zIndex: 1,
          size: bodyData.size
        });
      }

      // 2. Эмоция
      const emotionPath = characterSprites.emotion[type]?.pink_eyes?.[emotion];
      if (emotionPath) {
        layers.push({
          src: `sprites/characters/${emotionPath}`,
          zIndex: 2
        });
      }

      // 3. Одежда
      let dressPath = null;
      if (appearance?.dressPaid) {
        // Платная одежда
        dressPath = characterSprites.dresses[type]?.paid?.[appearance.dress];
      } else {
        // Сначала проверяем бесплатную одежду
        dressPath = characterSprites.dresses[type]?.free?.[appearance.dress];
        
        // Если не найдено в бесплатной, проверяем в сценах
        if (!dressPath) {
          dressPath = characterSprites.dresses[type]?.scenes?.[appearance.dress];
        }
      }

      if (dressPath) {
        layers.push({
          src: `sprites/characters/${dressPath}`,
          zIndex: 4
        });
      }

      // 4. Причёска
      const hairPath = characterSprites.hairs[type]?.[appearance?.hairStyle]?.[appearance?.hairColor];
      if (hairPath) {
        layers.push({
          src: `sprites/characters/${hairPath}`,
          zIndex: 5
        });
      }

      // 5. Аксессуары (если есть)
      if (appearance?.accessory) {
        let accessoryPath = null;
        if (appearance.accessoryPaid) {
          // Платный аксессуар
          accessoryPath = characterSprites.accessories[type]?.paid?.[appearance.accessory];
        } else {
          // Бесплатный аксессуар
          accessoryPath = characterSprites.accessories[type]?.free?.[appearance.accessory];
        }

        if (accessoryPath) {
          layers.push({
            src: `sprites/characters/${accessoryPath}`,
            zIndex: 6
          });
        } else {
          console.warn(`Аксессуар ${appearance.accessory} не найден для типа ${type}`);
        }
      }

      const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
      return sortedLayers;
    } catch (err) {
      console.error('SpriteManager - Ошибка при сборке спрайта игрока:', err);
      return [];
    }
  }
}

// Создаем единственный экземпляр менеджера
const spriteManager = new SpriteManager();

export default spriteManager; 