@echo off
chcp 65001 >nul
echo ========================================
echo Очистка дублированных файлов
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

echo Запуск очистки дублированных файлов...
node clean_duplicates.js

echo.
echo Для продолжения нажмите любую клавишу . . .
pause >nul 