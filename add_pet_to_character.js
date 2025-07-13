// Скрипт для добавления питомца персонажу
console.log('Добавление питомца персонажу...');

try {
    // Получаем прогресс из localStorage
    const progressData = localStorage.getItem('tutorial_progress');
    if (!progressData) {
        console.error('Прогресс не найден');
        return;
    }
    
    const progress = JSON.parse(progressData);
    console.log(`Прогресс: Глава ${progress.currentChapter}, Сцена ${progress.currentScene}`);
    
    // Получаем данные персонажа
    const characterData = localStorage.getItem(`character_${progress.playerCharacterId}`);
    if (!characterData) {
        console.error('Данные персонажа не найдены');
        return;
    }
    
    const character = JSON.parse(characterData);
    console.log(`Персонаж: ${character.name}`);
    
    // Проверяем, есть ли уже питомец
    if (character.pet) {
        console.log(`У персонажа уже есть питомец: ${character.pet.name} (${character.pet.id})`);
        return;
    }
    
    // Добавляем питомца
    character.pet = {
        id: 'slime',
        name: 'Слаймчик'
    };
    
    // Сохраняем обновленного персонажа
    localStorage.setItem(`character_${progress.playerCharacterId}`, JSON.stringify(character));
    
    console.log(`Питомец добавлен: ${character.pet.name} (${character.pet.id})`);
    console.log('Теперь запустите игру и проверьте сцену 123_reaction');
    
} catch (error) {
    console.error('Ошибка:', error.message);
} 