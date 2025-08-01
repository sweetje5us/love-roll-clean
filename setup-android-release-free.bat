@echo off
set JAVA_HOME=E:\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin
set PATH=%PATH%;E:\Gradle\gradle-8.13\bin

REM --- Free Version Specific Variables ---
set APP_PACKAGE_NAME_FREE=brainrot.animals.versus.free
set APP_DISPLAY_NAME_FREE="Brainrot Animals Versus Free"
set KEYSTORE_NAME_FREE=brainrot_animals_versus_free.keystore
set KEYSTORE_ALIAS_FREE=brainrotanimalsversusfree
set KEYSTORE_PASS_FREE=BrainrotPassFree2024
set KEYSTORE_DNAME_FREE="CN=Brainrot Animals Versus Free,O=YourOrganization,C=RU"
set OUTPUT_APK_NAME_FREE=BrainrotAnimalsVersus_Free_v1.1.0.apk
set CONFIG_JS_SOURCE_FREE="%~dp0www\js\config_free.js"
set CONFIG_XML_SOURCE_FREE="%~dp0config_free.xml"
set TEMP_DIR_FREE=E:\cordova_temp_release_free
set RUSTORE_CONSOLE_ID_FREE="2063628745"
set RUSTORE_DEEPLINK_SCHEME_FREE="brainrot-sweetjesus"
REM --- End Free Version Specific Variables ---

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
echo Creating temporary directory: %TEMP_DIR_FREE%
if exist "%TEMP_DIR_FREE%" (
    echo Removing old temporary directory...
    rmdir /s /q "%TEMP_DIR_FREE%" 2>nul
    if exist "%TEMP_DIR_FREE%" (
        echo Warning: Could not remove old directory, trying alternative method...
        cd /d "%TEMP_DIR_FREE%"
        del /f /q *.* > nul 2>&1
        cd ..
        rmdir /s /q "%TEMP_DIR_FREE%" 2>nul
    )
)
mkdir "%TEMP_DIR_FREE%"

REM Переходим во временную директорию
cd /d "%TEMP_DIR_FREE%"

