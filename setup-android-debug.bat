@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

REM --- Love & Roll Specific Variables ---
set APP_PACKAGE_NAME=com.loveroll.game
set APP_DISPLAY_NAME="LoveRoll"
set TEMP_DIR=E:\cordova_temp_loveroll_debug
REM --- End Love & Roll Specific Variables ---

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

echo Проверка config_loveroll.xml...
if not exist "%~dp0config_loveroll.xml" (
    echo Ошибка: Файл config_loveroll.xml не найден!
    pause
    exit /b 1
)

echo Создание временной директории...
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%" 2>nul
mkdir "%TEMP_DIR%"

cd /d "%TEMP_DIR%"

echo Инициализация проекта...
call cordova create . %APP_PACKAGE_NAME% %APP_DISPLAY_NAME%
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось инициализировать проект
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование файлов проекта...
REM Копируем основные файлы игры
xcopy /E /I /Y "%~dp0public\*" "www\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать файлы проекта
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем исходный код React приложения
xcopy /E /I /Y "%~dp0src\*" "www\src\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать исходный код
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем стили
xcopy /E /I /Y "%~dp0src\styles\*" "www\styles\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать стили
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем данные
xcopy /E /I /Y "%~dp0src\data\*" "www\data\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать данные
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем утилиты
xcopy /E /I /Y "%~dp0src\utils\*" "www\utils\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать утилиты
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем контексты
xcopy /E /I /Y "%~dp0src\contexts\*" "www\contexts\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать контексты
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем движки
xcopy /E /I /Y "%~dp0src\engines\*" "www\engines\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать движки
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем компоненты
xcopy /E /I /Y "%~dp0src\components\*" "www\components\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать компоненты
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем спрайты
xcopy /E /I /Y "%~dp0sprites\*" "www\sprites\"
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать спрайты
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Копирование config.xml...
copy /Y "%~dp0config_loveroll.xml" "config.xml" 
if %errorlevel% neq 0 (
    echo Ошибка: Не удалось скопировать config_loveroll.xml в config.xml
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Проверка config.xml после копирования...
if not exist "config.xml" (
    echo Ошибка: config.xml не найден после копирования!
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
    echo Попробуем установить последнюю версию...
    call cordova platform add android --nofetch
    if %errorlevel% neq 0 (
        echo Ошибка: Не удалось добавить платформу Android
        cd /d "%~dp0"
        pause
        exit /b 1
    )
)

echo Проверка установки платформы...
call cordova platform ls
if %errorlevel% neq 0 (
    echo Ошибка: Платформа Android не установлена
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Создание директории для gradle.properties...
if not exist "platforms\android" (
    echo Ошибка: Директория platforms\android не найдена!
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Creating build configuration (gradle.properties)...
if exist "platforms\android\gradle.properties" (
    del "platforms\android\gradle.properties"
)
echo android.useAndroidX=true> platforms\android\gradle.properties
echo android.enableJetifier=true>> platforms\android\gradle.properties
echo android.defaults.buildfeatures.buildconfig=true>> platforms\android\gradle.properties
echo android.nonTransitiveRClass=true>> platforms\android\gradle.properties
echo org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8>> platforms\android\gradle.properties
echo org.gradle.daemon=false>> platforms\android\gradle.properties
echo org.gradle.parallel=true>> platforms\android\gradle.properties
echo org.gradle.configureondemand=true>> platforms\android\gradle.properties
echo org.gradle.java.home=%JAVA_HOME:\=\\%>> platforms\android\gradle.properties

echo Creating local.properties...
if exist "platforms\android\local.properties" (
    del "platforms\android\local.properties"
)
echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\local.properties

echo Установка плагинов...
call cordova plugin add cordova-plugin-splashscreen@6.0.1
if %errorlevel% neq 0 (
    echo Warning: Не удалось установить splashscreen plugin, продолжаем...
)

call cordova plugin add cordova-plugin-statusbar@2.4.3
if %errorlevel% neq 0 (
    echo Warning: Не удалось установить statusbar plugin, продолжаем...
)

call cordova plugin add cordova-plugin-app-version
if %errorlevel% neq 0 (
    echo Warning: Не удалось установить app-version plugin, продолжаем...
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
adb shell am start -n %APP_PACKAGE_NAME%/.MainActivity

echo Готово! Приложение Love & Roll должно быть запущено на эмуляторе.
pause 