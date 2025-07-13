import React, { useState, useEffect } from 'react';
import { buildCharacterSprite, getCharacterPreviewScale } from '../../utils/characterUtils';
import { useInventory } from '../../contexts/InventoryContext';
import './CharacterPreview.css';

const CharacterPreview = ({ characterData, inventory: externalInventory }) => {
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { inventory: contextInventory } = useInventory();
  
  // Используем переданный инвентарь или из контекста
  const inventory = externalInventory || contextInventory;

  useEffect(() => {
    if (!characterData) {
      setLayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const spriteLayers = buildCharacterSprite(characterData, inventory);
      setLayers(spriteLayers);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка при сборке спрайта:', err);
      setError('Ошибка загрузки спрайта');
      setLoading(false);
    }
  }, [characterData, inventory]);

  const scale = getCharacterPreviewScale(characterData?.gender, characterData?.age);

  if (loading) {
    return (
      <div className="character-preview">
        <div className="preview-container">
          <div className="preview-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Загрузка...</p>
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
            <p>{error}</p>
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
            <p>Превью персонажа</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-preview">
      <div className="preview-container">
        <div className="sprite-container" style={{ transform: `scale(${scale})` }}>
          {layers.map((layer, index) => (
            <img
              key={`${layer.zIndex}-${index}`}
              src={layer.src}
              alt={`Слой ${layer.zIndex}`}
              className="sprite-layer"
              style={{
                zIndex: layer.zIndex,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                console.warn(`Ошибка загрузки изображения: ${layer.src}`);
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