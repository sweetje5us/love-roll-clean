import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  performStatCheck, 
  getStatIcon, 
  getStatDisplayName, 
  getPetStatBonus, 
  getPetCubeBonus,
  getFinalStatValue 
} from '../../utils/diceSystem';
import { useInventory } from '../../contexts/InventoryContext';
import './InlineDiceRoll.css';
import itemsData from '../../data/items.json';

const getResultColor = (result) => {
  if (result === 'critical_success') return 'success';
  if (result === 'success') return 'success';
  if (result === 'failure') return 'danger';
  if (result === 'critical_failure') return 'danger';
  return 'warning';
};

const getResultDescription = (result) => {
  const descriptions = {
    critical_success: 'Критический успех!',
    success: 'Успех!',
    failure: 'Неудача.',
    critical_failure: 'Критическая неудача!'
  };
  return descriptions[result] || 'Результат не определен.';
};

// Карта соседних значений для d20 (точно как в test_dice_mechanics.html)
const D20_NEIGHBORS = {
  1: [2, 3, 4, 5, 6],
  2: [1, 3, 6, 7, 8],
  3: [1, 2, 4, 8, 9],
  4: [1, 3, 5, 9, 10],
  5: [1, 4, 6, 10, 11],
  6: [1, 2, 5, 7, 11],
  7: [2, 6, 8, 11, 12],
  8: [2, 3, 7, 9, 12],
  9: [3, 4, 8, 10, 12],
  10: [4, 5, 9, 11, 12],
  11: [5, 6, 7, 10, 12],
  12: [7, 8, 9, 10, 11],
  13: [14, 15, 16, 17, 18],
  14: [13, 15, 17, 18, 19],
  15: [13, 14, 16, 18, 19],
  16: [13, 15, 17, 19, 20],
  17: [13, 14, 16, 18, 20],
  18: [13, 14, 15, 17, 19],
  19: [14, 15, 16, 18, 20],
  20: [16, 17, 18, 19, 13]
};

