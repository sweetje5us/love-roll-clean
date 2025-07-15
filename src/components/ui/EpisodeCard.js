import React from 'react';
import { motion } from 'framer-motion';
import { getEpisodePreview } from '../../utils/episodeUtils';
import { getStaticPath } from '../../utils/pathUtils';
import './EpisodeCard.css';

const EpisodeCard = ({ episode, episodeData, types, ageRatings, onOpenModal }) => {
  const typeInfo = types[episode.type] || { name: 'Неизвестно', color: '#6b7280', icon: 'fas fa-question' };
  const ageInfo = ageRatings[episode.ageRating] || { name: '0+', color: '#22c55e' };

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal(episode);
    }
  };

  return (
    <motion.div 
      className={`episode-card ${!episode.unlocked ? 'locked' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
    >
      {/* Превью эпизода */}
      <div className="episode-preview">
        {episode.unlocked ? (
          <img 
            src={getEpisodePreview(episode.id, episode.preview)} 
            alt={episode.name}
            className="episode-image"
            onError={(e) => {
              // Используем разные fallback изображения в зависимости от типа эпизода
              if (episode.type === 'detective') {
                e.target.src = getStaticPath('sprites/episodes/locations/mansion/mansion_inside.png');
              } else {
                e.target.src = getStaticPath('sprites/episodes/locations/school/school_building.png');
              }
            }}
          />
        ) : (
          <div className="episode-locked">
            <i className="fas fa-lock"></i>
          </div>
        )}
        
        {/* Длительность */}
        <div className="episode-duration">
          <i className="fas fa-clock"></i>
          <span>{episode.duration}</span>
        </div>
      </div>

      {/* Информация об эпизоде */}
      <div className="episode-info">
        <h3 className="episode-name">{episode.name}</h3>
        <p className="episode-description">{episode.description}</p>
        
        {/* Метки */}
        <div className="episode-tags">
          {/* Тип сюжета */}
          <div 
            className="episode-tag type-tag"
            style={{ backgroundColor: typeInfo.color }}
          >
            <i className={typeInfo.icon}></i>
            <span>{typeInfo.name}</span>
          </div>
          
          {/* Возрастные ограничения */}
          <div 
            className="episode-tag age-tag"
            style={{ backgroundColor: ageInfo.color }}
          >
            <span>{ageInfo.name}</span>
          </div>
        </div>

        {/* Статус */}
        {episode.completed && (
          <div className="episode-completed">
            <i className="fas fa-check-circle"></i>
            <span>Завершен</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EpisodeCard; 