@echo off
echo ========================================
echo Восстановление спрайтов из резервных копий
echo ========================================
echo.

echo Проверка наличия Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ошибка: Node.js не найден!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo Проверка наличия резервных копий...
if not exist "sprites_backup" (
    echo Ошибка: Папка sprites_backup не найдена!
    echo Сначала создайте резервные копии с помощью optimize_sprites.bat
    pause
    exit /b 1
)

echo.
echo ВНИМАНИЕ: Это действие заменит все оптимизированные спрайты
echo на оригинальные версии из резервных копий.
echo.

set /p confirm="Продолжить восстановление? (y/n): "
if /i not "%confirm%"=="y" (
    echo Восстановление отменено.
    pause
    exit /b 0
)

echo.
echo Восстановление спрайтов...
node restore_sprites.js

echo.
echo ========================================
echo Восстановление завершено!
echo ========================================
echo.
pause 