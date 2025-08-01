const fs = require('fs');
const path = require('path');

// Конфигурация
const CONFIG = {
    // Папка для сканирования
    spritesDir: 'public/sprites',
    
    // Папки для пропуска
    skipFolders: ['backup', 'original', 'temp', 'sprites_backup'],
    
    // Расширения файлов для обработки
    imageExtensions: ['.png', '.jpg', '.jpeg', '.jfif']
};

// Функция для получения размера файла в читаемом формате
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Функция для рекурсивного поиска файлов с суффиксом _optimized
function findOptimizedFiles(dirPath, relativePath = '') {
    const optimizedFiles = [];
    
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
                    // Проверяем, содержит ли имя файла _optimized
                    if (item.includes('_optimized')) {
                        optimizedFiles.push({
                            path: fullPath,
                            relativePath: itemRelativePath,
                            size: stat.size
                        });
                    }
                }
            }
        }
    }
    
    scanRecursive(dirPath, relativePath);
    return optimizedFiles;
}

// Функция для удаления файла
function deleteFile(filePath) {
    try {
        fs.unlinkSync(filePath);
        return true;
    } catch (error) {
        console.log(`  ✗ Ошибка удаления ${filePath}: ${error.message}`);
        return false;
    }
}

// Основная функция
function main() {
    console.log('🧹 ОЧИСТКА ДУБЛИРОВАННЫХ ФАЙЛОВ');
    console.log('='.repeat(50));
    
    if (!fs.existsSync(CONFIG.spritesDir)) {
        console.log('❌ Папка sprites не найдена!');
        return;
    }
    
    console.log('Поиск файлов с суффиксом _optimized...\n');
    
    // Находим все файлы с суффиксом _optimized
    const optimizedFiles = findOptimizedFiles(CONFIG.spritesDir);
    
    if (optimizedFiles.length === 0) {
        console.log('✅ Файлы с суффиксом _optimized не найдены!');
        return;
    }
    
    console.log(`Найдено ${optimizedFiles.length} файлов с суффиксом _optimized:`);
    console.log('');
    
    let totalSize = 0;
    optimizedFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.relativePath} (${formatFileSize(file.size)})`);
        totalSize += file.size;
    });
    
    console.log(`\nОбщий размер файлов для удаления: ${formatFileSize(totalSize)}`);
    console.log('');
    
    // Запрашиваем подтверждение
    console.log('⚠️  ВНИМАНИЕ: Эти файлы будут удалены безвозвратно!');
    console.log('Убедитесь, что у вас есть резервные копии.');
    console.log('');
    console.log('Продолжить удаление? (y/n)');
    console.log('Начинаем удаление...\n');
    
    // Удаляем файлы
    let deletedCount = 0;
    let deletedSize = 0;
    
    optimizedFiles.forEach((file) => {
        console.log(`Удаление: ${file.relativePath}`);
        
        if (deleteFile(file.path)) {
            deletedCount++;
            deletedSize += file.size;
            console.log(`  ✅ Удален (${formatFileSize(file.size)})`);
        } else {
            console.log(`  ❌ Ошибка удаления`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('ОЧИСТКА ЗАВЕРШЕНА');
    console.log('='.repeat(50));
    
    console.log(`\n📊 РЕЗУЛЬТАТЫ:`);
    console.log(`Найдено файлов: ${optimizedFiles.length}`);
    console.log(`Удалено файлов: ${deletedCount}`);
    console.log(`Освобождено места: ${formatFileSize(deletedSize)}`);
    
    if (deletedCount < optimizedFiles.length) {
        console.log(`\n⚠️  Некоторые файлы не были удалены из-за ошибок.`);
        console.log(`Попробуйте запустить скрипт с правами администратора.`);
    }
    
    console.log('\n' + '='.repeat(50));
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { main, findOptimizedFiles, formatFileSize }; 