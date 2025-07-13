// Утилиты для работы с сохранениями эпизодов

const SAVE_KEY = 'episode_saves';
const GAME_STATE_KEY = 'game_state';

/**
 * Получает все сохранения эпизодов
 */
export const getEpisodeSaves = () => {
  try {
    const saves = localStorage.getItem(SAVE_KEY);
    return saves ? JSON.parse(saves) : {};
  } catch (error) {
    console.error('Ошибка загрузки сохранений:', error);
    return {};
  }
};

/**
 * Сохраняет прогресс эпизода
 */
export const saveEpisodeProgress = (episodeId, chapterId, progress = {}) => {
  try {
    const saves = getEpisodeSaves();
    const episodeSave = saves[episodeId] || {
      currentChapter: 1,
      currentScene: null,
      completedChapters: [],
      progress: {},
      playerChoices: {},
      importantChoices: {}, // Важные выборы
      lastPlayed: null
    };

    // Обновляем текущую главу
    episodeSave.currentChapter = chapterId;
    
    // Обновляем текущую сцену из прогресса
    if (progress.currentScene !== undefined) {
      episodeSave.currentScene = progress.currentScene;
    }
    
    // Добавляем главу в завершенные, если она меньше текущей
    if (!episodeSave.completedChapters.includes(chapterId - 1) && chapterId > 1) {
      episodeSave.completedChapters.push(chapterId - 1);
    }
    
    // Обновляем прогресс
    episodeSave.progress = { ...episodeSave.progress, ...progress };
    episodeSave.playerCharacterId = progress.playerCharacterId || episodeSave.playerCharacterId;
    episodeSave.lastPlayed = new Date().toISOString();
    
    // Сохраняем статус завершения эпизода
    if (progress.completed !== undefined) {
      episodeSave.completed = progress.completed;
    }
    if (progress.completedAt !== undefined) {
      episodeSave.completedAt = progress.completedAt;
    }

    saves[episodeId] = episodeSave;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    
    return true;
  } catch (error) {
    console.error('Ошибка сохранения прогресса:', error);
    return false;
  }
};

/**
 * Сохраняет детальное состояние игры для эпизода
 */
export const saveGameState = (episodeId, gameState) => {
  try {
    const saves = getEpisodeSaves();
    const episodeSave = saves[episodeId] || {
      currentChapter: 1,
      currentScene: null,
      completedChapters: [],
      progress: {},
      playerChoices: {},
      importantChoices: {}, // Важные выборы
      playerCharacterId: null,
      lastPlayed: null
    };

    // Сохраняем детальное состояние
    episodeSave.currentChapter = gameState.currentChapter || episodeSave.currentChapter;
    episodeSave.currentScene = gameState.currentScene || episodeSave.currentScene;
    episodeSave.playerChoices = gameState.playerChoices || episodeSave.playerChoices;
    episodeSave.importantChoices = gameState.importantChoices || episodeSave.importantChoices;
    episodeSave.progress = { ...episodeSave.progress, ...gameState.progress };
    episodeSave.playerCharacterId = gameState.playerCharacterId || episodeSave.playerCharacterId;
    episodeSave.lastPlayed = new Date().toISOString();

    saves[episodeId] = episodeSave;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    
    return true;
  } catch (error) {
    console.error('Ошибка сохранения состояния игры:', error);
    return false;
  }
};

/**
 * Сохраняет важный выбор
 */
export const saveImportantChoice = (episodeId, choiceId, choiceData) => {
  try {
    const saves = getEpisodeSaves();
    const episodeSave = saves[episodeId] || {
      currentChapter: 1,
      currentScene: null,
      completedChapters: [],
      progress: {},
      playerChoices: {},
      importantChoices: {},
      playerCharacterId: null,
      lastPlayed: null
    };

    // Сохраняем важный выбор с метаданными
    episodeSave.importantChoices[choiceId] = {
      value: choiceData.value,
      timestamp: new Date().toISOString(),
      chapter: episodeSave.currentChapter,
      scene: episodeSave.currentScene,
      description: choiceData.description || '',
      consequences: choiceData.consequences || []
    };

    saves[episodeId] = episodeSave;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    
    return true;
  } catch (error) {
    console.error('Ошибка сохранения важного выбора:', error);
    return false;
  }
};

