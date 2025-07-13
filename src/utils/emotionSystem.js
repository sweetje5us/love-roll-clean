/**
 * Универсальная система эмоций для персонажей
 * Автоматически определяет доступные эмоции и использует fallback
 */

// Универсальный список всех возможных эмоций
export const UNIVERSAL_EMOTIONS = {
  // Базовые эмоции (есть у всех персонажей)
  normal: 'normal',
  happy: 'smile1', // Для male персонажей используем smile1
  sad: 'sad',
  angry: 'angry1', // Для male персонажей используем angry1
  surprised: 'surprised',
  
  // Дополнительные эмоции (могут отсутствовать у некоторых персонажей)
  delighted: 'delighted',
  annoyed: 'annoyed',
  smug: 'smug',
  sleepy: 'sleepy',
  laugh: 'laugh',
  smile2: 'smile2',
  angry1: 'angry1',
  angry2: 'angry2',
  delighted2: 'delighted2',
  sleepy2: 'sleepy2',
  smug2: 'smug2',
  crying: 'crying',
  smile1: 'smile1',
  smile3: 'smile3',
  smirk: 'smirk'
};

// Fallback цепочки для эмоций (если основная эмоция недоступна)
export const EMOTION_FALLBACKS = {
  // Счастливые эмоции
  happy: ['smile1', 'smile2', 'smile3', 'delighted', 'delighted2', 'normal'],
  delighted: ['smile1', 'smile2', 'smile3', 'happy', 'normal'],
  laugh: ['smile1', 'smile2', 'smile3', 'delighted', 'happy', 'normal'],
  
  // Грустные эмоции
  sad: ['crying', 'sleepy', 'sleepy2', 'normal'],
  crying: ['sad', 'sleepy', 'normal'],
  
  // Злые эмоции
  angry: ['angry1', 'angry2', 'annoyed', 'normal'],
  angry1: ['angry', 'angry2', 'annoyed', 'normal'],
  angry2: ['angry', 'angry1', 'annoyed', 'normal'],
  
  // Удивленные эмоции
  surprised: ['normal'],
  
  // Другие эмоции
  annoyed: ['angry', 'angry1', 'angry2', 'normal'],
  smug: ['smug2', 'smile1', 'smile2', 'smile3', 'normal'],
  sleepy: ['sleepy2', 'sad', 'normal'],
  
  // Fallback для всех эмоций
  normal: ['normal']
};

// Кэш доступных эмоций для каждого типа персонажа
const emotionCache = new Map();

/**
 * Получает доступные эмоции для персонажа
 * @param {string} gender - пол персонажа ('male', 'female')
 * @param {string} age - возраст персонажа ('1', '2', 'mature')
 * @param {string} eyeColor - цвет глаз (по умолчанию 'pink_eyes')
 * @returns {Promise<Set<string>>} - множество доступных эмоций
 */
export async function getAvailableEmotions(gender, age, eyeColor = 'pink_eyes') {
  const cacheKey = `${gender}_${age}_${eyeColor}`;
  
  if (emotionCache.has(cacheKey)) {
    return emotionCache.get(cacheKey);
  }
  
  const availableEmotions = new Set();
  
  try {
    // Определяем путь к папке с эмоциями
    let emotionPath;
    if (age === 'mature' || age === '2') {
      emotionPath = `sprites/characters/emotion/${gender}_mature/${eyeColor}`;
    } else {
      emotionPath = `sprites/characters/emotion/${gender}/${eyeColor}`;
    }
    
    // Проверяем доступность каждой эмоции
    for (const emotionName of Object.values(UNIVERSAL_EMOTIONS)) {
      try {
        const response = await fetch(`${emotionPath}/${emotionName}.png`, { method: 'HEAD' });
        if (response.ok) {
          availableEmotions.add(emotionName);
        }
      } catch (error) {
        // Эмоция недоступна, пропускаем
      }
    }
    
    // Добавляем специфичные эмоции для male персонажей
    if (gender === 'male') {
      const maleSpecificEmotions = ['smile1', 'smile2', 'smile3', 'angry1', 'angry2', 'surprised', 'laugh', 'smirk'];
      for (const emotionName of maleSpecificEmotions) {
        try {
          const response = await fetch(`${emotionPath}/${emotionName}.png`, { method: 'HEAD' });
          if (response.ok) {
            availableEmotions.add(emotionName);
          }
        } catch (error) {
          // Эмоция недоступна, пропускаем
        }
      }
    }
    
    // Добавляем специфичные эмоции для female персонажей
    if (gender === 'female') {
      const femaleSpecificEmotions = ['smile', 'angry', 'shocked', 'delighted', 'annoyed', 'smug', 'sleepy'];
      for (const emotionName of femaleSpecificEmotions) {
        try {
          const response = await fetch(`${emotionPath}/${emotionName}.png`, { method: 'HEAD' });
          if (response.ok) {
            availableEmotions.add(emotionName);
          }
        } catch (error) {
          // Эмоция недоступна, пропускаем
        }
      }
    }
    
    // Всегда добавляем 'normal' как базовую эмоцию
    availableEmotions.add('normal');
    
    // Кэшируем результат
    emotionCache.set(cacheKey, availableEmotions);
    
    console.log(`EmotionSystem: Доступные эмоции для ${cacheKey}:`, Array.from(availableEmotions));
    
  } catch (error) {
    console.error('EmotionSystem: Ошибка при получении доступных эмоций:', error);
    // В случае ошибки возвращаем только базовые эмоции
    availableEmotions.add('normal');
    availableEmotions.add('smile');
    availableEmotions.add('sad');
  }
  
  return availableEmotions;
}

