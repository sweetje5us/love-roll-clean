import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useRelationships } from '../../contexts/RelationshipsContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import './PauseMenuModal.css';

const PauseMenuModal = ({ isOpen, onClose, onContinue }) => {
  const { navigateTo } = useScreen();
  const { getCharacter, addExperience } = useCharacters();
  const { changeRelationship, getRelationships } = useRelationships();
  const { addItem } = useInventory();
  const { addGold, addGems } = useCurrency();
  
  // Состояние для тестовых функций
  const [testCharacterId, setTestCharacterId] = useState('');
  const [testExperience, setTestExperience] = useState(100);
  const [testRelationship, setTestRelationship] = useState(10);
  const [testItemId, setTestItemId] = useState('apple');
  const [testGold, setTestGold] = useState(100);
  const [testGems, setTestGems] = useState(10);

  // Получаем данные выбранного персонажа
  const { getNavigationParams } = useScreen();
  const params = getNavigationParams();
  const selectedCharacter = getCharacter(params.characterId);

  // Обработчики основных кнопок
  const handleContinue = () => {
    onContinue();
  };

  const handleSettings = () => {
    navigateTo(SCREEN_TYPES.SETTINGS, { fromGame: true });
  };

  const handleMainMenu = () => {
    navigateTo(SCREEN_TYPES.MAIN_MENU, {}, 'fade');
  };

  // Тестовые функции
  const handleAddExperience = () => {
    if (selectedCharacter) {
      addExperience(selectedCharacter.id, testExperience);
      alert(`Добавлено ${testExperience} опыта персонажу ${selectedCharacter.name}!`);
    } else {
      alert('Персонаж не выбран!');
    }
  };

  const handleAddRelationship = () => {
    if (selectedCharacter && testCharacterId) {
      changeRelationship(selectedCharacter.id, testCharacterId, 'friendship', testRelationship);
      alert(`Добавлено ${testRelationship} к отношениям с персонажем ${testCharacterId}!`);
    } else {
      alert('Выберите персонажа и ID персонажа для отношений!');
    }
  };

  const handleAddItem = () => {
    addItem(testItemId, 1);
    alert(`Добавлен предмет ${testItemId}!`);
  };

  const handleAddGold = () => {
    addGold(testGold);
    alert(`Добавлено ${testGold} монет!`);
  };

  const handleAddGems = () => {
    addGems(testGems);
    alert(`Добавлено ${testGems} камней!`);
  };

  const handleAddAllTestItems = () => {
    // Добавляем несколько тестовых предметов
    const testItems = ['apple', 'health_potion', 'mana_potion', 'basic_chest', 'old_key'];
    testItems.forEach(itemId => addItem(itemId, 5));
    alert('Добавлены тестовые предметы!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="pause-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="pause-menu-modal"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="pause-menu-header">
              <h2>Меню паузы</h2>
              <button className="pause-menu-close" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Информация о персонаже */}
            {selectedCharacter && (
              <div className="pause-menu-character-info">
                <h3>Текущий персонаж</h3>
                <div className="character-info-content">
                  <div className="character-name">{selectedCharacter.name}</div>
                  <div className="character-details">
                    <span>Уровень: {selectedCharacter.level || 1}</span>
                    <span>Опыт: {selectedCharacter.experience || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Основные кнопки */}
            <div className="pause-menu-main-buttons">
              <motion.button
                className="pause-menu-btn continue-btn"
                onClick={handleContinue}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-play"></i>
                Продолжить
              </motion.button>

              <motion.button
                className="pause-menu-btn settings-btn"
                onClick={handleSettings}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-cog"></i>
                Настройки
              </motion.button>

              <motion.button
                className="pause-menu-btn main-menu-btn"
                onClick={handleMainMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-home"></i>
                В главное меню
              </motion.button>
            </div>

            {/* Тестовые функции */}
            <div className="pause-menu-test-section">
              <h3>Тестовые функции</h3>
              
              <div className="test-functions-grid">
                {/* Опыт */}
                <div className="test-function-group">
                  <label>Опыт:</label>
                  <input
                    type="number"
                    value={testExperience}
                    onChange={(e) => setTestExperience(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                  />
                  <button onClick={handleAddExperience} className="test-btn">
                    <i className="fas fa-star"></i>
                    Добавить опыт
                  </button>
                </div>

                {/* Отношения */}
                <div className="test-function-group">
                  <label>ID персонажа:</label>
                  <input
                    type="text"
                    value={testCharacterId}
                    onChange={(e) => setTestCharacterId(e.target.value)}
                    placeholder="character_id"
                  />
                  <label>Отношения:</label>
                  <input
                    type="number"
                    value={testRelationship}
                    onChange={(e) => setTestRelationship(parseInt(e.target.value) || 0)}
                    min="1"
                    max="100"
                  />
                  <button onClick={handleAddRelationship} className="test-btn">
                    <i className="fas fa-heart"></i>
                    Добавить отношения
                  </button>
                </div>

                {/* Предметы */}
                <div className="test-function-group">
                  <label>ID предмета:</label>
                  <input
                    type="text"
                    value={testItemId}
                    onChange={(e) => setTestItemId(e.target.value)}
                    placeholder="item_id"
                  />
                  <button onClick={handleAddItem} className="test-btn">
                    <i className="fas fa-box"></i>
                    Добавить предмет
                  </button>
                  <button onClick={handleAddAllTestItems} className="test-btn">
                    <i className="fas fa-boxes"></i>
                    Добавить тестовые предметы
                  </button>
                </div>

                {/* Валюты */}
                <div className="test-function-group">
                  <label>Монеты:</label>
                  <input
                    type="number"
                    value={testGold}
                    onChange={(e) => setTestGold(parseInt(e.target.value) || 0)}
                    min="1"
                    max="10000"
                  />
                  <button onClick={handleAddGold} className="test-btn">
                    <i className="fas fa-coins"></i>
                    Добавить монеты
                  </button>
                  
                  <label>Камни:</label>
                  <input
                    type="number"
                    value={testGems}
                    onChange={(e) => setTestGems(parseInt(e.target.value) || 0)}
                    min="1"
                    max="1000"
                  />
                  <button onClick={handleAddGems} className="test-btn">
                    <i className="fas fa-gem"></i>
                    Добавить камни
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseMenuModal; 