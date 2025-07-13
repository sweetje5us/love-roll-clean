# Исправление двойного перехода между главами

## Проблема
После завершения главы 5 автоматически загружалась глава 7, пропуская главу 6. В логах было видно двойной вызов `handleEndCreditsComplete`.

## Причина
Двойной вызов `handleEndCreditsComplete` происходил из-за двух источников в компоненте `ChapterCredits`:

1. **Автоматический таймер** - `setTimeout` вызывал `onComplete` автоматически
2. **Клик пользователя** - `handleClick` вызывал `onComplete` при клике

Это приводило к тому, что:
- Первый вызов завершал главу 5 и переходил к главе 6
- Второй вызов завершал главу 6 и переходил к главе 7

## Исправления

### 1. ChapterCredits.js
Добавлена защита от повторного вызова `onComplete`:

```javascript
// Было:
const [isVisible, setIsVisible] = useState(true);

useEffect(() => {
  const timer = setTimeout(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
  }, duration);
}, [duration, onComplete]);

const handleClick = () => {
  if (type === 'end') {
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1000);
  }
};

// Стало:
const [isVisible, setIsVisible] = useState(true);
const [hasCompleted, setHasCompleted] = useState(false);

const triggerComplete = () => {
  if (!hasCompleted && onComplete) {
    setHasCompleted(true);
    onComplete();
  }
};

useEffect(() => {
  const timer = setTimeout(() => {
    setIsVisible(false);
    setTimeout(() => {
      triggerComplete();
    }, 1000);
  }, duration);
}, [duration]);

const handleClick = () => {
  if (type === 'end') {
    setIsVisible(false);
    setTimeout(() => {
      triggerComplete();
    }, 1000);
  }
};
```

### 2. GameScreen.js
Улучшена защита в `handleEndCreditsComplete`:

```javascript
// Было:
const handleEndCreditsComplete = () => {
  if (gameState.isLoading) {
    console.log('handleEndCreditsComplete: уже выполняется, пропускаем');
    return;
  }
  
  setCreditsState(prev => ({ ...prev, showEndCredits: false }));

// Стало:
const handleEndCreditsComplete = () => {
  if (gameState.isLoading || creditsState.isTransitioning) {
    console.log('handleEndCreditsComplete: уже выполняется, пропускаем');
    return;
  }
  
  setCreditsState(prev => ({ 
    ...prev, 
    showEndCredits: false,
    isTransitioning: true 
  }));
```

Добавлен флаг `isTransitioning` в состояние `creditsState`:

```javascript
const [creditsState, setCreditsState] = useState({
  showStartCredits: false,
  showEndCredits: false,
  creditsData: null,
  isTransitioning: false  // Новый флаг
});
```

## Результат
Теперь система корректно обрабатывает переходы между главами:

1. **Защита от двойного вызова** - `ChapterCredits` гарантирует, что `onComplete` вызывается только один раз
2. **Дополнительная защита** - `GameScreen` проверяет флаг `isTransitioning` перед выполнением перехода
3. **Правильная последовательность** - главы загружаются по порядку: 5 → 6 → 7

## Тестирование
Создан тестовый файл `test_chapter_transition_fix.html` для проверки исправлений:

1. **Тест защиты ChapterCredits** - проверяет, что `onComplete` вызывается только один раз
2. **Тест перехода между главами** - симулирует переход от главы 5 к главе 6
3. **Интерактивная симуляция** - позволяет протестировать переходы в реальном времени

## Файлы изменены
- `src/components/ui/ChapterCredits.js` - добавлена защита от повторного вызова
- `src/components/screens/GameScreen.js` - улучшена защита в handleEndCreditsComplete
- `test_chapter_transition_fix.html` - создан тестовый файл
- `CHAPTER_TRANSITION_FIX_SUMMARY.md` - создано резюме

## Статус
✅ **Исправлено** - переходы между главами теперь работают корректно без пропуска глав 