// Дополнительные соседи для полного покрытия (точно как в test_dice_mechanics.html)
const D20_EXTRA_NEIGHBORS = {
  1: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  2: [4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  3: [5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  4: [2, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  5: [2, 3, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  6: [3, 4, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  7: [1, 3, 4, 5, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20],
  8: [1, 4, 5, 6, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20],
  9: [1, 2, 5, 6, 7, 11, 13, 14, 15, 16, 17, 18, 19, 20],
  10: [1, 2, 3, 6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20],
  11: [1, 2, 3, 4, 7, 8, 9, 13, 14, 15, 16, 17, 18, 19, 20],
  12: [1, 2, 3, 4, 5, 6, 13, 14, 15, 16, 17, 18, 19, 20],
  13: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  14: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  15: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  16: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  17: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  18: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  19: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  20: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

// Функция для получения всех видимых соседних значений (точно как в test_dice_mechanics.html)
function getAllVisibleNeighbors(faceNumber) {
  const neighbors = D20_NEIGHBORS[faceNumber] ? [...D20_NEIGHBORS[faceNumber]] : [];
  if (D20_EXTRA_NEIGHBORS[faceNumber]) {
    neighbors.push(...D20_EXTRA_NEIGHBORS[faceNumber]);
  }
  // Убираем дубликаты и ограничиваем до 20 значений
  return [...new Set(neighbors)].slice(0, 20);
}

// Функция для расчета поворота кубика для показа нужной грани (точно как в test_dice_mechanics.html)
function getRotationForFace(faceNumber) {
  // Возвращаем базовый поворот для красивого отображения
  return 'rotateX(-45deg) rotateY(0deg) rotateZ(0deg)';
}

const InlineDiceRoll = ({ 
  isVisible, 
  choice, 
  character, 
  onRollResult,
  onClose,
  removeItem
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);
  const [finalFace, setFinalFace] = useState(20);
  const [d20Rotation, setD20Rotation] = useState(getRotationForFace(20));
  const [rerollCount, setRerollCount] = useState(0);
  
  const { inventory } = useInventory();

  // Получаем информацию о проверке
  const diceCheckInfo = choice?.diceCheck;
  const statName = diceCheckInfo?.stat;
  const difficulty = diceCheckInfo?.difficulty || 10;
  const description = diceCheckInfo?.description || 'Проверка характеристики';

  // Получаем значения характеристик с учетом бонусов питомцев
  const baseStatValue = character?.stats?.[statName] || 10;
  const petStatBonus = getPetStatBonus(character, statName, itemsData);
  const finalStatValue = getFinalStatValue(character, statName, itemsData);
  const petCubeBonus = getPetCubeBonus(character, itemsData);

  // Функция для проверки наличия зелья воскрешения
  const hasResurrectionPotion = () => {
    const itemData = inventory['resurrection_potion'];
    if (typeof itemData === 'number') {
      return itemData > 0;
    } else if (itemData && typeof itemData === 'object' && itemData.quantity !== undefined) {
      return itemData.quantity > 0;
    }
    return false;
  };

  // Функция для проверки питомца с способностью переброса
  const hasRerollPet = () => {
    if (!character || !character.petId) return false;
    const pet = itemsData.items.pet[character.petId];
    if (!pet || !pet.special) return false;
    // special может быть объектом или массивом
    if (Array.isArray(pet.special)) {
      return pet.special.some(s => s.type === 'reroll' && (s.count === undefined || rerollCount < s.count));
    } else if (pet.special.type === 'reroll') {
      return pet.special.count === undefined || rerollCount < pet.special.count;
    }
    return false;
  };

  // Функция для проверки, бесплатный ли переброс
  const isFreeReroll = () => {
    if (!character || !character.petId) return false;
    const pet = itemsData.items.pet[character.petId];
    if (!pet || !pet.special) return false;
    if (Array.isArray(pet.special)) {
      const s = pet.special.find(s => s.type === 'reroll');
      return s && (s.count === undefined || rerollCount < s.count);
    } else if (pet.special.type === 'reroll') {
      return pet.special.count === undefined || rerollCount < pet.special.count;
    }
    return false;
  };

  // Функция для проверки доступности переброса
  const canReroll = () => {
    // Если бросок успешен, переброс недоступен
    if (rollResult && (rollResult.result === 'success' || rollResult.result === 'critical_success')) {
      return false;
    }
    // Если бесплатный переброс
    if (isFreeReroll()) return true;
    // Иначе требуется зелье воскрешения
    return hasResurrectionPotion();
  };

  // Функция для получения текста кнопки переброса
  const getRerollButtonText = () => {
    if (rollResult && (rollResult.result === 'success' || rollResult.result === 'critical_success')) {
      return 'Переброс недоступен';
    }
    if (isFreeReroll()) {
      return 'Бесплатный переброс';
    }
    if (hasResurrectionPotion()) {
      return 'Перебросить (Зелье воскрешения)';
    }
    return 'Перебросить (нет зелья воскрешения)';
  };

  // Функция для установки CSS-переменных для отображения чисел на гранях (точно как в test_dice_mechanics.html)
  const setDiceNumbers = (faceNumber) => {
    const d20Element = document.querySelector('.inline-d20-dodecahedron');
    if (!d20Element) return;
    
    // Получаем все видимые соседние значения
    const neighborValues = getAllVisibleNeighbors(faceNumber);
    
    // Отображаем выпавшее число на грани с номером 1
    d20Element.style.setProperty('--dice-number', `'${faceNumber}'`);
    
    // Отображаем соседние значения на всех гранях
    for (let i = 0; i < 20; i++) {
      if (neighborValues[i]) {
        d20Element.style.setProperty(`--dice-number-${i + 1}`, `'${neighborValues[i]}'`);
      }
    }
    
    // Выделяем грань с номером 1 (где отображается результат)
    const faces = d20Element.querySelectorAll('.face');
    faces.forEach((face, index) => {
      face.classList.remove('active');
      if (index === 0) {
        face.classList.add('active');
        face.style.zIndex = '10';
      } else {
        face.style.zIndex = '1';
      }
    });
  };

  // Сброс состояния при открытии
  useEffect(() => {
    if (isVisible) {
      setIsRolling(false);
      setRollResult(null);
      setFinalFace(20);
      setD20Rotation(getRotationForFace(20));
      setRerollCount(0);
      // Устанавливаем начальные CSS-переменные
      setTimeout(() => {
        setDiceNumbers(20);
      }, 100);
    }
  }, [isVisible]);

  // После броска: обновляем CSS-переменные для отображения чисел на гранях
  useEffect(() => {
    if (rollResult) {
      setDiceNumbers(rollResult.roll);
      // Устанавливаем финальную трансформацию после анимации
      setTimeout(() => {
        setD20Rotation(getRotationForFace(rollResult.roll));
      }, 100);
    } else {
      setDiceNumbers(20);
    }
  }, [rollResult]);

  // Функция броска кубика (точно как в test_dice_mechanics.html)
  const handleRollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setRollResult(null);
    
    // Скрываем предыдущий результат
    const d20 = document.querySelector('.inline-d20');
    
    d20.classList.add('rolling');
    
    setTimeout(() => {
      // Выполняем проверку с учетом бонусов питомцев
      const result = performStatCheck(statName, character, difficulty, itemsData);
      setRollResult(result);
      setFinalFace(result.roll);
      
      d20.classList.remove('rolling');
      setIsRolling(false);
    }, 1500);
  };

  // Функция продолжения
  const handleContinue = () => {
    if (rollResult) {
      onRollResult(rollResult);
      onClose();
    }
  };

  // Функция переброса
  const handleReroll = () => {
    if (!canReroll()) {
      return;
    }
    setRerollCount(prev => prev + 1);
    // Если это не бесплатный переброс, списываем зелье
    if (!isFreeReroll()) {
      if (removeItem) {
        removeItem('resurrection_potion', 1);
      }
    }
    setRollResult(null);
    setFinalFace(20);
    setD20Rotation(getRotationForFace(20));
    setDiceNumbers(20);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="inline-dice-roll-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="inline-dice-roll-container">
          {/* Информация о проверке */}
          <div className="inline-check-info">
            <div className="inline-stat-info">
              <i className={getStatIcon(statName)}></i>
              <span className="inline-stat-name">{getStatDisplayName(statName)}</span>
              <span className="inline-stat-value">
                ({baseStatValue}
                {petStatBonus > 0 && <span className="pet-stat-bonus">+{petStatBonus}</span>}
                )
              </span>
            </div>
            <div className="inline-difficulty-info">
              <span>Сложность: {difficulty}</span>
            </div>
            {/* Отображение бонусов питомцев */}
            {(petStatBonus > 0 || petCubeBonus > 0) && (
              <div className="inline-pet-bonuses">
                {petStatBonus > 0 && (
                  <span className="pet-bonus-item">
                    <i className="fas fa-paw"></i>
                    Бонус к характеристике: +{petStatBonus}
                  </span>
                )}
                {petCubeBonus > 0 && (
                  <span className="pet-bonus-item">
                    <i className="fas fa-dice-d20"></i>
                    Бонус к броску: +{petCubeBonus}
                  </span>
                )}
              </div>
            )}
            <div className="inline-description">
              <p>{description}</p>
            </div>
          </div>

          {/* Кубик d20 */}
          <div className="inline-dice-container">
            <div className={`inline-d20 ${isRolling ? 'rolling' : ''}`}> 
              <div className="inline-d20-dodecahedron" style={!isRolling ? { transform: d20Rotation } : {}}>
                <div className="face face-1"></div>
                <div className="face face-2"></div>
                <div className="face face-3"></div>
                <div className="face face-4"></div>
                <div className="face face-5"></div>
                <div className="face face-6"></div>
                <div className="face face-7"></div>
                <div className="face face-8"></div>
                <div className="face face-9"></div>
                <div className="face face-10"></div>
                <div className="face face-11"></div>
                <div className="face face-12"></div>
                <div className="face face-13"></div>
                <div className="face face-14"></div>
                <div className="face face-15"></div>
                <div className="face face-16"></div>
                <div className="face face-17"></div>
                <div className="face face-18"></div>
                <div className="face face-19"></div>
                <div className="face face-20"></div>
              </div>
            </div>
            <div className="inline-dice-value">{finalFace}</div>
          </div>

          {/* Кнопка броска */}
          {!rollResult && (
            <button 
              className={`inline-roll-button ${isRolling ? 'rolling' : ''}`}
              onClick={handleRollDice}
              disabled={isRolling}
            >
              {isRolling ? '🎲 Бросаем...' : '🎲 Бросить кубик'}
            </button>
          )}

          {/* Результат броска */}
          {rollResult && (
            <motion.div
              className="inline-roll-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`inline-result-header ${getResultColor(rollResult.result)}`}>
                <h3>{rollResult.resultType}</h3>
                <p>{getResultDescription(rollResult.result)}</p>
              </div>

              <div className="inline-result-summary">
                <div className="inline-summary-item">
                  <span className="summary-label">Результат:</span>
                  <span className="summary-value">
                    {rollResult.roll} {rollResult.modifier >= 0 ? '+ ' : ''}{rollResult.modifier}
                    {rollResult.petCubeBonus > 0 && ` + ${rollResult.petCubeBonus}`}
                    = {rollResult.total}
                  </span>
                </div>
                {/* Детальная информация о бонусах */}
                {(rollResult.petStatBonus > 0 || rollResult.petCubeBonus > 0) && (
                  <div className="inline-bonus-details">
                    {rollResult.petStatBonus > 0 && (
                      <div className="bonus-detail">
                        <span>Базовая характеристика: {rollResult.baseStatValue}</span>
                        <span>Бонус питомца: +{rollResult.petStatBonus}</span>
                        <span>Итого: {rollResult.statValue}</span>
                      </div>
                    )}
                    {rollResult.petCubeBonus > 0 && (
                      <div className="bonus-detail">
                        <span>Бонус к броску: +{rollResult.petCubeBonus}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="inline-result-actions">
                <button className="inline-continue-button" onClick={handleContinue}>
                  Продолжить
                </button>
                {/* Кнопка переброса всегда видна, если бросок не успешен */}
                {rollResult.result !== 'success' && rollResult.result !== 'critical_success' && (
                  <button 
                    className={`inline-reroll-button${!canReroll() ? ' disabled' : ''}`} 
                    onClick={handleReroll}
                    disabled={!canReroll()}
                  >
                    {getRerollButtonText()}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InlineDiceRoll; 