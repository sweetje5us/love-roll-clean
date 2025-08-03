import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './LoadingScreen.css';

// Определяем мобильное устройство
const isMobileDevice = () => {
  return window.innerWidth < 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const LoadingScreen = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Упрощенные анимации для мобильных устройств
  if (isMobile) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-logo">
            <h1>Love & Roll</h1>
          </div>
          
          <div className="loading-spinner">
            <div className="spinner">
              <i className="fas fa-heart"></i>
            </div>
          </div>
          
          <p className="loading-text">
            Загрузка...
          </p>
        </div>
      </div>
    );
  }

  // Полные анимации для десктопа
  return (
    <motion.div 
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-container">
        <motion.div
          className="loading-logo"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <h1>Love & Roll</h1>
        </motion.div>
        
        <div className="loading-spinner">
          <motion.div
            className="spinner"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <i className="fas fa-heart"></i>
          </motion.div>
        </div>
        
        <motion.p
          className="loading-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          Загрузка...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default LoadingScreen; 