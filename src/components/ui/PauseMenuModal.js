import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useRelationships } from '../../contexts/RelationshipsContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { createCustomQuestItem } from '../../utils/questItemUtils';
import itemsData from '../../data/items.json';
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
  
  // Состояние для кастомных квестовых предметов
  const [customQuestItemId, setCustomQuestItemId] = useState('door_key_1');
  const [customQuestItemName, setCustomQuestItemName] = useState('Ключ от двери чердака');
  const [customQuestItemDescription, setCustomQuestItemDescription] = useState('Загадочный ключ от неизвестной двери');

  // Получаем все квестовые предметы из items.json
  const questTemplates = Object.values(itemsData.items.quest || {});

  // Обработчик выбора шаблона
  const handleQuestTemplateChange = (e) => {
    const selectedId = e.target.value;
    const template = questTemplates.find(q => q.id === selectedId);
    if (template) {
      setCustomQuestItemId(template.id);
      setCustomQuestItemName(template.name);
      setCustomQuestItemDescription(template.description);
      setCustomQuestItemSprite(template.sprite || '');
      setCustomQuestItemRarity(template.rarity || 'common');
    }
  };

  // Состояния для всех полей кастомного предмета
  const [customQuestItemSprite, setCustomQuestItemSprite] = useState('');
  const [customQuestItemRarity, setCustomQuestItemRarity] = useState('common');

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

  const handleAddCustomQuestItem = () => {
    const customQuestItem = createCustomQuestItem({
      id: customQuestItemId,
      name: customQuestItemName,
      description: customQuestItemDescription,
      rarity: customQuestItemRarity,
      sprite: customQuestItemSprite
    });
    
    addItem(customQuestItem, 1);
    alert(`Добавлен кастомный квестовый предмет "${customQuestItemName}"!`);
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

            {/* Тестовые функции скрыты в продакшене */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseMenuModal; 