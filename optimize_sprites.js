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
        episodes: { width: 512, height: 512 },      // Эпизоды - средний
        backgrounds: { width: 1024, height: 768 }   // Фоны - большой, но оптимизированный
    },
    
    // Качество JPEG (0-100)
    jpegQuality: 85,
    
    // Уровень сжатия PNG (0-9)
    pngCompression: 9,
    
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

// Функция для получения размеров изображения (требует ImageMagick)
function getImageDimensions(imagePath) {
    try {
        const output = execSync(`magick identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf8' });
        const [width, height] = output.trim().split('x').map(Number);
        return { width, height };
    } catch (error) {
        console.log(`Не удалось получить размеры для ${imagePath}: ${error.message}`);
        return null;
    }
}

// Функция для вычисления новых размеров с сохранением пропорций
function calculateNewSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    // Если изображение больше максимального размера, уменьшаем его
    if (originalWidth > maxWidth || originalHeight > maxHeight) {
        if (aspectRatio > 1) {
            // Горизонтальное изображение
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth / aspectRatio);
            
            // Проверяем, не превышает ли высота максимальную
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = Math.round(maxHeight * aspectRatio);
            }
        } else {
            // Вертикальное изображение
            newHeight = maxHeight;
            newWidth = Math.round(maxHeight * aspectRatio);
            
            // Проверяем, не превышает ли ширина максимальную
            if (newWidth > maxWidth) {
                newWidth = maxWidth;
                newHeight = Math.round(maxWidth / aspectRatio);
            }
        }
    }
    
    return { width: newWidth, height: newHeight };
}

// Функция для оптимизации изображения с помощью ImageMagick
function optimizeImageWithImageMagick(inputPath, outputPath, maxWidth, maxHeight, quality) {
    try {
        const ext = path.extname(inputPath).toLowerCase();
        let command;
        
        if (ext === '.png') {
            command = `magick "${inputPath}" -resize ${maxWidth}x${maxHeight}^> -strip -define png:compression-level=${CONFIG.pngCompression} -define png:compression-strategy=1 "${outputPath}"`;
        } else {
            command = `magick "${inputPath}" -resize ${maxWidth}x${maxHeight}^> -strip -quality ${quality} "${outputPath}"`;
        }
        
        execSync(command, { stdio: 'pipe' });
        return true;
    } catch (error) {
        console.log(`Ошибка оптимизации ${inputPath}: ${error.message}`);
        return false;
    }
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

// Функция для рекурсивного обхода папок
function processDirectory(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Пропускаем папки из списка исключений
            if (!CONFIG.skipFolders.includes(item.toLowerCase())) {
                processDirectory(fullPath, itemRelativePath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (CONFIG.imageExtensions.includes(ext)) {
                processImage(fullPath, itemRelativePath);
            }
        }
    }
}

// Функция для обработки одного изображения
function processImage(imagePath, relativePath) {
    console.log(`Обработка: ${relativePath}`);
    
    // Определяем тип спрайта
    const spriteType = getSpriteType(relativePath);
    const maxSize = CONFIG.maxSizes[spriteType];
    
    // Получаем размеры изображения
    const dimensions = getImageDimensions(imagePath);
    if (!dimensions) {
        console.log(`Пропускаем ${relativePath} - не удалось получить размеры`);
        return;
    }
    
    // Вычисляем новые размеры
    const newSize = calculateNewSize(dimensions.width, dimensions.height, maxSize.width, maxSize.height);
    
    // Проверяем, нужно ли уменьшать изображение
    if (newSize.width === dimensions.width && newSize.height === dimensions.height) {
        console.log(`  Пропускаем - размер уже оптимальный (${dimensions.width}x${dimensions.height})`);
        return;
    }
    
    console.log(`  Размер: ${dimensions.width}x${dimensions.height} -> ${newSize.width}x${newSize.height}`);
    
    // Создаем резервную копию
    createBackup(imagePath);
    
    // Оптимизируем изображение
    const success = optimizeImageWithImageMagick(
        imagePath, 
        imagePath, 
        newSize.width, 
        newSize.height, 
        CONFIG.jpegQuality
    );
    
    if (success) {
        console.log(`  ✓ Оптимизировано`);
    } else {
        console.log(`  ✗ Ошибка оптимизации`);
    }
}

// Функция для получения статистики
function getStatistics(dirPath) {
    let totalFiles = 0;
    let totalSize = 0;
    let processedFiles = 0;
    let processedSize = 0;
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!CONFIG.skipFolders.includes(item.toLowerCase())) {
                    scanDirectory(fullPath);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (CONFIG.imageExtensions.includes(ext)) {
                    totalFiles++;
                    totalSize += stat.size;
                }
            }
        }
    }
    
    scanDirectory(dirPath);
    
    return { totalFiles, totalSize };
}

// Основная функция
function main() {
    const spritesDir = 'public/sprites';
    
    if (!fs.existsSync(spritesDir)) {
        console.log('Папка sprites не найдена!');
        return;
    }
    
    // Проверяем наличие ImageMagick
    try {
        execSync('magick --version', { stdio: 'pipe' });
        console.log('✓ ImageMagick найден');
    } catch (error) {
        console.log('✗ ImageMagick не найден! Установите ImageMagick для оптимизации изображений.');
        console.log('Скачать: https://imagemagick.org/script/download.php');
        return;
    }
    
    // Создаем папку для резервных копий
    if (CONFIG.createBackup) {
        if (!fs.existsSync(CONFIG.backupFolder)) {
            fs.mkdirSync(CONFIG.backupFolder, { recursive: true });
        }
    }
    
    // Получаем статистику
    console.log('Анализ папки sprites...');
    const stats = getStatistics(spritesDir);
    console.log(`Найдено файлов: ${stats.totalFiles}`);
    console.log(`Общий размер: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Спрашиваем подтверждение
    console.log('\nНастройки оптимизации:');
    Object.entries(CONFIG.maxSizes).forEach(([type, size]) => {
        console.log(`  ${type}: ${size.width}x${size.height}`);
    });
    console.log(`Качество JPEG: ${CONFIG.jpegQuality}%`);
    console.log(`Сжатие PNG: ${CONFIG.pngCompression}/9`);
    
    console.log('\nНачать оптимизацию? (y/n)');
    
    // В реальном использовании здесь был бы ввод пользователя
    // Для автоматизации просто продолжаем
    console.log('Начинаем оптимизацию...\n');
    
    // Обрабатываем все изображения
    processDirectory(spritesDir);
    
    console.log('\nОптимизация завершена!');
    
    if (CONFIG.createBackup) {
        console.log(`Резервные копии сохранены в папке: ${CONFIG.backupFolder}`);
    }
}

// Запускаем скрипт
if (require.main === module) {
    main();
}

module.exports = { optimizeImageWithImageMagick, calculateNewSize, getSpriteType }; 