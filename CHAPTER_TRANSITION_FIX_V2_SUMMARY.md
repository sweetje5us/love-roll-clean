# Исправление проблемы с двойным переходом между главами v2

## Проблема
После завершения 2 главы игра должна была загрузить 3 главу (scene40), но вместо этого сразу перескочила на 4 главу (scene60).

## Причина
Двойной вызов `handleEndCreditsComplete` из-за двух источников в компоненте `ChapterCredits`:
1. **Автоматический таймер** - вызывает `onComplete` после `duration`
2. **Клик пользователя** - вызывает `onComplete` при клике на титры

Хотя была защита `hasCompleted`, она не всегда срабатывала из-за асинхронности.

## Исправления

### 1. Улучшена защита в `handleEndCreditsComplete` (GameScreen.js)
```javascript
const handleEndCreditsComplete = () => {
  // Защита от повторного вызова
  if (gameState.isLoading || creditsState.isTransitioning || handleEndCreditsComplete._isExecuting) {
    console.log('handleEndCreditsComplete: уже выполняется, пропускаем');
    return;
  }
  
  // Устанавливаем флаг выполнения
  handleEndCreditsComplete._isExecuting = true;
  
  // ... остальной код ...
  
  // Сбрасываем флаг выполнения в конце
  handleEndCreditsComplete._isExecuting = false;
};
```

### 2. Улучшена защита в `ChapterCredits.triggerComplete` (ChapterCredits.js)
```javascript
const triggerComplete = () => {
  if (!hasCompleted && onComplete && !ChapterCredits._isCompleting) {
    setHasCompleted(true);
    ChapterCredits._isCompleting = true;
    onComplete();
    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => {
      ChapterCredits._isCompleting = false;
    }, 100);
  }
};
```

### 3. Улучшена защита в `EpisodeManager.nextChapter` (episodeManager.js)
```javascript
async nextChapter() {
  // Защита от повторного вызова
  if (this._nextChapterInProgress || EpisodeManager._globalNextChapterInProgress) {
    console.log('EpisodeManager.nextChapter: уже выполняется, пропускаем');
    return false;
  }
  
  this._nextChapterInProgress = true;
  EpisodeManager._globalNextChapterInProgress = true;
  
  // ... остальной код ...
  
  // Сбрасываем флаги в конце
  this._nextChapterInProgress = false;
  EpisodeManager._globalNextChapterInProgress = false;
}
```

## Результат
Теперь при двойном вызове `handleEndCreditsComplete`:
1. Первый вызов выполнится нормально
2. Второй вызов будет заблокирован защитными флагами
3. Игра корректно перейдет к следующей главе без пропуска

## Файлы изменены
- `src/components/screens/GameScreen.js` - улучшена защита в handleEndCreditsComplete
- `src/components/ui/ChapterCredits.js` - добавлена защита от двойных вызовов
- `src/utils/episodeManager.js` - добавлена глобальная защита в nextChapter

## Тестирование
Создан тестовый файл `test_chapter_transition_fix_v2.html` для проверки исправлений. 