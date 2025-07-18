import React, { useState, useEffect } from 'react';
import CharacterPreview from './CharacterPreview';
import characterSprites from '../data/character_sprites.json';
import './CharacterEditModal.css';

const CharacterEditModal = ({ character, onSave, onClose }) => {
  const [characterData, setCharacterData] = useState({
    id: '',
    name: '',
    description: '',
    role: '',
    gender: 'female',
    age: 'young',
    romanceAvailable: false,
    appearance: {
      hairStyle: 'long_hair',
      hairColor: 'brown',
      hairBehind: '',
      dress: 'hoodie',
      dressPaid: false,
      accessory: '',
      accessoryPaid: false,
      bush: ''
    }
  });

  const [activeTab, setActiveTab] = useState('basic');

  // Функция для получения типа персонажа
  const getCharacterType = (gender, age) => {
    if (age === 'mature') {
      return `${gender}_mature`;
    }
    return gender;
  };

  // Получаем доступные опции для текущего персонажа
  const getAvailableOptions = () => {
    const type = getCharacterType(characterData.gender, characterData.age);
    
    // Прически
    const hairStyles = characterSprites.hairs[type] ? Object.keys(characterSprites.hairs[type]) : [];
    
    // Цвета волос для выбранной прически
    const selectedHairStyle = characterData.appearance.hairStyle;
    const hairColors = selectedHairStyle && characterSprites.hairs[type]?.[selectedHairStyle] 
      ? Object.keys(characterSprites.hairs[type][selectedHairStyle]) 
      : hairStyles.length > 0 
        ? Object.keys(characterSprites.hairs[type][hairStyles[0]] || {}) 
        : [];
    
    // Волосы сзади
    const hairBehindStyles = characterSprites.hair_behind[type] ? Object.keys(characterSprites.hair_behind[type]) : [];
    
    // Цвета для волос сзади (если выбраны)
    const selectedHairBehind = characterData.appearance.hairBehind;
    const hairBehindColors = selectedHairBehind && characterSprites.hair_behind[type]?.[selectedHairBehind]
      ? Object.keys(characterSprites.hair_behind[type][selectedHairBehind])
      : hairBehindStyles.length > 0
        ? Object.keys(characterSprites.hair_behind[type][hairBehindStyles[0]] || {})
        : [];
    
    // Одежда
    const dresses = [];
    if (characterSprites.dresses[type]) {
      if (characterSprites.dresses[type].free) {
        dresses.push(...Object.keys(characterSprites.dresses[type].free).map(d => ({ name: d, type: 'free' })));
      }
      if (characterSprites.dresses[type].paid) {
        dresses.push(...Object.keys(characterSprites.dresses[type].paid).map(d => ({ name: d, type: 'paid' })));
      }
      if (characterSprites.dresses[type].scenes) {
        dresses.push(...Object.keys(characterSprites.dresses[type].scenes).map(d => ({ name: d, type: 'scenes' })));
      }
    }
    
    // Аксессуары
    const accessories = [];
    if (characterSprites.accessories[type]) {
      if (characterSprites.accessories[type].free) {
        accessories.push(...Object.keys(characterSprites.accessories[type].free).map(a => ({ name: a, type: 'free' })));
      }
      if (characterSprites.accessories[type].paid) {
        accessories.push(...Object.keys(characterSprites.accessories[type].paid).map(a => ({ name: a, type: 'paid' })));
      }
    }
    
    return {
      hairStyles,
      hairColors,
      hairBehindStyles,
      hairBehindColors,
      dresses,
      accessories
    };
  };

  useEffect(() => {
    if (character) {
      setCharacterData({
        id: character.id || '',
        name: character.name || '',
        description: character.description || '',
        role: character.role || '',
        gender: character.gender || 'female',
        age: character.age || 'young',
        romanceAvailable: character.romanceAvailable || false,
        appearance: {
          hairStyle: character.appearance?.hairStyle || '',
          hairColor: character.appearance?.hairColor || 'brown',
          hairBehind: character.appearance?.hairBehind || '',
          dress: character.appearance?.dress || '',
          dressPaid: character.appearance?.dressPaid || false,
          accessory: character.appearance?.accessory || '',
          accessoryPaid: character.appearance?.accessoryPaid || false,
          bush: character.appearance?.bush || ''
        }
      });
    }
  }, [character]);

  const handleInputChange = (field, value) => {
    setCharacterData(prev => ({
      ...prev,
      [field]: value
    }));

    // Если изменился пол или возраст, сбрасываем внешность на совместимые значения
    if (field === 'gender' || field === 'age') {
      const newType = getCharacterType(
        field === 'gender' ? value : characterData.gender,
        field === 'age' ? value : characterData.age
      );
      
      // Получаем доступные опции для нового типа
      const availableHairStyles = characterSprites.hairs[newType] ? Object.keys(characterSprites.hairs[newType]) : [];
      const availableDresses = [];
      if (characterSprites.dresses[newType]) {
        if (characterSprites.dresses[newType].free) {
          availableDresses.push(...Object.keys(characterSprites.dresses[newType].free));
        }
        if (characterSprites.dresses[newType].paid) {
          availableDresses.push(...Object.keys(characterSprites.dresses[newType].paid));
        }
        if (characterSprites.dresses[newType].scenes) {
          availableDresses.push(...Object.keys(characterSprites.dresses[newType].scenes));
        }
      }
      
      // Сбрасываем несовместимые настройки
      const newAppearance = { ...characterData.appearance };
      
      if (availableHairStyles.length > 0 && !availableHairStyles.includes(newAppearance.hairStyle)) {
        newAppearance.hairStyle = availableHairStyles[0];
        const availableColors = characterSprites.hairs[newType][newAppearance.hairStyle] 
          ? Object.keys(characterSprites.hairs[newType][newAppearance.hairStyle])
          : [];
        if (availableColors.length > 0) {
          newAppearance.hairColor = availableColors[0];
        }
      }
      
      if (availableDresses.length > 0 && !availableDresses.includes(newAppearance.dress)) {
        newAppearance.dress = availableDresses[0];
      }
      
      setCharacterData(prev => ({
        ...prev,
        [field]: value,
        appearance: newAppearance
      }));
    }
  };

  const handleAppearanceChange = (key, value) => {
    setCharacterData(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));

    // Если изменилась прическа, сбрасываем цвет волос на первый доступный
    if (key === 'hairStyle') {
      const type = getCharacterType(characterData.gender, characterData.age);
      const availableColors = characterSprites.hairs[type]?.[value] 
        ? Object.keys(characterSprites.hairs[type][value])
        : [];
      
      if (availableColors.length > 0 && !availableColors.includes(characterData.appearance.hairColor)) {
        setCharacterData(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            [key]: value,
            hairColor: availableColors[0]
          }
        }));
      }
    }

    // Если изменились волосы сзади, сбрасываем цвет на первый доступный
    if (key === 'hairBehind') {
      const type = getCharacterType(characterData.gender, characterData.age);
      const availableColors = characterSprites.hair_behind[type]?.[value] 
        ? Object.keys(characterSprites.hair_behind[type][value])
        : [];
      
      if (availableColors.length > 0 && !availableColors.includes(characterData.appearance.hairColor)) {
        setCharacterData(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            [key]: value,
            hairColor: availableColors[0]
          }
        }));
      }
    }
  };

  const handleSave = () => {
    if (!characterData.name.trim()) {
      alert('Пожалуйста, введите имя персонажа');
      return;
    }

    if (!characterData.id.trim()) {
      characterData.id = characterData.name.toLowerCase().replace(/\s+/g, '_');
    }

    onSave(characterData);
  };

  const getOptionDisplayName = (option) => {
    const displayNames = {
      // Прически
      'long_hair': 'Длинные волосы',
      'short_hair': 'Короткие волосы',
      'short_bob': 'Каре',
      'hime_cut': 'Химе-кат',
      'hime_cut_short': 'Короткий химе-кат',
      'long': 'Длинные',
      'middle': 'Средние',
      'short': 'Короткие',
      'side_curl': 'Боковые локоны',
      'curly': 'Кудрявые',
      'long1': 'Длинные 1',
      'long2': 'Длинные 2',
      'long3': 'Длинные 3',
      'long4': 'Длинные 4',
      'long_blocking_eyes': 'Длинные (закрывают глаза)',
      'short1': 'Короткие 1',
      'short2': 'Короткие 2',
      'short3': 'Короткие 3',
      'short4': 'Короткие 4',
      'twin_tail': 'Два хвостика',
      
      // Одежда
      'hoodie': 'Худи',
      'hoodie1': 'Худи 1',
      'hoodie2': 'Худи 2',
      'casual': 'Повседневная',
      'casual1': 'Повседневная 1',
      'casual2': 'Повседневная 2',
      'casual3': 'Повседневная 3',
      'casual4': 'Повседневная 4',
      'casual5': 'Повседневная 5',
      'casual6': 'Повседневная 6',
      'sport_uniform': 'Спортивная форма',
      'summer_dress': 'Летнее платье',
      'school_uniform': 'Школьная форма',
      'school_uniform1': 'Школьная форма 1',
      'school_uniform2': 'Школьная форма 2',
      'school1': 'Школьная 1',
      'school2': 'Школьная 2',
      'teacher_uniform': 'Учительская форма',
      'teacher_uniform2': 'Учительская форма 2',
      'teacher_uniform3': 'Учительская форма 3',
      'office_suit': 'Офисный костюм',
      'office1': 'Офисная 1',
      'office2': 'Офисная 2',
      'office3': 'Офисная 3',
      'office4': 'Офисная 4',
      'doc_suit1': 'Докторский костюм 1',
      'doc_suit2': 'Докторский костюм 2',
      'doc_suit3': 'Докторский костюм 3',
      'tanktop': 'Майка',
      'tanktop2': 'Майка 2',
      'vest': 'Жилет',
      'winter': 'Зимняя',
      'winter_outfit': 'Зимний наряд',
      'pajama': 'Пижама',
      'shirt1': 'Рубашка 1',
      'shirt2': 'Рубашка 2',
      'tshirt': 'Футболка',
      'tshirt2': 'Футболка 2',
      'uniform': 'Униформа',
      'dress1': 'Платье 1',
      'appron1': 'Фартук 1',
      'appron2': 'Фартук 2',
      'swim_suit': 'Купальник',
      'swimsuit': 'Купальник',
      'towel': 'Полотенце',
      
      // Аксессуары
      'black_glasses': 'Черные очки',
      'circle_glasses': 'Круглые очки',
      'red_glasses': 'Красные очки',
      'glasses': 'Очки',
      'glasses_black': 'Черные очки',
      'headphones': 'Наушники',
      'choker': 'Чокер',
      'flower': 'Цветок',
      'black_band': 'Черная повязка',
      'white_band': 'Белая повязка',
      'yellow_band': 'Желтая повязка',
      'black_ribbon': 'Черная лента',
      'white_ribbon': 'Белая лента',
      'yellow_ribbon': 'Желтая лента',
      'ribbon': 'Лента',
      'rose1': 'Роза 1',
      'rose2': 'Роза 2',
      
      // Цвета волос
      'blond': 'Светлые',
      'brown': 'Каштановые',
      'dark': 'Темные',
      'pink': 'Розовые',
      'silver': 'Серебристые',
      'red': 'Рыжие',
      'black': 'Черные'
    };
    return displayNames[option] || option;
  };

  const getHairColorClass = (color) => {
    const colorMap = {
      'blond': 'color-blond',
      'brown': 'color-brown', 
      'dark': 'color-dark',
      'pink': 'color-pink',
      'silver': 'color-silver',
      'red': 'color-red',
      'black': 'color-black'
    };
    return colorMap[color] || 'color-brown';
  };

  const tabs = [
    { id: 'basic', label: 'Основное', icon: 'fas fa-user' },
    { id: 'appearance', label: 'Внешность', icon: 'fas fa-palette' }
  ];

  const availableOptions = getAvailableOptions();

  return (
    <div className="character-edit-modal-overlay" onClick={onClose}>
      <div className="character-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{character ? 'Редактирование персонажа' : 'Создание персонажа'}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

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

        <div className="modal-content">
          {activeTab === 'basic' && (
            <div className="basic-settings">
              <div className="preview-section">
                <CharacterPreview characterData={characterData} />
              </div>
              
              <div className="settings-section">
                <div className="setting-group">
                  <label>ID персонажа</label>
                  <input
                    type="text"
                    value={characterData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="Уникальный идентификатор"
                  />
                </div>

                <div className="setting-group">
                  <label>Имя персонажа</label>
                  <input
                    type="text"
                    value={characterData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Введите имя..."
                  />
                </div>

                <div className="setting-group">
                  <label>Описание</label>
                  <textarea
                    value={characterData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Описание персонажа..."
                    rows={3}
                  />
                </div>

                <div className="setting-group">
                  <label>Роль</label>
                  <input
                    type="text"
                    value={characterData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="Роль в истории..."
                  />
                </div>

                <div className="setting-group">
                  <label>Пол</label>
                  <div className="option-buttons">
                    <button
                      className={`option-button ${characterData.gender === 'female' ? 'active' : ''}`}
                      onClick={() => handleInputChange('gender', 'female')}
                    >
                      <i className="fas fa-venus"></i>
                      <span>Женский</span>
                    </button>
                    <button
                      className={`option-button ${characterData.gender === 'male' ? 'active' : ''}`}
                      onClick={() => handleInputChange('gender', 'male')}
                    >
                      <i className="fas fa-mars"></i>
                      <span>Мужской</span>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>Возраст</label>
                  <div className="option-buttons">
                    <button
                      className={`option-button ${characterData.age === 'young' ? 'active' : ''}`}
                      onClick={() => handleInputChange('age', 'young')}
                    >
                      <span>Молодой</span>
                    </button>
                    <button
                      className={`option-button ${characterData.age === 'mature' ? 'active' : ''}`}
                      onClick={() => handleInputChange('age', 'mature')}
                    >
                      <span>Взрослый</span>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={characterData.romanceAvailable}
                      onChange={(e) => handleInputChange('romanceAvailable', e.target.checked)}
                    />
                    Романтика доступна
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="appearance-settings">
              <div className="preview-section">
                <CharacterPreview characterData={characterData} />
              </div>
              
              <div className="settings-section">
                <div className="setting-group">
                  <label>Прическа</label>
                  <select
                    value={characterData.appearance.hairStyle}
                    onChange={(e) => handleAppearanceChange('hairStyle', e.target.value)}
                  >
                    {availableOptions.hairStyles.map(style => (
                      <option key={style} value={style}>
                        {getOptionDisplayName(style)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-group">
                  <label>Цвет волос</label>
                  <div className="color-palette">
                    {availableOptions.hairColors.map(color => (
                      <button
                        key={color}
                        className={`color-option ${getHairColorClass(color)} ${characterData.appearance.hairColor === color ? 'active' : ''}`}
                        onClick={() => handleAppearanceChange('hairColor', color)}
                        title={getOptionDisplayName(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="setting-group">
                  <label>Волосы сзади</label>
                  <select
                    value={characterData.appearance.hairBehind || 'Нет'}
                    onChange={(e) => handleAppearanceChange('hairBehind', e.target.value === 'Нет' ? '' : e.target.value)}
                  >
                    <option value="Нет">Нет</option>
                    {availableOptions.hairBehindStyles.map(style => (
                      <option key={style} value={style}>
                        {getOptionDisplayName(style)}
                      </option>
                    ))}
                  </select>
                </div>

                {characterData.appearance.hairBehind && characterData.appearance.hairBehind.trim() !== '' && (
                  <div className="setting-group">
                    <label>Цвет волос сзади</label>
                    <div className="color-palette">
                      {availableOptions.hairBehindColors.map(color => (
                        <button
                          key={color}
                          className={`color-option ${getHairColorClass(color)} ${characterData.appearance.hairColor === color ? 'active' : ''}`}
                          onClick={() => handleAppearanceChange('hairColor', color)}
                          title={getOptionDisplayName(color)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="setting-group">
                  <label>Одежда</label>
                  <select
                    value={characterData.appearance.dress}
                    onChange={(e) => handleAppearanceChange('dress', e.target.value)}
                  >
                    {availableOptions.dresses.map(dress => (
                      <option key={dress.name} value={dress.name}>
                        {getOptionDisplayName(dress.name)} ({dress.type === 'free' ? 'Бесплатная' : dress.type === 'paid' ? 'Платная' : 'Сцены'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-group">
                  <label>Тип одежды</label>
                  <div className="option-buttons">
                    <button
                      className={`option-button ${!characterData.appearance.dressPaid ? 'active' : ''}`}
                      onClick={() => handleAppearanceChange('dressPaid', false)}
                    >
                      <span>Бесплатная</span>
                    </button>
                    <button
                      className={`option-button ${characterData.appearance.dressPaid ? 'active' : ''}`}
                      onClick={() => handleAppearanceChange('dressPaid', true)}
                    >
                      <span>Платная</span>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label>Аксессуары</label>
                  <select
                    value={characterData.appearance.accessory}
                    onChange={(e) => handleAppearanceChange('accessory', e.target.value)}
                  >
                    <option value="">Нет</option>
                    {availableOptions.accessories.map(accessory => (
                      <option key={accessory.name} value={accessory.name}>
                        {getOptionDisplayName(accessory.name)} ({accessory.type === 'free' ? 'Бесплатный' : 'Платный'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-group">
                  <label>Тип аксессуара</label>
                  <div className="option-buttons">
                    <button
                      className={`option-button ${!characterData.appearance.accessoryPaid ? 'active' : ''}`}
                      onClick={() => handleAppearanceChange('accessoryPaid', false)}
                    >
                      <span>Бесплатный</span>
                    </button>
                    <button
                      className={`option-button ${characterData.appearance.accessoryPaid ? 'active' : ''}`}
                      onClick={() => handleAppearanceChange('accessoryPaid', true)}
                    >
                      <span>Платный</span>
                    </button>
                  </div>
                </div>

                {characterData.gender === 'female' && (
                  <div className="setting-group">
                    <label>Смущение</label>
                    <select
                      value={characterData.appearance.bush}
                      onChange={(e) => handleAppearanceChange('bush', e.target.value)}
                    >
                      <option value="">Нет</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button className="save-btn" onClick={handleSave}>
            {character ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterEditModal; 