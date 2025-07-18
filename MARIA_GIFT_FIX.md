# Исправление проблемы с подарком Марии

## Проблема
В сцене с Марией (scene152) не добавлялся предмет "chocolate" в инвентарь игрока, хотя в диалоге упоминался подарок.

## Причина
1. **Неправильный ключ для отношений**: В сцене 152 использовался ключ `"relationship"` вместо `"relationships"`
2. **Неправильная логика подарка**: Шоколад должен был добавляться в сцене 153, где Мария говорит о подарке, а не в сцене 152
3. **Отсутствие эффекта добавления предмета**: В сцене 153 не было эффекта `"items"` для добавления шоколада

## Исправления

### 1. Сцена 151 (scene151.json)
**Изменение**: Убрано упоминание о том, что Мария "ждет"
```json
// БЫЛО:
"Я уверена, что ты завел много друзей. Кстати, Мария хотела с тобой попрощаться. Она в коридоре ждет."

// СТАЛО:
"Я уверена, что ты завел много друзей. Кстати, Мария хотела с тобой попрощаться. Она в коридоре."
```

### 2. Сцена 152 (scene152.json)
**Изменения**:
- Исправлен ключ `"relationship"` → `"relationships"`
- Убран эффект добавления шоколада (теперь добавляется в сцене 153)

```json
// БЫЛО:
"effects": {
  "relationship": {
    "student": 3
  },
  "items": {
    "add": ["chocolate"]
  }
}

// СТАЛО:
"effects": {
  "relationships": {
    "student": 3
  }
}
```

### 3. Сцена 153 (scene153.json)
**Изменения**:
- Исправлен ключ `"relationship"` → `"relationships"`
- Добавлен эффект добавления шоколада в оба варианта выбора
- Добавлен эффект отношений для второго варианта

```json
// БЫЛО:
{
  "id": "scene153_choice1",
  "text": "Спасибо! Обязательно встретимся",
  "nextScene": "scene154",
  "effects": {
    "relationship": {
      "student": 2
    }
  }
},
{
  "id": "scene153_choice2",
  "text": "Спасибо за подарок",
  "nextScene": "scene154"
}

// СТАЛО:
{
  "id": "scene153_choice1",
  "text": "Спасибо! Обязательно встретимся",
  "nextScene": "scene154",
  "effects": {
    "relationships": {
      "student": 2
    },
    "items": {
      "add": ["chocolate"]
    }
  }
},
{
  "id": "scene153_choice2",
  "text": "Спасибо за подарок",
  "nextScene": "scene154",
  "effects": {
    "relationships": {
      "student": 1
    },
    "items": {
      "add": ["chocolate"]
    }
  }
}
```

## Результат
Теперь логика работает следующим образом:

1. **Сцена 151**: Анастасия говорит, что Мария в коридоре (без упоминания о подарке)
2. **Сцена 152**: Мария приветствует игрока и благодарит за время, проведенное вместе
3. **Сцена 153**: Мария дарит шоколад и говорит о подарке
4. **Любой выбор в сцене 153** приводит к получению шоколада в инвентарь

## Тестирование
Создан тестовый файл `test_maria_gift_fix.html` для проверки:
- Корректности формата эффектов
- Логики добавления предметов
- Соответствия диалогов и эффектов

## Файлы для тестирования
- `test_maria_gift_fix.html` - проверка исправлений подарка Марии
- `test_scene152_fix.html` - проверка формата эффектов в сцене 152 