import React from 'react';
import { motion } from 'framer-motion';
import { 
  getRarityColor, 
  getTypeColor, 
  formatPrice, 
  canSellItem, 
  getSellPrice,
  getPetSpecialText,
  getPetSpecialIcon,
  getPetSpecialColor
} from '../../utils/itemUtils';
import './ItemCard.css';

const ItemCard = ({ 
  item, 
  onBuy, 
  onSell, 
  onChestClick,
  showPrice = true, 
  showRarity = true, 
  showType = true,
  showQuantity = false,
  quantity = 0,
  showBuyButton = true,
  showSellButton = false,
  className = '',
  size = 'medium'
}) => {
  const rarityColor = getRarityColor(item.rarity);
  const typeColor = getTypeColor(item.type);
  const canSell = canSellItem(item);
  const sellPrice = getSellPrice(item);
  const isChest = item.type === 'chest';
  const isPet = item.type === 'pet';
  const specialText = isPet ? getPetSpecialText(item) : null;
  const specialIcon = isPet && item.special ? getPetSpecialIcon(item.special.type) : null;
  const specialColor = isPet && item.special ? getPetSpecialColor(item.special.type) : null;

  const handleBuy = () => {
    if (onBuy) {
      onBuy(item);
    }
  };

  const handleSell = () => {
    if (onSell && canSell) {
      onSell(item);
    }
  };

  const handleChestClick = () => {
    if (isChest && onChestClick) {
      onChestClick(item);
    }
  };

  return (
    <motion.div
      className={`item-card ${size} ${className} ${isChest ? 'chest-item' : ''} ${isPet ? 'pet-item' : ''}`}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={isChest ? handleChestClick : undefined}
      style={{ cursor: isChest ? 'pointer' : 'default' }}
    >
      {/* Изображение предмета */}
      <div className="item-image" data-rarity={item.rarity}>
        <img 
          src={item.sprite} 
          alt={item.name}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="item-image-placeholder">
          <i className="fas fa-question"></i>
        </div>
        
        {/* Бейдж скидки */}
        {item.hasDiscount && (
          <div className="item-discount-badge">
            -{item.discountPercent}%
          </div>
        )}
      </div>

      {/* Бейдж сундука */}
      {isChest && (
        <div className="item-chest-badge">
          <i className="fas fa-box-open"></i>
        </div>
      )}

      {/* Бейдж специальной способности питомца */}
      {isPet && specialIcon && (
        <div 
          className="item-special-badge"
          style={{ backgroundColor: specialColor }}
          title={specialText}
        >
          {specialIcon}
        </div>
      )}

      {/* Информация о предмете */}
      <div className="item-info">
        {/* Бейдж редкости */}
        {showRarity && (
          <div 
            className="item-rarity-badge"
            style={{ backgroundColor: rarityColor }}
          >
            {item.rarity}
          </div>
        )}

        <h3 className="item-name">{item.name}</h3>
        <p className="item-description">{item.description}</p>
        
        {/* Специальная способность питомца */}
        {isPet && specialText && (
          <div 
            className="item-special-ability"
            style={{ color: specialColor }}
          >
            {specialText}
          </div>
        )}

        {/* Дополнительная информация о питомце */}
        {isPet && (
          <div className="pet-info">
            {item.scary !== undefined && (
              <span className={`pet-trait ${item.scary ? 'scary' : 'friendly'}`}>
                {item.scary ? '😱 Пугающий' : '😊 Дружелюбный'}
              </span>
            )}
            {item.can_get_in_scenes !== undefined && (
              <span className={`pet-trait ${item.can_get_in_scenes ? 'scene-available' : 'scene-unavailable'}`}>
                {item.can_get_in_scenes ? '🎭 В сценах' : '🚫 Не в сценах'}
              </span>
            )}
          </div>
        )}
        
        {/* Тип предмета */}
        {showType && (
          <div 
            className="item-type-badge"
            style={{ backgroundColor: typeColor }}
          >
            {item.type}
          </div>
        )}

        {/* Цена */}
        {showPrice && item.price && (
          <div className="item-price">
            {item.hasDiscount ? (
              <div className="discounted-price">
                <span className="original-price-amount">
                  {item.originalPrice} {item.price.currency === 'gems' ? '💎' : '🪙'}
                </span>
                <span className="discount-price-amount">
                  {item.discountPrice} {item.price.currency === 'gems' ? '💎' : '🪙'}
                </span>
              </div>
            ) : (
              <span className="price-amount">
                {formatPrice(item.price)}
              </span>
            )}
          </div>
        )}

        {/* Количество предметов */}
        {showQuantity && quantity > 0 && (
          <div className="item-quantity">
            x{quantity}
          </div>
        )}

        {/* Цена продажи */}
        {showSellButton && canSell && (
          <div className="item-sell-price">
            Продажа: {sellPrice} 🪙
          </div>
        )}

        {/* Подсказка для сундука */}
        {isChest && (
          <div className="item-chest-hint">
            <i className="fas fa-mouse-pointer"></i>
            <span>Нажмите, чтобы открыть</span>
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="item-actions">
        {showBuyButton && onBuy && item.price && !isChest && (
          <button 
            className="item-buy-btn"
            onClick={handleBuy}
          >
            Купить
          </button>
        )}
        
        {showSellButton && onSell && canSell && !isChest && (
          <button 
            className="item-sell-btn"
            onClick={handleSell}
          >
            Продать
          </button>
        )}

        {isChest && (
          <button 
            className="item-chest-btn"
            onClick={handleChestClick}
          >
            <i className="fas fa-box-open"></i>
            Открыть
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ItemCard; 