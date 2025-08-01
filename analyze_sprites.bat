@echo off
echo ========================================
echo Анализ спрайтов проекта
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

echo.
echo Запуск анализа спрайтов...
node analyze_sprites.js

echo.
pause 