@echo off
echo ========================================
echo Оптимизация спрайтов для мобильного приложения
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

echo Проверка наличия ImageMagick...
magick --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ВНИМАНИЕ: ImageMagick не найден!
    echo Для оптимизации изображений установите ImageMagick:
    echo https://imagemagick.org/script/download.php
    echo.
    echo Без ImageMagick будет использован упрощенный режим.
    echo.
    set /p continue="Продолжить в упрощенном режиме? (y/n): "
    if /i not "%continue%"=="y" (
        echo Оптимизация отменена.
        pause
        exit /b 1
    )
    echo.
    echo Запуск в упрощенном режиме (без ImageMagick)...
    node optimize_sprites_simple.js
    goto :end
)

echo.
echo Настройки оптимизации:
echo - Персонажи: максимум 512x512
echo - Предметы: максимум 256x256  
echo - UI элементы: максимум 128x128
echo - Достижения: максимум 128x128
echo - Спрайты страха: максимум 256x256
echo - Эпизоды: максимум 512x512
echo - Фоны: максимум 1024x768
echo - Качество JPEG: 85%%
echo - Сжатие PNG: 9/9
echo.

echo ВАЖНО: Будут созданы резервные копии в папке sprites_backup
echo.

set /p confirm="Начать оптимизацию спрайтов? (y/n): "
if /i not "%confirm%"=="y" (
    echo Оптимизация отменена.
    pause
    exit /b 0
)

echo.
echo Запуск оптимизации...
node optimize_sprites.js

echo.
echo ========================================
echo Оптимизация завершена!
echo ========================================
echo.
echo Резервные копии сохранены в папке: sprites_backup
echo.
echo Теперь вы можете:
echo 1. Протестировать оптимизированные спрайты в веб-версии
echo 2. Если результат устраивает - собрать мобильное приложение
echo 3. Если нужно откатиться - восстановить из папки sprites_backup
echo.

:end
pause 