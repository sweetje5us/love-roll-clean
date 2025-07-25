const express = require('express');
const path = require('path');
const cors = require('cors');

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