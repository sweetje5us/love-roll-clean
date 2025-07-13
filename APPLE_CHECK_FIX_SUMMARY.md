# Исправление проверки яблока в сцене с Арсением

## Проблема
В сцене с Арсением (scene80) проверка наличия яблока работала неверно. Система показывала, что яблока нет, хотя оно было в инвентаре.

## Причина
Несоответствие форматов инвентаря между разными частями системы:

1. **episodeManager.js** использовал простой формат: `{ itemId: number }`
2. **dialogueItemSystem.js** получал сложный формат: `{ itemId: { quantity: number, ... } }`
3. **GameScreen.js** передавал сложный формат в `isChoiceAvailable()`

## Исправления

### 1. episodeManager.js (строки 830-850)
Улучшена логика проверки предметов в функции `getAvailableChoices()`:

```javascript
// Было:
} else if (itemQuantity && typeof itemQuantity === 'object' && itemQuantity.quantity) {

// Стало:
} else if (itemQuantity && typeof itemQuantity === 'object' && itemQuantity.quantity !== undefined) {
  // Сложный формат: { itemId: { quantity: number, ... } }
  hasItem = itemQuantity.quantity > 0;
} else {
  // Предмет не найден
  hasItem = false;
}
```

### 2. dialogueItemSystem.js (строки 113-150)
Улучшена логика проверки предметов в функции `isChoiceAvailable()`:

```javascript
// Было:
} else if (itemData && typeof itemData === 'object' && itemData.quantity !== undefined) {
  // Сложный формат: { itemId: { quantity: number, ... } }
  const hasItem = itemData.quantity > 0;
  console.log('isChoiceAvailable - сложный формат, количество:', itemData.quantity, 'доступен:', hasItem);
  return hasItem;
}

console.log('isChoiceAvailable - предмет не найден в инвентаре');
return false;

// Стало:
} else if (itemData && typeof itemData === 'object' && itemData.quantity !== undefined) {
  // Сложный формат: { itemId: { quantity: number, ... } }
  const hasItem = itemData.quantity > 0;
  console.log('isChoiceAvailable - сложный формат, количество:', itemData.quantity, 'доступен:', hasItem);
  return hasItem;
} else {
  // Предмет не найден
  console.log('isChoiceAvailable - предмет не найден в инвентаре');
  return false;
}
```

## Результат
Теперь система корректно проверяет наличие предметов в обоих форматах инвентаря:

- **Простой формат**: `{ apple: 1 }`
- **Сложный формат**: `{ apple: { quantity: 1, lastAdded: "..." } }`

## Тестирование
Создан тестовый файл `test_apple_check_fix.html` для проверки исправлений:

1. **Тест простого формата** - проверяет работу с `{ itemId: number }`
2. **Тест сложного формата** - проверяет работу с `{ itemId: { quantity: number, ... } }`
3. **Симуляция сцены с Арсением** - тестирует реальный сценарий

## Файлы изменены
- `src/utils/episodeManager.js` - улучшена проверка предметов
- `src/utils/dialogueItemSystem.js` - улучшена проверка предметов
- `test_apple_check_fix.html` - создан тестовый файл
- `APPLE_CHECK_FIX_SUMMARY.md` - создано резюме

## Статус
✅ **Исправлено** - проверка яблока в сцене с Арсением теперь работает корректно 