/**
 * Получает сохранение для конкретного эпизода
 */
export const getEpisodeSave = (episodeId) => {
  const saves = getEpisodeSaves();
  return saves[episodeId] || null;
};

/**
 * Проверяет, есть ли сохранение для эпизода
 */
export const hasEpisodeSave = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save !== null;
};

/**
 * Получает текущую главу эпизода
 */
export const getCurrentChapter = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.currentChapter : 1;
};

/**
 * Получает текущую сцену эпизода
 */
export const getCurrentScene = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.currentScene : null;
};

/**
 * Получает список завершенных глав
 */
export const getCompletedChapters = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.completedChapters : [];
};

/**
 * Получает выборы игрока для эпизода
 */
export const getPlayerChoices = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.playerChoices : {};
};

/**
 * Получает важные выборы для эпизода
 */
export const getImportantChoices = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.importantChoices : {};
};

/**
 * Проверяет, был ли сделан важный выбор
 */
export const hasImportantChoice = (episodeId, choiceId) => {
  const importantChoices = getImportantChoices(episodeId);
  return choiceId in importantChoices;
};

/**
 * Получает значение важного выбора
 */
export const getImportantChoiceValue = (episodeId, choiceId) => {
  const importantChoices = getImportantChoices(episodeId);
  return importantChoices[choiceId]?.value || null;
};

/**
 * Проверяет, завершена ли глава
 */
export const isChapterCompleted = (episodeId, chapterId) => {
  const completedChapters = getCompletedChapters(episodeId);
  return completedChapters.includes(chapterId);
};

/**
 * Получает последнее сохранение для эпизода
 */
export const getLastSave = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  if (!save) return null;
  
  return {
    episodeId,
    currentChapter: save.currentChapter,
    currentScene: save.currentScene,
    completedChapters: save.completedChapters,
    playerChoices: save.playerChoices,
    importantChoices: save.importantChoices,
    progress: save.progress,
    playerCharacterId: save.playerCharacterId,
    lastPlayed: save.lastPlayed,
    completed: save.completed,
    completedAt: save.completedAt
  };
};

/**
 * Проверяет, завершен ли эпизод
 */
export const isEpisodeCompleted = (episodeId) => {
  const save = getEpisodeSave(episodeId);
  return save ? save.completed === true : false;
};

/**
 * Удаляет сохранение эпизода
 */
export const deleteEpisodeSave = (episodeId) => {
  try {
    const saves = getEpisodeSaves();
    delete saves[episodeId];
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    return true;
  } catch (error) {
    console.error('Ошибка удаления сохранения:', error);
    return false;
  }
};

/**
 * Получает статистику по всем сохранениям
 */
export const getSaveStats = () => {
  const saves = getEpisodeSaves();
  const stats = {
    totalEpisodes: Object.keys(saves).length,
    totalCompletedChapters: 0,
    totalImportantChoices: 0,
    totalPlayTime: 0
  };

  Object.values(saves).forEach(save => {
    stats.totalCompletedChapters += save.completedChapters.length;
    stats.totalImportantChoices += Object.keys(save.importantChoices || {}).length;
  });

  return stats;
};

/**
 * Экспортирует все сохранения
 */
export const exportSaves = () => {
  const saves = getEpisodeSaves();
  const dataStr = JSON.stringify(saves, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `episode_saves_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

/**
 * Импортирует сохранения
 */
export const importSaves = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const saves = JSON.parse(e.target.result);
        localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
        resolve(true);
      } catch (error) {
        reject(new Error('Неверный формат файла'));
      }
    };
    
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
};

/**
 * Очищает все сохранения эпизода
 */
export const clearEpisodeSaves = (episodeId = null) => {
  try {
    if (episodeId) {
      // Очищаем сохранение конкретного эпизода
      const saves = getEpisodeSaves();
      delete saves[episodeId];
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
      console.log(`Сохранения эпизода ${episodeId} очищены`);
    } else {
      // Очищаем все сохранения
      localStorage.removeItem(SAVE_KEY);
      console.log('Все сохранения эпизодов очищены');
    }
    return true;
  } catch (error) {
    console.error('Ошибка очистки сохранений:', error);
    return false;
  }
}; 