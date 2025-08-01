@echo off
chcp 65001 >nul
echo ========================================
echo Оптимизация спрайтов (ИСПРАВЛЕННАЯ)
echo ========================================

echo.
echo Проверка наличия Node.js...

node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не найден!
    echo Установите Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js найден!
echo.

echo Проверка наличия ImageMagick...

magick --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ImageMagick не найден!
    echo Установите ImageMagick: https://imagemagick.org/script/download.php
    echo После установки перезапустите скрипт.
    pause
    exit /b 1
)

echo ✅ ImageMagick найден!
echo.

echo Запуск оптимизации спрайтов...
node optimize_sprites_fixed.js

echo.
echo Для продолжения нажмите любую клавишу . . .
pause >nul 