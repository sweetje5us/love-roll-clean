import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const ChapterManager = ({ episode, selectedChapter, onChapterSelect, onEpisodeUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '15-30 мин'
  });

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setFormData({
      name: '',
      description: '',
      duration: '15-30 мин'
    });
    setShowModal(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setFormData({
      name: chapter.name || '',
      description: chapter.description || '',
      duration: chapter.duration || '15-30 мин'
    });
    setShowModal(true);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту главу?')) {
      try {
        // Определяем правильный путь к главе (как в App.js)
        const chapterPath = (episode.id === 'mansion' || episode.id === 'tutorial')
          ? `chapter${chapterId}`
          : chapterId;
        
        const response = await fetch(`${API_BASE_URL}/episodes/${episode.id}/chapters/${chapterPath}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Обновляем эпизод после удаления главы
          const updatedEpisode = {
            ...episode,
            chapters: episode.chapters.filter(ch => ch.id !== chapterId)
          };
          onEpisodeUpdate(updatedEpisode);
          
          if (selectedChapter && selectedChapter.id === chapterId) {
            onChapterSelect(null);
          }
        } else {
          console.error('Ошибка удаления главы');
        }
      } catch (error) {
        console.error('Ошибка удаления главы:', error);
      }
    }
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    
    try {
      // Определяем правильный путь к главе (как в App.js)
      const chapterPath = editingChapter 
        ? ((episode.id === 'mansion' || episode.id === 'tutorial')
            ? `chapter${editingChapter.id}`
            : editingChapter.id)
        : null;
      
      const url = editingChapter 
        ? `${API_BASE_URL}/episodes/${episode.id}/chapters/${chapterPath}`
        : `${API_BASE_URL}/episodes/${episode.id}/chapters`;
      
      const method = editingChapter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedChapter = await response.json();
        
        // Обновляем список глав в эпизоде
        let updatedChapters;
        if (editingChapter) {
          updatedChapters = episode.chapters.map(ch => 
            ch.id === editingChapter.id ? savedChapter : ch
          );
        } else {
          updatedChapters = [...episode.chapters, savedChapter];
        }
        
        const updatedEpisode = {
          ...episode,
          chapters: updatedChapters
        };
        
        onEpisodeUpdate(updatedEpisode);
        setShowModal(false);
        setEditingChapter(null);
      } else {
        console.error('Ошибка сохранения главы');
      }
    } catch (error) {
      console.error('Ошибка сохранения главы:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const durations = [
    { value: '15-30 мин', label: '15-30 минут' },
    { value: '30-60 мин', label: '30-60 минут' },
    { value: '1-2 часа', label: '1-2 часа' }
  ];

  if (!episode) {
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
          <p className="episode-info">Эпизод: {episode.name}</p>
        </div>
        <button className="button" onClick={handleCreateChapter}>
          Создать главу
        </button>
      </div>

      <div className="chapters-content">
        {!episode.chapters || episode.chapters.length === 0 ? (
          <div className="empty-state">
            <p>Главы не найдены</p>
            <p>Создайте первую главу для эпизода "{episode.name}"</p>
          </div>
        ) : (
          <div className="chapters-list">
            {episode.chapters.map(chapter => (
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
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingChapter ? 'Редактировать главу' : 'Создать главу'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveChapter} className="modal-content">
              <div className="form-group">
                <label htmlFor="name">Название *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Продолжительность</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {durations.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="button">
                  {editingChapter ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterManager; 