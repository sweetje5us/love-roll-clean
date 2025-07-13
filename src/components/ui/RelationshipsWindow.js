import React, { useState, useEffect } from 'react';
import { useRelationships, RELATIONSHIP_LEVELS, getRelationshipLevel } from '../../contexts/RelationshipsContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useScreen } from '../../contexts/ScreenContext';
import './RelationshipsWindow.css';

const RelationshipsWindow = ({ isOpen, onClose, episodeCharacters = [] }) => {
  const { selectedCharacter } = useCharacters();
  const { 
    getCharacterRelationships, 
    changeRelationship,
    RELATIONSHIP_LEVELS,
    getRelationshipLevel 
  } = useRelationships();
  
  // Получаем персонажа игрока из контекста
  const { getCharacter } = useCharacters();
  const params = useScreen().getNavigationParams();
  const { characterId } = params;
  const playerCharacter = characterId ? getCharacter(characterId) : null;
  const selectedCharacterId = playerCharacter?.id;

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };



  const handleRelationshipChange = (targetId, type, change) => {
    if (selectedCharacterId) {
      changeRelationship(selectedCharacterId, targetId, type, change);
    }
  };

  const getCharacterById = (id) => {
    // Сначала ищем в персонажах игрока
    const playerChar = getCharacter(id);
    if (playerChar) return playerChar;
    
    // Затем в персонажах эпизода
    return episodeCharacters.find(char => char.id === id);
  };

  const selectedChar = getCharacterById(selectedCharacterId);

  const renderRelationshipBar = (targetCharacter) => {
    if (!selectedCharacterId) return null;
    const currentValue = getCharacterRelationships(selectedCharacterId)[targetCharacter.id]?.friendship || 0;
    const romanceAvailable = selectedChar?.romanceAvailable || targetCharacter.romanceAvailable;
    const { level, color } = getRelationshipLevel(currentValue, romanceAvailable);
    // Если романтика недоступна, ограничиваем максимальное значение до 100
    const maxValue = romanceAvailable ? 160 : 100;
    const percentage = ((currentValue + 100) / (maxValue + 100)) * 100;
    

    return (
      <div className="relationship-bar-container">
        <div className="relationship-bar">
          <div 
            className="relationship-fill" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
        </div>
        <div className="relationship-level" style={{ color }}>
          {level}
        </div>
      </div>
    );
  };

  const renderCharacterRelationships = () => {
    if (!selectedCharacterId) {
      return (
        <div className="no-character-selected">
          <p>Персонаж игрока не найден</p>
        </div>
      );
    }
    const selectedChar = getCharacterById(selectedCharacterId);
    if (!selectedChar) {
      return (
        <div className="character-not-found">
          <p>Персонаж не найден</p>
        </div>
      );
    }
    const otherCharacters = episodeCharacters.filter(char => char.id !== selectedCharacterId);
    return (
      <div className="relationships-content">
        <div className="relationships-list">
          {otherCharacters.map(character => (
            <div key={character.id} className="character-relationship">
              <div className="character-name">
                {character.name}
              </div>
              {renderRelationshipBar(character)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relationships-window-overlay">
      <div className="relationships-window">
        <div className="relationships-header">
          <h2>Отношения</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        

        
        <div className="relationships-body">
          {renderCharacterRelationships()}
        </div>
        
        <div className="relationships-footer">
          <button className="close-btn-secondary" onClick={handleClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipsWindow; 