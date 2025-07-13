// Система броска кубиков d20 для проверки характеристик

/**
 * Выполняет бросок кубика d20
 * @returns {number} Результат броска (1-20)
 */
export function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Рассчитывает модификатор характеристики (D&D стиль)
 * @param {number} statValue - Значение характеристики
 * @returns {number} Модификатор
 */
export function getStatModifier(statValue) {
  return Math.floor((statValue - 10) / 2);
}

/**
 * Получает бонус к характеристике от питомца
 * @param {Object} character - Объект персонажа
 * @param {string} statName - Название характеристики
 * @param {Object} itemsData - Данные предметов
 * @returns {number} Бонус к характеристике
 */
export function getPetStatBonus(character, statName, itemsData) {
  if (!character?.petId || !itemsData?.items?.pet) return 0;
  
  const pet = itemsData.items.pet[character.petId];
  if (!pet || !pet.special) return 0;
  
  // Проверяем, является ли special массивом или объектом
  if (Array.isArray(pet.special)) {
    const statBonus = pet.special.find(s => s.type === 'stat' && s.stat_type === statName);
    return statBonus ? statBonus.bonus : 0;
  } else if (pet.special.type === 'stat' && pet.special.stat_type === statName) {
    return pet.special.bonus || 0;
  }
  
  return 0;
}

/**
 * Получает бонус к результату броска от питомца
 * @param {Object} character - Объект персонажа
 * @param {Object} itemsData - Данные предметов
 * @returns {number} Бонус к результату броска
 */
export function getPetCubeBonus(character, itemsData) {
  if (!character?.petId || !itemsData?.items?.pet) return 0;
  
  const pet = itemsData.items.pet[character.petId];
  if (!pet || !pet.special) return 0;
  
  // Проверяем, является ли special массивом или объектом
  if (Array.isArray(pet.special)) {
    const cubeBonus = pet.special.find(s => s.type === 'cube');
    return cubeBonus ? (cubeBonus.modificator || 0) : 0;
  } else if (pet.special.type === 'cube') {
    return pet.special.modificator || 0;
  }
  
  return 0;
}

/**
 * Получает итоговое значение характеристики с учетом бонуса питомца
 * @param {Object} character - Объект персонажа
 * @param {string} statName - Название характеристики
 * @param {Object} itemsData - Данные предметов
 * @returns {number} Итоговое значение характеристики
 */
export function getFinalStatValue(character, statName, itemsData) {
  const baseValue = character?.stats?.[statName] || 10;
  const petBonus = getPetStatBonus(character, statName, itemsData);
  return baseValue + petBonus;
}

/**
 * Выполняет проверку характеристики с учетом бонусов питомца
 * @param {string} statName - Название характеристики
 * @param {Object} character - Объект персонажа
 * @param {number} difficulty - Сложность проверки
 * @param {Object} itemsData - Данные предметов
 * @returns {Object} Результат проверки
 */
export function performStatCheck(statName, character, difficulty, itemsData) {
  const roll = rollD20();
  const finalStatValue = getFinalStatValue(character, statName, itemsData);
  const modifier = getStatModifier(finalStatValue);
  const petCubeBonus = getPetCubeBonus(character, itemsData);
  const total = roll + modifier + petCubeBonus;
  
  // Определяем результат
  let result;
  let resultType;
  
  if (roll === 20) {
    result = 'critical_success';
    resultType = 'Критический успех';
  } else if (roll === 1) {
    result = 'critical_failure';
    resultType = 'Критическая неудача';
  } else if (total >= difficulty) {
    result = 'success';
    resultType = 'Успех';
  } else {
    result = 'failure';
    resultType = 'Неудача';
  }
  
  return {
    roll,
    modifier,
    petCubeBonus,
    total,
    difficulty,
    result,
    resultType,
    statName,
    statValue: finalStatValue,
    baseStatValue: character?.stats?.[statName] || 10,
    petStatBonus: getPetStatBonus(character, statName, itemsData)
  };
}

/**
 * Получает название характеристики на русском языке
 * @param {string} statName - Название характеристики
 * @returns {string} Название на русском
 */
export function getStatDisplayName(statName) {
  const statNames = {
    charisma: 'Харизма',
    coldness: 'Холод',
    sensitivity: 'Чувствительность',
    cunning: 'Коварство',
    determination: 'Решительность',
    intelligence: 'Интеллект'
  };
  
  return statNames[statName] || statName;
}

/**
 * Получает иконку характеристики
 * @param {string} statName - Название характеристики
 * @returns {string} CSS класс иконки
 */
export function getStatIcon(statName) {
  const statIcons = {
    charisma: 'fas fa-comments',
    coldness: 'fas fa-snowflake',
    sensitivity: 'fas fa-heart',
    cunning: 'fas fa-mask',
    determination: 'fas fa-fist-raised',
    intelligence: 'fas fa-brain'
  };
  
  return statIcons[statName] || 'fas fa-dice-d20';
}

/**
 * Получает цвет результата для отображения
 * @param {string} result - Результат проверки
 * @returns {string} CSS класс цвета
 */
export function getResultColor(result) {
  const colors = {
    critical_success: 'success',
    success: 'success',
    failure: 'warning',
    critical_failure: 'danger'
  };
  
  return colors[result] || 'info';
}

/**
 * Получает описание результата
 * @param {string} result - Результат проверки
 * @returns {string} Описание результата
 */
export function getResultDescription(result) {
  const descriptions = {
    critical_success: 'Блестящий успех! Действие выполнено с превосходством.',
    success: 'Успех! Действие выполнено успешно.',
    failure: 'Неудача. Действие не удалось выполнить.',
    critical_failure: 'Критическая неудача! Действие провалено полностью.'
  };
  
  return descriptions[result] || 'Неизвестный результат';
}

/**
 * Проверяет, является ли выбор вариантом с проверкой характеристики
 * @param {Object} choice - Вариант выбора
 * @returns {boolean} true если есть проверка
 */
export function hasDiceCheck(choice) {
  return choice.diceCheck && choice.diceCheck.stat;
}

/**
 * Получает информацию о проверке из выбора
 * @param {Object} choice - Вариант выбора
 * @returns {Object|null} Информация о проверке
 */
export function getDiceCheckInfo(choice) {
  if (!hasDiceCheck(choice)) {
    return null;
  }
  
  return {
    stat: choice.diceCheck.stat,
    difficulty: choice.diceCheck.difficulty || 10,
    description: choice.diceCheck.description || 'Проверка характеристики'
  };
} 