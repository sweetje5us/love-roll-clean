// Утилиты для работы с эпизодами
import { getEpisodeSave, getCompletedChapters } from './saveUtils';

/**
 * Загружает данные эпизодов
 */
export const loadEpisodesData = async () => {
  try {
    const response = await fetch('/episodes.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных эпизодов:', error);
    return null;
  }
};

/**
 * Фильтрует эпизоды по различным критериям
 */
export const filterEpisodes = (episodes, filters) => {
  let filtered = [...episodes];

  // Фильтр по поиску
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(episode =>
      episode.name.toLowerCase().includes(query) ||
      episode.description.toLowerCase().includes(query) ||
      episode.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Фильтр по типу
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(episode => episode.type === filters.type);
  }

  // Фильтр по возрасту
  if (filters.ageRating && filters.ageRating !== 'all') {
    filtered = filtered.filter(episode => episode.ageRating === filters.ageRating);
  }

  // Фильтр по статусу разблокировки
  if (filters.unlockedOnly) {
    filtered = filtered.filter(episode => episode.unlocked);
  }

  return filtered;
};

/**
 * Сортирует эпизоды
 */
export const sortEpisodes = (episodes, sortBy = 'name', sortOrder = 'asc') => {
  const sorted = [...episodes];

  sorted.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'duration':
        aValue = parseDuration(a.duration);
        bValue = parseDuration(b.duration);
        break;
      case 'difficulty':
        aValue = getDifficultyValue(a.difficulty);
        bValue = getDifficultyValue(b.difficulty);
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

/**
 * Парсит длительность эпизода в минуты
 */
const parseDuration = (duration) => {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
};

/**
 * Получает числовое значение сложности
 */
const getDifficultyValue = (difficulty) => {
  const values = { easy: 1, medium: 2, hard: 3 };
  return values[difficulty] || 1;
};

/**
 * Проверяет, доступен ли эпизод для прохождения
 */
export const isEpisodeAvailable = (episode, userProgress = {}) => {
  if (!episode.unlocked) return false;
  
  // Здесь можно добавить дополнительную логику проверки
  // Например, проверка пройденных предварительных эпизодов
  
  return true;
};



/**
 * Обновляет прогресс эпизода
 */
export const updateEpisodeProgress = (episodeId, progress, userProgress = {}) => {
  return {
    ...userProgress,
    [episodeId]: {
      ...userProgress[episodeId],
      ...progress,
      lastPlayed: new Date().toISOString()
    }
  };
};

// Загрузка конфигурации эпизода из его папки
export const loadEpisodeConfig = async (episodeId) => {
  try {
    console.log(`loadEpisodeConfig: загружаем конфигурацию для эпизода ${episodeId}`);
    const response = await fetch(`/episodes/${episodeId}/config.json`);
    if (!response.ok) {
      throw new Error(`Не удалось загрузить конфигурацию эпизода ${episodeId}`);
    }
    const config = await response.json();
    
    console.log(`loadEpisodeConfig: конфигурация загружена для ${episodeId}:`, {
      id: config.id,
      name: config.name,
      preview: config.preview,
      type: config.type
    });
    
    // Добавляем прогресс из сохранений
    const save = getEpisodeSave(episodeId);
    config.progress = save || {};
    
    return config;
  } catch (error) {
    console.error('Ошибка загрузки конфигурации эпизода:', error);
    return null;
  }
};

// Загрузка всех конфигураций эпизодов
export const loadAllEpisodeConfigs = async () => {
  const episodes = [];
  
  try {
    // Сначала пытаемся загрузить из episodes.json
    const episodesResponse = await fetch('/episodes.json');
    if (episodesResponse.ok) {
      const episodesData = await episodesResponse.json();
      const episodeIds = Object.keys(episodesData.episodes || {});
      
      // Загружаем конфигурации для каждого эпизода
      for (const episodeId of episodeIds) {
        try {
          const config = await loadEpisodeConfig(episodeId);
          if (config) {
            // Объединяем данные из episodes.json с конфигурацией
            const episodeData = episodesData.episodes[episodeId];
            episodes.push({
              ...config,
              ...episodeData
            });
          }
        } catch (error) {
          console.error(`Ошибка загрузки эпизода ${episodeId}:`, error);
        }
      }
    } else {
      // Fallback: используем статический список
      const EPISODE_FOLDERS = ['tutorial', 'mansion'];
      for (const folder of EPISODE_FOLDERS) {
        try {
          const config = await loadEpisodeConfig(folder);
          if (config) {
            episodes.push(config);
          }
        } catch (error) {
          console.error(`Ошибка загрузки эпизода ${folder}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки списка эпизодов:', error);
    // Fallback: используем статический список
    const EPISODE_FOLDERS = ['tutorial', 'mansion'];
  for (const folder of EPISODE_FOLDERS) {
    try {
      const config = await loadEpisodeConfig(folder);
      if (config) {
        episodes.push(config);
      }
    } catch (error) {
      console.error(`Ошибка загрузки эпизода ${folder}:`, error);
      }
    }
  }
  
  return episodes;
};

// Получение превью эпизода
export const getEpisodePreview = (episodeId, previewName) => {
  let finalPath;
  
  // Если previewName уже содержит полный путь, используем его
  if (previewName.startsWith('sprites/')) {
    finalPath = `/${previewName}`;
  } else {
    // Иначе формируем путь относительно папки эпизода
    finalPath = `/episodes/${episodeId}/${previewName}`;
  }
  
  console.log(`getEpisodePreview: episodeId=${episodeId}, previewName=${previewName}, finalPath=${finalPath}`);
  
  return finalPath;
};

// Получение ресурсов эпизода (изображения, аудио и т.д.)
export const getEpisodeResource = (episodeId, resourcePath) => {
  return `/episodes/${episodeId}/${resourcePath}`;
};

// Фильтрация эпизодов по типу
export const filterEpisodesByType = (episodes, type) => {
  if (!type || type === 'all') {
    return episodes;
  }
  return episodes.filter(episode => episode.type === type);
};

// Фильтрация эпизодов по сложности
export const filterEpisodesByDifficulty = (episodes, difficulty) => {
  if (!difficulty || difficulty === 'all') {
    return episodes;
  }
  return episodes.filter(episode => episode.difficulty === difficulty);
};

// Поиск эпизодов по названию и описанию
export const searchEpisodes = (episodes, searchQuery) => {
  if (!searchQuery.trim()) {
    return episodes;
  }
  
  const query = searchQuery.toLowerCase();
  return episodes.filter(episode => 
    episode.name.toLowerCase().includes(query) ||
    episode.description.toLowerCase().includes(query) ||
    episode.tags.some(tag => tag.toLowerCase().includes(query))
  );
};

// Получение статистики эпизода
export const getEpisodeStats = (episode) => {
  const progress = episode.progress || {};
  const totalChapters = episode.chapters.length;
  const completedChapters = episode.chapters.filter(chapter => 
    progress[chapter.id]?.completed
  ).length;
  
  return {
    totalChapters,
    completedChapters,
    progressPercentage: totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0,
    isCompleted: completedChapters === totalChapters && totalChapters > 0
  };
};

// Получение следующей доступной главы
export const getNextAvailableChapter = (episode) => {
  const progress = episode.progress || {};
  
  for (const chapter of episode.chapters) {
    if (!progress[chapter.id]?.completed) {
      return chapter;
    }
  }
  
  return null; // Все главы завершены
};

// Проверка доступности эпизода
export const isEpisodeUnlocked = (episode) => {
  return episode.unlocked === true;
};

// Получение цвета для типа эпизода
export const getEpisodeTypeColor = (type) => {
  const colors = {
    tutorial: '#10b981',
    romance: '#ec4899',
    mystery: '#8b5cf6',
    detective: '#8b5cf6',
    adventure: '#f59e0b',
    drama: '#ef4444'
  };
  return colors[type] || '#6b7280';
};

// Получение цвета для сложности
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444'
  };
  return colors[difficulty] || '#6b7280';
};

// Получение иконки для типа эпизода
export const getEpisodeTypeIcon = (type) => {
  const icons = {
    tutorial: '📚',
    romance: '💕',
    mystery: '🔍',
    detective: '🔍',
    adventure: '🗺️',
    drama: '🎭'
  };
  return icons[type] || '📖';
};

// Получение иконки для сложности
export const getDifficultyIcon = (difficulty) => {
  const icons = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐'
  };
  return icons[difficulty] || '⭐';
}; 