import React, { useState, useEffect, useRef } from 'react';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { loadAllEpisodeConfigs } from '../../utils/episodeUtils';
import './EpisodeEditorScreen.css';

const EpisodeEditorScreen = () => {
  const { goBack } = useScreen();
  const [activeTab, setActiveTab] = useState('episodes');
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  const tabs = [
    { id: 'episodes', name: 'Эпизоды', icon: '📚' },
    { id: 'chapters', name: 'Главы', icon: '📖' },
    { id: 'scenes', name: 'Сцены', icon: '🎭' },
    { id: 'mechanics', name: 'Механики', icon: '⚙️' },
    { id: 'tree', name: 'Древо сцен', icon: '🌳' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'episodes':
        return <EpisodeManager onEpisodeSelect={setSelectedEpisode} selectedEpisode={selectedEpisode} />;
      case 'chapters':
        return <ChapterManager selectedEpisode={selectedEpisode} onChapterSelect={setSelectedChapter} selectedChapter={selectedChapter} />;
      case 'scenes':
        return <SceneManager selectedEpisode={selectedEpisode} selectedChapter={selectedChapter} />;
      case 'mechanics':
        return <MechanicsManager selectedEpisode={selectedEpisode} selectedChapter={selectedChapter} />;
      case 'tree':
        return <SceneTreeView selectedEpisode={selectedEpisode} selectedChapter={selectedChapter} />;
      default:
        return <EpisodeManager onEpisodeSelect={setSelectedEpisode} selectedEpisode={selectedEpisode} />;
    }
  };

  return (
    <div className="episode-editor-screen">
      <div className="editor-header">
        <button className="back-button" onClick={goBack}>
          ← Назад
        </button>
        <h1>Редактор эпизодов</h1>
      </div>

      <div className="editor-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="editor-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Компонент управления эпизодами
const EpisodeManager = ({ onEpisodeSelect, selectedEpisode: globalSelectedEpisode }) => {
  const [episodes, setEpisodes] = useState([]);
  const [localSelectedEpisode, setLocalSelectedEpisode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Синхронизируем локальный выбор с глобальным
  useEffect(() => {
    setLocalSelectedEpisode(globalSelectedEpisode);
  }, [globalSelectedEpisode]);

  // Загрузка существующих эпизодов
  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем эпизоды через API
        const response = await fetch('http://localhost:3001/api/episodes');
        if (response.ok) {
          const apiEpisodes = await response.json();
          setEpisodes(apiEpisodes);
        } else {
          console.error('Ошибка загрузки эпизодов через API');
          // Fallback: загружаем эпизоды из файловой системы
          try {
            const fileResponse = await fetch('/episodes.json');
            if (fileResponse.ok) {
              const data = await fileResponse.json();
              const fileSystemEpisodes = Object.values(data.episodes || {});
              setEpisodes(fileSystemEpisodes);
            } else {
              const episodesList = await loadAllEpisodeConfigs() || [];
              setEpisodes(episodesList);
            }
          } catch (fallbackError) {
            console.error('Ошибка fallback загрузки эпизодов:', fallbackError);
            setEpisodes([]);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки эпизодов:', error);
        // Fallback: загружаем эпизоды из файловой системы
        try {
          const episodesList = await loadAllEpisodeConfigs() || [];
          setEpisodes(episodesList);
        } catch (fallbackError) {
          console.error('Ошибка fallback загрузки эпизодов:', fallbackError);
          setEpisodes([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  const handleCreateEpisode = () => {
    setIsCreating(true);
  };

  const handleSaveEpisode = async (episodeData) => {
    try {
      setIsSaving(true);
      
      // Создаем уникальный ID для эпизода
      const newEpisode = {
        ...episodeData,
        id: episodeData.id || `episode_${Date.now()}`,
        unlocked: true
      };
      
      // Сохраняем эпизод через API
      const response = await fetch('http://localhost:3001/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEpisode)
      });

      if (response.ok) {
        const savedEpisode = await response.json();
        // Обновляем локальный список
        setEpisodes([...episodes, savedEpisode]);
        setIsCreating(false);
        console.log('Эпизод успешно создан:', savedEpisode);
      } else {
        const errorData = await response.json();
        console.error('Ошибка при создании эпизода:', errorData);
        alert('Ошибка при создании эпизода. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при создании эпизода:', error);
      alert('Ошибка при создании эпизода. Убедитесь, что сервер запущен на порту 3001.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEpisode = (episode) => {
    setLocalSelectedEpisode(episode);
    if (onEpisodeSelect) {
      onEpisodeSelect(episode);
    }
  };

  const handleEditEpisode = (episode) => {
    setLocalSelectedEpisode(episode);
    setIsCreating(true);
  };

  const handleUpdateEpisode = async (episodeData) => {
    try {
      setIsSaving(true);
      
      // Обновляем эпизод через API
      const response = await fetch(`http://localhost:3001/api/episodes/${episodeData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(episodeData)
      });

      if (response.ok) {
        const updatedEpisode = await response.json();
        // Обновляем локальный список
        setEpisodes(episodes.map(ep => ep.id === episodeData.id ? updatedEpisode : ep));
        setIsCreating(false);
        setLocalSelectedEpisode(null);
        console.log('Эпизод успешно обновлен:', updatedEpisode);
      } else {
        const errorData = await response.json();
        console.error('Ошибка при обновлении эпизода:', errorData);
        alert('Ошибка при обновлении эпизода. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при обновлении эпизода:', error);
      alert('Ошибка при обновлении эпизода. Убедитесь, что сервер запущен на порту 3001.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот эпизод?')) {
      try {
        // Удаляем эпизод через API
        const response = await fetch(`http://localhost:3001/api/episodes/${episodeId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Обновляем локальный список
          setEpisodes(episodes.filter(ep => ep.id !== episodeId));
          if (localSelectedEpisode?.id === episodeId) {
            setLocalSelectedEpisode(null);
            if (onEpisodeSelect) {
              onEpisodeSelect(null);
            }
          }
          console.log('Эпизод успешно удален:', episodeId);
        } else {
          const errorData = await response.json();
          console.error('Ошибка при удалении эпизода:', errorData);
          alert('Ошибка при удалении эпизода. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Ошибка при удалении эпизода:', error);
        alert('Ошибка при удалении эпизода. Убедитесь, что сервер запущен на порту 3001.');
      }
    }
  };

  return (
    <div className="episode-manager">
      <div className="manager-header">
        <h2>Управление эпизодами</h2>
        {!isCreating && (
          <button className="create-button" onClick={handleCreateEpisode}>
            + Создать эпизод
          </button>
        )}
      </div>

      {isCreating ? (
        <EpisodeForm 
          onSave={localSelectedEpisode ? handleUpdateEpisode : handleSaveEpisode} 
          onCancel={() => {
            setIsCreating(false);
            setLocalSelectedEpisode(null);
          }}
          episode={localSelectedEpisode}
          isSaving={isSaving}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка эпизодов...</p>
            </div>
          ) : (
            <div className="episodes-list">
              {episodes.length === 0 ? (
                <div className="empty-state">
                  <p>Эпизоды не найдены</p>
                  <p>Создайте первый эпизод, чтобы начать работу</p>
                </div>
              ) : (
                episodes.map(episode => (
                  <div
                    key={episode.id}
                    className={`episode-item ${localSelectedEpisode?.id === episode.id ? 'selected' : ''}`}
                  >
                    <div className="episode-content" onClick={() => handleSelectEpisode(episode)}>
                      <h3>{episode.name}</h3>
                      <p>{episode.description}</p>
                      <div className="episode-meta">
                        <span className="episode-type">{episode.type}</span>
                        <span className="episode-duration">{episode.duration}</span>
                        <span className="episode-difficulty">{episode.difficulty}</span>
                      </div>
                    </div>
                    <div className="episode-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditEpisode(episode)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteEpisode(episode.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Компонент управления главами
const ChapterManager = ({ selectedEpisode, onChapterSelect, selectedChapter }) => {
  const [chapters, setChapters] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка глав при выборе эпизода
  useEffect(() => {
    const loadChapters = async () => {
      if (!selectedEpisode) {
        setChapters([]);
        return;
      }

      setIsLoading(true);
      try {
        // Загружаем главы через API
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/chapters`);
        if (response.ok) {
          const apiChapters = await response.json();
          setChapters(apiChapters);
        } else {
          console.error('Ошибка загрузки глав через API');
          // Fallback: загружаем главы из файловой системы
          try {
            const fileResponse = await fetch(`/episodes/${selectedEpisode.id}/config.json`);
            if (fileResponse.ok) {
              const episodeConfig = await fileResponse.json();
              setChapters(episodeConfig.chapters || []);
            } else {
              setChapters([]);
            }
          } catch (fallbackError) {
            console.error('Ошибка fallback загрузки глав:', fallbackError);
            setChapters([]);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки глав:', error);
        // Fallback: загружаем главы из файловой системы
        try {
          const fileResponse = await fetch(`/episodes/${selectedEpisode.id}/config.json`);
          if (fileResponse.ok) {
            const episodeConfig = await fileResponse.json();
            setChapters(episodeConfig.chapters || []);
          } else {
            setChapters([]);
          }
        } catch (fallbackError) {
          console.error('Ошибка fallback загрузки глав:', fallbackError);
          setChapters([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChapters();
  }, [selectedEpisode]);

  const handleCreateChapter = () => {
    setIsCreating(true);
  };

  const handleSaveChapter = async (chapterData) => {
    try {
      const newChapter = {
        ...chapterData,
        id: chapterData.id || `chapter_${Date.now()}`
      };
      
      // Сохраняем главу через API
      const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChapter)
      });

      if (response.ok) {
        const savedChapter = await response.json();
        setChapters([...chapters, savedChapter]);
        setIsCreating(false);
      } else {
        const errorData = await response.json();
        console.error('Ошибка при создании главы:', errorData);
        alert('Ошибка при создании главы. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при создании главы:', error);
      alert('Ошибка при создании главы. Убедитесь, что сервер запущен на порту 3001.');
    }
  };

  const handleEditChapter = (chapter) => {
    onChapterSelect(chapter);
    setIsCreating(true);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту главу?')) {
      try {
        // Удаляем главу через API
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/chapters/${chapterId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setChapters(chapters.filter(ch => ch.id !== chapterId));
          if (selectedChapter?.id === chapterId) {
            onChapterSelect(null);
          }
        } else {
          const errorData = await response.json();
          console.error('Ошибка при удалении главы:', errorData);
          alert('Ошибка при удалении главы. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Ошибка при удалении главы:', error);
        alert('Ошибка при удалении главы. Убедитесь, что сервер запущен на порту 3001.');
      }
    }
  };

  if (!selectedEpisode) {
    return (
      <div className="chapter-manager">
        <div className="no-selection">
          <h2>Управление главами</h2>
          <p>Выберите эпизод для управления главами</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-manager">
      <div className="manager-header">
        <div className="header-info">
          <h2>Управление главами</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
        </div>
        <button className="create-button" onClick={handleCreateChapter}>
          + Создать главу
        </button>
      </div>

      {isCreating ? (
        <ChapterForm 
          onSave={handleSaveChapter} 
          onCancel={() => {
            setIsCreating(false);
            onChapterSelect(null);
          }}
          chapter={selectedChapter}
          episodeId={selectedEpisode.id}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка глав...</p>
            </div>
          ) : (
            <div className="chapters-list">
              {chapters.length === 0 ? (
                <div className="empty-state">
                  <p>Главы не найдены</p>
                  <p>Создайте первую главу для эпизода "{selectedEpisode.name}"</p>
                </div>
              ) : (
                chapters.map(chapter => (
                  <div
                    key={chapter.id}
                    className={`chapter-item ${selectedChapter?.id === chapter.id ? 'selected' : ''}`}
                  >
                    <div className="chapter-content" onClick={() => onChapterSelect(chapter)}>
                      <h3>{chapter.name}</h3>
                      <p>{chapter.description}</p>
                      <div className="chapter-meta">
                        <span className="chapter-duration">{chapter.duration}</span>
                        <span className="chapter-scenes-count">
                          {chapter.scenes ? chapter.scenes.length : 0} сцен
                        </span>
                      </div>
                    </div>
                    <div className="chapter-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditChapter(chapter)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteChapter(chapter.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Компонент управления сценами
const SceneManager = ({ selectedEpisode, selectedChapter }) => {
  const [scenes, setScenes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingScene, setEditingScene] = useState(null);

  // Загрузка сцен при выборе главы
  useEffect(() => {
    const loadScenes = async () => {
      if (!selectedEpisode || !selectedChapter) {
        setScenes([]);
        return;
      }

      setIsLoading(true);
      try {
        // Загружаем сцены через API
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/chapters/${selectedChapter.id}/scenes`);
        if (response.ok) {
          const apiScenes = await response.json();
          setScenes(apiScenes);
        } else {
          console.error('Ошибка загрузки сцен через API');
          // Fallback: загружаем сцены из файловой системы
          try {
            const fileResponse = await fetch(`/episodes/${selectedEpisode.id}/chapters/chapter${selectedChapter.id}/config.json`);
            if (fileResponse.ok) {
              const chapterConfig = await fileResponse.json();
              const sceneIds = chapterConfig.scenes || [];
              
              // Загружаем данные каждой сцены
              const scenesData = [];
              const uniqueSceneIds = [...new Set(sceneIds)]; // Убираем дубликаты
              
              for (const sceneId of uniqueSceneIds) {
                try {
                  const sceneResponse = await fetch(`/episodes/${selectedEpisode.id}/scenes/${sceneId}.json`);
                  if (sceneResponse.ok) {
                    const sceneData = await sceneResponse.json();
                    scenesData.push(sceneData);
                  } else {
                    // Если сцена не найдена, создаем заглушку
                    scenesData.push({
                      id: sceneId,
                      name: sceneId,
                      dialogue: [],
                      choices: []
                    });
                  }
                } catch (error) {
                  console.error(`Ошибка загрузки сцены ${sceneId}:`, error);
                  // Создаем заглушку для сцены с ошибкой
                  scenesData.push({
                    id: sceneId,
                    name: sceneId,
                    dialogue: [],
                    choices: []
                  });
                }
              }
              
              setScenes(scenesData);
            } else {
              setScenes([]);
            }
          } catch (fallbackError) {
            console.error('Ошибка fallback загрузки сцен:', fallbackError);
            setScenes([]);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки сцен:', error);
        // Fallback: загружаем сцены из файловой системы
        try {
          const fileResponse = await fetch(`/episodes/${selectedEpisode.id}/chapters/chapter${selectedChapter.id}/config.json`);
          if (fileResponse.ok) {
            const chapterConfig = await fileResponse.json();
            const sceneIds = chapterConfig.scenes || [];
            
            // Загружаем данные каждой сцены
            const scenesData = [];
            const uniqueSceneIds = [...new Set(sceneIds)]; // Убираем дубликаты
            
            for (const sceneId of uniqueSceneIds) {
              try {
                const sceneResponse = await fetch(`/episodes/${selectedEpisode.id}/scenes/${sceneId}.json`);
                if (sceneResponse.ok) {
                  const sceneData = await sceneResponse.json();
                  scenesData.push(sceneData);
                } else {
                  // Если сцена не найдена, создаем заглушку
                  scenesData.push({
                    id: sceneId,
                    name: sceneId,
                    dialogue: [],
                    choices: []
                  });
                }
              } catch (error) {
                console.error(`Ошибка загрузки сцены ${sceneId}:`, error);
                // Создаем заглушку для сцены с ошибкой
                scenesData.push({
                  id: sceneId,
                  name: sceneId,
                  dialogue: [],
                  choices: []
                });
              }
            }
            
            setScenes(scenesData);
          } else {
            setScenes([]);
          }
        } catch (fallbackError) {
          console.error('Ошибка fallback загрузки сцен:', fallbackError);
          setScenes([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadScenes();
  }, [selectedEpisode, selectedChapter]);

  const handleCreateScene = () => {
    setEditingScene(null);
    setIsCreating(true);
  };

  const handleSaveScene = async (sceneData) => {
    try {
      if (editingScene) {
        // Обновляем существующую сцену через API
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/scenes/${editingScene.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sceneData)
        });

        if (response.ok) {
          const updatedScene = await response.json();
          const updatedScenes = scenes.map(scene => 
            scene.id === editingScene.id ? updatedScene : scene
          );
          setScenes(updatedScenes);
        } else {
          const errorData = await response.json();
          console.error('Ошибка при обновлении сцены:', errorData);
          alert('Ошибка при обновлении сцены. Попробуйте еще раз.');
          return;
        }
      } else {
        // Создаем новую сцену через API
        const newScene = {
          ...sceneData,
          id: sceneData.id || `scene_${Date.now()}`
        };
        
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/chapters/${selectedChapter.id}/scenes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newScene)
        });

        if (response.ok) {
          const savedScene = await response.json();
          setScenes([...scenes, savedScene]);
        } else {
          const errorData = await response.json();
          console.error('Ошибка при создании сцены:', errorData);
          alert('Ошибка при создании сцены. Попробуйте еще раз.');
          return;
        }
      }
      
      setIsCreating(false);
      setEditingScene(null);
    } catch (error) {
      console.error('Ошибка при сохранении сцены:', error);
      alert('Ошибка при сохранении сцены. Убедитесь, что сервер запущен на порту 3001.');
    }
  };

  const handleEditScene = (scene) => {
    console.log('SceneManager: editing scene', scene);
    setEditingScene(scene);
    setIsCreating(true);
  };

  const handleDeleteScene = async (sceneId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту сцену?')) {
      try {
        // Удаляем сцену через API
        const response = await fetch(`http://localhost:3001/api/episodes/${selectedEpisode.id}/scenes/${sceneId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setScenes(scenes.filter(sc => sc.id !== sceneId));
        } else {
          const errorData = await response.json();
          console.error('Ошибка при удалении сцены:', errorData);
          alert('Ошибка при удалении сцены. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Ошибка при удалении сцены:', error);
        alert('Ошибка при удалении сцены. Убедитесь, что сервер запущен на порту 3001.');
      }
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

  return (
    <div className="scene-manager">
      <div className="manager-header">
        <div className="header-info">
          <h2>Управление сценами</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
          <p className="chapter-info">Глава: {selectedChapter.name}</p>
        </div>
        {!isCreating && (
          <div className="create-buttons">
            <button className="create-button" onClick={handleCreateScene}>
              + Создать сцену
            </button>
            <button className="create-button secondary" onClick={() => {
              const exampleScene = {
                id: 'scene_example',
                chapterId: selectedChapter.id,
                name: 'Пример сцены с проверкой',
                background: 'mansion_hall',
                characters: [
                  { id: 'anna', position: 'center', name: 'Анна' }
                ],
                dialogue: [
                  { speaker: 'anna', text: 'Попробуй обмануть меня!', emotion: 'challenging' }
                ],
                choices: [
                  {
                    id: 'scene_example_choice1',
                    text: '[Коварство] Попытаться обмануть Анну',
                    nextScene: '',
                    important: false,
                    value: '',
                    description: '',
                    consequences: [''],
                    effects: { items: {}, relationships: {} },
                    diceCheck: {
                      stat: 'cunning',
                      difficulty: 15,
                      description: 'Попытка обмануть Анну',
                      results: {
                        critical_success: 'scene_critical_success',
                        success: 'scene_success',
                        failure: 'scene_failure',
                        critical_failure: 'scene_critical_failure'
                      }
                    },
                    specialInteraction: '',
                    requiredItem: '',
                    conditions: {}
                  }
                ]
              };
              setEditingScene(exampleScene);
              setIsCreating(true);
            }}>
              🎲 Пример с проверкой
            </button>
          </div>
        )}
      </div>

      {isCreating ? (
        <SceneForm 
          onSave={handleSaveScene} 
          onCancel={() => {
            setIsCreating(false);
            setEditingScene(null);
          }}
          scene={editingScene}
          episodeId={selectedEpisode.id}
          chapterId={selectedChapter.id}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка сцен...</p>
            </div>
          ) : (
            <div className="scenes-list">
              {scenes.length === 0 ? (
                <div className="empty-state">
                  <p>Сцены не найдены</p>
                  <p>Создайте первую сцену для главы "{selectedChapter.name}"</p>
                </div>
              ) : (
                scenes.map(scene => (
                  <div
                    key={scene.id}
                    className="scene-item"
                  >
                    <div className="scene-content">
                      <h3>{scene.name || scene.id}</h3>
                      <p>ID: {scene.id}</p>
                      <p>{scene.dialogue ? `${scene.dialogue.length} диалогов` : 'Нет диалогов'}</p>
                      <div className="scene-meta">
                        <span className="scene-choices">
                          {scene.choices ? scene.choices.length : 0} выборов
                        </span>
                        <span className="scene-background">
                          {scene.background ? 'Фон' : 'Без фона'}
                        </span>
                        <span className="scene-characters">
                          {scene.characters ? scene.characters.length : 0} персонажей
                        </span>
                        {scene.choices && scene.choices.some(choice => choice.diceCheck) && (
                          <span className="scene-dice-checks">
                            🎲 Проверки
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="scene-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditScene(scene)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteScene(scene.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Компонент управления механиками
const MechanicsManager = () => {
  return (
    <div className="mechanics-manager">
      <h2>Управление механиками</h2>
      <p>Настройка игровых механик</p>
    </div>
  );
};

// Компонент отображения древа сцен
const SceneTreeView = ({ selectedEpisode, selectedChapter }) => {
  const [scenes, setScenes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [treeData, setTreeData] = useState({ nodes: [], connections: [] });
  const treeContainerRef = useRef(null);

  // Загрузка сцен для построения дерева
  useEffect(() => {
    const loadScenesForTree = async () => {
      if (!selectedEpisode || !selectedChapter) {
        setScenes([]);
        setTreeData({ nodes: [], connections: [] });
        return;
      }

      setIsLoading(true);
      try {
        // Загружаем конфигурацию главы
        const response = await fetch(`/episodes/${selectedEpisode.id}/chapters/chapter${selectedChapter.id}/config.json`);
        if (response.ok) {
          const chapterConfig = await response.json();
          const sceneIds = chapterConfig.scenes || [];
          const uniqueSceneIds = [...new Set(sceneIds)];
          
          // Загружаем данные сцен для анализа связей
          const scenesData = [];
          for (const sceneId of uniqueSceneIds) {
            try {
              const sceneResponse = await fetch(`/episodes/${selectedEpisode.id}/scenes/${sceneId}.json`);
              if (sceneResponse.ok) {
                const sceneData = await sceneResponse.json();
                scenesData.push(sceneData);
              } else {
                scenesData.push({
                  id: sceneId,
                  name: sceneId,
                  choices: []
                });
              }
            } catch (error) {
              scenesData.push({
                id: sceneId,
                name: sceneId,
                choices: []
              });
            }
          }
          
          setScenes(scenesData);
          
          // Строим дерево связей
          const tree = buildSceneTree(scenesData);
          setTreeData(tree);
        } else {
          setScenes([]);
          setTreeData({ nodes: [], connections: [] });
        }
      } catch (error) {
        console.error('Ошибка загрузки сцен для дерева:', error);
        setScenes([]);
        setTreeData({ nodes: [], connections: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadScenesForTree();
  }, [selectedEpisode, selectedChapter]);

  // Функция построения дерева сцен
  const buildSceneTree = (scenesData) => {
    const sceneMap = new Map();
    const connections = [];
    
    // Создаем узлы для всех сцен
    scenesData.forEach((scene) => {
      sceneMap.set(scene.id, {
        id: scene.id,
        name: scene.name || scene.id,
        x: 0,
        y: 0,
        level: 0,
        choices: scene.choices || []
      });
    });

    // Находим связи между сценами
    scenesData.forEach(scene => {
      if (scene.choices) {
        scene.choices.forEach(choice => {
          // Обычные переходы
          if (choice.nextScene && sceneMap.has(choice.nextScene)) {
            connections.push({
              from: scene.id,
              to: choice.nextScene,
              text: choice.text || 'Выбор'
            });
          }
          
          // Проверки характеристик с множественными исходами
          if (choice.diceCheck && choice.diceCheck.results) {
            const results = choice.diceCheck.results;
            const statName = choice.diceCheck.stat;
            
            // Критический успех
            if (results.critical_success && sceneMap.has(results.critical_success)) {
              connections.push({
                from: scene.id,
                to: results.critical_success,
                text: `🎯 ${choice.text} (Крит. успех)`
              });
            }
            
            // Успех
            if (results.success && sceneMap.has(results.success)) {
              connections.push({
                from: scene.id,
                to: results.success,
                text: `✅ ${choice.text} (Успех)`
              });
            }
            
            // Провал
            if (results.failure && sceneMap.has(results.failure)) {
              connections.push({
                from: scene.id,
                to: results.failure,
                text: `❌ ${choice.text} (Провал)`
              });
            }
            
            // Критический провал
            if (results.critical_failure && sceneMap.has(results.critical_failure)) {
              connections.push({
                from: scene.id,
                to: results.critical_failure,
                text: `💥 ${choice.text} (Крит. провал)`
              });
            }
          }
        });
      }
    });

    // Определяем уровни для каждого узла (BFS)
    const visited = new Set();
    const queue = [{ id: scenesData[0]?.id, level: 0 }];
    
    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (visited.has(id)) continue;
      
      visited.add(id);
      const node = sceneMap.get(id);
      if (node) {
        node.level = level;
        
        // Добавляем связанные узлы в очередь
        connections.forEach(conn => {
          if (conn.from === id && !visited.has(conn.to)) {
            queue.push({ id: conn.to, level: level + 1 });
          }
        });
      }
    }

    // Группируем узлы по уровням
    const levels = new Map();
    sceneMap.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, []);
      }
      levels.get(node.level).push(node);
    });

    // Позиционируем узлы
    const levelSpacing = 200;
    const nodeSpacing = 150;
    
    levels.forEach((nodes, level) => {
      const levelY = level * levelSpacing + 50;
      const totalWidth = (nodes.length - 1) * nodeSpacing;
      const startX = 50;
      
      nodes.forEach((node, index) => {
        node.x = startX + index * nodeSpacing;
        node.y = levelY;
      });
    });

    // Вычисляем размеры для SVG
    const nodes = Array.from(sceneMap.values());
    let maxX = 0, maxY = 0;
    
    nodes.forEach(node => {
      maxX = Math.max(maxX, node.x + 120); // 120px - ширина узла
      maxY = Math.max(maxY, node.y + 80);  // 80px - высота узла
    });
    
    // Добавляем отступы
    const svgWidth = Math.max(maxX + 50, 800);
    const svgHeight = Math.max(maxY + 50, 400);
    
    return {
      nodes: nodes,
      connections: connections,
      svgWidth: svgWidth,
      svgHeight: svgHeight
    };
  };

  if (!selectedEpisode) {
    return (
      <div className="scene-tree-view">
        <div className="no-selection">
          <h2>Древо сцен</h2>
          <p>Выберите эпизод для отображения дерева сцен</p>
        </div>
      </div>
    );
  }

  if (!selectedChapter) {
    return (
      <div className="scene-tree-view">
        <div className="no-selection">
          <h2>Древо сцен</h2>
          <p>Выберите главу для отображения дерева сцен</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-tree-view">
      <div className="manager-header">
        <div className="header-info">
          <h2>Древо сцен</h2>
          <p className="episode-info">Эпизод: {selectedEpisode.name}</p>
          <p className="chapter-info">Глава: {selectedChapter.name}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка дерева сцен...</p>
        </div>
      ) : (
        <div className="scene-tree-container" ref={treeContainerRef}>
          {!treeData || !treeData.nodes || treeData.nodes.length === 0 ? (
            <div className="empty-state">
              <p>Сцены не найдены</p>
              <p>Создайте сцены для отображения дерева связей</p>
            </div>
          ) : (
            <div className="tree-svg-container">
              <svg 
                className="tree-svg" 
                width={treeData.svgWidth || 800} 
                height={treeData.svgHeight || 400}
                viewBox={`0 0 ${treeData.svgWidth || 800} ${treeData.svgHeight || 400}`}
              >
                                 {/* Отрисовка связей */}
                 {treeData.connections && treeData.connections.map((connection, index) => {
                   const fromNode = treeData.nodes.find(n => n.id === connection.from);
                   const toNode = treeData.nodes.find(n => n.id === connection.to);
                   
                   if (fromNode && toNode) {
                     const fromX = fromNode.x + 60; // центр узла
                     const fromY = fromNode.y + 40;
                     const toX = toNode.x + 60;
                     const toY = toNode.y + 40;
                     
                     // Создаем изогнутую линию
                     const midX = (fromX + toX) / 2;
                     const midY = (fromY + toY) / 2;
                     
                     // Определяем цвет и стиль связи в зависимости от типа
                     const isDiceCheck = connection.text.includes('🎯') || connection.text.includes('✅') || 
                                       connection.text.includes('❌') || connection.text.includes('💥');
                     const strokeColor = isDiceCheck ? '#2196F3' : '#4CAF50';
                     const strokeWidth = isDiceCheck ? '3' : '2';
                     
                     return (
                       <g key={`connection-${index}`}>
                         <path
                           d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
                           stroke={strokeColor}
                           strokeWidth={strokeWidth}
                           fill="none"
                           markerEnd={`url(#arrowhead-${isDiceCheck ? 'dice' : 'normal'})`}
                         />
                         <text
                           x={midX}
                           y={midY - 15}
                           textAnchor="middle"
                           fill="white"
                           fontSize="10"
                           className="connection-label"
                         >
                           {connection.text.length > 15 ? connection.text.substring(0, 15) + '...' : connection.text}
                         </text>
                       </g>
                     );
                   }
                   return null;
                 })}
                
                {/* Стрелки для связей */}
                <defs>
                  <marker
                    id="arrowhead-normal"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50" />
                  </marker>
                  <marker
                    id="arrowhead-dice"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
                  </marker>
                </defs>
              </svg>
              
              {/* Отрисовка узлов */}
              <div className="tree-nodes">
                {treeData.nodes && treeData.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="tree-node"
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`
                    }}
                  >
                    <div className="node-content">
                      <div className="node-id">{node.id}</div>
                      <div className="node-name">{node.name}</div>
                      {node.choices.length > 0 && (
                        <div className="node-choices">
                          {node.choices.length} выборов
                          {node.choices.some(choice => choice.diceCheck) && (
                            <span className="node-dice-check">🎲</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Форма создания/редактирования эпизода
const EpisodeForm = ({ onSave, onCancel, episode = null, isSaving = false }) => {
  const [formData, setFormData] = useState({
    id: episode?.id || '',
    name: episode?.name || '',
    description: episode?.description || '',
    longDescription: episode?.longDescription || '',
    type: episode?.type || 'detective',
    ageRating: episode?.ageRating || '0+',
    duration: episode?.duration || '',
    difficulty: episode?.difficulty || 'normal',
    tags: episode?.tags || [],
    preview: episode?.preview || 'preview.png'
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setIsUploading(true);
    try {
      const formDataImage = new FormData();
      formDataImage.append('image', file);
      formDataImage.append('episodeId', formData.id || 'temp');

      const response = await fetch('http://localhost:3001/api/episodes/upload-preview', {
        method: 'POST',
        body: formDataImage
      });

      if (response.ok) {
        const result = await response.json();
        setFormData({ ...formData, preview: result.filename });
        setPreviewImage(URL.createObjectURL(file));
      } else {
        alert('Ошибка при загрузке изображения');
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      alert('Ошибка при загрузке изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="episode-form" onSubmit={handleSubmit}>
      <h3>{episode ? 'Редактирование эпизода' : 'Создание нового эпизода'}</h3>
      
      <div className="form-group">
        <label>ID эпизода:</label>
        <input
          type="text"
          value={formData.id}
          onChange={(e) => setFormData({...formData, id: e.target.value})}
          placeholder="mansion"
          required
        />
      </div>

      <div className="form-group">
        <label>Название:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Поместье"
          required
        />
      </div>

      <div className="form-group">
        <label>Краткое описание:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Детективное расследование"
          required
        />
      </div>

      <div className="form-group">
        <label>Подробное описание:</label>
        <textarea
          value={formData.longDescription}
          onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
          placeholder="Этот эпизод поможет вам освоить все основные механики игры..."
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Тип:</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="detective">Детектив</option>
            <option value="romance">Романтика</option>
            <option value="adventure">Приключения</option>
            <option value="mystery">Мистика</option>
          </select>
        </div>

        <div className="form-group">
          <label>Возрастной рейтинг:</label>
          <select
            value={formData.ageRating}
            onChange={(e) => setFormData({...formData, ageRating: e.target.value})}
          >
            <option value="0+">0+</option>
            <option value="12+">12+</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Длительность:</label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            placeholder="60-75 минут"
          />
        </div>

        <div className="form-group">
          <label>Сложность:</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
          >
            <option value="easy">Легкая</option>
            <option value="normal">Нормальная</option>
            <option value="hard">Сложная</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Превью изображение:</label>
        <div className="image-upload-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="image-upload-input"
          />
          {isUploading && <div className="upload-status">Загрузка...</div>}
          {previewImage && (
            <div className="preview-image">
              <img src={previewImage} alt="Превью" />
            </div>
          )}
          {formData.preview && !previewImage && (
            <div className="current-preview">
              <span>Текущее изображение: {formData.preview}</span>
            </div>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="save-button" disabled={isSaving}>
          {isSaving ? 'Сохранение...' : (episode ? 'Обновить' : 'Создать')}
        </button>
      </div>
    </form>
  );
};

// Форма создания/редактирования сцены
const SceneForm = ({ onSave, onCancel, scene = null, episodeId, chapterId }) => {
  const [formData, setFormData] = useState({
    id: '',
    chapterId: chapterId || '',
    name: '',
    background: '',
    characters: [],
    dialogue: [],
    choices: []
  });

  const [activeTab, setActiveTab] = useState('basic');

  // Обновляем данные формы при изменении сцены
  useEffect(() => {
    console.log('SceneForm: scene changed', scene);
    if (scene) {
      const newFormData = {
        id: scene.id || '',
        chapterId: scene.chapterId || chapterId || '',
        name: scene.name || '',
        background: scene.background || '',
        characters: scene.characters || [],
        dialogue: scene.dialogue || [],
        choices: scene.choices || []
      };
      console.log('SceneForm: setting form data for editing', newFormData);
      setFormData(newFormData);
    } else {
      const newFormData = {
        id: '',
        chapterId: chapterId || '',
        name: '',
        background: '',
        characters: [],
        dialogue: [],
        choices: []
      };
      console.log('SceneForm: setting form data for new scene', newFormData);
      setFormData(newFormData);
    }
  }, [scene, chapterId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Функции для работы с персонажами
  const addCharacter = () => {
    if (formData.characters.length < 3) {
      setFormData({
        ...formData,
        characters: [...formData.characters, { id: '', position: 'center', name: '' }]
      });
    }
  };

  const removeCharacter = (index) => {
    setFormData({
      ...formData,
      characters: formData.characters.filter((_, i) => i !== index)
    });
  };

  const updateCharacter = (index, field, value) => {
    const newCharacters = [...formData.characters];
    newCharacters[index] = { ...newCharacters[index], [field]: value };
    setFormData({ ...formData, characters: newCharacters });
  };

  // Функции для работы с диалогами
  const addDialogue = () => {
    setFormData({
      ...formData,
      dialogue: [...formData.dialogue, { speaker: '', text: '', emotion: 'normal' }]
    });
  };

  const removeDialogue = (index) => {
    setFormData({
      ...formData,
      dialogue: formData.dialogue.filter((_, i) => i !== index)
    });
  };

  const updateDialogue = (index, field, value) => {
    const newDialogue = [...formData.dialogue];
    newDialogue[index] = { ...newDialogue[index], [field]: value };
    setFormData({ ...formData, dialogue: newDialogue });
  };

  // Функции для работы с вариантами выбора
  const addChoice = () => {
    setFormData({
      ...formData,
      choices: [...formData.choices, {
        id: '',
        text: '',
        nextScene: '',
        important: false,
        value: '',
        description: '',
        consequences: [''],
        effects: { items: {}, relationships: {} },
        diceCheck: null,
        specialInteraction: '',
        requiredItem: '',
        conditions: {}
      }]
    });
  };

  const removeChoice = (index) => {
    setFormData({
      ...formData,
      choices: formData.choices.filter((_, i) => i !== index)
    });
  };

  const updateChoice = (index, field, value) => {
    const newChoices = [...formData.choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setFormData({ ...formData, choices: newChoices });
  };

  const addConsequence = (choiceIndex) => {
    const newChoices = [...formData.choices];
    newChoices[choiceIndex].consequences.push('');
    setFormData({ ...formData, choices: newChoices });
  };

  const removeConsequence = (choiceIndex, consequenceIndex) => {
    const newChoices = [...formData.choices];
    newChoices[choiceIndex].consequences.splice(consequenceIndex, 1);
    setFormData({ ...formData, choices: newChoices });
  };

  const updateConsequence = (choiceIndex, consequenceIndex, value) => {
    const newChoices = [...formData.choices];
    newChoices[choiceIndex].consequences[consequenceIndex] = value;
    setFormData({ ...formData, choices: newChoices });
  };

  return (
    <div className="scene-form-container">
      <div className="form-tabs">
        <button
          type="button"
          className={`form-tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Основное
        </button>
        <button
          type="button"
          className={`form-tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          Персонажи
        </button>
        <button
          type="button"
          className={`form-tab ${activeTab === 'dialogue' ? 'active' : ''}`}
          onClick={() => setActiveTab('dialogue')}
        >
          Диалоги
        </button>
        <button
          type="button"
          className={`form-tab ${activeTab === 'choices' ? 'active' : ''}`}
          onClick={() => setActiveTab('choices')}
        >
          Варианты выбора
        </button>
      </div>

      <form className="scene-form" onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="form-section">
            <h3>{scene ? 'Редактирование сцены' : 'Создание новой сцены'}</h3>
            
            <div className="form-group">
              <label>ID сцены:</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                placeholder="scene1"
                required
              />
            </div>

            <div className="form-group">
              <label>ID главы:</label>
              <input
                type="text"
                value={formData.chapterId}
                onChange={(e) => setFormData({...formData, chapterId: e.target.value})}
                placeholder="chapter1"
                required
              />
            </div>

            <div className="form-group">
              <label>Название сцены:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Добро пожаловать в игру"
                required
              />
            </div>

            <div className="form-group">
              <label>ID фона:</label>
              <input
                type="text"
                value={formData.background}
                onChange={(e) => setFormData({...formData, background: e.target.value})}
                placeholder="mansion_outside"
              />
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="form-section">
            <h3>Персонажи в сцене (максимум 3)</h3>
            
            {formData.characters.map((character, index) => (
              <div key={index} className="character-item">
                <div className="character-header">
                  <h4>Персонаж {index + 1}</h4>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeCharacter(index)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>ID персонажа:</label>
                    <input
                      type="text"
                      value={character.id}
                      onChange={(e) => updateCharacter(index, 'id', e.target.value)}
                      placeholder="anna"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Позиция:</label>
                    <select
                      value={character.position}
                      onChange={(e) => updateCharacter(index, 'position', e.target.value)}
                    >
                      <option value="left">Слева</option>
                      <option value="center">По центру</option>
                      <option value="right">Справа</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Имя персонажа:</label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                    placeholder="Анна"
                  />
                </div>
              </div>
            ))}
            
            {formData.characters.length < 3 && (
              <button type="button" className="add-button" onClick={addCharacter}>
                + Добавить персонажа
              </button>
            )}
          </div>
        )}

        {activeTab === 'dialogue' && (
          <div className="form-section">
            <h3>Диалоги</h3>
            
            {formData.dialogue.map((dialogue, index) => (
              <div key={index} className="dialogue-item">
                <div className="dialogue-header">
                  <h4>Диалог {index + 1}</h4>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeDialogue(index)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Говорящий:</label>
                    <input
                      type="text"
                      value={dialogue.speaker}
                      onChange={(e) => updateDialogue(index, 'speaker', e.target.value)}
                      placeholder="anna"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Эмоция:</label>
                    <select
                      value={dialogue.emotion}
                      onChange={(e) => updateDialogue(index, 'emotion', e.target.value)}
                    >
                      <option value="normal">Обычная</option>
                      <option value="happy">Радость</option>
                      <option value="sad">Грусть</option>
                      <option value="angry">Злость</option>
                      <option value="surprised">Удивление</option>
                      <option value="confused">Растерянность</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Текст диалога:</label>
                  <textarea
                    value={dialogue.text}
                    onChange={(e) => updateDialogue(index, 'text', e.target.value)}
                    placeholder="Привет! Как дела?"
                    rows={3}
                  />
                </div>
              </div>
            ))}
            
            <button type="button" className="add-button" onClick={addDialogue}>
              + Добавить диалог
            </button>
          </div>
        )}

        {activeTab === 'choices' && (
          <div className="form-section">
            <h3>Варианты выбора</h3>
            
            {formData.choices.map((choice, index) => (
              <div key={index} className="choice-item">
                <div className="choice-header">
                  <h4>Вариант {index + 1}</h4>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeChoice(index)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="form-group">
                  <label>ID варианта:</label>
                  <input
                    type="text"
                    value={choice.id}
                    onChange={(e) => updateChoice(index, 'id', e.target.value)}
                    placeholder="scene1_choice1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Текст варианта:</label>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => updateChoice(index, 'text', e.target.value)}
                    placeholder="Пойти в класс"
                  />
                </div>
                
                <div className="form-group">
                  <label>Следующая сцена:</label>
                  <input
                    type="text"
                    value={choice.nextScene}
                    onChange={(e) => updateChoice(index, 'nextScene', e.target.value)}
                    placeholder="scene2"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={choice.important}
                        onChange={(e) => updateChoice(index, 'important', e.target.checked)}
                      />
                      Важный выбор
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label>Требуемый предмет:</label>
                    <input
                      type="text"
                      value={choice.requiredItem || ''}
                      onChange={(e) => updateChoice(index, 'requiredItem', e.target.value)}
                      placeholder="apple"
                    />
                  </div>
                </div>
                
                {choice.important && (
                  <div className="important-choice-fields">
                    <div className="form-group">
                      <label>Значение важного выбора:</label>
                      <input
                        type="text"
                        value={choice.value}
                        onChange={(e) => updateChoice(index, 'value', e.target.value)}
                        placeholder="choice_value"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Описание важного выбора:</label>
                      <textarea
                        value={choice.description}
                        onChange={(e) => updateChoice(index, 'description', e.target.value)}
                        placeholder="Описание важного выбора"
                        rows={2}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Последствия:</label>
                      {choice.consequences.map((consequence, consequenceIndex) => (
                        <div key={consequenceIndex} className="consequence-item">
                          <input
                            type="text"
                            value={consequence}
                            onChange={(e) => updateConsequence(index, consequenceIndex, e.target.value)}
                            placeholder="Описание последствия"
                          />
                          <button
                            type="button"
                            className="remove-button small"
                            onClick={() => removeConsequence(index, consequenceIndex)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-button small"
                        onClick={() => addConsequence(index)}
                      >
                        + Добавить последствие
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Специальное взаимодействие:</label>
                  <input
                    type="text"
                    value={choice.specialInteraction || ''}
                    onChange={(e) => updateChoice(index, 'specialInteraction', e.target.value)}
                    placeholder="pet_play"
                  />
                </div>
                
                <div className="form-group">
                  <label>Проверка характеристик:</label>
                  <div className="dice-check-section">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Характеристика:</label>
                        <select
                          value={choice.diceCheck?.stat || ''}
                          onChange={(e) => {
                            const newChoices = [...formData.choices];
                            if (!newChoices[index].diceCheck) {
                              newChoices[index].diceCheck = {};
                            }
                            newChoices[index].diceCheck.stat = e.target.value;
                            setFormData({ ...formData, choices: newChoices });
                          }}
                        >
                          <option value="">Нет проверки</option>
                          <option value="charisma">Харизма</option>
                          <option value="coldness">Холод</option>
                          <option value="determination">Решительность</option>
                          <option value="intelligence">Интеллект</option>
                          <option value="cunning">Коварство</option>
                          <option value="sensitivity">Чувствительность</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Сложность:</label>
                        <input
                          type="number"
                          value={choice.diceCheck?.difficulty || ''}
                          onChange={(e) => {
                            const newChoices = [...formData.choices];
                            if (!newChoices[index].diceCheck) {
                              newChoices[index].diceCheck = {};
                            }
                            newChoices[index].diceCheck.difficulty = parseInt(e.target.value);
                            setFormData({ ...formData, choices: newChoices });
                          }}
                          placeholder="15"
                        />
                      </div>
                    </div>
                    
                                         {choice.diceCheck?.stat && (
                       <>
                         <div className="form-group">
                           <label>Описание проверки:</label>
                           <input
                             type="text"
                             value={choice.diceCheck?.description || ''}
                             onChange={(e) => {
                               const newChoices = [...formData.choices];
                               newChoices[index].diceCheck.description = e.target.value;
                               setFormData({ ...formData, choices: newChoices });
                             }}
                             placeholder="Попытка обмануть Николая"
                           />
                         </div>
                         
                         <div className="dice-results">
                           <h5>Результаты проверки:</h5>
                           
                           <div className="form-row">
                             <div className="form-group">
                               <label>Критический успех → сцена:</label>
                               <input
                                 type="text"
                                 value={choice.diceCheck?.results?.critical_success || ''}
                                 onChange={(e) => {
                                   const newChoices = [...formData.choices];
                                   if (!newChoices[index].diceCheck.results) {
                                     newChoices[index].diceCheck.results = {};
                                   }
                                   newChoices[index].diceCheck.results.critical_success = e.target.value;
                                   setFormData({ ...formData, choices: newChoices });
                                 }}
                                 placeholder="scene98"
                               />
                             </div>
                             
                             <div className="form-group">
                               <label>Успех → сцена:</label>
                               <input
                                 type="text"
                                 value={choice.diceCheck?.results?.success || ''}
                                 onChange={(e) => {
                                   const newChoices = [...formData.choices];
                                   if (!newChoices[index].diceCheck.results) {
                                     newChoices[index].diceCheck.results = {};
                                   }
                                   newChoices[index].diceCheck.results.success = e.target.value;
                                   setFormData({ ...formData, choices: newChoices });
                                 }}
                                 placeholder="scene97"
                               />
                             </div>
                           </div>
                           
                           <div className="form-row">
                             <div className="form-group">
                               <label>Провал → сцена:</label>
                               <input
                                 type="text"
                                 value={choice.diceCheck?.results?.failure || ''}
                                 onChange={(e) => {
                                   const newChoices = [...formData.choices];
                                   if (!newChoices[index].diceCheck.results) {
                                     newChoices[index].diceCheck.results = {};
                                   }
                                   newChoices[index].diceCheck.results.failure = e.target.value;
                                   setFormData({ ...formData, choices: newChoices });
                                 }}
                                 placeholder="scene100"
                               />
                             </div>
                             
                             <div className="form-group">
                               <label>Критический провал → сцена:</label>
                               <input
                                 type="text"
                                 value={choice.diceCheck?.results?.critical_failure || ''}
                                 onChange={(e) => {
                                   const newChoices = [...formData.choices];
                                   if (!newChoices[index].diceCheck.results) {
                                     newChoices[index].diceCheck.results = {};
                                   }
                                   newChoices[index].diceCheck.results.critical_failure = e.target.value;
                                   setFormData({ ...formData, choices: newChoices });
                                 }}
                                 placeholder="scene95"
                               />
                             </div>
                           </div>
                         </div>
                       </>
                     )}
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" className="add-button" onClick={addChoice}>
              + Добавить вариант выбора
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="save-button">
            {scene ? 'Обновить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Форма создания/редактирования главы
const ChapterForm = ({ onSave, onCancel, chapter = null, episodeId }) => {
  const [formData, setFormData] = useState({
    name: chapter?.name || '',
    description: chapter?.description || '',
    duration: chapter?.duration || '',
    scenes: chapter?.scenes || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="chapter-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Название главы:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Глава 1: Знакомство с основами"
          required
        />
      </div>

      <div className="form-group">
        <label>Описание:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Краткое описание главы"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Длительность:</label>
        <input
          type="text"
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: e.target.value})}
          placeholder="3-5 минут"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-button" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="save-button">
          Сохранить
        </button>
      </div>
    </form>
  );
};

export default EpisodeEditorScreen; 