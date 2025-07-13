import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacters } from '../../contexts/CharacterContext';
import { useInventory } from '../../contexts/InventoryContext';
import CharacterPreview from './CharacterPreview';
import OptionsCarousel from './OptionsCarousel';
import Tooltip from './Tooltip';
import { getAvailableOptions, getAvailablePaidOptions, getOptionDisplayName, getPaidClothingItems } from '../../utils/characterUtils';
import { getPetSpecialColor, getPetSpecialIcon } from '../../utils/petUtils';
import { getPetSpecialText } from '../../utils/itemUtils';
import itemsData from '../../data/items.json';
import './CharacterEditModal.css';

const CharacterEditModal = ({ isOpen, onClose, characterId, onCharacterUpdate }) => {
  const { getCharacter, updateCharacter, getAvailableStatPoints, setAvailableStatPoints } = useCharacters();
  const { inventory } = useInventory();
  const [activeTab, setActiveTab] = useState('character');
  
  // Получаем данные персонажа
  const character = getCharacter(characterId);
  
  // Состояние для редактирования
  const [characterData, setCharacterData] = useState(null);
  const [statPoints, setStatPoints] = useState(0);
  const [availableOptions, setAvailableOptions] = useState({});
  const [availablePaidOptions, setAvailablePaidOptions] = useState({});
  const [originalStats, setOriginalStats] = useState(null); // Исходные характеристики персонажа

  // Инициализация данных персонажа
  useEffect(() => {
    if (character) {
      // Получаем доступные опции для текущего персонажа
      const options = getAvailableOptions(character.gender, character.age);
      const paidOptions = getAvailablePaidOptions(character.gender, character.age, inventory);
      
      // Проверяем совместимость существующих настроек
      const appearance = character.appearance || {
        hairStyle: 'long_hair',
        hairColor: 'brown',
        hairBehind: '',
        dress: 'hoodie',
        dressPaid: false,
        accessory: '',
        accessoryPaid: false,
        bush: ''
      };
      
      // Устанавливаем совместимые значения по умолчанию
      const safeAppearance = {
        hairStyle: options.hairStyles.includes(appearance.hairStyle) ? appearance.hairStyle : (options.hairStyles[0] || 'long_hair'),
        hairColor: options.hairColors.includes(appearance.hairColor) ? appearance.hairColor : (options.hairColors[0] || 'brown'),
        hairBehind: options.hairBehindStyles.includes(appearance.hairBehind) ? appearance.hairBehind : '',
        dress: (options.dresses.free.includes(appearance.dress) || paidOptions.dresses?.includes(appearance.dress)) ? appearance.dress : (options.dresses.free[0] || 'hoodie'),
        dressPaid: paidOptions.dresses?.includes(appearance.dress) || false,
        accessory: (options.accessories.free.includes(appearance.accessory) || paidOptions.accessories?.includes(appearance.accessory)) ? appearance.accessory : '',
        accessoryPaid: paidOptions.accessories?.includes(appearance.accessory) || false,
        bush: character.gender === 'female' && options.bush.includes(appearance.bush) ? appearance.bush : ''
      };
      
      const characterStats = character.stats || {
        charisma: 8,
        coldness: 8,
        sensitivity: 8,
        cunning: 8,
        determination: 8,
        intelligence: 8
      };
      
      setCharacterData({
        id: character.id,
        name: character.name || '',
        gender: character.gender || 'female',
        age: character.age || '1',
        appearance: safeAppearance,
        stats: characterStats,
        pet: {
          id: character.petId || null,
          name: character.petName || ''
        },
        romanceAvailable: character.romanceAvailable || false
      });
      
      // Определяем, является ли это созданием нового персонажа или редактированием существующего
      const isNewCharacter = !character.id || character.id === 'new' || character.id === 'temp';
      
      if (isNewCharacter) {
        // Создание нового персонажа - не сохраняем исходные характеристики
        setOriginalStats(null);
      } else {
        // Редактирование существующего персонажа - сохраняем исходные характеристики
        setOriginalStats({ ...characterStats });
      }
      
      // Получаем доступные очки характеристик
      const availablePoints = getAvailableStatPoints(character.id);
      setStatPoints(availablePoints);
    }
  }, [character, getAvailableStatPoints, inventory]);

  // Обновление доступных опций при изменении пола/возраста
  useEffect(() => {
    if (characterData) {
      const options = getAvailableOptions(characterData.gender, characterData.age);
      const paidOptions = getAvailablePaidOptions(characterData.gender, characterData.age, inventory);
      
      // Убеждаемся, что все поля являются массивами
      const safeOptions = {
        hairStyles: Array.isArray(options.hairStyles) ? options.hairStyles : [],
        hairColors: Array.isArray(options.hairColors) ? options.hairColors : [],
        hairBehindStyles: Array.isArray(options.hairBehindStyles) ? options.hairBehindStyles : [],
        emotions: Array.isArray(options.emotions) ? options.emotions : [],
        dresses: {
          free: Array.isArray(options.dresses?.free) ? options.dresses.free : [],
          paid: Array.isArray(options.dresses?.paid) ? options.dresses.paid : []
        },
        accessories: {
          free: Array.isArray(options.accessories?.free) ? options.accessories.free : [],
          paid: Array.isArray(options.accessories?.paid) ? options.accessories.paid : []
        },
        bush: Array.isArray(options.bush) ? options.bush : []
      };
      
      setAvailableOptions(safeOptions);
      setAvailablePaidOptions(paidOptions);
      
      // Проверяем совместимость текущих выборов и устанавливаем значения по умолчанию
      setCharacterData(prev => {
        const updatedData = { ...prev };
        
        // Проверяем прическу
        if (!safeOptions.hairStyles.includes(prev.appearance.hairStyle)) {
          updatedData.appearance.hairStyle = safeOptions.hairStyles[0] || 'long_hair';
        }
        
        // Проверяем цвет волос
        if (!safeOptions.hairColors.includes(prev.appearance.hairColor)) {
          updatedData.appearance.hairColor = safeOptions.hairColors[0] || 'brown';
        }
        
        // Проверяем волосы сзади
        if (prev.appearance.hairBehind && !safeOptions.hairBehindStyles.includes(prev.appearance.hairBehind)) {
          updatedData.appearance.hairBehind = '';
        }
        
        // Проверяем одежду (бесплатную и платную)
        const allDresses = [...safeOptions.dresses.free, ...(paidOptions.dresses || [])];
        if (!allDresses.includes(prev.appearance.dress)) {
          updatedData.appearance.dress = safeOptions.dresses.free[0] || 'hoodie';
          updatedData.appearance.dressPaid = false;
        } else {
          // Проверяем, является ли текущая одежда платной
          updatedData.appearance.dressPaid = paidOptions.dresses?.includes(prev.appearance.dress) || false;
        }
        
        // Проверяем аксессуары (бесплатные и платные)
        const allAccessories = [...safeOptions.accessories.free, ...(paidOptions.accessories || [])];
        if (prev.appearance.accessory && !allAccessories.includes(prev.appearance.accessory)) {
          updatedData.appearance.accessory = '';
          updatedData.appearance.accessoryPaid = false;
        } else if (prev.appearance.accessory) {
          // Проверяем, является ли текущий аксессуар платным
          updatedData.appearance.accessoryPaid = paidOptions.accessories?.includes(prev.appearance.accessory) || false;
        }
        
        // Проверяем смущение (только для женских персонажей)
        if (prev.gender === 'female' && prev.appearance.bush && !safeOptions.bush.includes(prev.appearance.bush)) {
          updatedData.appearance.bush = '';
        }
        
        return updatedData;
      });
    }
  }, [characterData?.gender, characterData?.age, inventory]);

  if (!character || !characterData) {
    return null;
  }

  // Обработчики изменений
  const handleNameChange = (e) => {
    setCharacterData(prev => ({
      ...prev,
      name: e.target.value
    }));
  };

  // Обработчики пола и возраста удалены

  const handleAppearanceChange = (key, value) => {
    setCharacterData(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));
  };

  // Функции для работы с характеристиками
  const getStatCost = (currentValue) => {
    if (currentValue <= 15) return 1;
    if (currentValue <= 20) return 2;
    return 0;
  };

  const getStatBonus = (statValue) => {
    const modifier = Math.floor((statValue - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const canIncreaseStat = (statName) => {
    const currentValue = characterData.stats[statName];
    const cost = getStatCost(currentValue);
    
    // Если нет нераспределенных очков, нельзя увеличивать характеристики
    if (statPoints === 0) {
      return false;
    }
    
    return currentValue < 20 && statPoints >= cost;
  };

  const canDecreaseStat = (statName) => {
    const currentValue = characterData.stats[statName];
    const originalValue = originalStats ? originalStats[statName] : 8;
    
    // Если нет нераспределенных очков, нельзя уменьшать характеристики
    if (statPoints === 0) {
      return false;
    }
    
    // Можно уменьшать только если текущее значение больше исходного
    // или если это создание нового персонажа (originalStats === null)
    if (originalStats === null) {
      // Создание нового персонажа - можно уменьшать до базового значения 8
      return currentValue > 8;
    } else {
      // Редактирование существующего персонажа - можно уменьшать только добавленные в этой сессии очки
      return currentValue > originalValue;
    }
  };

  const handleStatChange = (statName, direction) => {
    const currentValue = characterData.stats[statName];
    
    if (direction === 'increase' && canIncreaseStat(statName)) {
      const cost = getStatCost(currentValue);
      setCharacterData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statName]: currentValue + 1
        }
      }));
      setStatPoints(prev => prev - cost);
    } else if (direction === 'decrease' && canDecreaseStat(statName)) {
      const newValue = currentValue - 1;
      const cost = getStatCost(newValue);
      setCharacterData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statName]: newValue
        }
      }));
      setStatPoints(prev => prev + cost);
    }
  };

  // Функции для работы с питомцами
  const getAvailablePets = () => {
    const allPets = Object.values(itemsData.items.pet || {});
    
    return allPets.filter(pet => {
      const inventoryItem = inventory[pet.id];
      return inventoryItem && inventoryItem.quantity > 0;
    });
  };

  const getPetStatBonus = () => {
    if (!characterData.pet.id) return {};
    
    const selectedPet = getSelectedPet();
    if (!selectedPet || !selectedPet.special || selectedPet.special.type !== 'stat') {
      return {};
    }
    
    const { stat_type, bonus } = selectedPet.special;
    return { [stat_type]: bonus };
  };

  const getPetCubeBonus = () => {
    if (!characterData.pet.id) return 0;
    
    const selectedPet = getSelectedPet();
    if (!selectedPet || !selectedPet.special || selectedPet.special.type !== 'cube') {
      return 0;
    }
    
    return selectedPet.special.modificator || 0;
  };

  const getFinalStatValue = (statName) => {
    const baseValue = characterData.stats[statName];
    const petBonus = getPetStatBonus()[statName] || 0;
    return baseValue + petBonus;
  };

  const handlePetSelect = (petId) => {
    setCharacterData(prev => ({
      ...prev,
      pet: {
        id: petId,
        name: ''
      }
    }));
  };

  const handlePetNameChange = (e) => {
    setCharacterData(prev => ({
      ...prev,
      pet: {
        ...prev.pet,
        name: e.target.value
      }
    }));
  };

  const handleRemovePet = () => {
    setCharacterData(prev => ({
      ...prev,
      pet: {
        id: null,
        name: ''
      }
    }));
  };

  const getSelectedPet = () => {
    if (!characterData.pet.id) return null;
    const pet = Object.values(itemsData.items.pet || {}).find(pet => pet.id === characterData.pet.id);
    return pet;
  };

  const handleSave = () => {
    if (characterData.name.trim() === '') {
      alert('Введите имя персонажа');
      return;
    }

    console.log('CharacterEditModal: Сохранение изменений персонажа:', characterData);
    console.log('CharacterEditModal: Текущие данные персонажа в контексте:', character);
    console.log('CharacterEditModal: Сравнение данных:', {
      originalGender: character.gender,
      newGender: characterData.gender,
      originalAge: character.age,
      newAge: characterData.age,
      originalAppearance: character.appearance,
      newAppearance: characterData.appearance
    });

    // Преобразуем данные питомца в правильный формат
    const characterToUpdate = {
      ...characterData,
      stats: characterData.stats,
      petId: characterData.pet.id,
      petName: characterData.pet.name,
      availableStatPoints: statPoints // Добавляем очки в одно обновление
    };
    
    // Удаляем поле pet, так как теперь используем petId и petName
    delete characterToUpdate.pet;
    
    // Обновляем персонажа одним вызовом
    updateCharacter(character.id, characterToUpdate);
    
    // Принудительно обновляем данные персонажа в контексте
    setTimeout(() => {
      // Перезагружаем данные персонажа из контекста
      const updatedCharacter = getCharacter(character.id);
      console.log('CharacterEditModal: Обновленные данные персонажа:', updatedCharacter);
      
      // Проверяем, что данные действительно обновились
      if (updatedCharacter) {
        console.log('CharacterEditModal: Проверка обновления:', {
          expectedGender: characterData.gender,
          actualGender: updatedCharacter.gender,
          expectedAge: characterData.age,
          actualAge: updatedCharacter.age,
          genderMatch: characterData.gender === updatedCharacter.gender,
          ageMatch: characterData.age === updatedCharacter.age
        });
      }
    }, 200); // Увеличиваем задержку до 200мс
    
    // Обновляем персонажей в текущей сцене
    if (onCharacterUpdate) {
      // Используем React state обновление если доступно
      console.log('CharacterEditModal: Используем React state обновление');
      onCharacterUpdate();
    } else {
      // Fallback на DOM обновление
      console.log('CharacterEditModal: Используем DOM обновление');
      updateSceneCharacters();
    }
    
    onClose();
  };

  // Функция для обновления персонажей в текущей сцене
  const updateSceneCharacters = () => {
    // Очищаем кэш изображений для принудительного обновления
    const clearImageCache = () => {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src.includes('sprites/characters/')) {
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
          }, 10);
        }
      });
    };

    // Находим все элементы персонажей игрока в текущей сцене
    const playerCharacterElements = document.querySelectorAll('.scene-character-container');
    
    playerCharacterElements.forEach(element => {
      // Проверяем, что это персонаж игрока (не NPC)
      const avatarContainer = element.querySelector('.game-avatar-container');
      if (avatarContainer) {
        // Принудительно пересобираем спрайт персонажа
        const avatarLayers = avatarContainer.querySelectorAll('.game-avatar-layer');
        avatarLayers.forEach(layer => {
          // Добавляем временный параметр для принудительного обновления
          const currentSrc = layer.src;
          layer.src = '';
          setTimeout(() => {
            layer.src = currentSrc;
          }, 10);
        });
      }
    });
    
    // Также обновляем аватар в верхней панели
    const topPanelAvatar = document.querySelector('.game-character-preview .game-avatar-container');
    if (topPanelAvatar) {
      const topPanelLayers = topPanelAvatar.querySelectorAll('.game-avatar-layer');
      topPanelLayers.forEach(layer => {
        const currentSrc = layer.src;
        layer.src = '';
        setTimeout(() => {
          layer.src = currentSrc;
        }, 10);
      });
    }

    // Очищаем кэш изображений
    setTimeout(clearImageCache, 50);
  };

  const handleCancel = () => {
    // Сбрасываем изменения к исходным данным персонажа
    setCharacterData({
      id: character.id,
      name: character.name || '',
      gender: character.gender || 'female',
      age: character.age || '1',
      appearance: character.appearance || {
        hairStyle: 'long_hair',
        hairColor: 'brown',
        hairBehind: '',
        dress: 'hoodie',
        dressPaid: false,
        accessory: '',
        accessoryPaid: false,
        bush: ''
      },
      stats: originalStats || character.stats || {
        charisma: 8,
        coldness: 8,
        sensitivity: 8,
        cunning: 8,
        determination: 8,
        intelligence: 8
      },
      pet: {
        id: character.petId || null,
        name: character.petName || ''
      }
    });
    
    // Восстанавливаем исходные нераспределенные очки
    const availablePoints = getAvailableStatPoints(character.id);
    setStatPoints(availablePoints);
    
    onClose();
  };

  // Данные о подсказках для характеристик
  const statTooltips = {
    charisma: 'Влияет на возможности очарования и отвлечения',
    coldness: 'Влияет на возможности проявления беспристрастия, грубости',
    sensitivity: 'Влияет на возможность проявления чувств, подмечание неочевидного',
    cunning: 'Влияет на способности обмана, подлости',
    determination: 'Влияет на способности проявления силы, смелости',
    intelligence: 'Влияет на способности находить решения в сложных ситуациях'
  };

  // Вкладки
  const tabs = [
    { id: 'character', label: 'Персонаж', icon: 'fas fa-user' },
    { id: 'stats', label: 'Характеристики', icon: 'fas fa-chart-bar' },
    { id: 'pet', label: 'Питомец', icon: 'fas fa-paw' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="character-edit-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
        >
          <motion.div 
            className="character-edit-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="modal-header">
              <h2>Редактирование персонажа</h2>
              <button className="close-button" onClick={handleCancel}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Вкладки */}
            <div className="modal-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Содержимое вкладок */}
            <div className="modal-content">
              {activeTab === 'character' && (
                <div className="character-editor">
                  {/* Превью персонажа */}
                  <CharacterPreview characterData={characterData} />

                  {/* Основные настройки */}
                  <div className="character-settings">
                    {/* Имя */}
                    <div className="setting-group">
                      <label className="setting-label">Имя персонажа</label>
                      <input
                        type="text"
                        className="name-input"
                        value={characterData.name}
                        onChange={handleNameChange}
                        placeholder="Введите имя..."
                        maxLength={20}
                      />
                    </div>

                    {/* Пол и возраст скрыты в игровом режиме */}

                    {/* Прическа */}
                    <div className="setting-group">
                      <label className="setting-label">Прическа</label>
                      <OptionsCarousel
                        options={availableOptions.hairStyles || []}
                        selectedValue={characterData.appearance.hairStyle}
                        onSelect={(style) => handleAppearanceChange('hairStyle', style)}
                        displayName={getOptionDisplayName}
                      />
                    </div>

                    {/* Цвет волос */}
                    <div className="setting-group">
                      <label className="setting-label">Цвет волос</label>
                      <OptionsCarousel
                        options={availableOptions.hairColors || []}
                        selectedValue={characterData.appearance.hairColor}
                        onSelect={(color) => handleAppearanceChange('hairColor', color)}
                        displayName={getOptionDisplayName}
                      />
                    </div>

                    {/* Волосы сзади */}
                    <div className="setting-group">
                      <label className="setting-label">Волосы сзади</label>
                      <OptionsCarousel
                        options={['', ...(availableOptions.hairBehindStyles || [])]}
                        selectedValue={characterData.appearance.hairBehind}
                        onSelect={(hairBehind) => handleAppearanceChange('hairBehind', hairBehind)}
                        displayName={(value) => value === '' ? 'Нет' : getOptionDisplayName(value)}
                      />
                    </div>

                    {/* Одежда */}
                    <div className="setting-group">
                      <label className="setting-label">Одежда</label>
                      <OptionsCarousel
                        options={[
                          ...(availableOptions.dresses?.free || []),
                          ...(availablePaidOptions.dresses || [])
                        ]}
                        selectedValue={characterData.appearance.dress}
                        onSelect={(dress) => {
                          const isPaid = availablePaidOptions.dresses?.includes(dress);
                          handleAppearanceChange('dress', dress);
                          handleAppearanceChange('dressPaid', isPaid);
                        }}
                        displayName={(dress) => {
                          const dressItem = getPaidClothingItems(characterData.gender, characterData.age)
                            .find(item => item.id === dress && item.subtype === 'dress');
                          if (dressItem) {
                            return (
                              <>
                                <i className="fas fa-gem"></i>
                                {dressItem.name}
                              </>
                            );
                          }
                          return getOptionDisplayName(dress);
                        }}
                      />
                    </div>

                    {/* Аксессуары */}
                    <div className="setting-group">
                      <label className="setting-label">Аксессуары</label>
                      <OptionsCarousel
                        options={[
                          '',
                          ...(availableOptions.accessories?.free || []),
                          ...(availablePaidOptions.accessories || [])
                        ]}
                        selectedValue={characterData.appearance.accessory}
                        onSelect={(accessory) => {
                          const isPaid = availablePaidOptions.accessories?.includes(accessory);
                          handleAppearanceChange('accessory', accessory);
                          handleAppearanceChange('accessoryPaid', isPaid);
                        }}
                        displayName={(accessory) => {
                          if (accessory === '') return 'Нет';
                          const accessoryItem = getPaidClothingItems(characterData.gender, characterData.age)
                            .find(item => item.id === accessory && item.subtype === 'accessory');
                          if (accessoryItem) {
                            return (
                              <>
                                <i className="fas fa-gem"></i>
                                {accessoryItem.name}
                              </>
                            );
                          }
                          return getOptionDisplayName(accessory);
                        }}
                      />
                    </div>

                    {/* Смущение (только для женских персонажей) */}
                    {characterData.gender === 'female' && (
                      <div className="setting-group">
                        <label className="setting-label">Смущение</label>
                        <OptionsCarousel
                          options={['', ...(availableOptions.bush || [])]}
                          selectedValue={characterData.appearance.bush}
                          onSelect={(bush) => handleAppearanceChange('bush', bush)}
                          displayName={(value) => value === '' ? 'Нет' : getOptionDisplayName(value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="stats-editor">
                  <div className="stats-header">
                    <h3>Распределение характеристик</h3>
                    <div className="points-counter">
                      <span>Осталось очков: </span>
                      <span className={`points-value ${statPoints === 0 ? 'complete' : ''}`}>
                        {statPoints}
                      </span>
                    </div>
                    {getPetCubeBonus() > 0 && (
                      <div className="pet-bonus-info">
                        <i className="fas fa-paw"></i>
                        <span>Бонус к броскам: +{getPetCubeBonus()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="stats-grid">
                    {/* Харизма */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-comments"></i>
                        <Tooltip content={statTooltips.charisma}>
                          <span className="stat-name">Харизма (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.charisma}
                            {getPetStatBonus().charisma && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().charisma}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('charisma'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('charisma') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('charisma', 'decrease')}
                          disabled={!canDecreaseStat('charisma')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('charisma') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('charisma', 'increase')}
                          disabled={!canIncreaseStat('charisma')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Холод */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-snowflake"></i>
                        <Tooltip content={statTooltips.coldness}>
                          <span className="stat-name">Холод (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.coldness}
                            {getPetStatBonus().coldness && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().coldness}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('coldness'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('coldness') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('coldness', 'decrease')}
                          disabled={!canDecreaseStat('coldness')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('coldness') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('coldness', 'increase')}
                          disabled={!canIncreaseStat('coldness')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Чувствительность */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-heart"></i>
                        <Tooltip content={statTooltips.sensitivity}>
                          <span className="stat-name">Чувствительность (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.sensitivity}
                            {getPetStatBonus().sensitivity && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().sensitivity}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('sensitivity'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('sensitivity') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('sensitivity', 'decrease')}
                          disabled={!canDecreaseStat('sensitivity')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('sensitivity') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('sensitivity', 'increase')}
                          disabled={!canIncreaseStat('sensitivity')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Коварство */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-mask"></i>
                        <Tooltip content={statTooltips.cunning}>
                          <span className="stat-name">Коварство (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.cunning}
                            {getPetStatBonus().cunning && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().cunning}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('cunning'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('cunning') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('cunning', 'decrease')}
                          disabled={!canDecreaseStat('cunning')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('cunning') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('cunning', 'increase')}
                          disabled={!canIncreaseStat('cunning')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Решительность */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-fist-raised"></i>
                        <Tooltip content={statTooltips.determination}>
                          <span className="stat-name">Решительность (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.determination}
                            {getPetStatBonus().determination && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().determination}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('determination'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('determination') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('determination', 'decrease')}
                          disabled={!canDecreaseStat('determination')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('determination') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('determination', 'increase')}
                          disabled={!canIncreaseStat('determination')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>

                    {/* Интеллект */}
                    <div className="stat-item">
                      <div className="stat-info">
                        <i className="fas fa-brain"></i>
                        <Tooltip content={statTooltips.intelligence}>
                          <span className="stat-name">Интеллект (?)</span>
                        </Tooltip>
                        <div className="stat-value-container">
                          <span className="stat-value">
                            {characterData.stats.intelligence}
                            {getPetStatBonus().intelligence && (
                              <span className="pet-stat-bonus">+{getPetStatBonus().intelligence}</span>
                            )}
                          </span>
                          <span className="stat-bonus">{getStatBonus(getFinalStatValue('intelligence'))}</span>
                        </div>
                      </div>
                      <div className="stat-controls">
                        <button
                          className={`stat-button ${!canDecreaseStat('intelligence') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('intelligence', 'decrease')}
                          disabled={!canDecreaseStat('intelligence')}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <button
                          className={`stat-button ${!canIncreaseStat('intelligence') ? 'disabled' : ''}`}
                          onClick={() => handleStatChange('intelligence', 'increase')}
                          disabled={!canIncreaseStat('intelligence')}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pet' && (
                <div className="pet-editor">
                  <div className="pet-section">
                    <h3>Текущий питомец</h3>
                    <div className="current-pet">
                      {characterData.pet.id ? (
                        <div className="selected-pet">
                          <div className="pet-sprite">
                            <img 
                              src={`sprites/items/pets/${getSelectedPet()?.id}.png`} 
                              alt={getSelectedPet()?.name}
                              onError={(e) => {
                                console.warn(`Ошибка загрузки спрайта питомца: ${e.target.src}`);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="pet-info">
                            <div className="pet-header">
                              <h4>{getSelectedPet()?.name}</h4>
                              <button 
                                className="remove-pet-button"
                                onClick={handleRemovePet}
                                title="Убрать питомца"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            <div className="pet-special">
                              {getSelectedPet()?.special && (
                                <div 
                                  className="special-ability"
                                  style={{ 
                                    backgroundColor: getPetSpecialColor(getSelectedPet()?.special.type),
                                    color: 'white'
                                  }}
                                >
                                  <span className="special-icon">
                                    {getPetSpecialIcon(getSelectedPet()?.special.type)}
                                  </span>
                                  <span className="special-text">
                                    {getPetSpecialText(getSelectedPet())}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-pet-slot">
                          <i className="fas fa-plus"></i>
                          <span>Выберите питомца</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Имя питомца */}
                  {characterData.pet.id && (
                    <div className="setting-group">
                      <label className="setting-label">Имя питомца</label>
                      <input
                        type="text"
                        className="name-input"
                        value={characterData.pet.name}
                        onChange={handlePetNameChange}
                        placeholder="Введите имя питомца..."
                        maxLength={20}
                      />
                    </div>
                  )}

                  {/* Выбор питомца */}
                  <div className="pet-section">
                    <h3>Доступные питомцы</h3>
                    <div className="pets-grid">
                      {getAvailablePets().map(pet => (
                        <div
                          key={pet.id}
                          className={`pet-card ${characterData.pet.id === pet.id ? 'selected' : ''}`}
                          onClick={() => handlePetSelect(pet.id)}
                        >
                          <div className="pet-card-sprite">
                            <img 
                              src={`sprites/items/pets/${pet.id}.png`} 
                              alt={pet.name}
                              onError={(e) => {
                                console.warn(`Ошибка загрузки спрайта питомца: ${e.target.src}`);
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="pet-card-info">
                            <h5>{pet.name}</h5>
                            <div className="pet-card-special">
                              {pet.special && (
                                <div 
                                  className="special-badge"
                                  style={{ 
                                    backgroundColor: getPetSpecialColor(pet.special.type),
                                    color: 'white'
                                  }}
                                >
                                  <span className="special-icon">
                                    {getPetSpecialIcon(pet.special.type)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {getAvailablePets().length === 0 && (
                      <div className="no-pets-message">
                        <i className="fas fa-info-circle"></i>
                        <p>У вас нет питомцев в инвентаре</p>
                        <p>Приобретите питомцев в магазине</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="modal-actions">
              <button className="cancel-button" onClick={handleCancel}>
                <i className="fas fa-times"></i>
                <span>Отмена</span>
              </button>
              <button className="save-button" onClick={handleSave}>
                <i className="fas fa-save"></i>
                <span>Сохранить</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CharacterEditModal; 