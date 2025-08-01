@echo off
echo === Simple Cordova Test ===

echo Checking Cordova CLI...
cordova --version
if %errorlevel% neq 0 (
    echo ERROR: Cordova CLI not found!
    pause
    exit /b 1
)

echo Creating test directory...
set TEST_DIR=E:\cordova_test_simple
if exist "%TEST_DIR%" rmdir /s /q "%TEST_DIR%" 2>nul
mkdir "%TEST_DIR%"
cd /d "%TEST_DIR%"

echo Creating test project...
call cordova create . com.test.app "TestApp"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create test project
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Adding Android platform...
call cordova platform add android@12.0.1 --nofetch
if %errorlevel% neq 0 (
    echo ERROR: Failed to add Android platform
    cd /d "%~dp0"
    pause
    exit /b 1
)

echo Test completed successfully!
cd /d "%~dp0"
pause 