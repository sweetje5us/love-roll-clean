@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

echo ========================================
echo Android Build Setup for Love & Roll (Final Optimized)
echo ========================================

echo Проверка эмулятора...
adb devices | find "emulator" > nul
if %errorlevel% neq 0 (
    echo Ошибка: Эмулятор не найден.
    echo Пожалуйста, запустите эмулятор в Android Studio.
    pause
    exit /b 1
)

echo Создание временной директории...
set TEMP_DIR=E:\cordova_temp_loveroll_debug
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" 2>nul
mkdir "%TEMP_DIR%"

cd /d "%TEMP_DIR%"

echo Инициализация проекта...
call cordova create . com.loveroll.game "LoveRoll"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось инициализировать проект
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование файлов проекта (собранная React версия)...
xcopy /E /I /Y "%~dp0build\*" "www\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать файлы проекта
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование Font Awesome файлов...
xcopy /E /I /Y "%~dp0public\static\css\*" "www\static\css\"
xcopy /E /I /Y "%~dp0public\static\webfonts\*" "www\static\webfonts\"

echo Адаптация готового index.html для Cordova...
echo Замена CDN Font Awesome на локальную версию...
powershell -Command "(Get-Content 'www\index.html') -replace 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', './static/css/all.css' | Set-Content 'www\index.html'"

echo Улучшение viewport для мобильного...
powershell -Command "(Get-Content 'www\index.html') -replace 'width=device-width,initial-scale=1', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no' | Set-Content 'www\index.html'"

echo Добавление мета-тегов для Cordova...
powershell -Command "(Get-Content 'www\index.html') -replace '<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">', '<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\"><meta name=\"format-detection\" content=\"telephone=no\"><meta name=\"msapplication-tap-highlight\" content=\"no\">' | Set-Content 'www\index.html'"

echo Копирование config.xml...
copy /Y "%~dp0config_loveroll_clean.xml" "config.xml" 
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать config_loveroll_clean.xml в config.xml
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Установка зависимостей...
call npm install
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось установить зависимости
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Установка платформы Android...
call cordova platform add android@12.0.1 --nofetch
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось добавить платформу Android 12.0.1
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Creating optimized build configuration (gradle.properties)...
echo android.useAndroidX=true> platforms\android\gradle.properties
echo android.enableJetifier=true>> platforms\android\gradle.properties
echo android.defaults.buildfeatures.buildconfig=true>> platforms\android\gradle.properties
echo android.nonTransitiveRClass=true>> platforms\android\gradle.properties
echo org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8 -XX:+UseG1GC -XX:MaxGCPauseMillis=200>> platforms\android\gradle.properties
echo org.gradle.daemon=false>> platforms\android\gradle.properties
echo org.gradle.parallel=true>> platforms\android\gradle.properties
echo org.gradle.configureondemand=true>> platforms\android\gradle.properties
echo org.gradle.java.home=%JAVA_HOME:\=\\%>> platforms\android\gradle.properties
echo android.enableR8.fullMode=true>> platforms\android\gradle.properties
echo android.suppressUnsupportedCompileSdk=34>> platforms\android\gradle.properties

echo Creating local.properties...
echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\local.properties

echo Установка плагинов...
call cordova plugin add cordova-plugin-splashscreen@6.0.1
call cordova plugin add cordova-plugin-statusbar@2.4.3
call cordova plugin add cordova-plugin-app-version
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось установить плагины
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Настройка WebView для максимальной производительности...
echo ^<?xml version="1.0" encoding="utf-8"?^>^<webview xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:hardwareAccelerated="true" android:layerType="hardware" /^> > platforms\android\app\src\main\res\layout\activity_main.xml

echo Сборка приложения...
call cordova build android --debug
if %errorlevel% neq 0 (
    echo Ошибка сборки!
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Установка приложения на эмулятор...
adb install -r "platforms\android\app\build\outputs\apk\debug\app-debug.apk"
if %errorlevel% neq 0 (
    echo Ошибка установки!
    pause
    exit /b 1
)

echo Запуск приложения...
adb shell am start -n com.loveroll.game/.MainActivity

echo ========================================
echo Готово! Love & Roll должно быть запущено на эмуляторе.
echo ========================================
echo.
echo ИСПРАВЛЕНИЯ В ЭТОЙ ВЕРСИИ:
echo - ИСПРАВЛЕНО: Используем готовый index.html из React сборки
echo - ИСПРАВЛЕНО: Автоматически подхватываются актуальные имена JS/CSS файлов
echo - ИСПРАВЛЕНО: Добавлены настройки полноэкранного режима в config.xml
echo - ИСПРАВЛЕНО: Скрытие статус бара и системных кнопок
echo - ИСПРАВЛЕНО: Адаптация под 60/90/120 Hz экраны
echo - ИСПРАВЛЕНО: Игровые циклы используют delta time
echo - ИСПРАВЛЕНО: CSS анимации адаптируются под частоту экрана
echo.
echo ОПТИМИЗАЦИИ ВКЛЮЧЕНЫ:
echo - Font Awesome подключен локально (все иконки доступны)
echo - Отключено логирование в продакшн версии
echo - Оптимизирована загрузка персонажей
echo - Агрессивные CSS оптимизации для Cordova
echo - Ускоренные анимации (0.1s вместо стандартных)
echo - WebView оптимизации для производительности
echo - React Router оптимизации для быстрого переключения экранов
echo - Оптимизация памяти и сборка мусора
echo - Аппаратное ускорение включено
echo.
pause 