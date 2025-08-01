@echo off
echo ========================================
echo Исправление проблем с Android сборкой
echo ========================================

echo Проверка существования папки build...
if not exist "build" (
    echo Ошибка: Папка build не найдена. Сначала выполните npm run build
    pause
    exit /b 1
)

echo Проверка файлов в build/static/js/...
if not exist "build\static\js\main.*.js" (
    echo Ошибка: JavaScript файл не найден в build/static/js/
    pause
    exit /b 1
)

echo Проверка файлов в build/static/css/...
if not exist "build\static\css\main.*.css" (
    echo Ошибка: CSS файл не найден в build/static/css/
    pause
    exit /b 1
)

echo Найденные файлы:
for %%f in (build\static\js\main.*.js) do echo JS: %%~nxf
for %%f in (build\static\css\main.*.css) do echo CSS: %%~nxf

echo.
echo Проверка index.html...
if exist "build\index.html" (
    echo index.html найден
    findstr "main\." build\index.html
) else (
    echo Ошибка: index.html не найден
)

echo.
echo Проверка Font Awesome файлов...
if exist "build\static\css\all.css" (
    echo Font Awesome CSS найден
) else (
    echo Предупреждение: Font Awesome CSS не найден
)

if exist "build\static\webfonts" (
    echo Font Awesome webfonts найдены
) else (
    echo Предупреждение: Font Awesome webfonts не найдены
)

echo.
echo ========================================
echo Проверка завершена
echo ========================================
pause 