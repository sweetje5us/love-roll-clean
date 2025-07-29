const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  }
});

// Путь к папке с эпизодами основной игры
const EPISODES_PATH = path.join(__dirname, '..', '..', 'public', 'episodes');

// API для работы с эпизодами
app.get('/api/episodes', async (req, res) => {
  try {
    const episodes = [];
    const episodeFolders = await fs.readdir(EPISODES_PATH);
    
    for (const folder of episodeFolders) {
      const configPath = path.join(EPISODES_PATH, folder, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        // Убеждаемся, что у всех эпизодов есть массив chapters
        config.chapters = config.chapters || [];
        episodes.push(config);
      }
    }
    
    res.json(episodes);
  } catch (error) {
    console.error('Ошибка загрузки эпизодов:', error);
    res.status(500).json({ error: 'Ошибка загрузки эпизодов' });
  }
});

// Новый API endpoint для динамической загрузки эпизодов в формате episodes.json
app.get('/api/episodes/dynamic', async (req, res) => {
  try {
    const episodes = {};
    const types = {};
    const ageRatings = {};
    
    const episodeFolders = await fs.readdir(EPISODES_PATH);
    
    for (const folder of episodeFolders) {
      const configPath = path.join(EPISODES_PATH, folder, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        
        // Убеждаемся, что у всех эпизодов есть массив chapters
        config.chapters = config.chapters || [];
        
        // Добавляем эпизод в объект episodes
        episodes[config.id] = config;
        
        // Собираем типы эпизодов
        const type = config.type || 'story';
        if (!types[type]) {
          types[type] = {
            name: getTypeName(type),
            color: getTypeColor(type),
            icon: getTypeIcon(type)
          };
        }
        
        // Собираем возрастные рейтинги
        const ageRating = config.ageRating || '0+';
        if (!ageRatings[ageRating]) {
          ageRatings[ageRating] = {
            name: ageRating,
            color: getAgeRatingColor(ageRating),
            description: getAgeRatingDescription(ageRating)
          };
        }
      }
    }
    
    const episodesData = {
      episodes,
      types,
      ageRatings
    };
    
    res.json(episodesData);
  } catch (error) {
    console.error('Ошибка генерации episodes.json:', error);
    res.status(500).json({ error: 'Ошибка генерации episodes.json' });
  }
});

// Вспомогательные функции для типов и рейтингов
function getTypeName(type) {
  const typeNames = {
    tutorial: 'Обучение',
    detective: 'Детектив',
    romance: 'Романтика',
    mystery: 'Мистика',
    adventure: 'Приключения',
    story: 'История'
  };
  return typeNames[type] || type;
}

function getTypeColor(type) {
  const typeColors = {
    tutorial: '#4ade80',
    detective: '#8b5cf6',
    romance: '#ec4899',
    mystery: '#7c3aed',
    adventure: '#f59e0b',
    story: '#3b82f6'
  };
  return typeColors[type] || '#6b7280';
}

function getTypeIcon(type) {
  const typeIcons = {
    tutorial: 'fas fa-graduation-cap',
    detective: 'fas fa-search',
    romance: 'fas fa-heart',
    mystery: 'fas fa-ghost',
    adventure: 'fas fa-compass',
    story: 'fas fa-book'
  };
  return typeIcons[type] || 'fas fa-file-alt';
}

function getAgeRatingColor(rating) {
  const ratingColors = {
    '0+': '#22c55e',
    '6+': '#16a34a',
    '12+': '#f59e0b',
    '16+': '#ef4444',
    '18+': '#dc2626'
  };
  return ratingColors[rating] || '#22c55e';
}

function getAgeRatingDescription(rating) {
  const ratingDescriptions = {
    '0+': 'Для всех возрастов',
    '6+': 'Для детей от 6 лет',
    '12+': 'Для подростков от 12 лет',
    '16+': 'Для подростков от 16 лет',
    '18+': 'Только для взрослых'
  };
  return ratingDescriptions[rating] || 'Для всех возрастов';
}

