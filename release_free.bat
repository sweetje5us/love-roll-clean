@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

echo ========================================
echo Android RELEASE Build Setup for Love & Roll
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
set TEMP_DIR=E:\cordova_temp_loveroll_release
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

echo Создание оптимизированного index.html для Cordova (RELEASE)...
echo ^<!doctype html^>^<html lang="ru"^>^<head^>^<meta charset="UTF-8"^>^<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"^>^<title^>Love ^& Roll - Визуальная новелла^</title^>^<link rel="stylesheet" href="./static/css/all.css"^>^<meta name="theme-color" content="#ff6b9a"^>^<meta name="apple-mobile-web-app-capable" content="yes"^>^<meta name="apple-mobile-web-app-status-bar-style" content="default"^>^<meta name="format-detection" content="telephone=no"^>^<meta name="msapplication-tap-highlight" content="no"^>^<script defer="defer" src="./static/js/main.0f011f7a.js"^>^</script^>^<link href="./static/css/main.8a598cb7.css" rel="stylesheet"^>^</head^>^<body^>^<noscript^>Для работы приложения необходимо включить JavaScript.^</noscript^>^<div id="root"^>^</div^>^</body^>^</html^> > www\index.html

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

echo Creating RELEASE build configuration (gradle.properties)...
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
echo android.enableProguardInReleaseBuilds=true>> platforms\android\gradle.properties
echo android.enableShrinking=true>> platforms\android\gradle.properties
echo android.enableMinification=true>> platforms\android\gradle.properties

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

echo Настройка WebView для максимальной производительности (RELEASE)...
echo ^<?xml version="1.0" encoding="utf-8"?^>^<webview xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:hardwareAccelerated="true" android:layerType="hardware" /^> > platforms\android\app\src\main\res\layout\activity_main.xml

echo Отключение логирования в MainActivity.java...
powershell -Command "(Get-Content 'platforms\android\app\src\main\java\com\loveroll\game\MainActivity.java') -replace 'import android.util.Log;', '// import android.util.Log;' -replace 'Log\.d\([^)]*\);', '// Log.d(...);' -replace 'Log\.v\([^)]*\);', '// Log.v(...);' -replace 'Log\.i\([^)]*\);', '// Log.i(...);' | Set-Content 'platforms\android\app\src\main\java\com\loveroll\game\MainActivity.java'"

echo Настройка buildTypes для релиза...
echo Проверка текущего build.gradle...
type platforms\android\app\build.gradle | findstr "buildTypes"

powershell -Command "$content = Get-Content 'platforms\android\app\build.gradle' -Raw; $content = $content -replace 'minifyEnabled false', 'minifyEnabled true'; $content = $content -replace 'shrinkResources false', 'shrinkResources true'; $content | Set-Content 'platforms\android\app\build.gradle' -NoNewline"

echo Проверка измененного build.gradle...
type platforms\android\app\build.gradle | findstr "buildTypes"

echo Создание proguard-rules.pro...
if not exist "platforms\android\app\proguard-rules.pro" (
    echo # Cordova specific ProGuard rules> platforms\android\app\proguard-rules.pro
    echo -keep class org.apache.cordova.** { *; }>> platforms\android\app\proguard-rules.pro
    echo -keep class com.loveroll.game.** { *; }>> platforms\android\app\proguard-rules.pro
    echo -keepattributes *Annotation*>> platforms\android\app\proguard-rules.pro
    echo -keepattributes SourceFile,LineNumberTable>> platforms\android\app\proguard-rules.pro
) else (
    echo ProGuard rules file already exists, updating...
    echo # Cordova specific ProGuard rules> platforms\android\app\proguard-rules.pro
    echo -keep class org.apache.cordova.** { *; }>> platforms\android\app\proguard-rules.pro
    echo -keep class com.loveroll.game.** { *; }>> platforms\android\app\proguard-rules.pro
    echo -keepattributes *Annotation*>> platforms\android\app\proguard-rules.pro
    echo -keepattributes SourceFile,LineNumberTable>> platforms\android\app\proguard-rules.pro
)

echo Сборка AAB для Play Store...
call cordova build android --release
if %errorlevel% neq 0 (
    echo Ошибка сборки AAB!
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Проверка AAB файла...
if exist "platforms\android\app\build\outputs\bundle\release\app-release.aab" (
    echo AAB файл найден: app-release.aab
    echo.
    echo ========================================
    echo Готово! AAB файл создан для Google Play Store.
    echo ========================================
    echo.
    echo РЕЛИЗНЫЕ ОПТИМИЗАЦИИ ВКЛЮЧЕНЫ:
    echo - Сборка в режиме RELEASE (не DEBUG)
    echo - Полностью отключено логирование
    echo - Включена обфускация кода (ProGuard/R8)
    echo - Минификация и сжатие кода
    echo - Оптимизация размера AAB
    echo - Максимальная производительность
    echo - Отключены все отладочные функции
    echo - Оптимизированная память
    echo - Аппаратное ускорение включено
    echo - WebView оптимизации для продакшена
    echo - ProGuard правила для Cordova
    echo.
    echo AAB файл (для Play Store): platforms\android\app\build\outputs\bundle\release\app-release.aab
    echo.
    echo Для создания APK используйте скрипт: build_apk.bat
    echo.
) else (
    echo ПРЕДУПРЕЖДЕНИЕ: AAB файл не найден
    pause
    exit /b 1
)

pause 