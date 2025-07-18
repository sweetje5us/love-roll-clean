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
        episodes.push(config);
      }
    }
    
    res.json(episodes);
  } catch (error) {
    console.error('Ошибка загрузки эпизодов:', error);
    res.status(500).json({ error: 'Ошибка загрузки эпизодов' });
  }
});

// Создание нового эпизода
app.post('/api/episodes', async (req, res) => {
  try {
    const episodeData = req.body;
    const episodeId = episodeData.id || `episode_${Date.now()}`;
    const episodePath = path.join(EPISODES_PATH, episodeId);
    
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
    
    // Создаем config.json
    const config = {
      id: episodeId,
      name: episodeData.name,
      description: episodeData.description,
      type: episodeData.type,
      duration: episodeData.duration,
      difficulty: episodeData.difficulty,
      preview: finalPreview,
      chapters: [],
      unlocked: true
    };
    
    // Создаем данные для episodes.json
    const episodeDataForJson = {
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
      tags: episodeData.tags || []
    };
    
    await fs.writeJson(path.join(episodePath, 'config.json'), config, { spaces: 2 });
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    let episodesData = { episodes: {} };
    
    if (await fs.pathExists(episodesJsonPath)) {
      episodesData = await fs.readJson(episodesJsonPath);
    }
    
    episodesData.episodes[episodeId] = episodeDataForJson;
    await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
    
    res.json(episodeDataForJson);
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
    
    // Создаем данные для episodes.json
    const episodeDataForJson = {
      id: episodeId,
      name: episodeData.name || config.name,
      description: episodeData.description || config.description,
      longDescription: episodeData.longDescription || config.longDescription || episodeData.description || config.description,
      type: episodeData.type || config.type,
      ageRating: episodeData.ageRating || config.ageRating || '0+',
      duration: episodeData.duration || config.duration,
      difficulty: episodeData.difficulty || config.difficulty,
      preview: episodeData.preview || config.preview || 'preview.png',
      unlocked: episodeData.unlocked !== undefined ? episodeData.unlocked : config.unlocked,
      completed: episodeData.completed !== undefined ? episodeData.completed : config.completed,
      tags: episodeData.tags || config.tags || []
    };
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      episodesData.episodes[episodeId] = episodeDataForJson;
      await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
    }
    
    res.json(episodeDataForJson);
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
    
    // Удаляем из episodes.json
    const episodesJsonPath = path.join(__dirname, '..', '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      delete episodesData.episodes[episodeId];
      await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
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
    
    const chapterId = chapterData.id || `chapter_${Date.now()}`;
    const chapterPath = path.join(episodePath, 'chapters', chapterId);
    
    // Создаем папку главы
    await fs.ensureDir(chapterPath);
    
    // Создаем config.json для главы
    const chapterConfig = {
      id: chapterId,
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
    
    // Также обновляем config.json главы, если он существует
    const chapterPath = path.join(episodePath, 'chapters', chapterId);
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
    const chapterPath = path.join(episodePath, 'chapters', chapterId);
    
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
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления главы:', error);
    res.status(500).json({ error: 'Ошибка удаления главы' });
  }
});

// API для работы со сценами
app.get('/api/episodes/:episodeId/chapters/:chapterId/scenes', async (req, res) => {
  try {
    const { episodeId, chapterId } = req.params;
    
    // Сначала проверяем, есть ли папка главы (для новых глав)
    let chapterPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId);
    
    // Если папка не найдена, попробуем с префиксом "chapter"
    if (!await fs.pathExists(chapterPath)) {
      chapterPath = path.join(EPISODES_PATH, episodeId, 'chapters', `chapter${chapterId}`);
      console.log(`Попробуем путь с префиксом chapter: ${chapterPath}`);
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
    
    // Если сцен не найдено, попробуем загрузить все сцены из папки scenes
    if (scenes.length === 0) {
      console.log(`Сцены не найдены в config.json, загружаем все сцены из папки scenes для главы ${chapterId}`);
      const scenesPath = path.join(EPISODES_PATH, episodeId, 'scenes');
      if (await fs.pathExists(scenesPath)) {
        try {
          const sceneFiles = await fs.readdir(scenesPath);
          const jsonFiles = sceneFiles.filter(file => file.endsWith('.json'));
          
          for (const file of jsonFiles) {
            const sceneId = file.replace('.json', '');
            const scenePath = path.join(scenesPath, file);
            try {
              const sceneData = await fs.readJson(scenePath);
              scenes.push(sceneData);
            } catch (sceneError) {
              console.warn(`Ошибка чтения сцены ${sceneId}:`, sceneError);
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
          }
        } catch (dirError) {
          console.error('Ошибка чтения папки сцен:', dirError);
        }
      }
    }
    
    console.log(`Загружено ${scenes.length} сцен для главы ${chapterId} эпизода ${episodeId}`);
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
    
    const sceneId = sceneData.id || `scene_${Date.now()}`;
    const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
    
    // Сохраняем сцену
    const scene = {
      id: sceneId,
      chapterId: chapterId,
      ...sceneData
    };
    
    await fs.writeJson(scenePath, scene, { spaces: 2 });
    console.log(`Сцена сохранена: ${scenePath}`);
    
    // Проверяем, есть ли папка главы (для новых глав)
    let chapterConfigPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId, 'config.json');
    console.log(`Проверяем config.json главы: ${chapterConfigPath}`);
    console.log(`Файл существует: ${await fs.pathExists(chapterConfigPath)}`);
    
    // Если файл не найден, пробуем путь с префиксом chapter
    if (!await fs.pathExists(chapterConfigPath)) {
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

app.listen(PORT, () => {
  console.log(`Сервер редактора эпизодов запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}`);
}); 