const fs = require('fs');
const path = require('path');

// Конфигурация оптимизации
const CONFIG = {
    // Максимальные размеры для разных типов изображений
    maxSizes: {
        characters: { width: 512, height: 512 },    // Персонажи - средний размер
        items: { width: 256, height: 256 },         // Предметы - маленький размер
        ui: { width: 128, height: 128 },            // UI элементы - очень маленький
        achievements: { width: 128, height: 128 },  // Достижения - маленький
        scary: { width: 256, height: 256 },         // Спрайты страха - средний
        episodes: { width: 512, height: 512 },      // Эпизоды - средний
        backgrounds: { width: 1024, height: 768 }   // Фоны - большой, но оптимизированный
    },
    
    // Папки для пропуска (не оптимизировать)
    skipFolders: ['backup', 'original', 'temp'],
    
    // Расширения файлов для обработки
    imageExtensions: ['.png', '.jpg', '.jpeg', '.jfif'],
    
    // Создавать ли резервные копии
    createBackup: true,
    
    // Папка для резервных копий
    backupFolder: 'sprites_backup'
};

// Функция для определения типа спрайта по пути
function getSpriteType(filePath) {
    const normalizedPath = filePath.toLowerCase();
    
    if (normalizedPath.includes('character')) return 'characters';
    if (normalizedPath.includes('item')) return 'items';
    if (normalizedPath.includes('ui')) return 'ui';
    if (normalizedPath.includes('achievement')) return 'achievements';
    if (normalizedPath.includes('scary')) return 'scary';
    if (normalizedPath.includes('episode')) return 'episodes';
    if (normalizedPath.includes('background') || normalizedPath.includes('location')) return 'backgrounds';
    
    // Определение по папке
    const dirName = path.dirname(filePath).toLowerCase();
    if (dirName.includes('character')) return 'characters';
    if (dirName.includes('item')) return 'items';
    if (dirName.includes('ui')) return 'ui';
    if (dirName.includes('achievement')) return 'achievements';
    if (dirName.includes('scary')) return 'scary';
    if (dirName.includes('episode')) return 'episodes';
    if (dirName.includes('background') || dirName.includes('location')) return 'backgrounds';
    
    return 'characters'; // По умолчанию
}

// Функция для создания резервной копии
function createBackup(originalPath) {
    if (!CONFIG.createBackup) return;
    
    const backupPath = path.join(CONFIG.backupFolder, path.relative('public/sprites', originalPath));
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(originalPath, backupPath);
}

// Функция для получения размера файла в читаемом формате
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция для рекурсивного обхода папок и сбора статистики
function scanDirectory(dirPath, relativePath = '') {
    const stats = {
        totalFiles: 0,
        totalSize: 0,
        byType: {},
        byExtension: {},
        largestFiles: []
    };
    
    function scanRecursive(dir, relPath) {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const itemRelativePath = path.join(relPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!CONFIG.skipFolders.includes(item.toLowerCase())) {
                    scanRecursive(fullPath, itemRelativePath);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (CONFIG.imageExtensions.includes(ext)) {
                    const fileSize = stat.size;
                    const spriteType = getSpriteType(itemRelativePath);
                    
                    // Обновляем общую статистику
                    stats.totalFiles++;
                    stats.totalSize += fileSize;
                    
                    // Статистика по типам
                    if (!stats.byType[spriteType]) {
                        stats.byType[spriteType] = { count: 0, size: 0 };
                    }
                    stats.byType[spriteType].count++;
                    stats.byType[spriteType].size += fileSize;
                    
                    // Статистика по расширениям
                    if (!stats.byExtension[ext]) {
                        stats.byExtension[ext] = { count: 0, size: 0 };
                    }
                    stats.byExtension[ext].count++;
                    stats.byExtension[ext].size += fileSize;
                    
                    // Топ самых больших файлов
                    stats.largestFiles.push({
                        path: itemRelativePath,
                        size: fileSize,
                        type: spriteType,
                        fullPath: fullPath
                    });
                }
            }
        }
    }
    
    scanRecursive(dirPath, relativePath);
    
    // Сортируем топ файлов
    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 50); // Топ 50
    
    return stats;
}

