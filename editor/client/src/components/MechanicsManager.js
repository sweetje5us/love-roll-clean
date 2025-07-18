import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const MechanicsManager = ({ selectedEpisode, selectedChapter }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScene, setSelectedScene] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadScenes();
  }, [selectedEpisode?.id, selectedChapter?.id]);

  // Слушаем событие обновления списка сцен
  useEffect(() => {
    const handleRefreshScenes = () => {
      console.log('MechanicsManager: Получено событие обновления списка сцен');
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
      console.log(`MechanicsManager: Загружаем сцены для эпизода: ${selectedEpisode.id}, главы: ${selectedChapter.id}`);
      const response = await fetch(`${API_BASE_URL}/episodes/${selectedEpisode.id}/chapters/${selectedChapter.id}/scenes`);
      if (response.ok) {
        const data = await response.json();
        console.log(`MechanicsManager: Получено сцен: ${data.length}`);
        console.log('MechanicsManager: Первые 5 сцен:', data.slice(0, 5).map(s => s.id));
        setScenes(data);
      } else {
        console.error('MechanicsManager: Ошибка загрузки сцен');
      }
    } catch (error) {
      console.error('MechanicsManager: Ошибка загрузки сцен:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSceneSelect = (scene) => {
    setSelectedScene(scene);
    setShowModal(true);
  };

  const handleSaveMechanics = async (updatedScene) => {
    try {
      const response = await fetch(`${API_BASE_URL}/episodes/${selectedEpisode.id}/scenes/${updatedScene.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedScene)
      });

      if (response.ok) {
        setScenes(scenes.map(scene => 
          scene.id === updatedScene.id ? updatedScene : scene
        ));
        setShowModal(false);
        setSelectedScene(null);
      } else {
        console.error('Ошибка сохранения механик');
      }
    } catch (error) {
      console.error('Ошибка сохранения механик:', error);
    }
  };

  if (!selectedEpisode) {
    return (
      <div className="mechanics-manager">
        <div className="no-selection">
          <h2>Управление механиками</h2>
          <p>Выберите эпизод для управления механиками</p>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="mechanics-manager">
        <div className="no-selection">
          <h2>Управление механиками</h2>
          <p>Выберите главу для управления механиками</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mechanics-manager">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка механик...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mechanics-manager">
      <div className="manager-header">
        <div className="header-info">
          <h2>Управление механиками</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
          <p className="chapter-info">Глава: {selectedChapter.name}</p>
        </div>
      </div>

      <div className="mechanics-content">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <p>Сцены не найдены</p>
            <p>Создайте сцены для управления механиками</p>
          </div>
        ) : (
          <div className="scenes-grid">
            {scenes.map(scene => (
              <div key={scene.id} className="scene-mechanics-card">
                <div className="scene-header">
                  <h3>{scene.name || scene.id}</h3>
                  <button 
                    className="edit-mechanics-button"
                    onClick={() => handleSceneSelect(scene)}
                  >
                    Редактировать механики
                  </button>
                </div>
                
                <div className="mechanics-summary">
                  <div className="mechanics-item">
                    <span className="mechanics-label">Диалоги:</span>
                    <span className="mechanics-value">{scene.dialogue?.length || 0}</span>
                  </div>
                  
                  <div className="mechanics-item">
                    <span className="mechanics-label">Выборы:</span>
                    <span className="mechanics-value">{scene.choices?.length || 0}</span>
                  </div>
                  
                  <div className="mechanics-item">
                    <span className="mechanics-label">Проверки костей:</span>
                    <span className="mechanics-value">
                      {scene.choices?.filter(choice => choice.diceCheck).length || 0}
                    </span>
                  </div>
                  
                  <div className="mechanics-item">
                    <span className="mechanics-label">Эффекты:</span>
                    <span className="mechanics-value">
                      {scene.choices?.filter(choice => choice.effects).length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedScene && (
        <MechanicsModal
          scene={selectedScene}
          onSave={handleSaveMechanics}
          onClose={() => {
            setShowModal(false);
            setSelectedScene(null);
          }}
        />
      )}
    </div>
  );
};

// Модальное окно редактирования механик
const MechanicsModal = ({ scene, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    ...scene,
    choices: scene.choices?.map(choice => ({
      ...choice,
      diceCheck: choice.diceCheck || null,
      effects: choice.effects || { items: {}, relationships: {} },
      conditions: choice.conditions || {}
    })) || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateChoice = (index, field, value) => {
    const newChoices = [...formData.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setFormData({ ...formData, choices: newChoices });
  };

  const updateDiceCheck = (choiceIndex, field, value) => {
    const newChoices = [...formData.choices];
    if (!newChoices[choiceIndex].diceCheck) {
      newChoices[choiceIndex].diceCheck = {
        stat: '',
        difficulty: 0,
        results: {}
      };
    }
    newChoices[choiceIndex].diceCheck[field] = value;
    setFormData({ ...formData, choices: newChoices });
  };

  const updateEffects = (choiceIndex, type, target, value) => {
    const newChoices = [...formData.choices];
    if (!newChoices[choiceIndex].effects) {
      newChoices[choiceIndex].effects = { items: {}, relationships: {} };
    }
    if (!newChoices[choiceIndex].effects[type]) {
      newChoices[choiceIndex].effects[type] = {};
    }
    newChoices[choiceIndex].effects[type][target] = value;
    setFormData({ ...formData, choices: newChoices });
  };

  return (
    <div className="modal-overlay">
      <div className="modal large-modal">
        <div className="modal-header">
          <h2>Редактирование механик: {scene.name || scene.id}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="mechanics-form">
            {formData.choices.map((choice, index) => (
              <div key={index} className="choice-mechanics-section">
                <h3>Выбор: {choice.text}</h3>
                
                <div className="mechanics-section">
                  <h4>Проверка костей</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Характеристика:</label>
                      <select
                        value={choice.diceCheck?.stat || ''}
                        onChange={(e) => updateDiceCheck(index, 'stat', e.target.value)}
                      >
                        <option value="">Нет проверки</option>
                        <option value="strength">Сила</option>
                        <option value="agility">Ловкость</option>
                        <option value="intelligence">Интеллект</option>
                        <option value="charisma">Харизма</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Сложность:</label>
                      <input
                        type="number"
                        value={choice.diceCheck?.difficulty || 0}
                        onChange={(e) => updateDiceCheck(index, 'difficulty', parseInt(e.target.value))}
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>
                  
                  {choice.diceCheck?.stat && (
                    <div className="dice-results">
                      <h5>Результаты проверки:</h5>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Критический успех:</label>
                          <input
                            type="text"
                            value={choice.diceCheck.results?.critical_success || ''}
                            onChange={(e) => updateDiceCheck(index, 'results', {
                              ...choice.diceCheck.results,
                              critical_success: e.target.value
                            })}
                            placeholder="ID сцены"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Успех:</label>
                          <input
                            type="text"
                            value={choice.diceCheck.results?.success || ''}
                            onChange={(e) => updateDiceCheck(index, 'results', {
                              ...choice.diceCheck.results,
                              success: e.target.value
                            })}
                            placeholder="ID сцены"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Провал:</label>
                          <input
                            type="text"
                            value={choice.diceCheck.results?.failure || ''}
                            onChange={(e) => updateDiceCheck(index, 'results', {
                              ...choice.diceCheck.results,
                              failure: e.target.value
                            })}
                            placeholder="ID сцены"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Критический провал:</label>
                          <input
                            type="text"
                            value={choice.diceCheck.results?.critical_failure || ''}
                            onChange={(e) => updateDiceCheck(index, 'results', {
                              ...choice.diceCheck.results,
                              critical_failure: e.target.value
                            })}
                            placeholder="ID сцены"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mechanics-section">
                  <h4>Эффекты</h4>
                  <div className="effects-section">
                    <div className="form-group">
                      <label>Предметы:</label>
                      <input
                        type="text"
                        placeholder="ID предмета: количество"
                        onChange={(e) => {
                          const [itemId, amount] = e.target.value.split(':');
                          if (itemId && amount) {
                            updateEffects(index, 'items', itemId, parseInt(amount));
                          }
                        }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Отношения:</label>
                      <input
                        type="text"
                        placeholder="ID персонажа: изменение"
                        onChange={(e) => {
                          const [characterId, change] = e.target.value.split(':');
                          if (characterId && change) {
                            updateEffects(index, 'relationships', characterId, parseInt(change));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="button">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MechanicsManager; 