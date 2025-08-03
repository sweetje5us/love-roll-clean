@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

REM --- Love Roll Specific Variables ---
set APP_PACKAGE_NAME=com.loveroll.game
set APP_DISPLAY_NAME="Love Roll"
set KEYSTORE_NAME=love_roll_release.keystore
set KEYSTORE_ALIAS=loverollrelease
set KEYSTORE_PASS=LoveRollPass2024
set KEYSTORE_DNAME="CN=Love Roll,O=LoveRoll,C=RU"
set OUTPUT_APK_NAME=LoveRoll_v1.0.0.apk
set TEMP_DIR=E:\cordova_temp_loveroll_release
REM --- End Love Roll Specific Variables ---

echo ========================================
echo Android APK Build Setup for Love ^& Roll
echo ========================================

REM Проверяем наличие Java
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo Error: Java not found at %JAVA_HOME%
    echo Please check JAVA_HOME path
    pause
    exit /b 1
)

echo Checking for running emulator...
adb devices | find "emulator" > nul
if %errorlevel% neq 0 (
    echo Error: No running emulator found.
    echo Please start an emulator in Android Studio first.
    pause
    exit /b 1
)

REM Закрываем все процессы, которые могут блокировать файлы
echo Closing potentially blocking processes...
taskkill /F /IM java.exe /T > nul 2>&1
taskkill /F /IM node.exe /T > nul 2>&1
taskkill /F /IM gradle.exe /T > nul 2>&1
timeout /t 3 /nobreak > nul

REM Создаем временную директорию на диске E
echo Creating temporary directory: %TEMP_DIR%
if exist "%TEMP_DIR%" (
    echo Removing old temporary directory...
    rmdir /s /q "%TEMP_DIR%" 2>nul
    if exist "%TEMP_DIR%" (
        echo Warning: Could not remove old directory, trying alternative method...
        cd /d "%TEMP_DIR%"
        del /f /q *.* > nul 2>&1
        cd ..
        rmdir /s /q "%TEMP_DIR%" 2>nul
    )
)
mkdir "%TEMP_DIR%"

REM Переходим во временную директорию
cd /d "%TEMP_DIR%"

