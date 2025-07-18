import React from 'react';
import CharacterPreview from './CharacterPreview';
import './CharacterCard.css';

const CharacterCard = ({ character, onEdit, onDelete }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className="character-card">
      <div className="character-card-header">
        <h4 className="character-name">{character.name}</h4>
        <div className="character-actions">
          <button className="edit-btn" onClick={handleEdit} title="Редактировать">
            <i className="fas fa-edit"></i>
          </button>
          <button className="delete-btn" onClick={handleDelete} title="Удалить">
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div className="character-preview-container">
        <CharacterPreview characterData={character} />
      </div>
      
      <div className="character-info">
        <div className="character-details">
          <span className="character-role">{character.role || 'NPC'}</span>
          <span className="character-gender">
            {character.gender === 'female' ? 'Женский' : 'Мужской'}
          </span>
          <span className="character-age">
            {character.age === 'young' ? 'Молодой' : 'Взрослый'}
          </span>
        </div>
        
        {character.description && (
          <p className="character-description">{character.description}</p>
        )}
        
        {character.romanceAvailable && (
          <div className="romance-badge">
            <i className="fas fa-heart"></i>
            <span>Романтика доступна</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard; 