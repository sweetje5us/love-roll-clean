/**
 * Утилиты для работы с важными выборами в localStorage
 */

/**
 * Сохраняет важный выбор в localStorage для главы
 * @param {string} chapterId - ID главы
 * @param {string} choiceId - ID выбора
 * @param {string} choiceValue - Значение выбора
 */
export const saveImportantChoice = (chapterId, choiceId, choiceValue) => {
  if (!chapterId || !choiceId) return;
  
  try {
    const storageKey = `important_choices_${chapterId}`;
    const stored = localStorage.getItem(storageKey);
    let choices = stored ? JSON.parse(stored) : [];
    
    // Проверяем, есть ли уже такой выбор
    const existingIndex = choices.findIndex(c => c.id === choiceId);
    if (existingIndex >= 0) {
      choices[existingIndex].value = choiceValue;
    } else {
      choices.push({ id: choiceId, value: choiceValue });
    }
    
    localStorage.setItem(storageKey, JSON.stringify(choices));
    return choices;
  } catch (error) {
    console.error('Ошибка сохранения важного выбора:', error);
    return [];
  }
};

/**
 * Загружает все важные выборы для главы из localStorage
 * @param {string} chapterId - ID главы
 * @returns {Array} Массив важных выборов
 */
export const loadImportantChoices = (chapterId) => {
  if (!chapterId) return [];
  
  try {
    const storageKey = `important_choices_${chapterId}`;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Ошибка загрузки важных выборов:', error);
    return [];
  }
};

/**
 * Удаляет важный выбор из localStorage
 * @param {string} chapterId - ID главы
 * @param {string} choiceId - ID выбора для удаления
 */
export const removeImportantChoice = (chapterId, choiceId) => {
  if (!chapterId || !choiceId) return;
  
  try {
    const storageKey = `important_choices_${chapterId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      let choices = JSON.parse(stored);
      choices = choices.filter(c => c.id !== choiceId);
      localStorage.setItem(storageKey, JSON.stringify(choices));
      return choices;
    }
  } catch (error) {
    console.error('Ошибка удаления важного выбора:', error);
    return [];
  }
};

/**
 * Очищает все важные выборы для главы
 * @param {string} chapterId - ID главы
 */
export const clearImportantChoices = (chapterId) => {
  if (!chapterId) return;
  
  try {
    const storageKey = `important_choices_${chapterId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Ошибка очистки важных выборов:', error);
  }
};

/**
 * Получает все важные выборы для всех глав
 * @returns {Object} Объект с важными выборами по главам
 */
export const getAllImportantChoices = () => {
  const allChoices = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('important_choices_')) {
        const chapterId = key.replace('important_choices_', '');
        const choices = loadImportantChoices(chapterId);
        if (choices.length > 0) {
          allChoices[chapterId] = choices;
        }
      }
    }
  } catch (error) {
    console.error('Ошибка получения всех важных выборов:', error);
  }
  
  return allChoices;
};

/**
 * Экспортирует важные выборы в JSON файл
 * @param {string} chapterId - ID главы (опционально, если не указан - экспортирует все)
 */
export const exportImportantChoices = (chapterId = null) => {
  try {
    let data;
    if (chapterId) {
      data = {
        [chapterId]: loadImportantChoices(chapterId)
      };
    } else {
      data = getAllImportantChoices();
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = chapterId ? `important_choices_${chapterId}.json` : 'important_choices_all.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка экспорта важных выборов:', error);
  }
};

/**
 * Импортирует важные выборы из JSON файла
 * @param {File} file - Файл для импорта
 * @returns {Promise<boolean>} Успешность импорта
 */
export const importImportantChoices = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    for (const [chapterId, choices] of Object.entries(data)) {
      if (Array.isArray(choices)) {
        const storageKey = `important_choices_${chapterId}`;
        localStorage.setItem(storageKey, JSON.stringify(choices));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка импорта важных выборов:', error);
    return false;
  }
}; 