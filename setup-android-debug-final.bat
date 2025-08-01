@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM Environment setup
set JAVA_HOME=E:\apps\java
set ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=%ANDROID_HOME%
set GRADLE_HOME=E:\Gradle\gradle-8.13
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin
set PATH=%PATH%;%GRADLE_HOME%\bin

REM Force Java 17 compatibility for Gradle
set GRADLE_OPTS=-Dorg.gradle.java.home=E:\apps\java -Dorg.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8

REM Project variables
set APP_PACKAGE_NAME=com.loveroll.game
set APP_DISPLAY_NAME=LoveRoll
set TEMP_DIR=E:\cordova_temp_loveroll_debug

echo ========================================
echo Android Build Setup for Love & Roll (Final)
echo ========================================

REM Check emulator
echo [1/8] Checking emulator...
adb devices | find "emulator" > nul
if %errorlevel% neq 0 (
    echo ERROR: Emulator not found. Please start emulator in Android Studio.
    pause
    exit /b 1
)
echo OK: Emulator found

REM Check Gradle
echo [2/8] Checking Gradle installation...
if exist "%GRADLE_HOME%\bin\gradle.bat" (
    echo OK: Gradle found at %GRADLE_HOME%\bin\gradle.bat
) else (
    echo ERROR: Gradle not found at %GRADLE_HOME%\bin\gradle.bat
    pause
    exit /b 1
)

REM Check config files
echo [3/8] Checking configuration files...
if not exist "%~dp0config_loveroll_clean.xml" (
    echo ERROR: config_loveroll_clean.xml not found!
    pause
    exit /b 1
)
echo OK: config_loveroll_clean.xml found

REM Clean temp directory
echo [4/8] Preparing temp directory...
if exist "%TEMP_DIR%" (
    echo Removing old temp directory...
    rmdir /s /q "%TEMP_DIR%" 2>nul
)
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

REM Create Cordova project
echo [5/8] Creating Cordova project...
call cordova create . %APP_PACKAGE_NAME% %APP_DISPLAY_NAME%
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Cordova project
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo OK: Cordova project created

REM Copy files
echo [6/8] Copying project files...
echo Copying main files...
xcopy /E /I /Y "%~dp0public\*" "www\" >nul 2>&1
xcopy /E /I /Y "%~dp0src\*" "www\src\" >nul 2>&1
xcopy /E /I /Y "%~dp0sprites\*" "www\sprites\" >nul 2>&1

echo Copying clean config.xml...
copy /Y "%~dp0config_loveroll_clean.xml" "config.xml" >nul 2>&1
if not exist "config.xml" (
    echo ERROR: Failed to copy config.xml
    cd /d "%~dp0"
    pause
    exit /b 1
)
echo OK: Files copied

REM Install dependencies
echo [7/8] Installing dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Issues with npm install, continuing...
)

REM Add Android platform
echo [8/8] Installing Android platform...
call cordova platform add android --nofetch >nul 2>&1
if %errorlevel% neq 0 (
    echo Trying specific version...
    call cordova platform add android@13.0.0 --nofetch >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: Failed to add Android platform
        cd /d "%~dp0"
        pause
        exit /b 1
    )
)

REM Verify platform was added
if exist "platforms\android" (
    echo OK: Android platform installed successfully
) else (
    echo ERROR: Android platform not found
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Setup Gradle with proper configuration
echo Setting up Gradle configuration...
if exist "platforms\android" (
    echo Creating gradle.properties...
    if exist "platforms\android\gradle.properties" del "platforms\android\gradle.properties"
    
    (
        echo android.useAndroidX=true
        echo android.enableJetifier=true
        echo android.defaults.buildfeatures.buildconfig=true
        echo android.nonTransitiveRClass=true
        echo org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8 --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED
        echo org.gradle.daemon=false
        echo org.gradle.parallel=true
        echo org.gradle.configureondemand=true
        echo org.gradle.java.home=E:\\apps\\java
        echo org.gradle.wrapper.gradle-version=8.13
        echo org.gradle.warning.mode=all
    ) > platforms\android\gradle.properties

    echo Creating local.properties...
    if exist "platforms\android\local.properties" del "platforms\android\local.properties"
    echo sdk.dir=%ANDROID_HOME:\=\\% > platforms\android\local.properties

    echo Gradle configuration completed
)

REM Install plugins after platform is added
echo Installing plugins...
call cordova plugin add cordova-plugin-splashscreen@6.0.1 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Failed to install splashscreen plugin
)

call cordova plugin add cordova-plugin-statusbar@2.4.3 >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Failed to install statusbar plugin
)

call cordova plugin add cordova-plugin-app-version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Failed to install app-version plugin
)

REM Build application
echo Building application...
call cordova build android --debug
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Check if APK was actually created
if exist "platforms\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo OK: Application built successfully
) else (
    echo ERROR: APK file not found despite successful build
    cd /d "%~dp0"
    pause
    exit /b 1
)

REM Install on emulator
echo Installing on emulator...
adb install -r "platforms\android\app\build\outputs\apk\debug\app-debug.apk" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Issues installing on emulator
)

REM Launch application
echo Launching application...
adb shell am start -n %APP_PACKAGE_NAME%/.MainActivity >nul 2>&1

echo ========================================
echo SUCCESS: Build completed!
echo Love & Roll should be running on emulator
echo ========================================
pause 