/**
 * Получает подходящую эмоцию для персонажа
 * @param {string} requestedEmotion - запрашиваемая эмоция
 * @param {string} gender - пол персонажа
 * @param {string} age - возраст персонажа
 * @param {string} eyeColor - цвет глаз
 * @returns {Promise<string>} - доступная эмоция
 */
export async function getSuitableEmotion(requestedEmotion, gender, age, eyeColor = 'pink_eyes') {
  const availableEmotions = await getAvailableEmotions(gender, age, eyeColor);
  
  // Если запрашиваемая эмоция доступна, используем её
  if (availableEmotions.has(requestedEmotion)) {
    return requestedEmotion;
  }
  
  // Создаем специфичные fallback цепочки для разных полов
  let fallbackChain = EMOTION_FALLBACKS[requestedEmotion] || ['normal'];
  
  // Для male персонажей корректируем fallback цепочки
  if (gender === 'male') {
    if (requestedEmotion === 'happy') {
      fallbackChain = ['smile1', 'smile2', 'smile3', 'laugh', 'normal'];
    } else if (requestedEmotion === 'angry') {
      fallbackChain = ['angry1', 'angry2', 'normal'];
    } else if (requestedEmotion === 'surprised') {
      fallbackChain = ['normal'];
    }
  } else if (gender === 'female') {
    // Для female персонажей используем оригинальные fallback
    if (requestedEmotion === 'happy') {
      fallbackChain = ['smile', 'smile1', 'smile2', 'smile3', 'delighted', 'normal'];
    } else if (requestedEmotion === 'angry') {
      fallbackChain = ['angry', 'angry1', 'angry2', 'normal'];
    } else if (requestedEmotion === 'surprised') {
      fallbackChain = ['shocked', 'normal'];
    }
  }
  
  for (const fallbackEmotion of fallbackChain) {
    if (availableEmotions.has(fallbackEmotion)) {
      console.log(`EmotionSystem: Эмоция '${requestedEmotion}' заменена на '${fallbackEmotion}' для ${gender}_${age}`);
      return fallbackEmotion;
    }
  }
  
  // Если ничего не найдено, возвращаем 'normal'
  console.warn(`EmotionSystem: Не найдена подходящая эмоция для '${requestedEmotion}', используется 'normal'`);
  return 'normal';
}

/**
 * Получает путь к спрайту эмоции
 * @param {string} emotion - название эмоции
 * @param {string} gender - пол персонажа
 * @param {string} age - возраст персонажа
 * @param {string} eyeColor - цвет глаз
 * @returns {string} - путь к спрайту
 */
export function getEmotionSpritePath(emotion, gender, age, eyeColor = 'pink_eyes') {
  let emotionPath;
  if (age === 'mature' || age === '2') {
    emotionPath = `sprites/characters/emotion/${gender}_mature/${eyeColor}`;
  } else {
    emotionPath = `sprites/characters/emotion/${gender}/${eyeColor}`;
  }
  
  return `${emotionPath}/${emotion}.png`;
}

/**
 * Преобразует универсальные названия эмоций в конкретные названия файлов
 * @param {string} universalEmotion - универсальное название эмоции
 * @param {string} gender - пол персонажа
 * @returns {string} - конкретное название файла
 */
export function mapUniversalEmotion(universalEmotion, gender = 'female') {
  // Специальная обработка для разных полов
  if (gender === 'male') {
    if (universalEmotion === 'happy') return 'smile1';
    if (universalEmotion === 'angry') return 'angry1';
    if (universalEmotion === 'surprised') return 'surprised';
  } else if (gender === 'female') {
    if (universalEmotion === 'happy') return 'smile';
    if (universalEmotion === 'angry') return 'angry';
    if (universalEmotion === 'surprised') return 'shocked';
  }
  
  return UNIVERSAL_EMOTIONS[universalEmotion] || universalEmotion;
}

/**
 * Очищает кэш эмоций (полезно при перезагрузке ресурсов)
 */
export function clearEmotionCache() {
  emotionCache.clear();
  console.log('EmotionSystem: Кэш эмоций очищен');
}

/**
 * Принудительно перезагружает доступные эмоции для персонажа
 * @param {string} gender - пол персонажа
 * @param {string} age - возраст персонажа
 * @param {string} eyeColor - цвет глаз
 */
export async function reloadEmotions(gender, age, eyeColor = 'pink_eyes') {
  const cacheKey = `${gender}_${age}_${eyeColor}`;
  emotionCache.delete(cacheKey);
  console.log(`EmotionSystem: Перезагрузка эмоций для ${cacheKey}`);
  return await getAvailableEmotions(gender, age, eyeColor);
} 