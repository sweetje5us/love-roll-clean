import React, { useState, useEffect } from 'react';
import characterSprites from '../data/character_sprites.json';
import './CharacterPreview.css';

// Функция для получения правильного пути к спрайту
const getCharacterSpritePath = (spritePath) => {
  return `/sprites/characters/${spritePath}`;
};

// Функция для получения типа персонажа
const getCharacterType = (gender, age) => {
  if (age === 'mature') {
    return `${gender}_mature`;
  }
  return gender; // для age === 'young' или undefined
};

const CharacterPreview = ({ characterData }) => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!characterData) {
      setLayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Используем правильную логику сборки спрайта
      const spriteLayers = buildCharacterSprite(characterData);
      setLayers(spriteLayers);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при сборке спрайта:', err);
      setError('Ошибка загрузки спрайта');
      setLoading(false);
    }
  }, [characterData]);

  const buildCharacterSprite = (character) => {
    const { appearance, gender, age } = character;
    const type = getCharacterType(gender, age);
    const layers = [];

    // 0. Волосы сзади (если выбраны)
    if (appearance.hairBehind && typeof appearance.hairBehind === 'string' && appearance.hairBehind.trim() !== '') {
      const hairBehindPath = characterSprites.hair_behind[type]?.[appearance.hairBehind]?.[appearance.hairColor];
      if (hairBehindPath) {
        layers.push({
          src: getCharacterSpritePath(hairBehindPath),
          zIndex: 0
        });
      }
    }

    // 1. Тело
    const bodyData = characterSprites.base_body[type];
    if (bodyData) {
      layers.push({
        src: getCharacterSpritePath(bodyData.file),
        zIndex: 1,
        size: bodyData.size
      });
    }

    // 2. Эмоция (по умолчанию normal)
    const emotionPath = characterSprites.emotion[type]?.pink_eyes?.normal;
    if (emotionPath) {
      layers.push({
        src: getCharacterSpritePath(emotionPath),
        zIndex: 2
      });
    }

    // 3. Смущение (только для женских персонажей в определённых сценах)
    if (gender === 'female' && appearance.bush && appearance.bush.trim() !== '' && characterSprites.bush[type]?.[appearance.bush]) {
      const bushPath = characterSprites.bush[type][appearance.bush];
      layers.push({
        src: getCharacterSpritePath(bushPath),
        zIndex: 3
      });
    }

    // 4. Одежда
    if (appearance.dress && appearance.dress.trim() !== '') {
      let dressPath = null;
      if (appearance.dressPaid) {
        // Платная одежда
        dressPath = characterSprites.dresses[type]?.paid?.[appearance.dress];
      } else {
        // Сначала проверяем бесплатную одежду
        dressPath = characterSprites.dresses[type]?.free?.[appearance.dress];
        
        // Если не найдено в бесплатной, проверяем в сценах
        if (!dressPath) {
          dressPath = characterSprites.dresses[type]?.scenes?.[appearance.dress];
        }
      }

      if (dressPath) {
        layers.push({
          src: getCharacterSpritePath(dressPath),
          zIndex: 4
        });
      }
    }

    // 5. Причёска
    if (appearance.hairStyle && appearance.hairStyle.trim() !== '') {
      const hairPath = characterSprites.hairs[type]?.[appearance.hairStyle]?.[appearance.hairColor];
      if (hairPath) {
        layers.push({
          src: getCharacterSpritePath(hairPath),
          zIndex: 5
        });
      }
    }

    // 6. Аксессуары (если есть)
    if (appearance.accessory && appearance.accessory.trim() !== '') {
      let accessoryPath = null;
      if (appearance.accessoryPaid) {
        // Платный аксессуар
        accessoryPath = characterSprites.accessories[type]?.paid?.[appearance.accessory];
      } else {
        // Бесплатный аксессуар
        accessoryPath = characterSprites.accessories[type]?.free?.[appearance.accessory];
      }

      if (accessoryPath) {
        layers.push({
          src: getCharacterSpritePath(accessoryPath),
          zIndex: 6
        });
      }
    }

    const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
    return sortedLayers;
  };

  const getCharacterPreviewScale = (gender, age) => {
    if (gender === 'female' && age === 'mature') return 0.4;
    if (gender === 'female' && age === 'young') return 0.5;
    if (gender === 'male' && age === 'mature') return 0.5;
    if (gender === 'male' && age === 'young') return 0.6;
    return 0.5;
  };

  const scale = getCharacterPreviewScale(characterData?.gender, characterData?.age);

  if (loading) {
    return (
      <div className="character-preview">
        <div className="preview-container">
          <div className="preview-loading">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="character-preview">
        <div className="preview-container">
          <div className="preview-error">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
        </div>
      </div>
    );
  }

  if (layers.length === 0) {
    return (
      <div className="character-preview">
        <div className="preview-container">
          <div className="preview-placeholder">
            <i className="fas fa-user-circle"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-preview">
      <div className="preview-container">
        <div 
          className="sprite-container"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'bottom center'
          }}
        >
          {layers.map((layer, index) => (
            <img
              key={index}
              src={layer.src}
              alt={`Layer ${layer.zIndex}`}
              className="sprite-layer"
              style={{
                zIndex: layer.zIndex,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              onLoad={(e) => {
                console.log('✓ Изображение загружено:', layer.src);
              }}
              onError={(e) => {
                console.error('✗ Ошибка загрузки изображения:', layer.src);
                e.target.style.display = 'none';
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterPreview; 