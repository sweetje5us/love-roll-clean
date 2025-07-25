import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const ChapterManager = ({ episode, selectedChapter, onChapterSelect, onEpisodeUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    duration: '15-30 мин'
  });

  const handleCreateChapter = () => {
    setEditingChapter(null);
    setFormData({
      id: `chapter${Date.now()}`,
      name: '',
      description: '',
      duration: '15-30 мин'
    });
    setShowModal(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setFormData({
      id: chapter.id || '',
      name: chapter.name || '',
      description: chapter.description || '',
      duration: chapter.duration || '15-30 мин'
    });
    setShowModal(true);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту главу?')) {
      try {
        // Определяем правильный путь к главе
        let chapterPath = chapterId;
        
        // Всегда используем формат chapter[id] для совместимости с игровой системой
        if (!chapterId.startsWith('chapter')) {
          chapterPath = `chapter${chapterId}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/episodes/${episode.id}/chapters/${chapterPath}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Обновляем эпизод после удаления главы
          const currentChapters = episode.chapters || [];
          const updatedEpisode = {
            ...episode,
            chapters: currentChapters.filter(ch => ch.id !== chapterId)
          };
          onEpisodeUpdate(updatedEpisode);
          
          if (selectedChapter && selectedChapter.id === chapterId) {
            onChapterSelect(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Ошибка удаления главы: ${errorData.error || 'Неизвестная ошибка'}`);
        }
      } catch (error) {
        console.error('Ошибка удаления главы:', error);
      }
    }
  };

  const validateChapterId = (id) => {
    // Проверяем, что ID является числом от 1 до 999
    const numId = parseInt(id);
    return !isNaN(numId) && numId >= 1 && numId <= 999;
  };

  const handleSaveChapter = async (e) => {
    e.preventDefault();
    
    // Валидация ID
    if (!validateChapterId(formData.id)) {
      alert('ID главы должен быть числом от 1 до 999');
      return;
    }
    
    try {
      // Определяем правильный путь к главе
      let chapterPath = null;
      if (editingChapter) {
        chapterPath = editingChapter.id;
        
        // Всегда используем формат chapter[id] для совместимости с игровой системой
        if (!editingChapter.id.startsWith('chapter')) {
          chapterPath = `chapter${editingChapter.id}`;
        }
      }
      
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
        const currentChapters = episode.chapters || [];
        let updatedChapters;
        if (editingChapter) {
          updatedChapters = currentChapters.map(ch => 
            ch.id === editingChapter.id ? savedChapter : ch
          );
        } else {
          updatedChapters = [...currentChapters, savedChapter];
        }
        
        const updatedEpisode = {
          ...episode,
          chapters: updatedChapters
        };
        
        onEpisodeUpdate(updatedEpisode);
        setShowModal(false);
        setEditingChapter(null);
      } else {
        const errorData = await response.json();
        alert(`Ошибка сохранения главы: ${errorData.error || 'Неизвестная ошибка'}`);
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
                <label htmlFor="id">ID главы *</label>
                <div className="input-group">
                  <input
                    type="number"
                    id="id"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                    disabled={!!editingChapter} // Запрещаем изменение ID при редактировании
                    placeholder="1"
                    min="1"
                    max="999"
                    title="ID главы должен быть числом от 1 до 999"
                  />
                  {!editingChapter && (
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        // Автоматически генерируем следующий номер главы
                        const nextChapterNumber = (episode.chapters || []).length + 1;
                        setFormData(prev => ({ ...prev, id: nextChapterNumber.toString() }));
                      }}
                      title="Сгенерировать следующий номер главы"
                    >
                      Авто
                    </button>
                  )}
                </div>
                <small className="form-help">ID главы должен быть числом. Система автоматически создаст папку chapter[id]</small>
              </div>

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