const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация оптимизации
const CONFIG = {
    // Максимальные размеры для разных типов изображений
    maxSizes: {
        characters: { width: 512, height: 512 },    // Персонажи - средний размер
        items: { width: 256, height: 256 },         // Предметы - маленький размер
        ui: { width: 128, height: 128 },            // UI элементы - очень маленький
        achievements: { width: 128, height: 128 },  // Достижения - маленький
        scary: { width: 256, height: 256 },         // Спрайты страха - средний
        episodes: { width: 1024, height: 768 },     // Эпизоды - оптимизированный размер
        backgrounds: { width: 1024, height: 768 }   // Фоны - большой, но оптимизированный
    },
    
    // Папки для пропуска (не оптимизировать)
    skipFolders: ['backup', 'original', 'temp', 'sprites_backup'],
    
    // Расширения файлов для обработки
    imageExtensions: ['.png', '.jpg', '.jpeg', '.jfif'],
    
    // Создавать ли резервные копии
    createBackup: true,
    
    // Папка для резервных копий
    backupFolder: 'sprites_backup',
    
    // Качество сжатия PNG (0-9, где 9 - максимальное сжатие)
    pngQuality: 9,
    
    // Качество JPEG (0-100, где 100 - лучшее качество)
    jpegQuality: 85
};

