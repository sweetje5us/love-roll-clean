import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChapterCredits.css';

const ChapterCredits = ({ 
  type = 'start', // 'start' или 'end'
  chapterNumber, 
  chapterTitle, 
  episodeTitle = '',
  onComplete,
  duration = 3000 // Длительность показа в миллисекундах
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  const triggerComplete = () => {
    if (!hasCompleted && onComplete) {
      setHasCompleted(true);
      onComplete();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        triggerComplete();
      }, 1000); // Задержка для завершения анимации исчезновения
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClick = () => {
    if (type === 'end') {
      setIsVisible(false);
      setTimeout(() => {
        triggerComplete();
      }, 1000);
    }
  };

  const isStartCredits = type === 'start';
  const isEndCredits = type === 'end';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="chapter-credits-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={handleClick}
        >
          <div className="chapter-credits-container">
            {isStartCredits && (
              <motion.div
                className="chapter-credits-content start-credits"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="episode-title"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {episodeTitle}
                </motion.div>
                
                <motion.div
                  className="chapter-number"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  Глава {chapterNumber}
                </motion.div>
                
                <motion.div
                  className="chapter-title"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  {chapterTitle}
                </motion.div>
              </motion.div>
            )}

            {isEndCredits && (
              <motion.div
                className="chapter-credits-content end-credits"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="chapter-complete"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Глава завершена
                </motion.div>
                
                <motion.div
                  className="chapter-number"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  Глава {chapterNumber}
                </motion.div>
                
                <motion.div
                  className="chapter-title"
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                >
                  {chapterTitle}
                </motion.div>
                
                <motion.div
                  className="next-chapter-hint"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.6 }}
                >
                  Нажмите для продолжения...
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChapterCredits; 