@echo off
echo ========================================
echo Gradle Environment Check
echo ========================================

echo [1] Checking JAVA_HOME...
if defined JAVA_HOME (
    echo JAVA_HOME: %JAVA_HOME%
    if exist "%JAVA_HOME%\bin\java.exe" (
        echo ✅ Java found at: %JAVA_HOME%\bin\java.exe
    ) else (
        echo ❌ Java not found at: %JAVA_HOME%\bin\java.exe
    )
) else (
    echo ❌ JAVA_HOME not set
)

echo.
echo [2] Checking ANDROID_HOME...
if defined ANDROID_HOME (
    echo ANDROID_HOME: %ANDROID_HOME%
    if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
        echo ✅ ADB found at: %ANDROID_HOME%\platform-tools\adb.exe
    ) else (
        echo ❌ ADB not found at: %ANDROID_HOME%\platform-tools\adb.exe
    )
) else (
    echo ❌ ANDROID_HOME not set
)

echo.
echo [3] Checking Gradle installations...
echo Checking PATH for gradle...
gradle --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Gradle found in PATH
    gradle --version | find "Gradle"
) else (
    echo ❌ Gradle not found in PATH
)

echo.
echo [4] Checking specific Gradle locations...
set GRADLE_LOCATIONS=E:\Gradle\gradle-8.13\bin\gradle.bat;C:\Users\nenav\.gradle\wrapper\dists\gradle-8.11.1-bin\bpt9gzteqjrbo1mjrsomdt32c\gradle-8.11.1\bin\gradle.bat

for %%g in (%GRADLE_LOCATIONS%) do (
    if exist "%%g" (
        echo ✅ Found: %%g
    ) else (
        echo ❌ Not found: %%g
    )
)

echo.
echo [5] Testing Cordova...
cordova --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Cordova found
    cordova --version
) else (
    echo ❌ Cordova not found
)

echo.
echo [6] Testing ADB...
adb version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ADB found
    adb version | find "Android Debug Bridge"
) else (
    echo ❌ ADB not found
)

echo.
echo ========================================
echo Check complete
echo ========================================
pause 