import React from 'react';
import { motion } from 'framer-motion';
import CharacterPreview from './CharacterPreview';
import { useInventory } from '../../contexts/InventoryContext';
import { useCharacters } from '../../contexts/CharacterContext';
import itemsData from '../../data/items.json';
import './CharacterCard.css';

const CharacterCard = ({ character, onDelete, onEdit, hideActions = false }) => {
  const { inventory } = useInventory();
  const { getLevelInfo } = useCharacters();
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(character.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(character);
    }
  };

  // Получаем информацию об уровне
  const levelInfo = getLevelInfo(character);

  // Функция для получения иконки пола
  const getGenderIcon = (gender) => {
    return gender === 'female' ? 'venus' : 'mars';
  };

  // Функция для получения текста пола
  const getGenderText = (gender) => {
    return gender === 'female' ? 'Женский' : 'Мужской';
  };

  // Функция для получения текста возраста
  const getAgeText = (age) => {
    return age === '1' ? 'Молодой' : 'Взрослый';
  };

  // Функция для получения данных питомца
  const getPetData = (petId) => {
    if (!petId) return null;
    return itemsData.items.pet[petId] || null;
  };

  // Функция для получения отображаемого имени питомца
  const getPetDisplayName = (character) => {
    const petData = getPetData(character.petId);
    if (!petData) return 'Без питомца';
    
    const petName = character.petName && character.petName.trim() ? character.petName : '';
    return petName ? `${petData.name} ${petName}` : petData.name;
  };

  // Функция для получения спрайта питомца
  const getPetSprite = (petId) => {
    const petData = getPetData(petId);
    return petData ? petData.sprite : null;
  };

  return (
    <motion.div 
      className="character-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={hideActions ? undefined : handleEdit}
    >
      <div className="character-avatar">
        <CharacterPreview characterData={character} inventory={inventory} />
        
        {/* Индикатор уровня */}
        <div className="character-level">
          <div className="level-badge">
            <span className="level-number">{levelInfo.level}</span>
            <span className="level-label">ур.</span>
          </div>
          
          {/* Прогресс-бар опыта */}
          {!levelInfo.isMaxLevel && (
            <div className="experience-bar">
              <div 
                className="experience-fill"
                style={{ width: `${levelInfo.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="character-info">
        <h3 className="character-name">{character.name}</h3>
        <div className="character-details">
          <span className="character-gender">
            <i className={`fas fa-${getGenderIcon(character.gender)}`}></i>
            {getGenderText(character.gender)}
          </span>
          <span className="character-age">
            <i className="fas fa-birthday-cake"></i>
            {getAgeText(character.age)}
          </span>
        </div>
        
        <div className="character-stats-summary">
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <span className="stat-value">
              {character.availableStatPoints ? `${character.availableStatPoints} нераспр.` : '10/10'}
            </span>
          </div>
          <div className="stat-item">
            {getPetSprite(character.petId) ? (
              <img 
                src={getPetSprite(character.petId)} 
                alt="Питомец"
                className="pet-sprite"
              />
            ) : (
              <span className="stat-icon">🐾</span>
            )}
            <span className="stat-value">{getPetDisplayName(character)}</span>
          </div>
        </div>

        {/* Детальные характеристики */}
        {character.stats && (
          <div className="character-detailed-stats">
            <div className="stat-row">
              <span className="stat-label">Хар:</span>
              <span className="stat-value">{character.stats.charisma || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Хол:</span>
              <span className="stat-value">{character.stats.coldness || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Чув:</span>
              <span className="stat-value">{character.stats.sensitivity || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Ков:</span>
              <span className="stat-value">{character.stats.cunning || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Реш:</span>
              <span className="stat-value">{character.stats.determination || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Инт:</span>
              <span className="stat-value">{character.stats.intelligence || 0}</span>
            </div>
          </div>
        )}
      </div>
      
      {!hideActions && (
        <div className="character-actions">
          <button 
            className="action-btn edit-btn"
            onClick={handleEdit}
            title="Редактировать"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
            title="Удалить"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CharacterCard; 