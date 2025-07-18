import React, { useState, useEffect } from 'react';
import './SceneManager.css';

const API_BASE_URL = 'http://localhost:3001/api';

const SceneManager = ({ selectedEpisode, selectedChapter, onSceneEdit, onSceneCreate }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenes();
  }, [selectedEpisode?.id, selectedChapter?.id]);

  // Слушаем событие обновления списка сцен
  useEffect(() => {
    const handleRefreshScenes = () => {
      console.log('SceneManager: Получено событие обновления списка сцен');
      loadScenes();
    };

    window.addEventListener('refreshSceneTree', handleRefreshScenes);
    
    return () => {
      window.removeEventListener('refreshSceneTree', handleRefreshScenes);
    };
  }, [selectedEpisode?.id, selectedChapter?.id]);

  const loadScenes = async () => {
    if (!selectedEpisode || !selectedChapter) {
      setScenes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Загружаем сцены для эпизода: ${selectedEpisode.id}, главы: ${selectedChapter.id}`);
      const response = await fetch(`${API_BASE_URL}/episodes/${selectedEpisode.id}/chapters/${selectedChapter.id}/scenes`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Получено сцен: ${data.length}`);
        console.log('Первые 5 сцен:', data.slice(0, 5).map(s => s.id));
        setScenes(data);
      } else {
        console.error('Ошибка загрузки сцен');
      }
    } catch (error) {
      console.error('Ошибка загрузки сцен:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScene = () => {
    if (onSceneCreate) {
      onSceneCreate(null);
    }
  };

  const handleEditScene = (scene) => {
    if (onSceneEdit) {
      onSceneEdit(scene);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту сцену?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/episodes/${selectedEpisode.id}/chapters/${selectedChapter.id}/scenes/${sceneId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('Сцена успешно удалена');
        setScenes(scenes.filter(scene => scene.id !== sceneId));
        
        // Отправляем событие обновления для других компонентов
        setTimeout(() => {
          const event = new CustomEvent('refreshSceneTree');
          window.dispatchEvent(event);
        }, 100);
      } else {
        console.error('Ошибка удаления сцены');
      }
    } catch (error) {
      console.error('Ошибка удаления сцены:', error);
    }
  };

  if (!selectedEpisode) {
    return (
      <div className="scene-manager">
        <div className="no-selection">
          <h2>Управление сценами</h2>
          <p>Выберите эпизод для управления сценами</p>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="scene-manager">
        <div className="no-selection">
          <h2>Управление сценами</h2>
          <p>Выберите главу для управления сценами</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="scene-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка сцен...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-manager">
      <div className="manager-header">
        <div className="header-info">
          <h2>Управление сценами</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
          <p className="chapter-info">Глава: {selectedChapter.name}</p>
        </div>
        <button className="button" onClick={handleCreateScene}>
          Создать сцену
        </button>
      </div>

      <div className="scenes-content">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <p>Сцены не найдены</p>
            <p>Создайте первую сцену для главы "{selectedChapter.name}"</p>
          </div>
        ) : (
          <div className="scenes-grid">
            {scenes.map(scene => (
              <div key={scene.id} className="scene-card">
                <div className="scene-info">
                  <h3>{scene.name || scene.id}</h3>
                  <p className="scene-description">{scene.description}</p>
                  
                  <div className="scene-meta">
                    {scene.background && (
                      <span className="scene-background">Фон: {scene.background}</span>
                    )}
                    <span className="scene-dialogue">Диалогов: {scene.dialogue?.length || 0}</span>
                    <span className="scene-choices">Выборов: {scene.choices?.length || 0}</span>
                    {scene.choices?.some(choice => choice.diceCheck) && (
                      <span className="scene-dice">🎲 Проверки костей</span>
                    )}
                  </div>
                </div>
                
                <div className="scene-actions">
                  <button 
                    className="button secondary"
                    onClick={() => handleEditScene(scene)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="button danger"
                    onClick={() => handleDeleteScene(scene.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneManager; 