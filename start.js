const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs-extra'); // Добавляем fs-extra для работы с файлами

const app = express();
const PORT = 3000;

// Включаем CORS для разработки
app.use(cors());

// Обслуживаем статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Специальный маршрут для episodes.json
app.get('/episodes.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'episodes.json'));
});

// Новый динамический API endpoint для эпизодов
app.get('/api/episodes/dynamic', async (req, res) => {
  try {
    const episodes = {};
    const types = {};
    const ageRatings = {};
    
    const episodesPath = path.join(__dirname, 'public', 'episodes');
    const episodeFolders = await fs.readdir(episodesPath);
    
    for (const folder of episodeFolders) {
      const configPath = path.join(episodesPath, folder, 'config.json');
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

// Маршрут для конфигураций эпизодов
app.get('/episodes/:episodeId/config.json', (req, res) => {
  const episodeId = req.params.episodeId;
  const configPath = path.join(__dirname, 'public', 'episodes', episodeId, 'config.json');
  res.sendFile(configPath);
});

// Маршрут для конфигураций глав
app.get('/episodes/:episodeId/chapters/:chapterId/config.json', (req, res) => {
  const { episodeId, chapterId } = req.params;
  const configPath = path.join(__dirname, 'public', 'episodes', episodeId, 'chapters', chapterId, 'config.json');
  res.sendFile(configPath);
});

// Маршрут для сцен
app.get('/episodes/:episodeId/scenes/:sceneId.json', (req, res) => {
  const { episodeId, sceneId } = req.params;
  const scenePath = path.join(__dirname, 'public', 'episodes', episodeId, 'scenes', `${sceneId}.json`);
  res.sendFile(scenePath);
});

// Маршрут для всех остальных файлов из public
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер разработки запущен на http://localhost:${PORT}`);
  console.log(`Обслуживаем файлы из папки: ${path.join(__dirname, 'public')}`);
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
  return typeIcons[type] || 'fas fa-question';
}

function getAgeRatingColor(ageRating) {
  const ageColors = {
    '0+': '#22c55e',
    '6+': '#84cc16',
    '12+': '#f59e0b',
    '16+': '#ef4444',
    '18+': '#dc2626'
  };
  return ageColors[ageRating] || '#22c55e';
}

function getAgeRatingDescription(ageRating) {
  const ageDescriptions = {
    '0+': 'Для всех возрастов',
    '6+': 'Для детей от 6 лет',
    '12+': 'Для подростков от 12 лет',
    '16+': 'Для подростков от 16 лет',
    '18+': 'Только для взрослых'
  };
  return ageDescriptions[ageRating] || 'Для всех возрастов';
} 