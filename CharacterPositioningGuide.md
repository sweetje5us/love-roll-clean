# Краткое руководство по позиционированию персонажей

## Быстрая справка

### Количество персонажей → Позиции
- **0 персонажей** (рассказчик): `npcEmotion: null`
- **1 персонаж**: NPC в `center`
- **2 персонажа**: Игрок в `left`, NPC в `right`
- **3 персонажа**: Игрок в `left`, NPC в `center`, Дополнительный NPC в `right`

### Масштабирование
- **1 персонаж**: 100% (масштаб 1.0)
- **2 персонажа**: 80% (масштаб 0.8)
- **3 персонажа**: 70% (масштаб 0.7)

### Позиции по горизонтали
- **left**: 20% (2 персонажа) / 15% (3 персонажа)
- **center**: 50%
- **right**: 80% (2 персонажа) / 85% (3 персонажа)

## Шаблоны сцен

### Сцена рассказчика
```javascript
{
    npcEmotion: null,
    dialog: 'Текст диалога',
    choices: [...]
}
```

### Сцена с 1 NPC
```javascript
{
    npcEmotion: 'normal',
    npcRole: 'teacher',
    dialog: 'Текст диалога',
    choices: [...]
}
```

### Сцена с NPC + Игрок
```javascript
{
    npcEmotion: 'smile1',
    npcRole: 'teacher',
    includePlayer: true,
    dialog: 'Текст диалога',
    choices: [...]
}
```

### Сцена с 3 персонажами
```javascript
{
    npcEmotion: 'normal',
    npcRole: 'teacher',
    includePlayer: true,
    additionalNPCs: [
        {
            role: 'student',
            emotion: 'smile',
            position: 'right'
        }
    ],
    dialog: 'Текст диалога',
    choices: [...]
}
```

## Доступные эмоции

### Мужские персонажи
`normal`, `smile1`, `smile2`, `smile3`, `laugh`, `angry1`, `angry2`, `sad`, `surprised`, `smirk`

### Женские персонажи
`normal`, `smile`, `smile2`, `laugh`, `angry`, `sad`, `delighted`, `shocked`, `sleepy`, `annoyed`, `smug`

## Специальные роли
- `teacher` → Алексей Петрович
- `student` → Мария
- `main` → случайный NPC
- любая другая роль → случайный NPC

## CSS позиционирование
```css
bottom: -50px;  /* Накладывается на диалоговое окно */
align-items: flex-end;  /* Выравнивание по нижнему краю */
``` 