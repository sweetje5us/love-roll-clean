import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChestPreview, hasMatchingKey, openChest } from '../../utils/chestSystem';
import { getRarityColor, getRarityInfo } from '../../utils/itemUtils';
import './ChestModal.css';

const ChestModal = ({ 
  isOpen, 
  onClose, 
  chestItem, 
  inventoryData, 
  onOpenChest, 
  onRemoveItem 
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [showRewards, setShowRewards] = useState(false);

  if (!isOpen || !chestItem) return null;

  const chestPreview = getChestPreview(chestItem.id);
  const keyInfo = hasMatchingKey(chestItem.id, inventoryData);

  const handleOpenChest = async () => {
    if (!keyInfo) return;

    setIsOpening(true);
    
    // Анимация открытия
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Получаем награды
    const chestRewards = openChest(chestItem.id);
    setRewards(chestRewards);
    setShowRewards(true);
    
    // Добавляем награды в инвентарь
    chestRewards.forEach(reward => {
      onOpenChest(reward.id, 1);
    });
    
    // Удаляем сундук и ключ
    onRemoveItem(chestItem.id, 1);
    onRemoveItem(keyInfo.keyId, 1);
    
    setIsOpening(false);
  };

  const handleClose = () => {
    if (showRewards) {
      setShowRewards(false);
      setRewards([]);
    }
    onClose();
  };

  const getRarityName = (rarity) => {
    const rarityInfo = getRarityInfo(rarity);
    return rarityInfo ? rarityInfo.name : rarity;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="chest-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div 
            className="chest-modal"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {!showRewards ? (
              // Экран выбора действия
              <div className="chest-modal-content">
                <div className="chest-header">
                  <h2>{chestPreview.name}</h2>
                  <button className="close-btn" onClick={handleClose}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="chest-info">
                  <div className="chest-image">
                    <img src={chestItem.sprite} alt={chestItem.name} />
                  </div>
                  
                  <div className="chest-details">
                    <p className="chest-description">{chestItem.description}</p>
                    <div className="chest-stats">
                      <span>Предметов: {chestPreview.itemCount}</span>
                      <span>Редкость: {getRarityName(chestPreview.rarity)}</span>
                    </div>
                  </div>
                </div>

                {keyInfo ? (
                  <div className="key-info">
                    <div className="key-item">
                      <img src={keyInfo.keyItem.sprite} alt={keyInfo.keyItem.name} />
                      <span>{keyInfo.keyItem.name}</span>
                    </div>
                    <p>У вас есть подходящий ключ для открытия этого сундука!</p>
                  </div>
                ) : (
                  <div className="no-key-warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Для открытия этого сундука нужен подходящий ключ!</p>
                  </div>
                )}

                <div className="possible-rewards">
                  <h3>Возможные награды:</h3>
                  <div className="rewards-grid">
                    {Object.entries(chestPreview.possibleItems).map(([rarity, items]) => (
                      <div key={rarity} className="rarity-section">
                        <h4 style={{ color: getRarityColor(rarity) }}>
                          {getRarityName(rarity)} ({chestPreview.dropRates[rarity]}%)
                        </h4>
                        <div className="items-preview">
                          {items.map(item => (
                            <div key={item.id} className="preview-item">
                              <img src={item.sprite} alt={item.name} />
                              <span>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {keyInfo && (
                  <div className="chest-actions">
                    <button 
                      className={`open-chest-btn ${isOpening ? 'opening' : ''}`}
                      onClick={handleOpenChest}
                      disabled={isOpening}
                    >
                      {isOpening ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Открываем...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-key"></i>
                          Открыть сундук
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Экран наград
              <div className="rewards-modal-content">
                <div className="rewards-header">
                  <h2>Награды получены!</h2>
                  <button className="close-btn" onClick={handleClose}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="rewards-grid">
                  {rewards.map((reward, index) => (
                    <motion.div 
                      key={`${reward.id}-${index}`}
                      className="reward-item"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.2, type: "spring", stiffness: 200 }}
                      style={{ borderColor: getRarityColor(reward.rarity) }}
                    >
                      <div className="reward-image">
                        <img src={reward.sprite} alt={reward.name} />
                      </div>
                      <div className="reward-info">
                        <h4>{reward.name}</h4>
                        <span 
                          className="reward-rarity"
                          style={{ color: getRarityColor(reward.rarity) }}
                        >
                          {getRarityName(reward.rarity)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="rewards-actions">
                  <button className="continue-btn" onClick={handleClose}>
                    Продолжить
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChestModal; 