// Создание нового эпизода
app.post('/api/episodes', async (req, res) => {
  try {
    const episodeData = req.body;
    
    // Проверяем, что ID предоставлен
    if (!episodeData.id) {
      return res.status(400).json({ error: 'ID эпизода обязателен' });
    }
    
    const episodeId = episodeData.id;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    // Проверяем, что папка с таким ID не существует
    if (await fs.pathExists(episodePath)) {
      return res.status(400).json({ error: 'Эпизод с таким ID уже существует' });
    }
    
    // Создаем папку эпизода
    await fs.ensureDir(episodePath);
    
    // Создаем папки для глав и сцен
    await fs.ensureDir(path.join(episodePath, 'chapters'));
    await fs.ensureDir(path.join(episodePath, 'scenes'));
    
    // Если есть превью, копируем его из временной папки
    if (episodeData.preview && episodeData.preview.startsWith('temp_')) {
      const tempEpisodePath = path.join(EPISODES_PATH, episodeData.preview);
      const tempPreviewPath = path.join(tempEpisodePath, 'preview.png');
      const finalPreviewPath = path.join(episodePath, 'preview.png');
      
      if (await fs.pathExists(tempPreviewPath)) {
        await fs.copy(tempPreviewPath, finalPreviewPath);
        // Удаляем временную папку
        await fs.remove(tempEpisodePath);
      }
    }
    
    // Определяем финальное имя превью
    const finalPreview = episodeData.preview && episodeData.preview.startsWith('temp_') ? 'preview.png' : (episodeData.preview || '');
    
    // Создаем config.json с полными данными
    const config = {
      id: episodeId,
      name: episodeData.name,
      description: episodeData.description,
      longDescription: episodeData.longDescription || episodeData.description,
      type: episodeData.type,
      ageRating: episodeData.ageRating || '0+',
      duration: episodeData.duration,
      difficulty: episodeData.difficulty,
      preview: finalPreview,
      unlocked: true,
      completed: false,
      tags: episodeData.tags || [],
      characters: episodeData.characters || [],
      chapters: []
    };
    
    await fs.writeJson(path.join(episodePath, 'config.json'), config, { spaces: 2 });
    
    // Автоматически добавляем эпизод в список KNOWN_EPISODES
    try {
      const episodeListPath = path.join(__dirname, '..', '..', 'src', 'utils', 'episodeList.js');
      
      // Читаем текущий файл
      let content = await fs.readFile(episodeListPath, 'utf8');
      
      // Находим массив KNOWN_EPISODES
      const regex = /KNOWN_EPISODES\s*=\s*\[([\s\S]*?)\]/;
      const match = content.match(regex);
      
      if (match) {
        const currentEpisodes = match[1]
          .split(',')
          .map(ep => ep.trim().replace(/['"]/g, ''))
          .filter(ep => ep.length > 0);
        
        // Проверяем, есть ли уже такой эпизод
        if (!currentEpisodes.includes(episodeId)) {
          // Добавляем новый эпизод
          currentEpisodes.push(episodeId);
          
          // Формируем новый массив
          const newEpisodesArray = `KNOWN_EPISODES = [\n  '${currentEpisodes.join("',\n  '")}'\n];`;
          
          // Заменяем старый массив новым
          const newContent = content.replace(regex, newEpisodesArray);
          
          // Записываем обновленный файл
          await fs.writeFile(episodeListPath, newContent, 'utf8');
          
          console.log(`✅ Эпизод ${episodeId} автоматически добавлен в список KNOWN_EPISODES`);
        }
      }
    } catch (addToListError) {
      console.warn('Ошибка при автоматическом добавлении эпизода в список:', addToListError);
    }
    
    res.json(config);
  } catch (error) {
    console.error('Ошибка создания эпизода:', error);
    res.status(500).json({ error: 'Ошибка создания эпизода' });
  }
});



// Обновление эпизода
app.put('/api/episodes/:id', async (req, res) => {
  try {
    const episodeId = req.params.id;
    const episodeData = req.body;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    // Обновляем config.json
    const configPath = path.join(episodePath, 'config.json');
    const config = await fs.readJson(configPath);
    const updatedConfig = { ...config, ...episodeData };
    
    await fs.writeJson(configPath, updatedConfig, { spaces: 2 });
    
    res.json(updatedConfig);
  } catch (error) {
    console.error('Ошибка обновления эпизода:', error);
    res.status(500).json({ error: 'Ошибка обновления эпизода' });
  }
});

// Удаление эпизода
app.delete('/api/episodes/:id', async (req, res) => {
  try {
    const episodeId = req.params.id;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    // Удаляем папку эпизода
    await fs.remove(episodePath);
    
    // Удаляем эпизод из списка KNOWN_EPISODES
    try {
      const episodeListPath = path.join(__dirname, '..', '..', 'src', 'utils', 'episodeList.js');
      
      // Читаем текущий файл
      let content = await fs.readFile(episodeListPath, 'utf8');
      
      // Находим массив KNOWN_EPISODES
      const regex = /KNOWN_EPISODES\s*=\s*\[([\s\S]*?)\]/;
      const match = content.match(regex);
      
      if (match) {
        const currentEpisodes = match[1]
          .split(',')
          .map(ep => ep.trim().replace(/['"]/g, ''))
          .filter(ep => ep.length > 0 && ep !== episodeId);
        
        // Формируем новый массив без удаленного эпизода
        const newEpisodesArray = `KNOWN_EPISODES = [\n  '${currentEpisodes.join("',\n  '")}'\n];`;
        
        // Заменяем старый массив новым
        const newContent = content.replace(regex, newEpisodesArray);
        
        // Записываем обновленный файл
        await fs.writeFile(episodeListPath, newContent, 'utf8');
        
        console.log(`✅ Эпизод ${episodeId} удален из списка KNOWN_EPISODES`);
      }
    } catch (removeFromListError) {
      console.warn('Ошибка при удалении эпизода из списка:', removeFromListError);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления эпизода:', error);
    res.status(500).json({ error: 'Ошибка удаления эпизода' });
  }
});

// API для работы с главами
app.get('/api/episodes/:episodeId/chapters', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const configPath = path.join(episodePath, 'config.json');
    const config = await fs.readJson(configPath);
    
    res.json(config.chapters || []);
  } catch (error) {
    console.error('Ошибка загрузки глав:', error);
    res.status(500).json({ error: 'Ошибка загрузки глав' });
  }
});

// Создание главы
app.post('/api/episodes/:episodeId/chapters', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const chapterData = req.body;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    // Проверяем, что ID предоставлен
    if (!chapterData.id) {
      return res.status(400).json({ error: 'ID главы обязателен' });
    }
    
    const chapterId = chapterData.id;
    
    // Всегда используем формат chapter[id] для совместимости с игровой системой
    let chapterFolderName = chapterId;
    
    // Если ID уже содержит "chapter", используем как есть
    if (!chapterId.startsWith('chapter')) {
      chapterFolderName = `chapter${chapterId}`;
    }
    
    // Убеждаемся, что ID главы установлен
    if (!chapterData.id || chapterData.id.trim() === '') {
      chapterData.id = chapterId;
    }
    
    const chapterPath = path.join(episodePath, 'chapters', chapterFolderName);
    
    // Проверяем, что папка с таким ID не существует
    if (await fs.pathExists(chapterPath)) {
      return res.status(400).json({ error: 'Глава с таким ID уже существует' });
    }
    
    // Создаем папку главы
    await fs.ensureDir(chapterPath);
    
    // Создаем config.json для главы
    const chapterConfig = {
      id: chapterData.id, // Используем обновленный ID
      name: chapterData.name,
      description: chapterData.description,
      duration: chapterData.duration,
      scenes: []
    };
    
    await fs.writeJson(path.join(chapterPath, 'config.json'), chapterConfig, { spaces: 2 });
    
    // Обновляем config.json эпизода
    const configPath = path.join(episodePath, 'config.json');
    const config = await fs.readJson(configPath);
    config.chapters = config.chapters || [];
    config.chapters.push(chapterConfig);
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      if (episodesData.episodes && episodesData.episodes[episodeId]) {
        episodesData.episodes[episodeId].chapters = config.chapters;
        await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
      }
    }
    
    res.json(chapterConfig);
  } catch (error) {
    console.error('Ошибка создания главы:', error);
    res.status(500).json({ error: 'Ошибка создания главы' });
  }
});

// Обновление главы
app.put('/api/episodes/:episodeId/chapters/:chapterId', async (req, res) => {
  try {
    const { episodeId, chapterId } = req.params;
    const chapterData = req.body;
    
    const episodePath = path.join(EPISODES_PATH, episodeId);
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    // Обновляем config.json эпизода
    const configPath = path.join(episodePath, 'config.json');
    const config = await fs.readJson(configPath);
    config.chapters = config.chapters || [];
    
    const chapterIndex = config.chapters.findIndex(ch => ch.id.toString() === chapterId || ch.id === chapterId);
    if (chapterIndex === -1) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    // Обновляем данные главы
    const updatedChapter = {
      ...config.chapters[chapterIndex],
      ...chapterData,
      id: chapterId // Сохраняем оригинальный ID
    };
    
    config.chapters[chapterIndex] = updatedChapter;
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      if (episodesData.episodes && episodesData.episodes[episodeId]) {
        episodesData.episodes[episodeId].chapters = config.chapters;
        await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
      }
    }
    
    // Также обновляем config.json главы, если он существует
    let chapterFolderName = chapterId;
    if (!chapterId.startsWith('chapter')) {
      chapterFolderName = `chapter${chapterId}`;
    }
    
    const chapterPath = path.join(episodePath, 'chapters', chapterFolderName);
    const chapterConfigPath = path.join(chapterPath, 'config.json');
    
    if (await fs.pathExists(chapterConfigPath)) {
      const chapterConfig = await fs.readJson(chapterConfigPath);
      const updatedChapterConfig = {
        ...chapterConfig,
        ...chapterData,
        id: chapterId
      };
      await fs.writeJson(chapterConfigPath, updatedChapterConfig, { spaces: 2 });
    }
    
    res.json(updatedChapter);
  } catch (error) {
    console.error('Ошибка обновления главы:', error);
    res.status(500).json({ error: 'Ошибка обновления главы' });
  }
});

// Удаление главы
app.delete('/api/episodes/:episodeId/chapters/:chapterId', async (req, res) => {
  try {
    const { episodeId, chapterId } = req.params;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    // Определяем правильный путь к главе
    let chapterFolderName = chapterId;
    if (!chapterId.startsWith('chapter')) {
      chapterFolderName = `chapter${chapterId}`;
    }
    
    const chapterPath = path.join(episodePath, 'chapters', chapterFolderName);
    
    if (!await fs.pathExists(episodePath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    if (!await fs.pathExists(chapterPath)) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    // Удаляем папку главы
    await fs.remove(chapterPath);
    
    // Обновляем config.json эпизода
    const configPath = path.join(episodePath, 'config.json');
    const config = await fs.readJson(configPath);
    config.chapters = config.chapters || [];
    config.chapters = config.chapters.filter(ch => ch.id !== chapterId);
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      if (episodesData.episodes && episodesData.episodes[episodeId]) {
        episodesData.episodes[episodeId].chapters = config.chapters;
        await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления главы:', error);
    res.status(500).json({ error: 'Ошибка удаления главы' });
  }
});

// Удаляем дублирующий endpoint - он уже есть ниже

// Загрузка квестовых предметов (шаблонов из items.json)
app.get('/api/quest-items', async (req, res) => {
  try {
    const itemsPath = path.join(__dirname, '..', 'client', 'public', 'items.json');
    
    if (await fs.pathExists(itemsPath)) {
      const itemsData = await fs.readJson(itemsPath);
      const questItems = itemsData.items?.quest || {};
      
      // Преобразуем в массив с id
      const questItemsArray = Object.keys(questItems).map(itemId => ({
        id: itemId,
        ...questItems[itemId]
      }));
      
      res.json(questItemsArray);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка загрузки квестовых предметов:', error);
    res.status(500).json({ error: 'Ошибка загрузки квестовых предметов' });
  }
});

// Загрузка квестовых предметов эпизода
app.get('/api/episodes/:episodeId/quest-items', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const questItemsPath = path.join(EPISODES_PATH, episodeId, 'quest-items.json');
    
    if (await fs.pathExists(questItemsPath)) {
      const questItems = await fs.readJson(questItemsPath);
      res.json(questItems);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка загрузки квестовых предметов эпизода:', error);
    res.status(500).json({ error: 'Ошибка загрузки квестовых предметов эпизода' });
  }
});

// API для работы со сценами
app.get('/api/episodes/:episodeId/chapters/:chapterId/scenes', async (req, res) => {
  try {
    const { episodeId, chapterId } = req.params;
    
    // Определяем правильный путь к главе
    let chapterPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId);
    
    // Всегда используем формат chapter[id] для совместимости с игровой системой
    if (!chapterId.startsWith('chapter')) {
      chapterPath = path.join(EPISODES_PATH, episodeId, 'chapters', `chapter${chapterId}`);
    }
    
    // Если и этот путь не найден, попробуем найти папку главы по ID
    if (!await fs.pathExists(chapterPath)) {
      const chaptersDir = path.join(EPISODES_PATH, episodeId, 'chapters');
      if (await fs.pathExists(chaptersDir)) {
        const chapterDirs = await fs.readdir(chaptersDir);
        const chapterDir = chapterDirs.find(dir => dir.includes(chapterId));
        if (chapterDir) {
          chapterPath = path.join(chaptersDir, chapterDir);
          console.log(`Найдена папка главы: ${chapterPath}`);
        }
      }
    }
    
    let sceneIds = [];
    
    console.log(`Загрузка сцен для эпизода ${episodeId}, главы ${chapterId}`);
    console.log(`Путь к главе: ${chapterPath}`);
    console.log(`Папка главы существует: ${await fs.pathExists(chapterPath)}`);
    
    // Всегда сначала пытаемся прочитать из config.json главы
    const configPath = path.join(chapterPath, 'config.json');
    console.log(`Пытаемся прочитать config.json главы: ${configPath}`);
    console.log(`Файл существует: ${await fs.pathExists(configPath)}`);
    
    if (await fs.pathExists(configPath)) {
      try {
        const config = await fs.readJson(configPath);
        sceneIds = config.scenes || [];
        console.log(`Найдено сцен в config.json главы: ${sceneIds.length}`);
        console.log(`Первые 10 сцен:`, sceneIds.slice(0, 10));
        console.log(`Содержимое config.json главы:`, JSON.stringify(config, null, 2));
      } catch (configError) {
        console.error(`Ошибка чтения config.json главы:`, configError);
        // Если не удалось прочитать config.json главы, читаем из config.json эпизода
        const episodeConfigPath = path.join(EPISODES_PATH, episodeId, 'config.json');
        console.log(`Читаем config.json эпизода: ${episodeConfigPath}`);
        if (await fs.pathExists(episodeConfigPath)) {
          const episodeConfig = await fs.readJson(episodeConfigPath);
          const chapter = episodeConfig.chapters?.find(ch => ch.id.toString() === chapterId || ch.id === chapterId);
          if (chapter) {
            sceneIds = chapter.scenes || [];
            console.log(`Найдено сцен в config.json эпизода: ${sceneIds.length}`);
            console.log(`Первые 10 сцен:`, sceneIds.slice(0, 10));
          } else {
            console.log(`Глава ${chapterId} не найдена в config.json эпизода`);
          }
        }
      }
    }
    
    // Если config.json главы не найден, читаем из config.json эпизода
    if (sceneIds.length === 0) {
      console.log(`config.json главы не найден, читаем из config.json эпизода`);
      const episodeConfigPath = path.join(EPISODES_PATH, episodeId, 'config.json');
      console.log(`Читаем config.json эпизода: ${episodeConfigPath}`);
      if (await fs.pathExists(episodeConfigPath)) {
        const episodeConfig = await fs.readJson(episodeConfigPath);
        const chapter = episodeConfig.chapters?.find(ch => ch.id.toString() === chapterId || ch.id === chapterId);
        if (chapter) {
          sceneIds = chapter.scenes || [];
          console.log(`Найдено сцен в config.json эпизода: ${sceneIds.length}`);
          console.log(`Первые 10 сцен:`, sceneIds.slice(0, 10));
        } else {
          console.log(`Глава ${chapterId} не найдена в config.json эпизода`);
        }
      }
    }
    
    // Загружаем данные каждой сцены, проверяя существование файла
    const scenes = [];
    console.log(`Начинаем загрузку ${sceneIds.length} сцен...`);
    for (const sceneId of sceneIds) {
      const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
      console.log(`Проверяем сцену: ${sceneId} -> ${scenePath}`);
      if (await fs.pathExists(scenePath)) {
        try {
          const sceneData = await fs.readJson(scenePath);
          scenes.push(sceneData);
          console.log(`✓ Загружена сцена: ${sceneId}`);
        } catch (sceneError) {
          console.warn(`✗ Ошибка чтения сцены ${sceneId}:`, sceneError);
          // Добавляем базовую информацию о сцене, даже если файл поврежден
          scenes.push({
            id: sceneId,
            name: sceneId,
            description: 'Сцена недоступна',
            background: '',
            characters: [],
            dialogue: [],
            choices: []
          });
        }
      } else {
        console.warn(`✗ Файл сцены не найден: ${scenePath}`);
      }
    }
    // Если сцен не найдено, НЕ загружаем все сцены из папки scenes, а просто возвращаем пустой массив
    // (Раньше здесь был блок, который подгружал все сцены эпизода, теперь он удалён)
    res.json(scenes);
  } catch (error) {
    console.error('Ошибка загрузки сцен:', error);
    res.status(500).json({ error: 'Ошибка загрузки сцен' });
  }
});

// Создание сцены
app.post('/api/episodes/:episodeId/chapters/:chapterId/scenes', async (req, res) => {
  try {
    const { episodeId, chapterId } = req.params;
    const sceneData = req.body;
    
    console.log(`Создание сцены для эпизода ${episodeId}, главы ${chapterId}`);
    console.log('Данные сцены:', JSON.stringify(sceneData, null, 2));
    
    // Проверяем, что ID предоставлен
    if (!sceneData.id) {
      return res.status(400).json({ error: 'ID сцены обязателен' });
    }
    
    const sceneId = sceneData.id;
    const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
    
    // Проверяем, что файл с таким ID не существует
    if (await fs.pathExists(scenePath)) {
      return res.status(400).json({ error: 'Сцена с таким ID уже существует' });
    }
    
    // Сохраняем сцену
    const scene = {
      id: sceneId,
      chapterId: chapterId,
      ...sceneData
    };
    
    await fs.writeJson(scenePath, scene, { spaces: 2 });
    console.log(`Сцена сохранена: ${scenePath}`);
    
    // Определяем правильный путь к конфигурации главы
    let chapterConfigPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId, 'config.json');
    console.log(`Проверяем config.json главы: ${chapterConfigPath}`);
    console.log(`Файл существует: ${await fs.pathExists(chapterConfigPath)}`);
    
    // Всегда используем формат chapter[id] для совместимости с игровой системой
    if (!chapterId.startsWith('chapter')) {
      chapterConfigPath = path.join(EPISODES_PATH, episodeId, 'chapters', `chapter${chapterId}`, 'config.json');
      console.log(`Попробуем путь с префиксом chapter: ${chapterConfigPath}`);
      console.log(`Файл существует: ${await fs.pathExists(chapterConfigPath)}`);
    }
    
    if (await fs.pathExists(chapterConfigPath)) {
      // Для новых глав - обновляем config.json главы
      const chapterConfig = await fs.readJson(chapterConfigPath);
      chapterConfig.scenes = chapterConfig.scenes || [];
      if (!chapterConfig.scenes.includes(sceneId)) {
        chapterConfig.scenes.push(sceneId);
        await fs.writeJson(chapterConfigPath, chapterConfig, { spaces: 2 });
        console.log(`Сцена добавлена в config.json главы: ${sceneId}`);
      }
    }
    
    // Также обновляем config.json эпизода для совместимости
    const episodeConfigPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    console.log(`Обновляем config.json эпизода: ${episodeConfigPath}`);
    if (await fs.pathExists(episodeConfigPath)) {
      const episodeConfig = await fs.readJson(episodeConfigPath);
      const chapterIndex = episodeConfig.chapters?.findIndex(ch => 
        ch.id.toString() === chapterId || ch.id === chapterId
      );
      
      console.log(`Индекс главы в config.json эпизода: ${chapterIndex}`);
      
      if (chapterIndex !== -1 && chapterIndex !== undefined) {
        episodeConfig.chapters[chapterIndex].scenes = episodeConfig.chapters[chapterIndex].scenes || [];
        if (!episodeConfig.chapters[chapterIndex].scenes.includes(sceneId)) {
          episodeConfig.chapters[chapterIndex].scenes.push(sceneId);
          await fs.writeJson(episodeConfigPath, episodeConfig, { spaces: 2 });
          console.log(`Сцена добавлена в config.json эпизода: ${sceneId}`);
        }
      }
    }
    
    res.json(scene);
  } catch (error) {
    console.error('Ошибка создания сцены:', error);
    res.status(500).json({ error: 'Ошибка создания сцены' });
  }
});

// Обновление сцены
app.put('/api/episodes/:episodeId/scenes/:sceneId', async (req, res) => {
  try {
    const { episodeId, sceneId } = req.params;
    const sceneData = req.body;
    
    const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
    
    if (!await fs.pathExists(scenePath)) {
      return res.status(404).json({ error: 'Сцена не найдена' });
    }
    
    const updatedScene = { ...sceneData, id: sceneId };
    await fs.writeJson(scenePath, updatedScene, { spaces: 2 });
    
    res.json(updatedScene);
  } catch (error) {
    console.error('Ошибка обновления сцены:', error);
    res.status(500).json({ error: 'Ошибка обновления сцены' });
  }
});

// Удаление сцены
app.delete('/api/episodes/:episodeId/scenes/:sceneId', async (req, res) => {
  try {
    const { episodeId, sceneId } = req.params;
    const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
    
    if (!await fs.pathExists(scenePath)) {
      return res.status(404).json({ error: 'Сцена не найдена' });
    }
    
    // Удаляем файл сцены
    await fs.remove(scenePath);
    
    // Удаляем из всех глав (новых и существующих)
    const chaptersPath = path.join(EPISODES_PATH, episodeId, 'chapters');
    if (await fs.pathExists(chaptersPath)) {
      const chapterFolders = await fs.readdir(chaptersPath);
      
      for (const chapterFolder of chapterFolders) {
        const chapterConfigPath = path.join(chaptersPath, chapterFolder, 'config.json');
        if (await fs.pathExists(chapterConfigPath)) {
          const chapterConfig = await fs.readJson(chapterConfigPath);
          if (chapterConfig.scenes) {
            chapterConfig.scenes = chapterConfig.scenes.filter(id => id !== sceneId);
            await fs.writeJson(chapterConfigPath, chapterConfig, { spaces: 2 });
          }
        }
      }
    }
    
    // Также удаляем из config.json эпизода (для существующих глав)
    const episodeConfigPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    if (await fs.pathExists(episodeConfigPath)) {
      const episodeConfig = await fs.readJson(episodeConfigPath);
      if (episodeConfig.chapters) {
        let updated = false;
        for (const chapter of episodeConfig.chapters) {
          if (chapter.scenes && chapter.scenes.includes(sceneId)) {
            chapter.scenes = chapter.scenes.filter(id => id !== sceneId);
            updated = true;
          }
        }
        if (updated) {
          await fs.writeJson(episodeConfigPath, episodeConfig, { spaces: 2 });
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления сцены:', error);
    res.status(500).json({ error: 'Ошибка удаления сцены' });
  }
});

// Загрузка превью изображения
app.post('/api/episodes/upload-preview', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const episodeId = req.body.episodeId || 'temp';
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
    // Создаем папку эпизода, если её нет
    await fs.ensureDir(episodePath);
    
    // Сохраняем как preview.png
    const filename = 'preview.png';
    const filePath = path.join(episodePath, filename);
    
    // Конвертируем изображение в PNG и сохраняем
    await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(filePath);
    
    res.json({ 
      success: true, 
      filename: filename,
      path: `/episodes/${episodeId}/${filename}`
    });
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    res.status(500).json({ error: 'Ошибка загрузки изображения' });
  }
});

// API для работы с персонажами
app.get('/api/episodes/:episodeId/characters', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    console.log(`Запрос персонажей для эпизода: ${episodeId}`);
    
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    console.log(`Путь к config.json: ${configPath}`);
    
    if (!await fs.pathExists(configPath)) {
      console.log(`Файл config.json не найден для эпизода ${episodeId}`);
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    const characters = config.characters || [];
    console.log(`Найдено персонажей: ${characters.length}`);
    
    // Добавляем игрока в начало списка
    const charactersWithPlayer = [
      { id: 'player', name: 'Игрок', role: 'Главный герой' },
      ...characters
    ];
    
    res.json(charactersWithPlayer);
  } catch (error) {
    console.error('Ошибка загрузки персонажей:', error);
    res.status(500).json({ error: 'Ошибка загрузки персонажей' });
  }
});

// Создание персонажа
app.post('/api/episodes/:episodeId/characters', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const characterData = req.body;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.characters = config.characters || [];
    
    // Проверяем, что ID уникален
    if (config.characters.find(char => char.id === characterData.id)) {
      return res.status(400).json({ error: 'Персонаж с таким ID уже существует' });
    }
    
    config.characters.push(characterData);
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json(characterData);
  } catch (error) {
    console.error('Ошибка создания персонажа:', error);
    res.status(500).json({ error: 'Ошибка создания персонажа' });
  }
});