// Функция для проверки наличия ImageMagick
function checkImageMagick() {
    try {
        execSync('magick --version', { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Функция для определения типа спрайта по пути
function getSpriteType(filePath) {
    const normalizedPath = filePath.toLowerCase();
    
    if (normalizedPath.includes('character')) return 'characters';
    if (normalizedPath.includes('item')) return 'items';
    if (normalizedPath.includes('ui')) return 'ui';
    if (normalizedPath.includes('achievement')) return 'achievements';
    if (normalizedPath.includes('scary')) return 'scary';
    if (normalizedPath.includes('episode') || normalizedPath.includes('location')) return 'episodes';
    if (normalizedPath.includes('background')) return 'backgrounds';
    
    // Определение по папке
    const dirName = path.dirname(filePath).toLowerCase();
    if (dirName.includes('character')) return 'characters';
    if (dirName.includes('item')) return 'items';
    if (dirName.includes('ui')) return 'ui';
    if (dirName.includes('achievement')) return 'achievements';
    if (dirName.includes('scary')) return 'scary';
    if (dirName.includes('episode') || dirName.includes('location')) return 'episodes';
    if (dirName.includes('background')) return 'backgrounds';
    
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

// Функция для оптимизации изображения с помощью ImageMagick
function optimizeImageWithImageMagick(originalPath, spriteType) {
    const maxSize = CONFIG.maxSizes[spriteType];
    const ext = path.extname(originalPath).toLowerCase();
    
    // Создаем временный файл для оптимизированной версии
    const tempPath = originalPath + '.temp';
    
    try {
        let command;
        
        if (ext === '.png') {
            // Оптимизация PNG
            command = `magick "${originalPath}" -resize ${maxSize.width}x${maxSize.height}> -strip -quality ${CONFIG.pngQuality} "${tempPath}"`;
        } else if (['.jpg', '.jpeg', '.jfif'].includes(ext)) {
            // Оптимизация JPEG
            command = `magick "${originalPath}" -resize ${maxSize.width}x${maxSize.height}> -strip -quality ${CONFIG.jpegQuality} "${tempPath}"`;
        } else {
            throw new Error(`Неподдерживаемый формат: ${ext}`);
        }
        
        execSync(command, { stdio: 'ignore' });
        
        // Проверяем, что временный файл создался и меньше оригинала
        if (!fs.existsSync(tempPath)) {
            throw new Error('Временный файл не создался');
        }
        
        const originalSize = fs.statSync(originalPath).size;
        const tempSize = fs.statSync(tempPath).size;
        
        // Если оптимизированный файл больше оригинала, не заменяем
        if (tempSize >= originalSize) {
            fs.unlinkSync(tempPath);
            return {
                success: false,
                reason: 'Оптимизированный файл больше оригинала',
                originalSize,
                optimizedSize: tempSize
            };
        }
        
        // Заменяем оригинал оптимизированной версией
        fs.unlinkSync(originalPath);
        fs.renameSync(tempPath, originalPath);
        
        return {
            success: true,
            originalSize,
            optimizedSize: tempSize,
            savings: originalSize - tempSize
        };
        
    } catch (error) {
        // Удаляем временный файл если он существует
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Функция для обработки одного изображения
function processImage(imagePath, relativePath) {
    const spriteType = getSpriteType(relativePath);
    const maxSize = CONFIG.maxSizes[spriteType];
    
    // Создаем резервную копию
    createBackup(imagePath);
    
    // Получаем размер до оптимизации
    const originalSize = fs.statSync(imagePath).size;
    
    // Оптимизируем изображение
    const result = optimizeImageWithImageMagick(imagePath, spriteType);
    
    if (result.success) {
        const savingsPercent = ((result.savings / result.originalSize) * 100).toFixed(1);
        
        console.log(`  ✓ ${relativePath}`);
        console.log(`    Размер: ${formatFileSize(result.originalSize)} -> ${formatFileSize(result.optimizedSize)} (экономия: ${formatFileSize(result.savings)}, ${savingsPercent}%)`);
        
        return {
            processed: true,
            originalSize: result.originalSize,
            optimizedSize: result.optimizedSize,
            savings: result.savings
        };
    } else {
        console.log(`  ✗ ${relativePath} - ${result.reason || result.error}`);
        return { processed: false };
    }
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
    stats.largestFiles = stats.largestFiles.slice(0, 20); // Топ 20
    
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
    
    console.log(`\n🔝 ТОП-20 САМЫХ БОЛЬШИХ ФАЙЛОВ:`);
    stats.largestFiles.slice(0, 20).forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.path} (${formatFileSize(file.size)}) [${file.type}]`);
    });
    
    console.log('\n' + '='.repeat(60));
}

// Основная функция
function main() {
    const spritesDir = 'public/sprites';
    
    if (!fs.existsSync(spritesDir)) {
        console.log('Папка sprites не найдена!');
        return;
    }
    
    // Проверяем наличие ImageMagick
    const hasImageMagick = checkImageMagick();
    if (!hasImageMagick) {
        console.log('❌ ImageMagick не найден!');
        console.log('Установите ImageMagick: https://imagemagick.org/script/download.php');
        console.log('После установки перезапустите скрипт.');
        return;
    }
    
    // Создаем папку для резервных копий
    if (CONFIG.createBackup) {
        if (!fs.existsSync(CONFIG.backupFolder)) {
            fs.mkdirSync(CONFIG.backupFolder, { recursive: true });
        }
    }
    
    console.log('✅ ImageMagick найден! Начинаем оптимизацию...\n');
    
    // Получаем статистику до оптимизации
    console.log('Анализ папки sprites...');
    const beforeStats = scanDirectory(spritesDir);
    printStatistics(beforeStats, 'СТАТИСТИКА ДО ОПТИМИЗАЦИИ');
    
    // Показываем настройки
    console.log('\nНастройки оптимизации:');
    Object.entries(CONFIG.maxSizes).forEach(([type, size]) => {
        console.log(`  ${type}: ${size.width}x${size.height}`);
    });
    console.log(`  PNG качество: ${CONFIG.pngQuality}/9`);
    console.log(`  JPEG качество: ${CONFIG.jpegQuality}/100`);
    
    console.log('\nНачинаем процесс оптимизации...\n');
    
    // Обрабатываем файлы
    let processedCount = 0;
    let totalSavings = 0;
    let skippedCount = 0;
    
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
                    const result = processImage(fullPath, itemRelativePath);
                    if (result.processed) {
                        processedCount++;
                        totalSavings += result.savings;
                    } else {
                        skippedCount++;
                    }
                }
            }
        }
    }
    
    processDirectoryRecursive(spritesDir);
    
    // Получаем статистику после оптимизации
    console.log('\nАнализ результатов...');
    const afterStats = scanDirectory(spritesDir);
    
    console.log('\n' + '='.repeat(60));
    console.log('ПРОЦЕСС ЗАВЕРШЕН');
    console.log('='.repeat(60));
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ:`);
    console.log(`Обработано файлов: ${processedCount}`);
    console.log(`Пропущено файлов: ${skippedCount}`);
    console.log(`Общая экономия: ${formatFileSize(totalSavings)}`);
    console.log(`Процент экономии: ${((totalSavings / beforeStats.totalSize) * 100).toFixed(1)}%`);
    
    console.log(`\n📈 СРАВНЕНИЕ ДО/ПОСЛЕ:`);
    console.log(`До: ${formatFileSize(beforeStats.totalSize)}`);
    console.log(`После: ${formatFileSize(afterStats.totalSize)}`);
    console.log(`Экономия: ${formatFileSize(beforeStats.totalSize - afterStats.totalSize)}`);
    
    console.log(`\n💾 РЕЗЕРВНЫЕ КОПИИ:`);
    console.log(`Создано резервных копий: ${processedCount + skippedCount}`);
    console.log(`Папка резервных копий: ${CONFIG.backupFolder}`);
    
    console.log(`\n🔄 СЛЕДУЮЩИЕ ШАГИ:`);
    console.log(`• Проверьте качество оптимизированных изображений`);
    console.log(`• При необходимости используйте restore_sprites.bat для восстановления`);
    
    console.log('\n' + '='.repeat(60));
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { main, scanDirectory, formatFileSize }; 