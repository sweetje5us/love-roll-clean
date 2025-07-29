// Список известных эпизодов
// Этот файл можно обновлять при добавлении новых эпизодов
export const KNOWN_EPISODES = [
  'mansion',
  'tutorial'
];;;;;;;;;;;;

// Функция для проверки существования эпизода
export const checkEpisodeExists = async (episodeId) => {
  try {
    const response = await fetch(`/episodes/${episodeId}/config.json?t=${Date.now()}`, {
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Функция для получения списка существующих эпизодов
export const getExistingEpisodes = async () => {
  const existingEpisodes = [];
  
  for (const episodeId of KNOWN_EPISODES) {
    const exists = await checkEpisodeExists(episodeId);
    if (exists) {
      existingEpisodes.push(episodeId);
    }
  }
  
  return existingEpisodes;
};

// Функция для добавления нового эпизода в список
export const addEpisodeToList = (episodeId) => {
  if (!KNOWN_EPISODES.includes(episodeId)) {
    KNOWN_EPISODES.push(episodeId);
    console.log(`Эпизод ${episodeId} добавлен в список`);
  }
}; 