// Обновление персонажа
app.put('/api/episodes/:episodeId/characters/:characterId', async (req, res) => {
  try {
    const { episodeId, characterId } = req.params;
    const characterData = req.body;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.characters = config.characters || [];
    
    const characterIndex = config.characters.findIndex(char => char.id === characterId);
    if (characterIndex === -1) {
      return res.status(404).json({ error: 'Персонаж не найден' });
    }
    
    config.characters[characterIndex] = { ...characterData, id: characterId };
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json(config.characters[characterIndex]);
  } catch (error) {
    console.error('Ошибка обновления персонажа:', error);
    res.status(500).json({ error: 'Ошибка обновления персонажа' });
  }
});

// Удаление персонажа
app.delete('/api/episodes/:episodeId/characters/:characterId', async (req, res) => {
  try {
    const { episodeId, characterId } = req.params;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.characters = config.characters || [];
    
    const characterIndex = config.characters.findIndex(char => char.id === characterId);
    if (characterIndex === -1) {
      return res.status(404).json({ error: 'Персонаж не найден' });
    }
    
    config.characters.splice(characterIndex, 1);
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления персонажа:', error);
    res.status(500).json({ error: 'Ошибка удаления персонажа' });
  }
});



// Получение конкретного квестового предмета по ID
app.get('/api/quest-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const itemsPath = path.join(__dirname, '..', 'client', 'public', 'items.json');
    
    if (!await fs.pathExists(itemsPath)) {
      return res.status(404).json({ error: 'Файл items.json не найден' });
    }
    
    const itemsData = await fs.readJson(itemsPath);
    const questItem = itemsData.items?.quest?.[itemId];
    
    if (!questItem) {
      return res.status(404).json({ error: 'Квестовый предмет не найден' });
    }
    
    res.json({
      id: itemId,
      ...questItem
    });
  } catch (error) {
    console.error('Ошибка загрузки квестового предмета:', error);
    res.status(500).json({ error: 'Ошибка загрузки квестового предмета' });
  }
});

