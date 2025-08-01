@echo off
echo ========================================
echo Проверка всех файлов сборки Android
echo ========================================

echo Проверка существования папки build...
if not exist "build" (
    echo Ошибка: Папка build не найдена. Сначала выполните npm run build
    pause
    exit /b 1
)

echo.
echo ========================================
echo 1. Проверка основных файлов
echo ========================================

echo Проверка файлов в build/static/js/...
if not exist "build\static\js\main.*.js" (
    echo ❌ Ошибка: JavaScript файл не найден в build/static/js/
) else (
    echo ✅ JavaScript файлы найдены:
    for %%f in (build\static\js\main.*.js) do echo   - %%~nxf
)

echo.
echo Проверка файлов в build/static/css/...
if not exist "build\static\css\main.*.css" (
    echo ❌ Ошибка: CSS файл не найден в build/static/css/
) else (
    echo ✅ CSS файлы найдены:
    for %%f in (build\static\css\main.*.css) do echo   - %%~nxf
)

echo.
echo ========================================
echo 2. Проверка index.html
echo ========================================

if exist "build\index.html" (
    echo ✅ index.html найден
    echo.
    echo Содержимое index.html (ссылки на файлы):
    findstr "main\." build\index.html
) else (
    echo ❌ Ошибка: index.html не найден
)

echo.
echo ========================================
echo 3. Проверка Font Awesome файлов
echo ========================================

if exist "build\static\css\all.css" (
    echo ✅ Font Awesome CSS найден
) else (
    echo ⚠️  Предупреждение: Font Awesome CSS не найден
)

if exist "build\static\webfonts" (
    echo ✅ Font Awesome webfonts найдены
) else (
    echo ⚠️  Предупреждение: Font Awesome webfonts не найдены
)

echo.
echo ========================================
echo 4. Проверка скриптов сборки
echo ========================================

if exist "setup-android-debug-final-optimized.bat" (
    echo ✅ setup-android-debug-final-optimized.bat найден
) else (
    echo ❌ Ошибка: setup-android-debug-final-optimized.bat не найден
)

if exist "build_apk.bat" (
    echo ✅ build_apk.bat найден
) else (
    echo ❌ Ошибка: build_apk.bat не найден
)

if exist "fix-android-build.bat" (
    echo ✅ fix-android-build.bat найден
) else (
    echo ❌ Ошибка: fix-android-build.bat не найден
)

echo.
echo ========================================
echo 5. Проверка конфигурационных файлов
echo ========================================

if exist "config_loveroll_clean.xml" (
    echo ✅ config_loveroll_clean.xml найден
) else (
    echo ❌ Ошибка: config_loveroll_clean.xml не найден
)

if exist "public\static\css" (
    echo ✅ public\static\css найден
) else (
    echo ⚠️  Предупреждение: public\static\css не найден
)

if exist "public\static\webfonts" (
    echo ✅ public\static\webfonts найден
) else (
    echo ⚠️  Предупреждение: public\static\webfonts не найден
)

echo.
echo ========================================
echo Проверка завершена
echo ========================================
echo.
echo Рекомендации:
echo 1. Если есть ошибки ❌ - исправьте их перед сборкой
echo 2. Если есть предупреждения ⚠️ - проверьте, нужны ли эти файлы
echo 3. Если все ✅ - можно запускать сборку
echo.
pause 