import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScreen, SCREEN_TYPES } from '../../contexts/ScreenContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useCharacters } from '../../contexts/CharacterContext';
import { getAvailableOptions, getOptionDisplayName, supportsHairBehind, getAvailablePaidOptions, getPaidClothingItems, testPaidClothingSystem } from '../../utils/characterUtils';
import { getItemsByType, getPetSpecialText, getPetSpecialIcon, getPetSpecialColor } from '../../utils/itemUtils';
import itemsData from '../../data/items.json';
import CharacterPreview from '../ui/CharacterPreview';
import OptionsCarousel from '../ui/OptionsCarousel';
import Tooltip from '../ui/Tooltip';
import './CharacterCreatorScreen.css';

const CharacterCreatorScreen = () => {
  const { goBack, navigateTo, getNavigationParams } = useScreen();
  const { inventory, addTestItems } = useInventory();
  const { 
    addCharacter, 
    updateCharacter, 
    validateCharacter,
    loadLevelUpState,
    clearLevelUpState,
    getAvailableStatPoints,
    setAvailableStatPoints
  } = useCharacters();
  const [activeTab, setActiveTab] = useState('character');
  
  // Состояние для ошибок валидации
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Получаем параметры навигации для редактирования
  const navigationParams = getNavigationParams();
  const editingCharacter = navigationParams?.character;
  
  // Состояние персонажа
  const [characterData, setCharacterData] = useState(() => {
    if (editingCharacter) {
      // Редактирование существующего персонажа
      return {
        id: editingCharacter.id,
        name: editingCharacter.name || '',
        gender: editingCharacter.gender || 'female',
        age: editingCharacter.age || '1',
        appearance: editingCharacter.appearance || {
          hairStyle: 'long_hair',
          hairColor: 'brown',
          hairBehind: false,
          dress: 'hoodie',
          dressPaid: false,
          accessory: '',
          accessoryPaid: false,
          bush: ''
        },
        stats: editingCharacter.stats || {
          charisma: 8,
          coldness: 8,
          sensitivity: 8,
          cunning: 8,
          determination: 8,
          intelligence: 8
        },
        pet: {
          id: editingCharacter.petId || null,
          name: editingCharacter.petName || ''
        },
        romanceAvailable: editingCharacter.romanceAvailable || false
      };
    } else {
      // Создание нового персонажа
      return {
        name: '',
        gender: 'female',
        age: '1',
        appearance: {
          hairStyle: 'long_hair',
          hairColor: 'brown',
          hairBehind: false,
          dress: 'hoodie',
          dressPaid: false,
          accessory: '',
          accessoryPaid: false,
          bush: ''
        },
        stats: {
          charisma: 8,
          coldness: 8,
          sensitivity: 8,
          cunning: 8,
          determination: 8,
          intelligence: 8
        },
        pet: {
          id: null,
          name: ''
        },
        romanceAvailable: false
      };
    }
  });

  // Очки характеристик
  const [statPoints, setStatPoints] = useState(() => {
    if (editingCharacter) {
      // При редактировании персонажа используем доступные очки
      const availablePoints = editingCharacter.availableStatPoints || 0;
      console.log('Редактирование персонажа, доступные очки:', availablePoints);
      return availablePoints;
    }
    console.log('Создание нового персонажа, очки установлены в 10');
    return 10;
  });

  // Исходные характеристики персонажа (для защиты от изменения сохраненных характеристик)
  const [originalStats, setOriginalStats] = useState(() => {
    if (editingCharacter) {
      // При редактировании сохраняем исходные характеристики
      return { ...editingCharacter.stats };
    }
    // При создании нового персонажа не сохраняем исходные характеристики
    return null;
  });

  // Загрузка состояния модального окна повышения уровня при редактировании персонажа
  useEffect(() => {
    if (editingCharacter) {
      // Используем единую систему для получения нераспределенных очков
      const availablePoints = getAvailableStatPoints(editingCharacter.id);
      setStatPoints(availablePoints);
      
      console.log('Загружены нераспределенные очки для редактирования:', availablePoints);
    }
  }, [editingCharacter, getAvailableStatPoints]);

  // Доступные опции
  const [availableOptions, setAvailableOptions] = useState({});
  const [availablePaidOptions, setAvailablePaidOptions] = useState({});

  // Обновление доступных опций при изменении пола/возраста
  useEffect(() => {
    const options = getAvailableOptions(characterData.gender, characterData.age);
    const paidOptions = getAvailablePaidOptions(characterData.gender, characterData.age, inventory);
    
    console.log('Инвентарь:', inventory);
    console.log('Доступные платные опции:', paidOptions);
    
    // Тестирование системы платных предметов
    testPaidClothingSystem(characterData.gender, characterData.age, inventory);
    
    setAvailableOptions(options);
    setAvailablePaidOptions(paidOptions);
    
    // Проверяем совместимость текущих выборов
    if (!options.hairStyles.includes(characterData.appearance.hairStyle)) {
      setCharacterData(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          hairStyle: options.hairStyles[0] || 'long_hair'
        }
      }));
    }
    
    if (!options.hairColors.includes(characterData.appearance.hairColor)) {
      setCharacterData(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          hairColor: options.hairColors[0] || 'brown'
        }
      }));
    }
    
    if (!options.dresses.free.includes(characterData.appearance.dress)) {
      setCharacterData(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          dress: options.dresses.free[0] || 'hoodie'
        }
      }));
    }
  }, [characterData.gender, characterData.age, inventory]);

  // Обработчики изменений
  const handleNameChange = (e) => {
    setCharacterData(prev => ({
      ...prev,
      name: e.target.value
    }));
    // Очищаем ошибки валидации при изменении имени
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Обработчики пола и возраста (скрыты при редактировании персонажа)
  const handleGenderChange = (gender) => {
    setCharacterData(prev => ({
      ...prev,
      gender
    }));
  };

  const handleAgeChange = (age) => {
    setCharacterData(prev => ({
      ...prev,
      age
    }));
  };

  // Обработчик романтических отношений удален

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
    return 0; // Максимум достигнут
  };

  // Функция для расчета бонуса D&D стиля
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
    
    // Очищаем ошибки валидации при изменении характеристик
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Функции для работы с питомцами
  const getAvailablePets = () => {
    // Получаем всех питомцев напрямую из данных, минуя фильтры магазина
    const allPets = Object.values(itemsData.items.pet || {});
    
    return allPets.filter(pet => {
      // Проверяем, есть ли питомец в инвентаре
      const inventoryItem = inventory[pet.id];
      return inventoryItem && inventoryItem.quantity > 0;
    });
  };

  // Функции для расчета бонусов от питомца
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

  // Получить итоговое значение характеристики с учетом бонуса от питомца
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
        name: '' // Сбрасываем имя при смене питомца
      }
    }));
    
    // Очищаем ошибки валидации при выборе питомца
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handlePetNameChange = (e) => {
    setCharacterData(prev => ({
      ...prev,
      pet: {
        ...prev.pet,
        name: e.target.value
      }
    }));
    
    // Очищаем ошибки валидации при изменении имени питомца
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const getSelectedPet = () => {
    if (!characterData.pet.id) return null;
    return Object.values(itemsData.items.pet || {}).find(pet => pet.id === characterData.pet.id);
  };

  const handleSave = () => {
    const validation = validateCharacter(characterData, statPoints);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Показываем алерт с ошибками
      const errorMessage = validation.errors.join('\n');
      alert(`Ошибки при создании персонажа:\n\n${errorMessage}`);
      return;
    }

    // Преобразуем данные питомца в правильный формат
    const characterToSave = {
      ...characterData,
      stats: characterData.stats,
      petId: characterData.pet.id,
      petName: characterData.pet.name
    };
    
    // Удаляем поле pet, так как теперь используем petId и petName
    delete characterToSave.pet;

    if (editingCharacter) {
      // При редактировании обновляем только характеристики
      updateCharacter(editingCharacter.id, {
        ...characterToSave
      });
      
      // Устанавливаем оставшиеся нераспределенные очки через единую систему
      setAvailableStatPoints(editingCharacter.id, statPoints);
      
      console.log('Персонаж обновлен:', characterToSave);
      console.log('Установлены нераспределенные очки:', statPoints);
    } else {
      // При создании нового персонажа нераспределенные очки = 0
      const newCharacter = addCharacter({
        ...characterToSave,
        availableStatPoints: 0
      });
      console.log('Новый персонаж создан:', newCharacter);
    }

    // Переходим на экран выбора персонажа с сохранением контекста
    const returnParams = {};
    if (navigationParams.fromCollection) {
      returnParams.fromCollection = true;
    }
    navigateTo(SCREEN_TYPES.CHARACTER_SELECT, returnParams);
  };

  const handleBack = () => {
    // Если пользователь пришел из коллекции и должен вернуться туда
    if (navigationParams.returnToCollection) {
      navigateTo(SCREEN_TYPES.COLLECTION, { 
        activeTab: navigationParams.collectionTab || 'characters' 
      });
    } else {
      // Иначе используем стандартный возврат
      goBack();
    }
  };

  // Получение платных предметов для отображения
  const getPaidItemsForDisplay = () => {
    const paidItems = getPaidClothingItems(characterData.gender, characterData.age);
    return {
      dresses: paidItems.filter(item => item.subtype === 'dress'),
      accessories: paidItems.filter(item => item.subtype === 'accessory')
    };
  };

  const paidItems = getPaidItemsForDisplay();

  // Данные о подсказках для характеристик
  const statTooltips = {
    charisma: 'Влияет на возможности очарования и отвлечения',
    coldness: 'Влияет на возможности проявления беспристрастия, грубости',
    sensitivity: 'Влияет на возможность проявления чувств, подмечание неочевидного',
    cunning: 'Влияет на способности обмана, подлости',
    determination: 'Влияет на способности проявления силы, смелости',
    intelligence: 'Влияет на способности находить решения в сложных ситуациях'
  };

  // Функция для получения CSS класса цвета волос
  const getHairColorClass = (color) => {
    const colorMap = {
      'blond': 'color-blond',
      'brown': 'color-brown', 
      'dark': 'color-dark',
      'pink': 'color-pink',
      'silver': 'color-silver',
      'red': 'color-red'
    };
    return colorMap[color] || 'color-brown';
  };

  // Вкладки
  const tabs = [
    { id: 'character', label: 'Персонаж', icon: 'fas fa-user' },
    { id: 'stats', label: 'Характеристики', icon: 'fas fa-chart-bar' },
    { id: 'pet', label: 'Питомец', icon: 'fas fa-paw' }
  ];

  // Функция для получения начальных данных персонажа
  const getInitialCharacterData = () => {
    return {
      name: '',
      gender: 'female',
      age: '1',
      appearance: {
        hairStyle: 'long_hair',
        hairColor: 'brown',
        hairBehind: false,
        dress: 'hoodie',
        dressPaid: false,
        accessory: '',
        accessoryPaid: false,
        bush: ''
      },
      stats: {
        charisma: 8,
        coldness: 8,
        sensitivity: 8,
        cunning: 8,
        determination: 8,
        intelligence: 8
      },
      pet: {
        id: null,
        name: ''
      }
    };
  };

  return (
    <motion.div 
      className="character-creator-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="character-creator-container">
        {/* Заголовок */}
        <div className="character-creator-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="character-creator-title">
            {editingCharacter ? 'Редактирование персонажа' : 'Создание персонажа'}
          </h1>
        </div>

        {/* Вкладки */}
        <div className="character-creator-tabs">
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
        <div className="character-creator-content">
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

                {/* Пол и возраст скрыты при редактировании персонажа */}
                {!editingCharacter && (
                  <>
                    {/* Пол */}
                    <div className="setting-group">
                      <label className="setting-label">Пол</label>
                      <div className="option-buttons">
                        <button
                          className={`option-button ${characterData.gender === 'female' ? 'active' : ''}`}
                          onClick={() => handleGenderChange('female')}
                        >
                          <i className="fas fa-venus"></i>
                          <span>Женский</span>
                        </button>
                        <button
                          className={`option-button ${characterData.gender === 'male' ? 'active' : ''}`}
                          onClick={() => handleGenderChange('male')}
                        >
                          <i className="fas fa-mars"></i>
                          <span>Мужской</span>
                        </button>
                      </div>
                    </div>

                    {/* Возраст */}
                    <div className="setting-group">
                      <label className="setting-label">Возраст</label>
                      <div className="option-buttons">
                        <button
                          className={`option-button ${characterData.age === '1' ? 'active' : ''}`}
                          onClick={() => handleAgeChange('1')}
                        >
                          <span>1</span>
                        </button>
                        <button
                          className={`option-button ${characterData.age === '2' ? 'active' : ''}`}
                          onClick={() => handleAgeChange('2')}
                        >
                          <span>2</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Романтические отношения скрыты */}

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

                {/* Волосы сзади */}
                {supportsHairBehind(characterData.gender, characterData.age) && (
                  <div className="setting-group">
                    <label className="setting-label">Волосы сзади</label>
                    <OptionsCarousel
                      options={['Нет', ...(availableOptions.hairBehindStyles || [])]}
                      selectedValue={characterData.appearance.hairBehind || 'Нет'}
                      onSelect={(style) => handleAppearanceChange('hairBehind', style === 'Нет' ? false : style)}
                      displayName={(option) => option === 'Нет' ? 'Нет' : getOptionDisplayName(option)}
                    />
                  </div>
                )}

                {/* Цвет волос */}
                <div className="setting-group">
                  <label className="setting-label">Цвет волос</label>
                  <div className="color-palette">
                    {availableOptions.hairColors?.map(color => (
                      <button
                        key={color}
                        className={`color-option ${getHairColorClass(color)} ${characterData.appearance.hairColor === color ? 'active' : ''}`}
                        onClick={() => handleAppearanceChange('hairColor', color)}
                        title={getOptionDisplayName(color)}
                      />
                    ))}
                  </div>
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
                      const dressItem = paidItems.dresses.find(item => item.id === dress);
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
                      const accessoryItem = paidItems.accessories.find(item => item.id === accessory);
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

              <div className="stats-info">
                <p><strong>Правила:</strong></p>
                <ul>
                  <li>Все характеристики начинаются с 8</li>
                  <li>Повышение до 15 стоит 1 очко</li>
                  <li>Повышение с 16 до 20 стоит 2 очка</li>
                  <li>Максимальное значение - 20 (22 с бонусом питомца)</li>
                </ul>
                <p><strong>Бонусы D&D:</strong></p>
                <ul>
                  <li>Бонус = (Характеристика - 10) ÷ 2, округлено вниз</li>
                  <li>8 = -1, 10 = +0, 12 = +1, 14 = +2, 16 = +3, 18 = +4, 20 = +5, 22 = +6</li>
                  <li>Бонус применяется к проверкам характеристик</li>
                </ul>
                {(getPetStatBonus().charisma || getPetStatBonus().coldness || getPetStatBonus().sensitivity || 
                  getPetStatBonus().cunning || getPetStatBonus().determination || getPetStatBonus().intelligence) && (
                  <p><strong>Бонусы от питомца:</strong></p>
                )}
                {getPetStatBonus().charisma && <p>• Харизма +{getPetStatBonus().charisma}</p>}
                {getPetStatBonus().coldness && <p>• Холод +{getPetStatBonus().coldness}</p>}
                {getPetStatBonus().sensitivity && <p>• Чувствительность +{getPetStatBonus().sensitivity}</p>}
                {getPetStatBonus().cunning && <p>• Коварство +{getPetStatBonus().cunning}</p>}
                {getPetStatBonus().determination && <p>• Решительность +{getPetStatBonus().determination}</p>}
                {getPetStatBonus().intelligence && <p>• Интеллект +{getPetStatBonus().intelligence}</p>}
                {getPetCubeBonus() > 0 && (
                  <p><strong>Бонус к броскам:</strong> +{getPetCubeBonus()} к результату броска</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pet' && (
            <div className="pet-editor">
              <div className="pet-selection">
                <h3>Выбор питомца</h3>
                
                {/* Слот для выбранного питомца */}
                <div className="pet-slot">
                  {characterData.pet.id ? (
                    <div className="selected-pet">
                      <div className="pet-image">
                        <img 
                          src={getSelectedPet()?.sprite} 
                          alt={getSelectedPet()?.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="pet-placeholder" style={{ display: 'none' }}>
                          <i className="fas fa-paw"></i>
                        </div>
                      </div>
                      <div className="pet-info">
                        <h4>{getSelectedPet()?.name}</h4>
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

                {/* Список доступных питомцев */}
                <div className="available-pets">
                  <h4>Доступные питомцы</h4>
                  <div className="pets-grid">
                    {getAvailablePets().map(pet => (
                      <div
                        key={pet.id}
                        className={`pet-card ${characterData.pet.id === pet.id ? 'selected' : ''}`}
                        onClick={() => handlePetSelect(pet.id)}
                      >
                        <div className="pet-card-sprite">
                          <img 
                            src={pet.sprite} 
                            alt={pet.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div className="pet-placeholder" style={{ display: 'none' }}>
                            <i className="fas fa-paw"></i>
                          </div>
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
            </div>
          )}
        </div>

        {/* Отображение ошибок валидации */}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <div className="error-header">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Ошибки валидации:</span>
            </div>
            <ul className="error-list">
              {validationErrors.map((error, index) => (
                <li key={index} className="error-item">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Кнопка сохранения (общая для всех вкладок) */}
        <div className="save-section">
          <button className="save-button" onClick={handleSave}>
            <i className="fas fa-save"></i>
            <span>{editingCharacter ? 'Обновить персонажа' : 'Сохранить персонажа'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCreatorScreen; 