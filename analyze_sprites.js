const fs = require('fs');
const path = require('path');

const SPRITES_FOLDER = 'public/sprites';

// Статистика по типам файлов
const stats = {
    totalFiles: 0,
    totalSize: 0,
    byType: {},
    byExtension: {},
    largestFiles: []
};

// Функция для получения размера файла в читаемом формате
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция для определения типа спрайта
function getSpriteType(filePath) {
    const normalizedPath = filePath.toLowerCase();
    
    if (normalizedPath.includes('character')) return 'characters';
    if (normalizedPath.includes('item')) return 'items';
    if (normalizedPath.includes('ui')) return 'ui';
    if (normalizedPath.includes('achievement')) return 'achievements';
    if (normalizedPath.includes('scary')) return 'scary';
    if (normalizedPath.includes('episode')) return 'episodes';
    if (normalizedPath.includes('background') || normalizedPath.includes('location')) return 'backgrounds';
    
    const dirName = path.dirname(filePath).toLowerCase();
    if (dirName.includes('character')) return 'characters';
    if (dirName.includes('item')) return 'items';
    if (dirName.includes('ui')) return 'ui';
    if (dirName.includes('achievement')) return 'achievements';
    if (dirName.includes('scary')) return 'scary';
    if (dirName.includes('episode')) return 'episodes';
    if (dirName.includes('background') || dirName.includes('location')) return 'backgrounds';
    
    return 'other';
}

// Функция для рекурсивного сканирования папки
function scanDirectory(dirPath, relativePath = '') {
    if (!fs.existsSync(dirPath)) return;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            scanDirectory(fullPath, itemRelativePath);
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.jfif', '.gif', '.bmp', '.webp'].includes(ext)) {
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
                    type: spriteType
                });
            }
        }
    }
}

// Функция для сортировки топ файлов
function sortLargestFiles() {
    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 20); // Топ 20
}

// Функция для вывода статистики
function printStatistics() {
    console.log('='.repeat(60));
    console.log('АНАЛИЗ СПРАЙТОВ');
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
    stats.largestFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.path} (${formatFileSize(file.size)}) [${file.type}]`);
    });
    
    console.log(`\n💡 РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ:`);
    
    // Анализируем возможности оптимизации
    const largeFiles = stats.largestFiles.filter(f => f.size > 1024 * 1024); // > 1MB
    if (largeFiles.length > 0) {
        console.log(`  • ${largeFiles.length} файлов больше 1MB - приоритет для оптимизации`);
    }
    
    const pngFiles = stats.byExtension['.png'];
    if (pngFiles && pngFiles.size > stats.totalSize * 0.5) {
        console.log(`  • PNG файлы занимают ${((pngFiles.size / stats.totalSize) * 100).toFixed(1)}% - можно сжать`);
    }
    
    const jpegFiles = stats.byExtension['.jpg'] || stats.byExtension['.jpeg'];
    if (jpegFiles && jpegFiles.size > stats.totalSize * 0.3) {
        console.log(`  • JPEG файлы занимают ${((jpegFiles.size / stats.totalSize) * 100).toFixed(1)}% - можно уменьшить качество`);
    }
    
    // Оценка экономии места
    const estimatedSavings = stats.totalSize * 0.3; // Примерно 30% экономии
    console.log(`  • Ожидаемая экономия после оптимизации: ~${formatFileSize(estimatedSavings)}`);
    
    console.log('\n' + '='.repeat(60));
}

// Основная функция
function main() {
    if (!fs.existsSync(SPRITES_FOLDER)) {
        console.log('Папка sprites не найдена!');
        return;
    }
    
    console.log('Сканирование папки sprites...');
    scanDirectory(SPRITES_FOLDER);
    sortLargestFiles();
    printStatistics();
}

// Запускаем анализ
if (require.main === module) {
    main();
}

module.exports = { analyzeSprites: main, formatFileSize }; 