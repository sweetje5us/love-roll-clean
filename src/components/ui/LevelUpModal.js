import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacters } from '../../contexts/CharacterContext';
import { useInventory } from '../../contexts/InventoryContext';
import itemsData from '../../data/items.json';
import './LevelUpModal.css';

const LevelUpModal = () => {
  const { levelUpModal, hideLevelUpModal, getCharacter, levelUp, saveLevelUpState, loadLevelUpState, clearLevelUpState, cancelLevelUp, getAvailableStatPoints } = useCharacters();
  const { inventory } = useInventory();
  

  
  const [statAllocation, setStatAllocation] = useState({
    charisma: 0,
    coldness: 0,
    sensitivity: 0,
    cunning: 0,
    determination: 0,
    intelligence: 0
  });
  const [remainingPoints, setRemainingPoints] = useState(0);

  useEffect(() => {
    if (levelUpModal?.isOpen) {
      // Получаем актуальное количество очков из системы
      const actualAvailablePoints = getAvailableStatPoints(levelUpModal.characterId);
      console.log('LevelUpModal: Открываем модальное окно с', actualAvailablePoints, 'очками (из системы)');
      
      // Пытаемся загрузить сохраненное состояние
      const savedState = loadLevelUpState(levelUpModal.characterId);
      
      if (savedState && savedState.remainingPoints <= actualAvailablePoints) {
        // Используем сохраненное состояние
        setRemainingPoints(savedState.remainingPoints);
        setStatAllocation(savedState.statAllocation);
        console.log('Загружено сохраненное состояние модального окна');
      } else {
        // Используем новое состояние с актуальным количеством очков
        setRemainingPoints(actualAvailablePoints);
        setStatAllocation({
          charisma: 0,
          coldness: 0,
          sensitivity: 0,
          cunning: 0,
          determination: 0,
          intelligence: 0
        });
        console.log('Используем новое состояние модального окна с', actualAvailablePoints, 'очками');
      }
    }
  }, [levelUpModal?.isOpen, levelUpModal?.characterId, loadLevelUpState, getAvailableStatPoints]);

  // Сохраняем состояние при каждом изменении
  useEffect(() => {
    if (levelUpModal?.isOpen && levelUpModal?.characterId) {
      saveLevelUpState(levelUpModal.characterId, statAllocation, remainingPoints);
    }
  }, [statAllocation, remainingPoints, levelUpModal?.isOpen, levelUpModal?.characterId, saveLevelUpState]);

  const character = levelUpModal?.characterId ? getCharacter(levelUpModal.characterId) : null;
  


  // Функции для работы с характеристиками (в том же стиле, что и в редакторе)
  const getStatCost = (currentValue) => {
    if (currentValue <= 15) return 1;
    if (currentValue <= 20) return 2;
    return 0; // Максимум достигнут
  };

  const getStatBonus = (statValue) => {
    const modifier = Math.floor((statValue - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const canIncreaseStat = (statName) => {
    const currentValue = (character?.stats?.[statName] || 0) + statAllocation[statName];
    const cost = getStatCost(currentValue);
    return currentValue < 20 && remainingPoints >= cost;
  };

  const canDecreaseStat = (statName) => {
    const currentValue = (character?.stats?.[statName] || 0) + statAllocation[statName];
    return currentValue > (character?.stats?.[statName] || 0);
  };

  const handleStatChange = (statName, direction) => {
    const currentValue = (character?.stats?.[statName] || 0) + statAllocation[statName];
    
    if (direction === 'increase' && canIncreaseStat(statName)) {
      const cost = getStatCost(currentValue);
      const newStatAllocation = {
        ...statAllocation,
        [statName]: statAllocation[statName] + 1
      };
      const newRemainingPoints = remainingPoints - cost;
      
      setStatAllocation(newStatAllocation);
      setRemainingPoints(newRemainingPoints);
      
      // Сохраняем состояние
      saveLevelUpState(levelUpModal.characterId, newStatAllocation, newRemainingPoints);
    } else if (direction === 'decrease' && canDecreaseStat(statName)) {
      const newValue = currentValue - 1;
      const cost = getStatCost(newValue);
      const newStatAllocation = {
        ...statAllocation,
        [statName]: statAllocation[statName] - 1
      };
      const newRemainingPoints = remainingPoints + cost;
      
      setStatAllocation(newStatAllocation);
      setRemainingPoints(newRemainingPoints);
      
      // Сохраняем состояние
      saveLevelUpState(levelUpModal.characterId, newStatAllocation, newRemainingPoints);
    }
  };

  // Функции для работы с питомцами
  const getPetStatBonus = () => {
    if (!character?.petId) return {};
    
    const selectedPet = itemsData.items.pet[character.petId];
    if (!selectedPet || !selectedPet.special || selectedPet.special.type !== 'stat') {
      return {};
    }
    
    const { stat_type, bonus } = selectedPet.special;
    return { [stat_type]: bonus };
  };

  const getPetCubeBonus = () => {
    if (!character?.petId) return 0;
    
    const selectedPet = itemsData.items.pet[character.petId];
    if (!selectedPet || !selectedPet.special || selectedPet.special.type !== 'cube') {
      return 0;
    }
    
    return selectedPet.special.modificator || 0;
  };

  const getFinalStatValue = (statName) => {
    const baseValue = (character?.stats?.[statName] || 0) + statAllocation[statName];
    const petBonus = getPetStatBonus()[statName] || 0;
    return baseValue + petBonus;
  };

  const handleConfirm = () => {
    if (levelUpModal?.characterId) {
      levelUp(levelUpModal.characterId, statAllocation);
      // Очищаем сохраненное состояние после подтверждения
      clearLevelUpState(levelUpModal.characterId);
      hideLevelUpModal();
    }
  };

  const handleCancel = () => {
    // Отменяем повышение уровня и возвращаем очки персонажу
    if (levelUpModal?.characterId) {
      cancelLevelUp(levelUpModal.characterId);
    }
    hideLevelUpModal();
  };

  const statLabels = {
    charisma: 'Харизма',
    coldness: 'Холод',
    sensitivity: 'Чувствительность',
    cunning: 'Коварство',
    determination: 'Решительность',
    intelligence: 'Интеллект'
  };

  const statIcons = {
    charisma: 'fas fa-comments',
    coldness: 'fas fa-snowflake',
    sensitivity: 'fas fa-heart',
    cunning: 'fas fa-mask',
    determination: 'fas fa-fist-raised',
    intelligence: 'fas fa-brain'
  };

  const statTooltips = {
    charisma: 'Влияет на возможности очарования и отвлечения',
    coldness: 'Влияет на возможности проявления беспристрастия, грубости',
    sensitivity: 'Влияет на возможность проявления чувств, подмечание неочевидного',
    cunning: 'Влияет на способности обмана, подлости',
    determination: 'Влияет на способности проявления силы, смелости',
    intelligence: 'Влияет на способности находить решения в сложных ситуациях'
  };

  if (!levelUpModal?.isOpen || !character) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="level-up-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleCancel}
      >
        <motion.div
          className="level-up-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="level-up-header">
            <div className="level-up-title">
              <i className="fas fa-star"></i>
              <h2>Повышение уровня!</h2>
            </div>
            <div className="level-up-info">
              <p>
                <strong>{character.name}</strong> достиг {levelUpModal?.newLevel} уровня!
              </p>
            </div>
          </div>

          {/* Редактор характеристик в стиле CharacterCreatorScreen */}
          <div className="stats-editor">
            <div className="stats-header">
              <h3>Распределение характеристик</h3>
              <div className="points-counter">
                <span>Осталось очков: </span>
                <span className={`points-value ${remainingPoints === 0 ? 'complete' : ''}`}>
                  {remainingPoints}
                </span>
              </div>
              {getPetCubeBonus() > 0 && (
                <div className="pet-bonus-info">
                  <i className="fas fa-paw"></i>
                  <span>Бонус к броскам: +{getPetCubeBonus()}</span>
                </div>
              )}
            </div>
            
            <div className="stats-grid">
              {Object.entries(statLabels).map(([statName, label]) => (
                <div key={statName} className="stat-item">
                  <div className="stat-info">
                    <i className={statIcons[statName]}></i>
                    <span className="stat-name" title={statTooltips[statName]}>
                      {label} (?)
                    </span>
                    <div className="stat-value-container">
                      <span className="stat-value">
                        {(character.stats?.[statName] || 0) + statAllocation[statName]}
                        {getPetStatBonus()[statName] && (
                          <span className="pet-stat-bonus">+{getPetStatBonus()[statName]}</span>
                        )}
                      </span>
                      <span className="stat-bonus">{getStatBonus(getFinalStatValue(statName))}</span>
                    </div>
                  </div>
                  <div className="stat-controls">
                    <button
                      className={`stat-button ${!canDecreaseStat(statName) ? 'disabled' : ''}`}
                      onClick={() => handleStatChange(statName, 'decrease')}
                      disabled={!canDecreaseStat(statName)}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <button
                      className={`stat-button ${!canIncreaseStat(statName) ? 'disabled' : ''}`}
                      onClick={() => handleStatChange(statName, 'increase')}
                      disabled={!canIncreaseStat(statName)}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Информация о правилах */}
            <div className="stats-info">
              <p>Правила распределения характеристик:</p>
              <ul>
                <li>Характеристики 1-15: 1 очко за уровень</li>
                <li>Характеристики 16-20: 2 очка за уровень</li>
                <li>Максимальное значение характеристики: 20</li>
                <li>Бонусы от питомцев отображаются зеленым цветом</li>
              </ul>
            </div>
          </div>

          {/* Кнопки */}
          <div className="level-up-actions">
            <button
              className="cancel-btn"
              onClick={handleCancel}
            >
              Отмена
            </button>
            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={remainingPoints > 0}
            >
              Подтвердить
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LevelUpModal;