REM Проверяем наличие исходных файлов
if not exist "%~dp0www" (
    echo Error: Source www directory not found
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Инициализируем проект заново
echo Initializing Cordova project (%APP_PACKAGE_NAME_FREE% - %APP_DISPLAY_NAME_FREE%)...
call cordova create . %APP_PACKAGE_NAME_FREE% %APP_DISPLAY_NAME_FREE%
if %errorlevel% neq 0 (
    echo Error: Failed to initialize Cordova project
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем файлы проекта в www папку Cordova
echo Copying project files to Cordova www...
xcopy /E /I /Y "%~dp0www\*" "www\"
if %errorlevel% neq 0 (
    echo Error: Failed to copy project files to Cordova www
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем app_config_free.js в www\js\config.js
echo Copying %CONFIG_JS_SOURCE_FREE% to www\js\config.js
copy /Y %CONFIG_JS_SOURCE_FREE% "www\js\config.js"
if %errorlevel% neq 0 (
    echo Error: Failed to copy %CONFIG_JS_SOURCE_FREE%
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем config_free.xml
echo Copying %CONFIG_XML_SOURCE_FREE% to config.xml
copy /Y %CONFIG_XML_SOURCE_FREE% "config.xml"
if %errorlevel% neq 0 (
    echo Error: Failed to copy %CONFIG_XML_SOURCE_FREE%
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

REM Копируем ad plugin ПОСЛЕ npm install
echo Copying ad plugin (after npm install)...
if not exist "%~dp0adPlugin" (
    echo Error: Source adPlugin directory not found at %~dp0adPlugin
    cd /d "%~dp0"
    pause
    exit /b 1
)
xcopy /E /I /Y "%~dp0adPlugin\*" "adPlugin\"
if %errorlevel% neq 0 (
    echo Error: Failed to copy ad plugin
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

REM Создаем файл с настройками сборки gradle.properties
echo Creating build configuration (gradle.properties)...
echo android.useAndroidX=true> platforms\android\gradle.properties
echo android.enableJetifier=true>> platforms\android\gradle.properties
REM echo sdk.dir=%ANDROID_HOME:\=\\%>> platforms\android\gradle.properties  <- Не рекомендуется здесь
echo android.defaults.buildfeatures.buildconfig=true>> platforms\android\gradle.properties
echo android.nonTransitiveRClass=true>> platforms\android\gradle.properties
echo org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8>> platforms\android\gradle.properties
echo org.gradle.daemon=false>> platforms\android\gradle.properties
echo org.gradle.parallel=true>> platforms\android\gradle.properties
echo org.gradle.configureondemand=true>> platforms\android\gradle.properties
echo org.gradle.java.home=%JAVA_HOME:\=\\%>> platforms\android\gradle.properties

REM Создаем local.properties с корректным путем к SDK
echo Creating local.properties...
echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\local.properties
REM echo sdk.dir=%ANDROID_HOME:\=\\%> platforms\android\app\local.properties

REM Устанавливаем плагины
echo Installing plugins...
REM call cordova plugin add cordova-plugin-whitelist@1.3.5
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

REM Устанавливаем ad plugin
echo Installing ad plugin...
echo About to call cordova plugin add ./adPlugin. Output will be redirected.
call cordova plugin add ./adPlugin > ad_plugin_add_output.txt 2>&1
set PLUGIN_ADD_ERRORLEVEL=%errorlevel%
echo --- Finished ad plugin install command. Errorlevel: %PLUGIN_ADD_ERRORLEVEL% ---
REM type ad_plugin_add_output.txt
REM if %PLUGIN_ADD_ERRORLEVEL% neq 0 (
REM     echo Error: Failed to add ad plugin (Errorlevel: %PLUGIN_ADD_ERRORLEVEL%)
REM     cd /d "%~dp0"
REM     pause
REM     exit /b 1
REM )

REM УДАЛЕНО ДЛЯ БЕСПЛАТНОЙ, НО ОСТАВЛЕНО КАК КОММЕНТАРИЙ: Установка RuStore Billing plugin
REM echo Installing RuStore Billing plugin...
REM call cordova plugin add E:\apps\android_games\meme_fighting\rustore-billing --variable CONSOLE_APPLICATION_ID=%RUSTORE_CONSOLE_ID_FREE% --variable DEEPLINK_SCHEME=%RUSTORE_DEEPLINK_SCHEME_FREE%

echo DEBUG: === CHECKPOINT AFTER PLUGIN_ADD_ERRORLEVEL_CHECK ===
echo DEBUG: About to check keystore existence: %KEYSTORE_NAME_FREE%
echo DEBUG: Full path for IF NOT EXIST: "%~dp0%KEYSTORE_NAME_FREE%"

REM Проверяем существование keystore
if exist "%~dp0%KEYSTORE_NAME_FREE%" (
    echo Keystore file exists, checking alias...
    
    REM Проверяем существование алиаса
    "%JAVA_HOME%\bin\keytool.exe" -list -alias %KEYSTORE_ALIAS_FREE% -keystore "%~dp0%KEYSTORE_NAME_FREE%" -storepass %KEYSTORE_PASS_FREE% > nul 2>&1
    if %errorlevel% equ 0 (
        echo Keystore and alias exist, skipping creation...
        goto SKIP_CREATE_KEYSTORE_FREE
    ) else (
        echo Keystore exists but alias not found, recreating keystore...
        del /F /Q "%~dp0%KEYSTORE_NAME_FREE%"
    )
)

echo Creating new keystore for free version...
"%JAVA_HOME%\bin\keytool.exe" -genkey -v -keystore "%~dp0%KEYSTORE_NAME_FREE%" -alias %KEYSTORE_ALIAS_FREE% -keyalg RSA -keysize 2048 -validity 10000 -storepass %KEYSTORE_PASS_FREE% -keypass %KEYSTORE_PASS_FREE% -dname %KEYSTORE_DNAME_FREE% -storetype PKCS12
if %errorlevel% neq 0 (
    echo Error: Failed to create keystore
    cd /d "%~dp0"
    pause
    exit /b 1
)

:SKIP_CREATE_KEYSTORE_FREE
echo Keystore check/creation completed.

REM Копируем keystore во временную директорию
echo Copying keystore %KEYSTORE_NAME_FREE% to temporary directory...
copy /Y "%~dp0%KEYSTORE_NAME_FREE%" "%TEMP_DIR_FREE%\%KEYSTORE_NAME_FREE%"
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
echo       "keystore": "%KEYSTORE_NAME_FREE%",                      >> build.json
echo       "storePassword": "%KEYSTORE_PASS_FREE%",                 >> build.json
echo       "alias": "%KEYSTORE_ALIAS_FREE%",                        >> build.json
echo       "password": "%KEYSTORE_PASS_FREE%",                      >> build.json
echo       "keystoreType": "PKCS12"                                 >> build.json
echo     }                                                           >> build.json
echo   }                                                             >> build.json
echo }                                                               >> build.json

REM Устанавливаем переменные окружения для сборки
set GRADLE_OPTS="-Dorg.gradle.daemon=false -Dfile.encoding=UTF-8"
set JAVA_TOOL_OPTIONS="-Dfile.encoding=UTF-8"

set UNSIGNED_APK_PATH_FREE=platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk
set SIGNED_APK_PATH_FREE=platforms\android\app\build\outputs\apk\release\%OUTPUT_APK_NAME_FREE%

echo --- Script paused before release build. ---
echo --- Open a new terminal, cd to %TEMP_DIR_FREE% and run the build command manually if needed. ---
echo --- Pausing for 30 seconds (or press Ctrl+C to stop script)... ---
timeout /t 30 /nobreak >nul

echo Building free release version...
call cordova build android --release -- --buildConfig=build.json --packageType=apk --gradleArg=--no-daemon --gradleArg=--stacktrace --gradleArg=--info --gradleArg=--refresh-dependencies
if %errorlevel% neq 0 (
    echo Build failed!
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Проверяем наличие unsigned APK
if not exist "%UNSIGNED_APK_PATH_FREE%" (
    echo Error: Unsigned APK not found at %UNSIGNED_APK_PATH_FREE%
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Подписываем APK с помощью apksigner (Cordova должен делать это сам при использовании build.json)
REM Этот шаг может быть избыточным если Cordova >=7 и build.json настроен правильно
REM Однако, если автоматическая подпись не сработает, этот блок можно раскомментировать.
REM echo Signing APK (manual step, may be redundant)...
REM "%ANDROID_HOME%\build-tools\33.0.0\apksigner.bat" sign --ks %KEYSTORE_NAME_FREE% --ks-pass pass:%KEYSTORE_PASS_FREE% --key-pass pass:%KEYSTORE_PASS_FREE% --out %SIGNED_APK_PATH_FREE% %UNSIGNED_APK_PATH_FREE%
REM if %errorlevel% neq 0 (
REM     echo Signing failed!
REM     cd /d "%~dp0"
REM     pause
REM     exit /b 1
REM )

REM Переименовываем стандартный APK если он создался автоматически подписанным
if exist "platforms\android\app\build\outputs\apk\release\app-release.apk" (
    if not exist "%SIGNED_APK_PATH_FREE%" (
        echo Renaming automatically signed APK...
        ren "platforms\android\app\build\outputs\apk\release\app-release.apk" "%OUTPUT_APK_NAME_FREE%"
    )
)


REM Проверяем подпись
echo Verifying APK signature...
"%ANDROID_HOME%\build-tools\33.0.0\apksigner.bat" verify --verbose "%SIGNED_APK_PATH_FREE%"
if %errorlevel% neq 0 (
    echo Error: APK signature verification failed for %SIGNED_APK_PATH_FREE%
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Копируем APK в основную директорию
echo Copying APK to main directory...
xcopy /Y "%SIGNED_APK_PATH_FREE%" "%~dp0%OUTPUT_APK_NAME_FREE%"
if %errorlevel% neq 0 (
    echo Warning: Failed to copy APK to main directory
)

REM Возвращаемся в основную директорию
cd /d "%~dp0"

echo Removing old app from emulator (%APP_PACKAGE_NAME_FREE%)...
adb shell pm uninstall -k %APP_PACKAGE_NAME_FREE%
if %errorlevel% neq 0 (
    echo Warning: Failed to remove old app, continuing anyway...
)

echo Installing and starting the application (%OUTPUT_APK_NAME_FREE% on %APP_PACKAGE_NAME_FREE%)...
adb install -r "%OUTPUT_APK_NAME_FREE%"
if %errorlevel% neq 0 (
    echo Installation failed!
    pause
    exit /b 1
)

adb shell am start -n %APP_PACKAGE_NAME_FREE%/.MainActivity
if %errorlevel% neq 0 (
    echo Warning: Failed to start app, but installation was successful
)

echo Done! The application should now be running on your emulator.
echo Free Release APK: %~dp0%OUTPUT_APK_NAME_FREE%
pause 