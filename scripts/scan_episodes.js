#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Путь к папке с эпизодами
const EPISODES_PATH = path.join(__dirname, '..', 'public', 'episodes');
// Путь к файлу episodeList.js
const episodeListPath = path.join(__dirname, '..', 'src', 'utils', 'episodeList.js');

// Функция для сканирования папок эпизодов
async function scanEpisodeFolders() {
  try {
    console.log('🔍 Сканирование папок эпизодов...');
    
    if (!fs.existsSync(EPISODES_PATH)) {
      console.error('❌ Папка episodes не найдена');
      return [];
    }
    
    const episodeFolders = fs.readdirSync(EPISODES_PATH);
    const validEpisodes = [];
    
    for (const folder of episodeFolders) {
      const configPath = path.join(EPISODES_PATH, folder, 'config.json');
      
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (config.id) {
            validEpisodes.push(config.id);
            console.log(`✅ Найден эпизод: ${config.id} (${config.name})`);
          }
        } catch (error) {
          console.warn(`⚠️ Ошибка чтения config.json для ${folder}:`, error.message);
        }
      } else {
        console.warn(`⚠️ Папка ${folder} не содержит config.json`);
      }
    }
    
    return validEpisodes;
  } catch (error) {
    console.error('❌ Ошибка сканирования папок:', error);
    return [];
  }
}

// Функция для обновления списка эпизодов
async function updateEpisodeList(foundEpisodes) {
  try {
    console.log('📝 Обновление списка эпизодов...');
    
    if (!fs.existsSync(episodeListPath)) {
      console.error('❌ Файл episodeList.js не найден');
      return false;
    }
    
    // Читаем текущий файл
    let content = fs.readFileSync(episodeListPath, 'utf8');
    
    // Находим массив KNOWN_EPISODES
    const regex = /KNOWN_EPISODES\s*=\s*\[([\s\S]*?)\]/;
    const match = content.match(regex);
    
    if (!match) {
      console.error('❌ Не удалось найти массив KNOWN_EPISODES в файле');
      return false;
    }
    
    const currentEpisodes = match[1]
      .split(',')
      .map(ep => ep.trim().replace(/['"]/g, ''))
      .filter(ep => ep.length > 0);
    
    // Объединяем существующие и найденные эпизоды
    const allEpisodes = [...new Set([...currentEpisodes, ...foundEpisodes])];
    
    // Сортируем для удобства
    allEpisodes.sort();
    
    // Формируем новый массив
    const newEpisodesArray = `KNOWN_EPISODES = [\n  '${allEpisodes.join("',\n  '")}'\n];`;
    
    // Заменяем старый массив новым
    const newContent = content.replace(regex, newEpisodesArray);
    
    // Записываем обновленный файл
    fs.writeFileSync(episodeListPath, newContent, 'utf8');
    
    console.log(`✅ Список обновлен. Всего эпизодов: ${allEpisodes.length}`);
    console.log('📋 Список эпизодов:', allEpisodes);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка обновления списка:', error);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Запуск сканирования эпизодов...\n');
  
  // Сканируем папки
  const foundEpisodes = await scanEpisodeFolders();
  
  if (foundEpisodes.length === 0) {
    console.log('❌ Эпизоды не найдены');
    process.exit(1);
  }
  
  console.log(`\n📊 Найдено эпизодов: ${foundEpisodes.length}`);
  
  // Обновляем список
  const success = await updateEpisodeList(foundEpisodes);
  
  if (success) {
    console.log('\n🎉 Сканирование завершено успешно!');
  } else {
    console.log('\n❌ Ошибка при обновлении списка');
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  main();
}

module.exports = { scanEpisodeFolders, updateEpisodeList }; 