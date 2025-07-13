import React, { useState, useEffect } from 'react';
import './CurrencyDisplay.css';

const CurrencyDisplay = ({ 
  gold = 0, 
  gems = 0, 
  size = 'medium', 
  showLabels = true, 
  className = '' 
}) => {
  const [currentGold, setCurrentGold] = useState(gold);
  const [currentGems, setCurrentGems] = useState(gems);

  // Анимация изменения значений
  useEffect(() => {
    const animateValue = (start, end, setter) => {
      if (start === end) return;
      
      const duration = 500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Плавная анимация с easeOut
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeProgress);
        
        setter(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    };

    animateValue(currentGold, gold, setCurrentGold);
    animateValue(currentGems, gems, setCurrentGems);
  }, [gold, gems]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`currency-display ${size} ${className}`}>
      {gold !== undefined && (
        <div className="currency-item gold">
          <div className="currency-sprite coin-sprite"></div>
          <div className="currency-info">
            <span className="currency-amount">{formatNumber(currentGold)}</span>
            {showLabels && <span className="currency-label">Золото</span>}
          </div>
        </div>
      )}
      
      {gems !== undefined && (
        <div className="currency-item gems">
          <div className="currency-sprite gem-sprite"></div>
          <div className="currency-info">
            <span className="currency-amount">{formatNumber(currentGems)}</span>
            {showLabels && <span className="currency-label">Самоцветы</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyDisplay; 