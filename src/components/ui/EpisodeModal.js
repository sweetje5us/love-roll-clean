import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEpisodeSave, getCompletedChapters, isEpisodeCompleted } from '../../utils/saveUtils';
import { getEpisodePreview, getEpisodeStats } from '../../utils/episodeUtils';
import { getStaticPath } from '../../utils/pathUtils';
import './EpisodeModal.css';

const EpisodeModal = ({ episode, episodeData, isOpen, onClose, onStartEpisode }) => {
  if (!episode || !episodeData) return null;

  const typeInfo = episodeData.types[episode.type];
  const ageInfo = episodeData.ageRatings[episode.ageRating];

  // Используем главы из конфигурации эпизода
  const chapters = episode.chapters || [];

  // Получаем данные о сохранении
  const episodeSave = getEpisodeSave(episode.id);
  const completedChapters = getCompletedChapters(episode.id);
  const isCompleted = isEpisodeCompleted(episode.id);
  
  // Проверяем, есть ли сохранение
  const hasSave = episodeSave !== null;
  const currentChapter = episodeSave ? episodeSave.currentChapter : 1;

  const handleStartEpisode = () => {
    if (onStartEpisode) {
      onStartEpisode(episode.id, hasSave ? currentChapter.id : 1);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="episode-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="episode-modal"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Заголовок */}
            <div className="episode-modal-header">
              <h2>{episode.name}</h2>
              <button className="close-button" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Превью и основная информация */}
            <div className="episode-modal-content">
              <div className="episode-preview-section">
                <div className="episode-preview-image">
                  <img 
                    src={getEpisodePreview(episode.id, episode.preview)} 
                    alt={episode.name}
                    onError={(e) => {
                      // Используем разные fallback изображения в зависимости от типа эпизода
                      if (episode.type === 'detective') {
                        e.target.src = getStaticPath('sprites/episodes/locations/mansion/mansion_inside.png');
                      } else {
                        e.target.src = getStaticPath('sprites/episodes/locations/school/school_building.png');
                      }
                    }}
                  />
                </div>
                
                <div className="episode-basic-info">
                  <div className="episode-tags">
                    <div 
                      className="episode-tag type-tag"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      <i className={typeInfo.icon}></i>
                      <span>{typeInfo.name}</span>
                    </div>
                    
                    <div 
                      className="episode-tag age-tag"
                      style={{ backgroundColor: ageInfo.color }}
                    >
                      <span>{ageInfo.name}</span>
                    </div>
                  </div>

                  <div className="episode-meta">
                    <div className="meta-item">
                      <i className="fas fa-clock"></i>
                      <span>{episode.duration}</span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-signal"></i>
                      <span>{episode.difficulty === 'easy' ? 'Легко' : episode.difficulty === 'medium' ? 'Средне' : 'Сложно'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Полное описание */}
              <div className="episode-description-section">
                <h3>Описание</h3>
                <p>{episode.longDescription || episode.description}</p>
              </div>

              {/* Список глав */}
              <div className="episode-chapters-section">
                <h3>Главы</h3>
                <div className="chapters-list">
                  {chapters.map((chapter, index) => {
                    const isCompleted = completedChapters.includes(chapter.id);
                    return (
                      <div 
                        key={chapter.id} 
                        className={`chapter-item ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="chapter-info">
                          <div className="chapter-number">{chapter.id}</div>
                          <div className="chapter-details">
                            <h4>{chapter.name}</h4>
                            <span className="chapter-duration">{chapter.duration}</span>
                          </div>
                        </div>
                        <div className="chapter-status">
                          {isCompleted ? (
                            <i className="fas fa-check-circle completed-icon"></i>
                          ) : (
                            <i className="fas fa-circle not-completed-icon"></i>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Теги */}
              {episode.tags && episode.tags.length > 0 && (
                <div className="episode-tags-section">
                  <h3>Теги</h3>
                  <div className="tags-list">
                    {episode.tags.map((tag, index) => (
                      <span key={index} className="tag-item">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="episode-modal-actions">
              {episode.unlocked ? (
                <>
                  {isCompleted && (
                    <div className="episode-completed-badge">
                      <i className="fas fa-trophy"></i>
                      <span>Эпизод завершен!</span>
                    </div>
                  )}
                  {!isCompleted && (
                    <button 
                      className="start-episode-button"
                      onClick={handleStartEpisode}
                    >
                      <i className={`fas ${hasSave ? 'fa-play' : 'fa-play'}`}></i>
                      <span>
                        {hasSave ? 'Продолжить' : 'Начать игру'}
                      </span>
                    </button>
                  )}
                  
                  {isCompleted && (
                    <div className="episode-completed-message">
                      <i className="fas fa-trophy"></i>
                      <span>Эпизод уже пройден!</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="episode-locked-message">
                  <i className="fas fa-lock"></i>
                  <span>Эпизод заблокирован</span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EpisodeModal; 