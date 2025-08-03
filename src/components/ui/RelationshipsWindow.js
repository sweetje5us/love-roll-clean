import React, { useState, useEffect } from 'react';
import { useRelationships, RELATIONSHIP_LEVELS, getRelationshipLevel } from '../../contexts/RelationshipsContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { useScreen } from '../../contexts/ScreenContext';
import { getEpisodeSave } from '../../utils/saveUtils';
import episodeManager from '../../utils/episodeManager';
import './RelationshipsWindow.css';

const RelationshipsWindow = ({ isOpen, onClose, episodeCharacters = [] }) => {
  const { selectedCharacter } = useCharacters();
  const { 
    getCharacterRelationships, 
    changeRelationship,
    RELATIONSHIP_LEVELS,
    getRelationshipLevel 
  } = useRelationships();
  
  // Состояние для управления видами
  const [currentView, setCurrentView] = useState('contacts'); // 'contacts' или 'details'
  const [selectedContactId, setSelectedContactId] = useState(null);
  
  // Получаем персонажа игрока из контекста
  const { getCharacter } = useCharacters();
  const params = useScreen().getNavigationParams();
  const { characterId } = params;
  const playerCharacter = characterId ? getCharacter(characterId) : null;
  const selectedCharacterId = playerCharacter?.id;

  if (!isOpen) return null;

  const handleClose = () => {
    // Сбрасываем состояние при закрытии
    setCurrentView('contacts');
    setSelectedContactId(null);
    onClose();
  };

  // Функция для открытия детальной страницы персонажа
  const openCharacterDetails = (characterId) => {
    setSelectedContactId(characterId);
    setCurrentView('details');
  };

  // Функция для возврата к списку контактов
  const backToContacts = () => {
    setCurrentView('contacts');
    setSelectedContactId(null);
  };

  // Получение важных выборов для персонажа
  const getCharacterImportantChoices = (characterId) => {
    const allImportantChoices = episodeManager.getImportantChoices();
    const characterChoices = [];
    
    console.log('getCharacterImportantChoices - все важные выборы:', allImportantChoices);
    console.log('getCharacterImportantChoices - ищем выборы для персонажа:', characterId);
    
    // Фильтруем важные выборы по связанным персонажам
    for (const [choiceId, choiceData] of Object.entries(allImportantChoices)) {
      console.log('getCharacterImportantChoices - обрабатываем выбор:', choiceId, choiceData);
      
      // Проверяем, связан ли выбор с данным персонажем
      const isRelatedToCharacter = choiceData.relatedCharacters && 
        choiceData.relatedCharacters.includes(characterId);
      
      console.log('getCharacterImportantChoices - связан с персонажем?', isRelatedToCharacter, 
        'relatedCharacters:', choiceData.relatedCharacters);
      
      // Используем правильные поля из структуры данных
      if (choiceData.timestamp && isRelatedToCharacter) {
        // ПРИОРИТЕТ для журнала: description (краткое) → text (полный вариант) → value → fallback
        const choiceText = choiceData.description || choiceData.text || choiceData.value || `Выбор ${choiceId}`;
        
        characterChoices.push({
          id: choiceId,
          text: choiceText,
          scene: choiceData.scene,
          chapter: choiceData.chapter,
          timestamp: choiceData.timestamp,
          value: choiceData.value
        });
      }
    }
    
    console.log('getCharacterImportantChoices - итоговый список для', characterId, ':', characterChoices);
    return characterChoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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

  // Компонент списка контактов
  const renderContactsList = () => {
    if (!selectedCharacterId) {
      return (
        <div className="no-character-selected">
          <p>Персонаж игрока не найден</p>
        </div>
      );
    }
    
    const otherCharacters = episodeCharacters.filter(char => char.id !== selectedCharacterId);
    
    return (
      <div className="contacts-list">
        {otherCharacters.map(character => {
          const currentValue = getCharacterRelationships(selectedCharacterId)[character.id]?.friendship || 0;
          const romanceAvailable = character.romanceAvailable;
          const { level, color } = getRelationshipLevel(currentValue, romanceAvailable);
          
          return (
            <div 
              key={character.id} 
              className="contact-item" 
              onClick={() => openCharacterDetails(character.id)}
            >
              <div className="contact-avatar">
                <div className="avatar-placeholder" style={{ backgroundColor: color }}>
                  {character.name[0]}
                </div>
              </div>
              <div className="contact-info">
                <div className="contact-name">{character.name}</div>
                <div className="contact-status" style={{ color }}>
                  {level}
                </div>
              </div>
              <div className="contact-chevron">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Компонент детальной страницы персонажа
  const renderCharacterDetails = () => {
    const character = getCharacterById(selectedContactId);
    if (!character) {
      return (
        <div className="character-not-found">
          <p>Персонаж не найден</p>
        </div>
      );
    }

    const currentValue = getCharacterRelationships(selectedCharacterId)[character.id]?.friendship || 0;
    const romanceAvailable = character.romanceAvailable;
    const { level, color } = getRelationshipLevel(currentValue, romanceAvailable);
    const importantChoices = getCharacterImportantChoices(character.id);
    
    return (
      <div className="character-details">
        <div className="character-details-header">
          <div className="character-details-avatar">
            <div className="avatar-large" style={{ backgroundColor: color }}>
              {character.name[0]}
            </div>
          </div>
          <div className="character-details-info">
            <h3 className="character-details-name">{character.name}</h3>
            <div className="character-details-status" style={{ color }}>
              {level}
            </div>
          </div>
        </div>

        <div className="relationship-progress">
          <div className="relationship-bar-detailed">
            <div 
              className="relationship-fill-detailed" 
              style={{ 
                width: `${((currentValue + 100) / 260) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
          <div className="relationship-value">
            Отношения: {currentValue > 0 ? '+' : ''}{currentValue}
          </div>
        </div>

        <div className="important-choices-section">
          <h4 className="section-title">
            <i className="fas fa-book"></i>
            Журнал важных событий
          </h4>
          <div className="important-choices-list">
            {importantChoices.length > 0 ? (
              importantChoices.map((choice, index) => (
                <div key={choice.id} className="choice-entry">
                  <div className="choice-text">{choice.text}</div>
                  <div className="choice-meta">
                    {choice.chapter && <span>Глава {choice.chapter}</span>}
                    {choice.scene && <span>• Сцена {choice.scene}</span>}
                    {choice.timestamp && (
                      <span>• {new Date(choice.timestamp).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-choices">
                <p>Пока нет записей о важных событиях с этим персонажем</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relationships-window-overlay">
      <div className="relationships-window contacts-style">
        <div className="relationships-header">
          <div className="header-left">
            {currentView === 'details' && (
              <button className="back-button-header" onClick={backToContacts}>
                <i className="fas fa-arrow-left"></i>
              </button>
            )}
            <h2>
              {currentView === 'contacts' ? (
                <>
                  <i className="fas fa-address-book"></i>
                  Контакты
                </>
              ) : (
                <>
                  <i className="fas fa-user"></i>
                  {getCharacterById(selectedContactId)?.name || 'Детали персонажа'}
                </>
              )}
            </h2>
          </div>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        
        <div className="relationships-body">
          {currentView === 'contacts' ? renderContactsList() : renderCharacterDetails()}
        </div>
        
        {currentView === 'contacts' && (
          <div className="relationships-footer">
            <button className="close-btn-secondary" onClick={handleClose}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipsWindow; 