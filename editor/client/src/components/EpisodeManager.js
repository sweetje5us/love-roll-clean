import React, { useState } from 'react';
import EpisodeModal from './EpisodeModal';

const API_BASE_URL = 'http://localhost:3001/api';

const EpisodeManager = ({ 
  episodes, 
  selectedEpisode, 
  onEpisodeSelect, 
  onEpisodeCreate, 
  onEpisodeUpdate, 
  onEpisodeDelete,
  onRefresh 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);

  const handleCreateEpisode = () => {
    setEditingEpisode(null);
    setShowModal(true);
  };

  const handleEditEpisode = (episode) => {
    setEditingEpisode(episode);
    setShowModal(true);
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот эпизод?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          onEpisodeDelete(episodeId);
        } else {
          console.error('Ошибка удаления эпизода');
        }
      } catch (error) {
        console.error('Ошибка удаления эпизода:', error);
      }
    }
  };

  const handleSaveEpisode = async (episodeData) => {
    try {
      const url = editingEpisode 
        ? `${API_BASE_URL}/episodes/${editingEpisode.id}`
        : `${API_BASE_URL}/episodes`;
      
      const method = editingEpisode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(episodeData)
      });

      if (response.ok) {
        const savedEpisode = await response.json();
        
        if (editingEpisode) {
          onEpisodeUpdate(savedEpisode);
        } else {
          onEpisodeCreate(savedEpisode);
        }
        
        setShowModal(false);
        setEditingEpisode(null);
      } else {
        console.error('Ошибка сохранения эпизода');
      }
    } catch (error) {
      console.error('Ошибка сохранения эпизода:', error);
    }
  };

  return (
    <div className="episode-manager">
      <div className="manager-header">
        <div className="header-info">
          <h2>Управление эпизодами</h2>
        </div>
        <div className="flex gap-1">
          <button className="button secondary" onClick={onRefresh}>
            Обновить
          </button>
          <button className="button" onClick={handleCreateEpisode}>
            Создать эпизод
          </button>
        </div>
      </div>

      <div className="episodes-content">
        {episodes.length === 0 ? (
          <div className="empty-state">
            <p>Эпизоды не найдены</p>
            <p>Создайте первый эпизод!</p>
          </div>
        ) : (
          <div className="episodes-grid">
            {episodes.map(episode => (
              <div 
                key={episode.id} 
                className={`episode-card ${selectedEpisode?.id === episode.id ? 'selected' : ''}`}
                onClick={() => onEpisodeSelect(episode)}
              >
                <div className="episode-preview">
                  {episode.preview && (
                    <img 
                      src={`/episodes/${episode.id}/${episode.preview}`} 
                      alt={episode.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                
                <div className="episode-info">
                  <h3>{episode.name}</h3>
                  <p>{episode.description}</p>
                  
                  <div className="episode-meta">
                    <span className="episode-type">{episode.type}</span>
                    <span className="episode-duration">{episode.duration}</span>
                    <span className="episode-difficulty">{episode.difficulty}</span>
                  </div>
                  
                  <div className="episode-stats">
                    <span>Глав: {episode.chapters?.length || 0}</span>
                  </div>
                </div>
                
                <div className="episode-actions">
                  <button 
                    className="button secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEpisode(episode);
                    }}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="button danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEpisode(episode.id);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <EpisodeModal
          episode={editingEpisode}
          onSave={handleSaveEpisode}
          onClose={() => {
            setShowModal(false);
            setEditingEpisode(null);
          }}
        />
      )}
    </div>
  );
};

export default EpisodeManager; 