// API для работы с кастомными квестовыми предметами эпизода
app.get('/api/episodes/:episodeId/quest-items', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    const questItems = config.questItems || [];
    
    res.json(questItems);
  } catch (error) {
    console.error('Ошибка загрузки квестовых предметов эпизода:', error);
    res.status(500).json({ error: 'Ошибка загрузки квестовых предметов эпизода' });
  }
});

// Создание кастомного квестового предмета для эпизода
app.post('/api/episodes/:episodeId/quest-items', async (req, res) => {
  try {
    const episodeId = req.params.episodeId;
    const questItemData = req.body;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.questItems = config.questItems || [];
    
    // Проверяем, что ID уникален
    if (config.questItems.find(item => item.id === questItemData.id)) {
      return res.status(400).json({ error: 'Квестовый предмет с таким ID уже существует' });
    }
    
    // Добавляем тип quest если не указан
    const newQuestItem = {
      ...questItemData,
      type: 'quest'
    };
    
    config.questItems.push(newQuestItem);
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json(newQuestItem);
  } catch (error) {
    console.error('Ошибка создания квестового предмета:', error);
    res.status(500).json({ error: 'Ошибка создания квестового предмета' });
  }
});

// Обновление кастомного квестового предмета
app.put('/api/episodes/:episodeId/quest-items/:itemId', async (req, res) => {
  try {
    const { episodeId, itemId } = req.params;
    const questItemData = req.body;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.questItems = config.questItems || [];
    
    const itemIndex = config.questItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Квестовый предмет не найден' });
    }
    
    config.questItems[itemIndex] = { ...questItemData, id: itemId, type: 'quest' };
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json(config.questItems[itemIndex]);
  } catch (error) {
    console.error('Ошибка обновления квестового предмета:', error);
    res.status(500).json({ error: 'Ошибка обновления квестового предмета' });
  }
});

