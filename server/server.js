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

// Путь к папке с эпизодами
const EPISODES_PATH = path.join(__dirname, '..', 'public', 'episodes');

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
    
    // Создаем config.json
    const config = {
      id: episodeId,
      name: episodeData.name,
      description: episodeData.description,
      type: episodeData.type,
      duration: episodeData.duration,
      difficulty: episodeData.difficulty,
      preview: episodeData.preview || 'preview.png',
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
      preview: episodeData.preview || 'preview.png',
      unlocked: true,
      completed: false,
      tags: episodeData.tags || []
    };
    
    await fs.writeJson(path.join(episodePath, 'config.json'), config, { spaces: 2 });
    
    // Обновляем episodes.json
    const episodesJsonPath = path.join(__dirname, '..', 'public', 'episodes.json');
    let episodesData = { episodes: {} };
    
    if (await fs.pathExists(episodesJsonPath)) {
      episodesData = await fs.readJson(episodesJsonPath);
    }
    
    episodesData.episodes[episodeId] = episodeDataForJson;
    await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
    
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
    const episodesJsonPath = path.join(__dirname, '..', 'public', 'episodes.json');
    if (await fs.pathExists(episodesJsonPath)) {
      const episodesData = await fs.readJson(episodesJsonPath);
      episodesData.episodes[episodeId] = episodeDataForJson;
      await fs.writeJson(episodesJsonPath, episodesData, { spaces: 2 });
    }
    
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
    
    // Удаляем из episodes.json
    const episodesJsonPath = path.join(__dirname, '..', 'public', 'episodes.json');
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
    const chapterPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId);
    
    if (!await fs.pathExists(chapterPath)) {
      return res.status(404).json({ error: 'Глава не найдена' });
    }
    
    const configPath = path.join(chapterPath, 'config.json');
    const config = await fs.readJson(configPath);
    const sceneIds = config.scenes || [];
    
    // Загружаем данные каждой сцены
    const scenes = [];
    for (const sceneId of sceneIds) {
      const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
      if (await fs.pathExists(scenePath)) {
        const sceneData = await fs.readJson(scenePath);
        scenes.push(sceneData);
      }
    }
    
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
    
    const sceneId = sceneData.id || `scene_${Date.now()}`;
    const scenePath = path.join(EPISODES_PATH, episodeId, 'scenes', `${sceneId}.json`);
    
    // Сохраняем сцену
    const scene = {
      id: sceneId,
      chapterId: chapterId,
      ...sceneData
    };
    
    await fs.writeJson(scenePath, scene, { spaces: 2 });
    
    // Обновляем config.json главы
    const chapterConfigPath = path.join(EPISODES_PATH, episodeId, 'chapters', chapterId, 'config.json');
    if (await fs.pathExists(chapterConfigPath)) {
      const chapterConfig = await fs.readJson(chapterConfigPath);
      chapterConfig.scenes = chapterConfig.scenes || [];
      if (!chapterConfig.scenes.includes(sceneId)) {
        chapterConfig.scenes.push(sceneId);
        await fs.writeJson(chapterConfigPath, chapterConfig, { spaces: 2 });
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
    
    // Удаляем из всех глав
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
    
    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const filename = `preview_${timestamp}.png`;
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

app.listen(PORT, () => {
  console.log(`Сервер редактора эпизодов запущен на порту ${PORT}`);
  console.log(`API доступен по адресу: http://localhost:${PORT}`);
}); 