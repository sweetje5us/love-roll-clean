import React, { useState, useEffect } from 'react';
import './App.css';
import EpisodeManager from './components/EpisodeManager';
import ChapterManager from './components/ChapterManager';
import SceneManager from './components/SceneManager';
import MechanicsManager from './components/MechanicsManager';
import SceneTreeView from './components/SceneTreeView';
import CharacterManager from './components/CharacterManager';
import SceneModal from './components/SceneModal';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('episodes');
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [creatingSceneId, setCreatingSceneId] = useState(null);

  const tabs = [
    { id: 'episodes', name: 'Эпизоды', icon: '📚' },
    { id: 'chapters', name: 'Главы', icon: '📖' },
    { id: 'scenes', name: 'Сцены', icon: '🎭' },
    { id: 'characters', name: 'Персонажи', icon: '👥' },
    { id: 'mechanics', name: 'Механики', icon: '⚙️' },
    { id: 'tree', name: 'Древо сцен', icon: '🌳' }
  ];

  useEffect(() => {
    loadEpisodes();
  }, []);

  const loadEpisodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/episodes`);
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data);
      } else {
        console.error('Ошибка загрузки эпизодов');
      }
    } catch (error) {
      console.error('Ошибка загрузки эпизодов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSelect = (episode) => {
    setSelectedEpisode(episode);
    setSelectedChapter(null);
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
  };

  const handleEpisodeUpdate = (updatedEpisode) => {
    setEpisodes(episodes.map(ep => ep.id === updatedEpisode.id ? updatedEpisode : ep));
    if (selectedEpisode && selectedEpisode.id === updatedEpisode.id) {
      setSelectedEpisode(updatedEpisode);
    }
  };

  const handleEpisodeDelete = (episodeId) => {
    setEpisodes(episodes.filter(ep => ep.id !== episodeId));
    if (selectedEpisode && selectedEpisode.id === episodeId) {
      setSelectedEpisode(null);
      setSelectedChapter(null);
    }
  };

  const handleEpisodeCreate = (newEpisode) => {
    setEpisodes([...episodes, newEpisode]);
  };

  const handleSceneEdit = (scene) => {
    console.log('handleSceneEdit вызван с сценой:', scene);
    setEditingScene(scene);
    setCreatingSceneId(null);
    setShowSceneModal(true);
  };

  const handleSceneCreate = (sceneId) => {
    console.log('handleSceneCreate вызван с ID:', sceneId);
    setEditingScene(null);
    setCreatingSceneId(sceneId);
    setShowSceneModal(true);
  };

  const handleSceneModalClose = () => {
    setShowSceneModal(false);
    setEditingScene(null);
    setCreatingSceneId(null);
  };

  const handleSceneSave = async (sceneData) => {
    try {
      const isNew = !editingScene;
      
      // Определяем правильный путь к главе
      let chapterPath = selectedChapter.id;
      
      // Для существующих глав (mansion, tutorial) используем префикс chapter
      if (selectedEpisode.id === 'mansion' || selectedEpisode.id === 'tutorial') {
        chapterPath = `chapter${selectedChapter.id}`;
      }
      
      const url = isNew 
        ? `${API_BASE_URL}/episodes/${selectedEpisode.id}/chapters/${chapterPath}/scenes`
        : `${API_BASE_URL}/episodes/${selectedEpisode.id}/scenes/${sceneData.id}`;
      
      console.log(`handleSceneSave: URL для ${isNew ? 'создания' : 'обновления'}: ${url}`);
      
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sceneData)
      });

      if (response.ok) {
        console.log(`Сцена успешно ${isNew ? 'создана' : 'обновлена'}`);
        handleSceneModalClose();
        
        // Обновляем все компоненты сцен после успешного сохранения
        setTimeout(() => {
          const event = new CustomEvent('refreshSceneTree');
          window.dispatchEvent(event);
        }, 100);
      } else {
        console.error('Ошибка сохранения сцены');
        const errorText = await response.text();
        console.error('Детали ошибки:', errorText);
      }
    } catch (error) {
      console.error('Ошибка сохранения сцены:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'episodes':
        return (
          <EpisodeManager 
            episodes={episodes}
            selectedEpisode={selectedEpisode}
            onEpisodeSelect={handleEpisodeSelect}
            onEpisodeCreate={handleEpisodeCreate}
            onEpisodeUpdate={handleEpisodeUpdate}
            onEpisodeDelete={handleEpisodeDelete}
            onRefresh={loadEpisodes}
          />
        );
      case 'chapters':
        return (
          <ChapterManager 
            episode={selectedEpisode}
            onChapterSelect={handleChapterSelect}
            selectedChapter={selectedChapter}
            onEpisodeUpdate={handleEpisodeUpdate}
          />
        );
      case 'scenes':
        return (
          <SceneManager 
            selectedEpisode={selectedEpisode}
            selectedChapter={selectedChapter}
            onSceneEdit={handleSceneEdit}
            onSceneCreate={handleSceneCreate}
          />
        );
      case 'characters':
        return (
          <CharacterManager 
            episodeId={selectedEpisode?.id}
          />
        );
      case 'mechanics':
        return (
          <MechanicsManager 
            selectedEpisode={selectedEpisode}
            selectedChapter={selectedChapter}
          />
        );
      case 'tree':
        return (
          <SceneTreeView 
            selectedEpisode={selectedEpisode}
            selectedChapter={selectedChapter}
            onSceneEdit={handleSceneEdit}
            onSceneCreate={handleSceneCreate}
          />
        );
      default:
        return (
          <EpisodeManager 
            episodes={episodes}
            selectedEpisode={selectedEpisode}
            onEpisodeSelect={handleEpisodeSelect}
            onEpisodeCreate={handleEpisodeCreate}
            onEpisodeUpdate={handleEpisodeUpdate}
            onEpisodeDelete={handleEpisodeDelete}
            onRefresh={loadEpisodes}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Загрузка редактора...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Редактор эпизодов</h1>
        <nav className="tab-navigation">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={
                (tab.id === 'chapters' && !selectedEpisode) ||
                (tab.id === 'scenes' && (!selectedEpisode || !selectedChapter)) ||
                (tab.id === 'characters' && !selectedEpisode) ||
                (tab.id === 'mechanics' && (!selectedEpisode || !selectedChapter)) ||
                (tab.id === 'tree' && (!selectedEpisode || !selectedChapter))
              }
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {renderTabContent()}
      </main>

      {/* Модальное окно создания/редактирования сцены */}
      {showSceneModal && (
        <SceneModal
          scene={editingScene}
          episodeId={selectedEpisode?.id}
          chapterId={selectedChapter?.id}
          initialSceneId={creatingSceneId}
          onSave={handleSceneSave}
          onCancel={handleSceneModalClose}
        />
      )}
    </div>
  );
}

export default App;
