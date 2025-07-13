import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useScreen } from '../../contexts/ScreenContext';
import './SettingsScreen.css';

const SettingsScreen = () => {
  const { goBack } = useScreen();
  const [settings, setSettings] = useState({
    musicVolume: 70,
    sfxVolume: 80,
    textSpeed: 50,
    autoPlay: false,
    fullscreen: false
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <motion.div 
      className="settings-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="settings-container">
        <h1 className="settings-title">Настройки</h1>
        
        <div className="settings-group">
          <h3>Звук</h3>
          <div className="setting-item">
            <label>Музыка</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => handleSettingChange('musicVolume', e.target.value)}
            />
            <span>{settings.musicVolume}%</span>
          </div>
          
          <div className="setting-item">
            <label>Эффекты</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.sfxVolume}
              onChange={(e) => handleSettingChange('sfxVolume', e.target.value)}
            />
            <span>{settings.sfxVolume}%</span>
          </div>
        </div>

        <div className="settings-group">
          <h3>Игра</h3>
          <div className="setting-item">
            <label>Скорость текста</label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.textSpeed}
              onChange={(e) => handleSettingChange('textSpeed', e.target.value)}
            />
            <span>{settings.textSpeed}%</span>
          </div>
          
          <div className="setting-item">
            <label>Автовоспроизведение</label>
            <input
              type="checkbox"
              checked={settings.autoPlay}
              onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
            />
          </div>
        </div>

        <motion.button
          className="back-button"
          onClick={goBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <i className="fas fa-arrow-left"></i>
          Назад
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SettingsScreen; 