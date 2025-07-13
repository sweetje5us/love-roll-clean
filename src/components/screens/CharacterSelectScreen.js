import React, { useState } from 'react';
import { useCharacters } from '../../contexts/CharacterContext';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import CharacterCard from '../ui/CharacterCard';
import './CharacterSelectScreen.css';

const CharacterSelectScreen = () => {
  const { getAllCharacters } = useCharacters();
  const { navigateTo, goBack, getNavigationParams } = useScreen();
  const characters = getAllCharacters();
  
  // Получаем параметры навигации для предварительного выбора персонажа
  const navigationParams = getNavigationParams();
  const [selectedId, setSelectedId] = useState(navigationParams.characterId || null);

  const handleCreateCharacter = () => {
    const params = {};
    if (navigationParams.fromCollection) {
      params.fromCollection = true;
      params.returnToCollection = true;
      params.collectionTab = 'characters';
    }
    navigateTo(SCREEN_TYPES.CHARACTER_CREATOR, params);
  };

  const handleSelect = () => {
    if (selectedId) {
      navigateTo(SCREEN_TYPES.EPISODE_SELECT, { characterId: selectedId });
    }
  };

  const handleCharacterClick = (characterId) => {
    setSelectedId(characterId);
  };

  const handleBack = () => {
    // Если пользователь пришел из коллекции, возвращаемся туда
    if (navigationParams.fromCollection) {
      navigateTo(SCREEN_TYPES.COLLECTION, { activeTab: 'characters' });
    } else {
      // Иначе используем стандартный возврат
      goBack();
    }
  };

  return (
    <div className="character-select-screen">
      <div className="character-select-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Выбор персонажа</h1>
        <button className="add-character-btn" onClick={handleCreateCharacter}>
          <i className="fas fa-plus"></i> Создать персонажа
        </button>
      </div>
      <div className="character-select-list">
        {characters.length > 0 ? (
          <div className="characters-grid">
            {characters.map((character) => (
              <div
                key={character.id}
                className={`character-select-card${selectedId === character.id ? ' selected' : ''}`}
                onClick={() => handleCharacterClick(character.id)}
              >
                <CharacterCard 
                  character={character} 
                  hideActions={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-characters">
            <i className="fas fa-users empty-characters-icon"></i>
            <h3>Персонажи отсутствуют</h3>
            <p>Создайте своего первого персонажа, чтобы начать игру</p>
            <button className="create-first-character-btn" onClick={handleCreateCharacter}>
              <i className="fas fa-plus"></i> Создать персонажа
            </button>
          </div>
        )}
      </div>
      {characters.length > 0 && selectedId && (
        <div className="character-select-actions">
          <button className="select-btn" onClick={handleSelect}>
            Выбрать
          </button>
        </div>
      )}
    </div>
  );
};

export default CharacterSelectScreen;
