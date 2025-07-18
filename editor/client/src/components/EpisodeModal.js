import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

const EpisodeModal = ({ episode, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDescription: '',
    type: 'story',
    ageRating: '0+',
    duration: '30-60 мин',
    difficulty: 'easy',
    preview: '',
    tags: []
  });
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (episode) {
      setFormData({
        name: episode.name || '',
        description: episode.description || '',
        longDescription: episode.longDescription || episode.description || '',
        type: episode.type || 'story',
        ageRating: episode.ageRating || '0+',
        duration: episode.duration || '30-60 мин',
        difficulty: episode.difficulty || 'easy',
        preview: episode.preview || '',
        tags: episode.tags || []
      });
      
      if (episode.preview) {
        setPreviewUrl(`/episodes/${episode.id}/${episode.preview}`);
      }
    }
  }, [episode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadPreview = async () => {
    if (!previewFile) return null;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', previewFile);
      
      // Для нового эпизода используем временный ID
      const tempEpisodeId = episode?.id || `temp_${Date.now()}`;
      formData.append('episodeId', tempEpisodeId);

      const response = await fetch(`${API_BASE_URL}/episodes/upload-preview`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setPreviewFile(null);
        // Возвращаем временный ID для последующего копирования
        return tempEpisodeId;
      } else {
        console.error('Ошибка загрузки изображения');
        return null;
      }
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalPreview = formData.preview;
    
    // Если есть новый файл для загрузки, загружаем его
    if (previewFile) {
      const uploadedFilename = await handleUploadPreview();
      if (uploadedFilename) {
        finalPreview = uploadedFilename;
      } else {
        alert('Ошибка загрузки изображения');
        return;
      }
    }
    
    // Создаем финальные данные с правильным именем превью
    const finalFormData = {
      ...formData,
      preview: finalPreview
    };
    
    onSave(finalFormData);
  };

  const episodeTypes = [
    { value: 'story', label: 'История' },
    { value: 'adventure', label: 'Приключение' },
    { value: 'romance', label: 'Романтика' },
    { value: 'mystery', label: 'Детектив' },
    { value: 'horror', label: 'Ужасы' },
    { value: 'comedy', label: 'Комедия' }
  ];

  const ageRatings = [
    { value: '0+', label: '0+' },
    { value: '6+', label: '6+' },
    { value: '12+', label: '12+' },
    { value: '16+', label: '16+' },
    { value: '18+', label: '18+' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Легкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'hard', label: 'Сложный' }
  ];

  const durations = [
    { value: '15-30 мин', label: '15-30 минут' },
    { value: '30-60 мин', label: '30-60 минут' },
    { value: '1-2 часа', label: '1-2 часа' },
    { value: '2+ часа', label: '2+ часа' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{episode ? 'Редактировать эпизод' : 'Создать эпизод'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          <div className="grid grid-2">
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
              <label htmlFor="type">Тип эпизода</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-control"
              >
                {episodeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ageRating">Возрастной рейтинг</label>
              <select
                id="ageRating"
                name="ageRating"
                value={formData.ageRating}
                onChange={handleInputChange}
                className="form-control"
              >
                {ageRatings.map(rating => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
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

            <div className="form-group">
              <label htmlFor="difficulty">Сложность</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="form-control"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Краткое описание *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="longDescription">Подробное описание</label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              className="form-control"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preview">Превью изображение</label>
            <input
              type="file"
              id="preview"
              accept="image/*"
              onChange={handleFileChange}
              className="form-control"
            />
            {previewUrl && (
              <div className="preview-image">
                <img src={previewUrl} alt="Превью" />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? 'Сохранение...' : (episode ? 'Обновить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EpisodeModal; 