// Удаление кастомного квестового предмета
app.delete('/api/episodes/:episodeId/quest-items/:itemId', async (req, res) => {
  try {
    const { episodeId, itemId } = req.params;
    const configPath = path.join(EPISODES_PATH, episodeId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      return res.status(404).json({ error: 'Эпизод не найден' });
    }
    
    const config = await fs.readJson(configPath);
    config.questItems = config.questItems || [];
    
    const itemIndex = config.questItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Квестовый предмет не найден' });
    }
    
    config.questItems.splice(itemIndex, 1);
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления квестового предмета:', error);
    res.status(500).json({ error: 'Ошибка удаления квестового предмета' });
  }
});

// API для получения списка всех доступных фонов
app.get('/api/backgrounds', async (req, res) => {
  try {
    const backgroundsPath = path.join(__dirname, '..', '..', 'public', 'sprites', 'episodes');
    const backgrounds = await getAllBackgrounds(backgroundsPath);
    res.json(backgrounds);
  } catch (error) {
    console.error('Ошибка при получении списка фонов:', error);
    res.status(500).json({ error: 'Ошибка при получении списка фонов' });
  }
});

/**
 * Рекурсивно получает все файлы изображений из папки sprites/episodes
 * @param {string} basePath - Базовый путь к папке sprites/episodes
 * @returns {Array} - Массив объектов с информацией о фонах
 */
