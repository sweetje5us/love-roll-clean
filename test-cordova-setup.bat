@echo off
echo === Test Cordova Setup for LoveRoll ===

REM Проверяем наличие Cordova
echo Проверка Cordova CLI...
cordova --version
if %errorlevel% neq 0 (
    echo ОШИБКА: Cordova CLI не установлен!
    echo Установите: npm install -g cordova
    pause
    exit /b 1
)

REM Создаем тестовый проект
echo Создание тестового проекта...
set TEST_DIR=E:\cordova_test_loveroll
if exist "%TEST_DIR%" rmdir /s /q "%TEST_DIR%" 2>nul
mkdir "%TEST_DIR%"
cd /d "%TEST_DIR%"

echo Инициализация тестового проекта...
call cordova create . com.loveroll.test "LoveRollTest"
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось создать тестовый проект
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Добавление платформы Android...
call cordova platform add android@12.0.1 --nofetch
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось добавить платформу Android
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Проверка платформ...
call cordova platform ls
if %errorlevel% neq 0 (
    echo ОШИБКА: Платформы не найдены
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Добавление плагинов...
call cordova plugin add cordova-plugin-splashscreen@6.0.1
call cordova plugin add cordova-plugin-statusbar@2.4.3
call cordova plugin add cordova-plugin-app-version

echo Проверка плагинов...
call cordova plugin ls
if %errorlevel% neq 0 (
    echo ОШИБКА: Плагины не найдены
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Тестовая сборка...
call cordova build android --debug
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось собрать тестовый проект
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo === Тест успешно завершен! ===
echo Cordova настроен правильно.
echo Теперь можно запускать основные скрипты сборки.

cd /d "%~dp0"
pause 