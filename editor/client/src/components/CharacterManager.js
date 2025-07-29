import React, { useState, useEffect } from 'react';
import CharacterCard from './CharacterCard';
import CharacterEditModal from './CharacterEditModal';
import './CharacterManager.css';

const CharacterManager = ({ episodeId }) => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);

  useEffect(() => {
    loadCharacters();
  }, [episodeId]);

  const loadCharacters = async () => {
    if (!episodeId) {
      setCharacters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/episodes/${episodeId}/characters`);
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      } else {
        console.error('Ошибка загрузки персонажей:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки персонажей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharacter = () => {
    setEditingCharacter(null);
    setShowEditModal(true);
  };

  const handleEditCharacter = (character) => {
    setEditingCharacter(character);
    setShowEditModal(true);
  };

  const handleSaveCharacter = async (characterData) => {
    try {
      const url = editingCharacter 
        ? `http://localhost:3001/api/episodes/${episodeId}/characters/${editingCharacter.id}`
        : `http://localhost:3001/api/episodes/${episodeId}/characters`;
      
      const method = editingCharacter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(characterData),
      });

      if (response.ok) {
        await loadCharacters();
        setShowEditModal(false);
        setEditingCharacter(null);
      } else {
        console.error('Ошибка сохранения персонажа:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка сохранения персонажа:', error);
    }
  };

  const handleDeleteCharacter = async (characterId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого персонажа?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/episodes/${episodeId}/characters/${characterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCharacters();
      } else {
        console.error('Ошибка удаления персонажа:', response.statusText);
      }
    } catch (error) {
      console.error('Ошибка удаления персонажа:', error);
    }
  };

  const handleRefreshCache = async () => {
    try {
      // Принудительно очищаем кэш браузера
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('episodes') || cacheName.includes('static')) {
            await caches.delete(cacheName);
          }
        }
      }
      
      // Перезагружаем персонажей
      await loadCharacters();
      alert('Кэш персонажей обновлен! Теперь изменения должны отображаться в игре.');
    } catch (error) {
      console.error('Ошибка обновления кэша:', error);
      alert('Ошибка обновления кэша персонажей');
    }
  };

  if (loading) {
    return (
      <div className="character-manager">
        <div className="character-manager-header">
          <h3>Персонажи</h3>
          <button className="create-character-btn" disabled>
            <i className="fas fa-plus"></i>
            Создать персонажа
          </button>
        </div>
        <div className="character-manager-content">
          <div className="loading-message">
            <i className="fas fa-spinner fa-spin"></i>
            Загрузка персонажей...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-manager">
      <div className="character-manager-header">
        <h2>Управление персонажами эпизода</h2>
        <div className="character-manager-actions">
          <button className="button secondary" onClick={handleRefreshCache}>
            <i className="fas fa-sync-alt"></i> Обновить кэш
          </button>
          <button className="button primary" onClick={handleCreateCharacter}>
            <i className="fas fa-plus"></i> Создать персонажа
          </button>
        </div>
      </div>
      
      <div className="character-manager-content">
        {characters.length === 0 ? (
          <div className="empty-characters">
            <i className="fas fa-users"></i>
            <p>Персонажи не найдены</p>
            <button className="create-first-character-btn" onClick={handleCreateCharacter}>
              Создать первого персонажа
            </button>
          </div>
        ) : (
          <div className="characters-grid">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onEdit={() => handleEditCharacter(character)}
                onDelete={() => handleDeleteCharacter(character.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showEditModal && (
        <CharacterEditModal
          character={editingCharacter}
          onSave={handleSaveCharacter}
          onClose={() => {
            setShowEditModal(false);
            setEditingCharacter(null);
          }}
        />
      )}
    </div>
  );
};

export default CharacterManager; 