import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPetSpecialText, getPetSpecialColor, getPetSpecialIcon } from '../../utils/itemUtils';
import { getStaticPath } from '../../utils/pathUtils';
import { usePets } from '../../contexts/PetContext';
import { useInventory } from '../../contexts/InventoryContext';
import itemsData from '../../data/items.json';
import './PetModal.css';
import PetMiniGameModal from './PetMiniGameModal';

const PetModal = ({ isOpen, onClose, character }) => {
  const { 
    activePetId, 
    petCollection, 
    setActivePet, 
    addPetToCollection, 
    getActivePet,
    getPetCollection,
    feedPet,
    playWithPet,
    restPet,
    healPet,
    wakeUpPet,
    getActivePetStatus,
    getStatusIconByName,
    getStatusColorByName,
    getStatusTextByName
  } = usePets();
  const { inventory } = useInventory();
  
  // Состояние для принудительного обновления
  const [, forceUpdate] = useState({});
  const [isMiniGameOpen, setMiniGameOpen] = useState(false);
  
  // Инициализируем питомцев в коллекции при первом открытии
  useEffect(() => {
    if (isOpen && character) {
      const characterPetId = character.petId || character.pet?.id;
      if (characterPetId && !petCollection[characterPetId]) {
        addPetToCollection(characterPetId, character.petName || character.pet?.name || '');
      }
      
      // Если нет активного питомца, устанавливаем питомца персонажа
      if (!activePetId && characterPetId) {
        setActivePet(characterPetId);
      }
    }
  }, [isOpen, character, activePetId, petCollection, addPetToCollection, setActivePet]);

  // Обновляем активного питомца при изменении персонажа
  useEffect(() => {
    if (isOpen && character) {
      const characterPetId = character.petId || character.pet?.id;
      if (characterPetId && characterPetId !== activePetId) {
        console.log('PetModal: Обновляем активного питомца с', activePetId, 'на', characterPetId);
        // Добавляем питомца в коллекцию, если его там нет
        if (!petCollection[characterPetId]) {
          addPetToCollection(characterPetId, character.petName || character.pet?.name || '');
        }
        // Устанавливаем нового активного питомца
        setActivePet(characterPetId);
        // Принудительно обновляем компонент
        forceUpdate({});
      }
    }
  }, [isOpen, character, activePetId, petCollection, addPetToCollection, setActivePet, forceUpdate]);

  // Обновляем компонент при изменении активного питомца
  useEffect(() => {
    if (isOpen) {
      console.log('PetModal: activePetId изменился на', activePetId);
      forceUpdate({});
    }
  }, [activePetId, isOpen, forceUpdate]);

  // Принудительное обновление каждые 10 секунд для отображения изменений
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 10000); // Каждые 10 секунд

    return () => clearInterval(interval);
  }, [isOpen]);

  // Обработчики действий с питомцем
  const handleFeedPet = () => {
    if (activePetId) {
      feedPet(activePetId);
    }
  };

  const handlePlayWithPet = () => {
    if (activePetId) {
      setMiniGameOpen(true);
    }
  };

  const handleRestPet = () => {
    if (activePetId) {
      restPet(activePetId);
    }
  };

  const handleHealPet = () => {
    if (activePetId) {
      healPet(activePetId);
    }
  };

  const handleWakeUpPet = () => {
    if (activePetId) {
      wakeUpPet(activePetId);
    }
  };

  if (!isOpen) return null;

  // Получаем данные питомца из контекста
  const getPetData = (petId) => {
    if (!petId) return null;
    return itemsData.items.pet[petId] || null;
  };

  const getPetDisplayName = (petId) => {
    const petData = getPetData(petId);
    if (!petData) return '';
    
    const petState = petCollection[petId];
    const customName = petState?.name;
    return customName && customName.trim() ? customName : petData.name;
  };

  // Получаем доступных питомцев из инвентаря
  const getAvailablePets = () => {
    const allPets = Object.values(itemsData.items.pet || {});
    return allPets.filter(pet => {
      const inventoryItem = inventory[pet.id];
      return inventoryItem && inventoryItem.quantity > 0;
    });
  };

  // Получаем текущего активного питомца
  const activePetData = getPetData(activePetId);
  const activePetState = getActivePet();
  const activePetDisplayName = getPetDisplayName(activePetId);
  const hasActivePet = !!activePetData;

  // Определяем класс анимации для питомца
  const getPetAnimationClass = () => {
    if (!activePetState) return 'idle';
    
    const statuses = getActivePetStatus();
    
    // Приоритет анимаций
    if (activePetState.isSleeping) return 'sleeping';
    if (statuses.includes('sick')) return 'sick';
    if (statuses.includes('hungry')) return 'hungry';
    if (statuses.includes('sad')) return 'sad';
    
    return 'idle';
  };

  const petAnimationClass = getPetAnimationClass();

  // Проверяем, можно ли выполнить действия
  const canFeed = activePetState && activePetState.hunger < 100 && !activePetState.isSleeping;
  const canPlay = activePetState && activePetState.energy > 15 && activePetState.happiness < 100 && !activePetState.isSleeping;
  const canRest = activePetState && !activePetState.isSleeping;
  const canWakeUp = activePetState && activePetState.isSleeping;
  const canHeal = activePetState && activePetState.health < 100 && !activePetState.isSleeping;

  const handlePetSelect = (petId) => {
    if (!petCollection[petId]) {
      addPetToCollection(petId, '');
    }
    setActivePet(petId);
    setActiveTab('current');
  };

  return (
    <>
      <motion.div
        className="pet-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="pet-modal-content"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок и кнопка закрытия */}
          <div className="pet-modal-header">
            <h2 className="pet-modal-title">Питомец</h2>
            <button className="pet-modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Содержимое */}
          <div className="pet-modal-body">
            {hasActivePet ? (
              <div className="pet-layout">
                {/* Левая часть - превью питомца */}
                <div className="pet-preview-section">
                  {/* Имя питомца над превью */}
                  <div className="pet-name">
                    <h3>{activePetDisplayName}</h3>
                  </div>
                  
                  <div className={`pet-avatar ${petAnimationClass}`}>
                    <img 
                      src={getStaticPath(activePetData.sprite)} 
                      alt={activePetData.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="pet-placeholder" style={{ display: 'none' }}>
                      <i className="fas fa-paw fa-3x"></i>
                    </div>
                    
                    {/* Эффект сна */}
                    {activePetState?.isSleeping && (
                      <div className="sleep-effect"></div>
                    )}
                    
                    {/* Состояние питомца поверх превью */}
                    {activePetState && (
                      <div className="pet-status-indicators">
                        {getActivePetStatus().map((status, index) => (
                          <div 
                            key={status} 
                            className="pet-status-indicator"
                            style={{ 
                              backgroundColor: getStatusColorByName(status),
                              animationDelay: `${index * 0.1}s`
                            }}
                            title={getStatusTextByName(status)}
                          >
                            <i className={getStatusIconByName(status)}></i>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Описание питомца под превью */}
                  <div className="pet-description-section">
                    <p className="pet-description">{activePetData.description}</p>
                  </div>

                  {/* Редкость и способность под описанием */}
                  <div className="pet-details">
                    <div className="pet-rarity">
                      <span className={`rarity-badge rarity-${activePetData.rarity}`}>
                        {activePetData.rarity}
                      </span>
                    </div>
                    {activePetData.special && (
                      <div className="pet-special">
                        <div 
                          className={`special-ability ${activePetState && activePetState.happiness < 60 ? 'disabled' : ''}`}
                          style={{ 
                            backgroundColor: activePetState && activePetState.happiness < 60 
                              ? '#666' 
                              : getPetSpecialColor(activePetData.special.type),
                            color: 'white'
                          }}
                        >
                          <span className="special-icon">
                            {getPetSpecialIcon(activePetData.special.type)}
                          </span>
                          <span className="special-text">
                            {getPetSpecialText(activePetData)}
                          </span>
                        </div>
                        {activePetState && activePetState.happiness < 60 && (
                          <div className="pet-ability-warning">
                            <i className="fas fa-exclamation-triangle"></i>
                            Способность неактивна! Питомец грустит (счастье: {Math.round(activePetState.happiness)}%)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая часть - состояние и действия */}
                <div className="pet-content-section">
                  {/* Состояние питомца */}
                  {activePetState && (
                    <div className="pet-stats">
                      <h4>Состояние</h4>
                      
                      <div className="pet-stat-bars">
                        <div className="pet-stat-bar">
                          <span className="stat-label">Голод</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill hunger-fill" 
                              style={{ width: `${activePetState.hunger}%` }}
                            ></div>
                          </div>
                          <span className="stat-value">{Math.round(activePetState.hunger)}%</span>
                        </div>
                        <div className="pet-stat-bar">
                          <span className="stat-label">Счастье</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill happiness-fill" 
                              style={{ width: `${activePetState.happiness}%` }}
                            ></div>
                          </div>
                          <span className="stat-value">{Math.round(activePetState.happiness)}%</span>
                        </div>
                        <div className="pet-stat-bar">
                          <span className="stat-label">Энергия</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill energy-fill" 
                              style={{ width: `${activePetState.energy}%` }}
                            ></div>
                          </div>
                          <span className="stat-value">{Math.round(activePetState.energy)}%</span>
                        </div>
                        <div className="pet-stat-bar">
                          <span className="stat-label">Здоровье</span>
                          <div className="stat-bar">
                            <div 
                              className="stat-fill health-fill" 
                              style={{ width: `${activePetState.health}%` }}
                            ></div>
                          </div>
                          <span className="stat-value">{Math.round(activePetState.health)}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="pet-actions">
                    <h4>Действия</h4>
                    <div className="pet-action-buttons">
                      <button 
                        className="pet-action-btn pet-feed-btn" 
                        onClick={handleFeedPet}
                        disabled={!canFeed}
                        title={!canFeed ? (activePetState?.isSleeping ? "Питомец спит!" : "Питомец уже сыт!") : "Покормить питомца"}
                      >
                        <i className="fas fa-utensils"></i>
                        <span>Покормить</span>
                      </button>
                      <button 
                        className="pet-action-btn pet-play-btn" 
                        onClick={handlePlayWithPet}
                        disabled={!canPlay}
                        title={!canPlay ? (activePetState?.isSleeping ? "Питомец спит!" : "Питомец слишком устал или уже счастлив!") : "Поиграть с питомцем"}
                      >
                        <i className="fas fa-gamepad"></i>
                        <span>Поиграть</span>
                      </button>
                      <button 
                        className={`pet-action-btn ${activePetState?.isSleeping ? 'pet-wake-btn' : 'pet-sleep-btn'}`}
                        onClick={activePetState?.isSleeping ? handleWakeUpPet : handleRestPet}
                        disabled={activePetState?.isSleeping ? !canWakeUp : !canRest}
                        title={activePetState?.isSleeping 
                          ? (!canWakeUp ? "Питомец не спит!" : "Разбудить питомца")
                          : (!canRest ? "Питомец уже спит!" : "Уложить питомца спать")
                        }
                      >
                        <i className={activePetState?.isSleeping ? "fas fa-sun" : "fas fa-bed"}></i>
                        <span>{activePetState?.isSleeping ? "Разбудить" : "Уложить спать"}</span>
                      </button>
                      <button 
                        className="pet-action-btn pet-heal-btn" 
                        onClick={handleHealPet}
                        disabled={!canHeal}
                        title={!canHeal ? (activePetState?.isSleeping ? "Питомец спит!" : "Питомец полностью здоров!") : "Лечить питомца"}
                      >
                        <i className="fas fa-heartbeat"></i>
                        <span>Лечить</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pet-info">
                <div className="pet-avatar">
                  <i className="fas fa-paw fa-3x"></i>
                </div>
                <div className="pet-details">
                  <h3>Питомец не выбран</h3>
                  <p>У вас пока нет питомца. Купите питомца в магазине!</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      {isMiniGameOpen && (
        <PetMiniGameModal 
          isOpen={isMiniGameOpen} 
          onClose={() => setMiniGameOpen(false)} 
          pet={activePetData}
        />
      )}
    </>
  );
};

export default PetModal; 