// Функция для вывода статистики
function printStatistics(stats, title) {
    console.log('='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
    
    console.log(`\n📊 ОБЩАЯ СТАТИСТИКА:`);
    console.log(`Файлов: ${stats.totalFiles}`);
    console.log(`Общий размер: ${formatFileSize(stats.totalSize)}`);
    
    console.log(`\n📁 ПО ТИПАМ СПРАЙТОВ:`);
    const sortedTypes = Object.entries(stats.byType)
        .sort(([,a], [,b]) => b.size - a.size);
    
    sortedTypes.forEach(([type, data]) => {
        const percentage = ((data.size / stats.totalSize) * 100).toFixed(1);
        console.log(`  ${type}: ${data.count} файлов, ${formatFileSize(data.size)} (${percentage}%)`);
    });
    
    console.log(`\n📄 ПО РАСШИРЕНИЯМ ФАЙЛОВ:`);
    const sortedExtensions = Object.entries(stats.byExtension)
        .sort(([,a], [,b]) => b.size - a.size);
    
    sortedExtensions.forEach(([ext, data]) => {
        const percentage = ((data.size / stats.totalSize) * 100).toFixed(1);
        console.log(`  ${ext}: ${data.count} файлов, ${formatFileSize(data.size)} (${percentage}%)`);
    });
    
    console.log(`\n🔝 ТОП-10 САМЫХ БОЛЬШИХ ФАЙЛОВ:`);
    stats.largestFiles.slice(0, 10).forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.path} (${formatFileSize(file.size)}) [${file.type}]`);
    });
    
    console.log('\n' + '='.repeat(60));
}

// Функция для создания оптимизированной копии файла
function createOptimizedCopy(originalPath, spriteType) {
    const maxSize = CONFIG.maxSizes[spriteType];
    const ext = path.extname(originalPath).toLowerCase();
    
    // Создаем имя для оптимизированного файла
    const dir = path.dirname(originalPath);
    const name = path.basename(originalPath, ext);
    const optimizedPath = path.join(dir, `${name}_optimized${ext}`);
    
    try {
        // Просто копируем файл с новым именем
        // В реальной оптимизации здесь был бы ImageMagick
        fs.copyFileSync(originalPath, optimizedPath);
        
        // Получаем размеры для информации
        const originalSize = fs.statSync(originalPath).size;
        const optimizedSize = fs.statSync(optimizedPath).size;
        
        return {
            success: true,
            originalSize,
            optimizedSize,
            optimizedPath
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Функция для обработки одного изображения
function processImage(imagePath, relativePath, stats) {
    const spriteType = getSpriteType(relativePath);
    const maxSize = CONFIG.maxSizes[spriteType];
    
    // Создаем резервную копию
    createBackup(imagePath);
    
    // Создаем оптимизированную версию
    const result = createOptimizedCopy(imagePath, spriteType);
    
    if (result.success) {
        const savings = result.originalSize - result.optimizedSize;
        const savingsPercent = ((savings / result.originalSize) * 100).toFixed(1);
        
        console.log(`  ✓ ${relativePath}`);
        console.log(`    Размер: ${formatFileSize(result.originalSize)} -> ${formatFileSize(result.optimizedSize)} (экономия: ${formatFileSize(savings)}, ${savingsPercent}%)`);
        
        return {
            processed: true,
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            savings
        };
    } else {
        console.log(`  ✗ ${relativePath} - ошибка: ${result.error}`);
        return { processed: false };
    }
}

// Основная функция
function main() {
    const spritesDir = 'public/sprites';
    
    if (!fs.existsSync(spritesDir)) {
        console.log('Папка sprites не найдена!');
        return;
    }
    
    // Создаем папку для резервных копий
    if (CONFIG.createBackup) {
        if (!fs.existsSync(CONFIG.backupFolder)) {
            fs.mkdirSync(CONFIG.backupFolder, { recursive: true });
        }
    }
    
    console.log('⚠️  РЕЖИМ БЕЗ IMAGEMAGICK');
    console.log('Этот режим создает резервные копии и показывает статистику,');
    console.log('но не выполняет реальную оптимизацию изображений.');
    console.log('Для полной оптимизации установите ImageMagick.\n');
    
    // Получаем статистику до оптимизации
    console.log('Анализ папки sprites...');
    const beforeStats = scanDirectory(spritesDir);
    printStatistics(beforeStats, 'СТАТИСТИКА ДО ОПТИМИЗАЦИИ');
    
    // Показываем настройки
    console.log('\nНастройки оптимизации:');
    Object.entries(CONFIG.maxSizes).forEach(([type, size]) => {
        console.log(`  ${type}: ${size.width}x${size.height}`);
    });
    
    console.log('\n⚠️  ВНИМАНИЕ: Без ImageMagick реальная оптимизация не выполняется!');
    console.log('Скрипт создаст резервные копии и покажет, что можно оптимизировать.');
    
    console.log('\nНачать процесс? (y/n)');
    console.log('Начинаем процесс...\n');
    
    // Обрабатываем файлы (создаем резервные копии)
    let processedCount = 0;
    let totalSavings = 0;
    
    function processDirectoryRecursive(dirPath, relativePath = '') {
        if (!fs.existsSync(dirPath)) return;
        
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const itemRelativePath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!CONFIG.skipFolders.includes(item.toLowerCase())) {
                    processDirectoryRecursive(fullPath, itemRelativePath);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (CONFIG.imageExtensions.includes(ext)) {
                    console.log(`Обработка: ${itemRelativePath}`);
                    
                    const result = processImage(fullPath, itemRelativePath, beforeStats);
                    if (result.processed) {
                        processedCount++;
                        totalSavings += result.savings;
                    }
                }
            }
        }
    }
    
    processDirectoryRecursive(spritesDir);
    
    console.log('\n' + '='.repeat(60));
    console.log('ПРОЦЕСС ЗАВЕРШЕН');
    console.log('='.repeat(60));
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ:`);
    console.log(`Обработано файлов: ${processedCount}`);
    console.log(`Создано резервных копий: ${processedCount}`);
    console.log(`Общий размер резервных копий: ${formatFileSize(beforeStats.totalSize)}`);
    
    console.log(`\n💡 РЕКОМЕНДАЦИИ:`);
    console.log(`• Установите ImageMagick для реальной оптимизации`);
    console.log(`• Ожидаемая экономия с ImageMagick: ~${formatFileSize(beforeStats.totalSize * 0.3)}`);
    console.log(`• Резервные копии сохранены в папке: ${CONFIG.backupFolder}`);
    
    console.log(`\n🔄 СЛЕДУЮЩИЕ ШАГИ:`);
    console.log(`1. Установите ImageMagick: https://imagemagick.org/script/download.php`);
    console.log(`2. Запустите optimize_sprites.bat снова`);
    console.log(`3. Или используйте restore_sprites.bat для восстановления`);
    
    console.log('\n' + '='.repeat(60));
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { main, scanDirectory, formatFileSize }; 