async function getAllBackgrounds(basePath) {
  const backgrounds = [];
  
  try {
    // Проверяем, существует ли базовая папка
    if (!fs.existsSync(basePath)) {
      console.warn(`Папка ${basePath} не существует`);
      return backgrounds;
    }

    // Получаем все файлы и папки в базовой директории
    const items = await fs.readdir(basePath);
    
    for (const item of items) {
      const itemPath = path.join(basePath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно обрабатываем подпапки
        const subBackgrounds = await getAllBackgrounds(itemPath);
        backgrounds.push(...subBackgrounds);
      } else if (stats.isFile()) {
        // Проверяем, является ли файл изображением
        const ext = path.extname(item).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.jfif'].includes(ext)) {
          // Получаем относительный путь от папки sprites/episodes
          const relativePath = path.relative(path.join(__dirname, '..', '..', 'public', 'sprites', 'episodes'), itemPath);
          const normalizedPath = relativePath.replace(/\\/g, '/'); // Заменяем обратные слеши на прямые
          
          backgrounds.push({
            name: item,
            path: `sprites/episodes/${normalizedPath}`,
            fullPath: `/sprites/episodes/${normalizedPath}`,
            category: getBackgroundCategory(normalizedPath),
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
    }
    
    // Сортируем по категории и имени
    backgrounds.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
    
  } catch (error) {
    console.error('Ошибка при сканировании фонов:', error);
  }
  
  return backgrounds;
}

/**
 * Определяет категорию фона по пути
 * @param {string} filePath - Путь к файлу
 * @returns {string} - Категория фона
 */
function getBackgroundCategory(filePath) {
  const parts = filePath.split('/');
  
  // Если есть папка locations, используем следующую папку как категорию
  const locationsIndex = parts.indexOf('locations');
  if (locationsIndex !== -1 && locationsIndex + 1 < parts.length) {
    return parts[locationsIndex + 1];
  }
  
  // Иначе используем первую папку после sprites/episodes
  if (parts.length > 2) {
    return parts[2];
  }
  
  return 'other';
}

app.listen(PORT, () => {
  console.log(`Сервер редактора эпизодов запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}`);
}); 