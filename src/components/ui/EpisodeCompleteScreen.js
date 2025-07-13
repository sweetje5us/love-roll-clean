import React from 'react';
import { motion } from 'framer-motion';
import './EpisodeCompleteScreen.css';

const EpisodeCompleteScreen = ({ isVisible, effects, onBackToMenu }) => {
  if (!isVisible) return null;

  const { experience = 0, coins = 0 } = effects?.episode_complete || {};

  return (
    <motion.div
      className="episode-complete-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="episode-complete-content">
        <motion.div
          className="episode-complete-card"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="episode-complete-header">
            <h1>🎉 Эпизод завершен!</h1>
            <p>Поздравляем! Вы успешно прошли обучение</p>
          </div>

          <div className="episode-complete-rewards">
            <h2>Награды за прохождение:</h2>
            
            <motion.div
              className="reward-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="reward-icon">⭐</div>
              <div className="reward-text">
                <span className="reward-label">Опыт:</span>
                <span className="reward-value">+{experience}</span>
              </div>
            </motion.div>

            <motion.div
              className="reward-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <div className="reward-icon">💰</div>
              <div className="reward-text">
                <span className="reward-label">Монеты:</span>
                <span className="reward-value">+{coins}</span>
              </div>
            </motion.div>
          </div>

          <div className="episode-complete-message">
            <p>
              Теперь вы готовы к настоящим приключениям! 
              Все изученные механики помогут вам в дальнейшем прохождении игры.
            </p>
          </div>

          <motion.button
            className="episode-complete-button"
            onClick={onBackToMenu}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Вернуться в меню
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EpisodeCompleteScreen; 