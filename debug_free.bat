@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

echo Удаление старых папок в основном проекте...
cd /d "%~dp0"
if exist "plugins" rmdir /s /q "plugins" 2>nul

echo Проверка эмулятора...
adb devices | find "emulator" > nul
if %errorlevel% neq 0 (
    echo Ошибка: Эмулятор не найден.
    echo Пожалуйста, запустите эмулятор в Android Studio.
    pause
    exit /b 1
)

echo Создание временной директории...
set TEMP_DIR=E:\cordova_temp_free
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" 2>nul
mkdir "%TEMP_DIR%"

cd /d "%TEMP_DIR%"

echo Инициализация проекта...
call cordova create . brainrot.animals.versus.free "Brainrot Animal Versus Free"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось инициализировать проект
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование файлов проекта...
xcopy /E /I /Y "%~dp0www\*" "www\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать файлы проекта
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование app_config_free.js в www\js\config.js
copy /Y "%~dp0www\js\config_free.js" "www\js\config.js"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать config_free.js
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование config.xml...
copy /Y "%~dp0config_free.xml" "config.xml" 
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать config_free.xml в config.xml
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM <<< НОВОЕ: Копирование ресурсов (иконки, сплеши) >>>
REM echo Копирование папки res (ресурсы)...
REM xcopy /E /I /Y "%~dp0res\*" "res\"
REM if %errorlevel% neq 0 (
REM     echo Ошибка: Не удалось скопировать папку res
REM     echo Убедитесь, что папка res существует в %~dp0
REM     cd /d "%~dp0"
REM     pause
REM     exit /b 1
REM )
REM <<< КОНЕЦ НОВОГО >>>

echo Копирование плагина рекламы...
xcopy /E /I /Y "%~dp0adPlugin\*" "adPlugin\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать плагин рекламы
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

REM <<< НАЧАЛО: Добавляем создание gradle.properties >>>
echo Creating build configuration (gradle.properties)...
echo android.useAndroidX=true> platforms\android\gradle.properties
echo android.enableJetifier=true>> platforms\android\gradle.properties
echo android.defaults.buildfeatures.buildconfig=true>> platforms\android\gradle.properties
echo android.nonTransitiveRClass=true>> platforms\android\gradle.properties
echo org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8>> platforms\android\gradle.properties
echo org.gradle.daemon=false>> platforms\android\gradle.properties
echo org.gradle.parallel=true>> platforms\android\gradle.properties
echo org.gradle.configureondemand=true>> platforms\android\gradle.properties
echo org.gradle.java.home=%JAVA_HOME:\=\\%>> platforms\android\gradle.properties
REM <<< КОНЕЦ: Добавляем создание gradle.properties >>>

REM <<< НАЧАЛО: Добавляем создание local.properties >>>
echo Creating local.properties...
echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\local.properties
REM <<< КОНЕЦ: Добавляем создание local.properties >>>

echo Установка плагинов...
REM call cordova plugin add cordova-plugin-whitelist@1.3.5
call cordova plugin add cordova-plugin-splashscreen@6.0.1
call cordova plugin add cordova-plugin-statusbar@2.4.3
call cordova plugin add ./adPlugin
call cordova plugin add cordova-plugin-app-version
REM call cordova plugin add E:\\apps\\android_games\\meme_fighting\\rustore-billing --variable CONSOLE_APPLICATION_ID="2063628745" --variable DEEPLINK_SCHEME="brainrot-sweetjesus"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось установить плагины
    cd /d "%~dp0"
    pause
    exit /b 1
)

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
adb shell am start -n brainrot.animals.versus.free/.MainActivity

echo Готово! Приложение должно быть запущено на эмуляторе.
pause 