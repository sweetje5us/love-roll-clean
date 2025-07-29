#!/usr/bin/env node

/**
 * Скрипт для принудительного обновления кэша персонажей эпизодов
 * Использование: node scripts/refresh_episode_cache.js [episodeId]
 */

const fs = require('fs-extra');
const path = require('path');

const EPISODES_PATH = path.join(__dirname, '..', 'public', 'episodes');

async function refreshEpisodeCache(episodeId = null) {
  try {
    console.log('🔄 Начинаем обновление кэша персонажей эпизодов...');
    
    // Получаем список всех эпизодов
    const episodeFolders = await fs.readdir(EPISODES_PATH);
    
    for (const folder of episodeFolders) {
      // Если указан конкретный эпизод, обрабатываем только его
      if (episodeId && folder !== episodeId) {
        continue;
      }
      
      const configPath = path.join(EPISODES_PATH, folder, 'config.json');
      
      if (await fs.pathExists(configPath)) {
        try {
          const config = await fs.readJson(configPath);
          console.log(`📁 Обрабатываем эпизод: ${config.id} (${config.name})`);
          
          // Проверяем персонажей
          if (config.characters && Array.isArray(config.characters)) {
            console.log(`   👥 Найдено персонажей: ${config.characters.length}`);
            
            // Логируем информацию о персонажах
            config.characters.forEach(char => {
              console.log(`   - ${char.id} (${char.name}): одежда = ${char.appearance?.dress || 'не указана'}`);
            });
          } else {
            console.log(`   ⚠️  Персонажи не найдены или не являются массивом`);
          }
          
          // Создаем временный файл для принудительного обновления кэша
          const tempPath = path.join(EPISODES_PATH, folder, 'config.temp.json');
          await fs.writeJson(tempPath, config, { spaces: 2 });
          
          // Удаляем временный файл
          await fs.remove(tempPath);
          
          console.log(`   ✅ Кэш обновлен для эпизода ${config.id}`);
          
        } catch (error) {
          console.error(`   ❌ Ошибка обработки эпизода ${folder}:`, error.message);
        }
      } else {
        console.log(`   ⚠️  Файл config.json не найден в папке ${folder}`);
      }
    }
    
    console.log('🎉 Обновление кэша завершено!');
    console.log('');
    console.log('💡 Рекомендации:');
    console.log('   1. Перезапустите сервер разработки');
    console.log('   2. Очистите кэш браузера (Ctrl+Shift+R)');
    console.log('   3. Проверьте изменения в игре');
    
  } catch (error) {
    console.error('❌ Ошибка обновления кэша:', error);
    process.exit(1);
  }
}

// Получаем ID эпизода из аргументов командной строки
const episodeId = process.argv[2];

if (episodeId) {
  console.log(`🎯 Обновляем кэш только для эпизода: ${episodeId}`);
} else {
  console.log('🌍 Обновляем кэш для всех эпизодов');
}

refreshEpisodeCache(episodeId); 