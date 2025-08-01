const fs = require('fs');
const path = require('path');

const BACKUP_FOLDER = 'sprites_backup';
const SPRITES_FOLDER = 'public/sprites';

function restoreSprites() {
    console.log('Восстановление спрайтов из резервных копий...');
    
    if (!fs.existsSync(BACKUP_FOLDER)) {
        console.log('Папка с резервными копиями не найдена!');
        return;
    }
    
    if (!fs.existsSync(SPRITES_FOLDER)) {
        console.log('Папка sprites не найдена!');
        return;
    }
    
    let restoredCount = 0;
    let errorCount = 0;
    
    function restoreDirectory(backupPath, targetPath) {
        if (!fs.existsSync(backupPath)) return;
        
        const items = fs.readdirSync(backupPath);
        
        for (const item of items) {
            const backupItemPath = path.join(backupPath, item);
            const targetItemPath = path.join(targetPath, item);
            const stat = fs.statSync(backupItemPath);
            
            if (stat.isDirectory()) {
                // Создаем папку если её нет
                if (!fs.existsSync(targetItemPath)) {
                    fs.mkdirSync(targetItemPath, { recursive: true });
                }
                restoreDirectory(backupItemPath, targetItemPath);
            } else if (stat.isFile()) {
                try {
                    // Создаем папку если её нет
                    const targetDir = path.dirname(targetItemPath);
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                    }
                    
                    // Копируем файл
                    fs.copyFileSync(backupItemPath, targetItemPath);
                    console.log(`Восстановлен: ${path.relative(SPRITES_FOLDER, targetItemPath)}`);
                    restoredCount++;
                } catch (error) {
                    console.log(`Ошибка восстановления ${item}: ${error.message}`);
                    errorCount++;
                }
            }
        }
    }
    
    // Восстанавливаем все файлы из резервной копии
    restoreDirectory(BACKUP_FOLDER, SPRITES_FOLDER);
    
    console.log(`\nВосстановление завершено!`);
    console.log(`Восстановлено файлов: ${restoredCount}`);
    if (errorCount > 0) {
        console.log(`Ошибок: ${errorCount}`);
    }
}

// Запускаем восстановление
if (require.main === module) {
    restoreSprites();
}

module.exports = { restoreSprites }; 