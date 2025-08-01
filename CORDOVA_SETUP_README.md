# Love & Roll - Cordova Android Setup

## Описание
Этот проект содержит скрипты для сборки Android приложения Love & Roll с помощью Apache Cordova.

## Требования
- Java JDK 8 или выше
- Android SDK
- Gradle
- Node.js и npm
- Apache Cordova CLI
- Android Studio (для эмулятора)

## Установка зависимостей

### 1. Установка Cordova CLI
```bash
npm install -g cordova
```

### 2. Проверка переменных окружения
Убедитесь, что в скриптах правильно указаны пути:
- `JAVA_HOME=E:\java`
- `ANDROID_HOME=C:\Users\nenav\AppData\Local\Android\Sdk`
- `PATH` содержит пути к Android SDK и Gradle

## Использование

### Тестирование настройки
```bash
test-cordova-setup.bat
```
Проверяет правильность настройки Cordova и создает тестовый проект.

### Debug версия
```bash
setup-android-debug.bat
```
Создает debug APK и устанавливает на эмулятор.

### Release версия
```bash
setup-android-release.bat
```
Создает подписанный release APK.

## Структура файлов

### Скрипты сборки
- `setup-android-debug.bat` - сборка debug версии
- `setup-android-release.bat` - сборка release версии

### Конфигурация
- `config_loveroll.xml` - конфигурация Cordova
- `package_cordova.json` - зависимости Cordova

### Временные директории
- `E:\cordova_temp_loveroll_debug` - для debug сборки
- `E:\cordova_temp_loveroll_release` - для release сборки

## Настройки приложения

### Пакет
- Имя пакета: `com.loveroll.game`
- Отображаемое имя: `Love & Roll`
- Версия: `1.0.0`

### Keystore (для release)
- Файл: `loveroll_game.keystore`
- Алиас: `loverollgame`
- Пароль: `LoveRollPass2024`

## Плагины
- `cordova-plugin-splashscreen` - экран загрузки
- `cordova-plugin-statusbar` - управление статус-баром
- `cordova-plugin-app-version` - получение версии приложения

## Устранение неполадок

### Ошибка "Java not found"
Проверьте путь `JAVA_HOME` в скриптах.

### Ошибка "Android SDK not found"
Проверьте путь `ANDROID_HOME` в скриптах.

### Ошибка "No running emulator"
Запустите эмулятор в Android Studio перед запуском скрипта.

### Ошибка "Parsing config.xml failed"
1. Запустите тестовый скрипт: `test-cordova-setup.bat`
2. Убедитесь, что Cordova CLI установлен: `npm install -g cordova`
3. Проверьте версию Cordova: `cordova --version`

### Ошибка "No platforms added"
1. Убедитесь, что Android SDK установлен
2. Проверьте переменные окружения
3. Запустите тестовый скрипт для диагностики

### Ошибка сборки
1. Убедитесь, что все зависимости установлены
2. Проверьте версии Android SDK и Gradle
3. Очистите временные директории
4. Запустите тестовый скрипт: `test-cordova-setup.bat`

## Примечания
- Скрипты автоматически создают keystore для подписи release версии
- Все файлы проекта копируются во временную директорию
- После сборки APK автоматически устанавливается на эмулятор 