REM Проверяем наличие исходных файлов
if not exist "%~dp0public" (
    echo Error: Source public directory not found
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Инициализируем проект заново
echo Initializing Cordova project (%APP_PACKAGE_NAME% - %APP_DISPLAY_NAME%)...
call cordova create . %APP_PACKAGE_NAME% %APP_DISPLAY_NAME%
if %errorlevel% neq 0 (
    echo Error: Failed to initialize Cordova project
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем файлы проекта в www папку Cordova (собранная React версия)
echo Copying project files to Cordova www (built React version)...
xcopy /E /I /Y "%~dp0build\*" "www\"
if %errorlevel% neq 0 (
    echo Error: Failed to copy project files to Cordova www
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем Font Awesome файлы
echo Copying Font Awesome files...
xcopy /E /I /Y "%~dp0public\static\css\*" "www\static\css\"
xcopy /E /I /Y "%~dp0public\static\webfonts\*" "www\static\webfonts\"

REM Адаптируем готовый index.html из React сборки для Cordova
echo Adapting ready-made index.html from React build for Cordova...
echo Replacing CDN Font Awesome with local version...
powershell -Command "(Get-Content 'www\index.html') -replace 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', './static/css/all.css' | Set-Content 'www\index.html'"

echo Improving viewport for mobile...
powershell -Command "(Get-Content 'www\index.html') -replace 'width=device-width,initial-scale=1', 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no' | Set-Content 'www\index.html'"

echo Adding meta tags for Cordova...
powershell -Command "(Get-Content 'www\index.html') -replace '<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">', '<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\"><meta name=\"format-detection\" content=\"telephone=no\"><meta name=\"msapplication-tap-highlight\" content=\"no\">' | Set-Content 'www\index.html'"

REM Копируем config.xml (максимально оптимизированный)
echo Copying config.xml (performance optimized)...
copy /Y "%~dp0config_loveroll_performance.xml" "config.xml"
if %errorlevel% neq 0 (
    echo Error: Failed to copy config_loveroll_performance.xml to config.xml
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Устанавливаем зависимости
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Устанавливаем платформу Android
echo Adding Android platform...
call cordova platform add android@12.0.1 --nofetch --verbose
if %errorlevel% neq 0 (
    echo Error: Failed to add Android platform 12.0.1
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Создаем файл с настройками сборки gradle.properties (оптимизированные)
echo Creating optimized build configuration (gradle.properties)...
echo android.useAndroidX=true> platforms\android\gradle.properties
echo android.enableJetifier=true>> platforms\android\gradle.properties
echo android.defaults.buildfeatures.buildconfig=true>> platforms\android\gradle.properties
echo android.nonTransitiveRClass=true>> platforms\android\gradle.properties
echo org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8 -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:+UseStringDeduplication>> platforms\android\gradle.properties
echo org.gradle.daemon=false>> platforms\android\gradle.properties
echo org.gradle.parallel=true>> platforms\android\gradle.properties
echo org.gradle.configureondemand=true>> platforms\android\gradle.properties
echo org.gradle.java.home=%JAVA_HOME:\=\\%>> platforms\android\gradle.properties
echo android.enableR8.fullMode=true>> platforms\android\gradle.properties
echo android.enableR8.minification=true>> platforms\android\gradle.properties
echo android.enableR8.shrinking=true>> platforms\android\gradle.properties
echo android.suppressUnsupportedCompileSdk=34>> platforms\android\gradle.properties

REM Создаем local.properties с корректным путем к SDK
echo Creating local.properties...
echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\local.properties

REM Устанавливаем плагины
echo Installing plugins...
call cordova plugin add cordova-plugin-whitelist@1.3.5
if %errorlevel% neq 0 (
    echo Warning: Failed to add whitelist plugin, continuing without it...
)

call cordova plugin add cordova-plugin-splashscreen@6.0.1
if %errorlevel% neq 0 (
    echo Error: Failed to add splashscreen plugin
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Installing statusbar plugin...
call cordova plugin add cordova-plugin-statusbar@2.4.3
if %errorlevel% neq 0 (
    echo Warning: Failed to add statusbar plugin, continuing without it...
)

echo Installing app version plugin...
call cordova plugin add cordova-plugin-app-version
if %errorlevel% neq 0 (
    echo Warning: Failed to add app version plugin, continuing without it...
)

REM Настройка WebView для максимальной производительности
echo Setting up WebView for maximum performance...
echo ^<?xml version="1.0" encoding="utf-8"?^>^<webview xmlns:android="http://schemas.android.com/apk/res/android" android:layout_width="match_parent" android:layout_height="match_parent" android:hardwareAccelerated="true" android:layerType="hardware" android:overScrollMode="never" android:scrollbars="none" /^> > platforms\android\app\src\main\res\layout\activity_main.xml

REM Создаем proguard-rules.pro для максимальной оптимизации
echo Creating proguard-rules.pro for maximum optimization...
echo -dontwarn org.apache.cordova.**> platforms\android\app\proguard-rules.pro
echo -keep class org.apache.cordova.** { *; }>> platforms\android\app\proguard-rules.pro
echo -keep class com.loveroll.game.** { *; }>> platforms\android\app\proguard-rules.pro
echo -keepattributes *Annotation*>> platforms\android\app\proguard-rules.pro
echo -keepattributes SourceFile,LineNumberTable>> platforms\android\app\proguard-rules.pro
echo -keep class * implements android.os.Parcelable {>> platforms\android\app\proguard-rules.pro
echo   public static final android.os.Parcelable$Creator *;>> platforms\android\app\proguard-rules.pro
echo }>> platforms\android\app\proguard-rules.pro

REM Проверяем существование keystore
if exist "%~dp0%KEYSTORE_NAME%" (
    echo Keystore file exists, checking alias...
    
    REM Проверяем существование алиаса
    "%JAVA_HOME%\bin\keytool.exe" -list -alias %KEYSTORE_ALIAS% -keystore "%~dp0%KEYSTORE_NAME%" -storepass %KEYSTORE_PASS% > nul 2>&1
    if %errorlevel% equ 0 (
        echo Keystore and alias exist, skipping creation...
        goto SKIP_CREATE_KEYSTORE
    ) else (
        echo Keystore exists but alias not found, recreating keystore...
        del /F /Q "%~dp0%KEYSTORE_NAME%"
    )
)

echo Creating new keystore for Love Roll...
"%JAVA_HOME%\bin\keytool.exe" -genkey -v -keystore "%~dp0%KEYSTORE_NAME%" -alias %KEYSTORE_ALIAS% -keyalg RSA -keysize 2048 -validity 10000 -storepass %KEYSTORE_PASS% -keypass %KEYSTORE_PASS% -dname %KEYSTORE_DNAME% -storetype PKCS12
if %errorlevel% neq 0 (
    echo Error: Failed to create keystore
    cd /d "%~dp0"
    pause
    exit /b 1
)

:SKIP_CREATE_KEYSTORE
echo Keystore check/creation completed.

REM Копируем keystore во временную директорию
echo Copying keystore %KEYSTORE_NAME% to temporary directory...
copy /Y "%~dp0%KEYSTORE_NAME%" "%TEMP_DIR%\%KEYSTORE_NAME%"
if %errorlevel% neq 0 (
    echo Error: Failed to copy keystore
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Создаем файл с настройками подписи (build.json)
echo Creating build.json for signing configuration...
echo {                                                               > build.json
echo   "android": {                                                 >> build.json
echo     "release": {                                               >> build.json
echo       "keystore": "%KEYSTORE_NAME%",                           >> build.json
echo       "storePassword": "%KEYSTORE_PASS%",                      >> build.json
echo       "alias": "%KEYSTORE_ALIAS%",                             >> build.json
echo       "password": "%KEYSTORE_PASS%",                           >> build.json
echo       "keystoreType": "PKCS12"                                 >> build.json
echo     }                                                           >> build.json
echo   }                                                             >> build.json
echo }                                                               >> build.json

REM Устанавливаем переменные окружения для сборки
set GRADLE_OPTS="-Dorg.gradle.daemon=false -Dfile.encoding=UTF-8"
set JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"

set UNSIGNED_APK_PATH=platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH=platforms\android\app\build\outputs\apk\release\%OUTPUT_APK_NAME%

echo Building Love Roll release version...
call cordova build android --release -- --buildConfig=build.json --packageType=apk --gradleArg=--no-daemon --gradleArg=--stacktrace --gradleArg=--info --gradleArg=--refresh-dependencies
if %errorlevel% neq 0 (
    echo Build failed!
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Проверяем наличие unsigned APK
if not exist "%UNSIGNED_APK_PATH%" (
    echo Error: Unsigned APK not found at %UNSIGNED_APK_PATH%
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Переименовываем стандартный APK если он создался автоматически подписанным
if exist "platforms\android\app\build\outputs\apk\release\app-release.apk" (
    if not exist "%SIGNED_APK_PATH%" (
        echo Renaming automatically signed APK...
        ren "platforms\android\app\build\outputs\apk\release\app-release.apk" "%OUTPUT_APK_NAME%"
    )
)

REM Проверяем подпись
echo Verifying APK signature...
"%ANDROID_HOME%\build-tools\33.0.0\apksigner.bat" verify --verbose "%SIGNED_APK_PATH%"
if %errorlevel% neq 0 (
    echo Error: APK signature verification failed for %SIGNED_APK_PATH%
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем APK в основную директорию
echo Copying APK to main directory...
xcopy /Y "%SIGNED_APK_PATH%" "%~dp0%OUTPUT_APK_NAME%"
if %errorlevel% neq 0 (
    echo Warning: Failed to copy APK to main directory
)

REM Возвращаемся в основную директорию
cd /d "%~dp0"

echo Removing old app from emulator (%APP_PACKAGE_NAME%)...
adb shell pm uninstall -k %APP_PACKAGE_NAME%
if %errorlevel% neq 0 (
    echo Warning: Failed to remove old app, continuing anyway...
)

echo Installing and starting the application (%OUTPUT_APK_NAME% on %APP_PACKAGE_NAME%)...
adb install -r "%OUTPUT_APK_NAME%"
if %errorlevel% neq 0 (
    echo Installation failed!
    pause
    exit /b 1
)

adb shell am start -n %APP_PACKAGE_NAME%/.MainActivity
if %errorlevel% neq 0 (
    echo Warning: Failed to start app, but installation was successful
)

echo ========================================
echo Готово! Love Roll APK установлен и запущен.
echo ========================================
echo.
echo ИСПРАВЛЕНИЯ В РЕЛИЗНОЙ ВЕРСИИ:
echo - ИСПРАВЛЕНО: Убраны захардкоженные имена JS/CSS файлов
echo - ИСПРАВЛЕНО: Используется готовый index.html из React сборки  
echo - ИСПРАВЛЕНО: Автоматически подхватываются актуальные имена файлов
echo - ИСПРАВЛЕНО: Добавлены мета-теги для Cordova оптимизации
echo.
echo APK ОПТИМИЗАЦИИ ВКЛЮЧЕНЫ:
echo - Сборка в режиме RELEASE
echo - Полностью отключено логирование
echo - Включена обфускация кода (ProGuard/R8)
echo - Минификация и сжатие кода
echo - Оптимизация размера APK
echo - Подпись APK релизным ключом
echo - Максимальная производительность
echo - Отключены все отладочные функции
echo - Оптимизированная память
echo - Аппаратное ускорение включено
echo - WebView оптимизации для продакшена
echo - ProGuard правила для Cordova
echo - КРИТИЧНЫЕ ИСПРАВЛЕНИЯ:
echo   * android-keepRunning=false (отключен принудительный keep-alive)
echo   * Снижена память Gradle с 4GB до 2GB
echo   * Добавлены WebView оптимизации
echo   * Отключены ненужные файловые разрешения
echo   * Добавлены ProGuard правила
echo   * Оптимизированы настройки сборки
echo.
echo APK файл: %~dp0%OUTPUT_APK_NAME%
echo.
pause 