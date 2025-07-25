#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Путь к файлу episodeList.js
const episodeListPath = path.join(__dirname, '..', 'src', 'utils', 'episodeList.js');

// Функция для добавления эпизода в список
function addEpisodeToList(episodeId) {
  try {
    // Читаем текущий файл
    let content = fs.readFileSync(episodeListPath, 'utf8');
    
    // Находим массив KNOWN_EPISODES
    const regex = /KNOWN_EPISODES\s*=\s*\[([\s\S]*?)\]/;
    const match = content.match(regex);
    
    if (!match) {
      console.error('Не удалось найти массив KNOWN_EPISODES в файле');
      return false;
    }
    
    const currentEpisodes = match[1]
      .split(',')
      .map(ep => ep.trim().replace(/['"]/g, ''))
      .filter(ep => ep.length > 0);
    
    // Проверяем, есть ли уже такой эпизод
    if (currentEpisodes.includes(episodeId)) {
      console.log(`Эпизод ${episodeId} уже есть в списке`);
      return true;
    }
    
    // Добавляем новый эпизод
    currentEpisodes.push(episodeId);
    
    // Формируем новый массив
    const newEpisodesArray = `KNOWN_EPISODES = [\n  '${currentEpisodes.join("',\n  '")}'\n];`;
    
    // Заменяем старый массив новым
    const newContent = content.replace(regex, newEpisodesArray);
    
    // Записываем обновленный файл
    fs.writeFileSync(episodeListPath, newContent, 'utf8');
    
    console.log(`✅ Эпизод ${episodeId} успешно добавлен в список`);
    return true;
  } catch (error) {
    console.error('Ошибка при добавлении эпизода:', error);
    return false;
  }
}

// Функция для проверки существования папки эпизода
function checkEpisodeFolder(episodeId) {
  const episodePath = path.join(__dirname, '..', 'public', 'episodes', episodeId);
  const configPath = path.join(episodePath, 'config.json');
  
  if (!fs.existsSync(episodePath)) {
    console.error(`❌ Папка эпизода ${episodeId} не существует`);
    return false;
  }
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Файл config.json не найден в папке эпизода ${episodeId}`);
    return false;
  }
  
  console.log(`✅ Папка эпизода ${episodeId} существует`);
  return true;
}

// Основная функция
function main() {
  const episodeId = process.argv[2];
  
  if (!episodeId) {
    console.log('Использование: node add_episode.js <episode_id>');
    console.log('Пример: node add_episode.js new_episode');
    process.exit(1);
  }
  
  console.log(`Добавление эпизода: ${episodeId}`);
  
  // Проверяем существование папки
  if (!checkEpisodeFolder(episodeId)) {
    process.exit(1);
  }
  
  // Добавляем в список
  if (addEpisodeToList(episodeId)) {
    console.log('🎉 Эпизод успешно добавлен!');
  } else {
    console.log('❌ Не удалось добавить эпизод');
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { addEpisodeToList, checkEpisodeFolder }; 