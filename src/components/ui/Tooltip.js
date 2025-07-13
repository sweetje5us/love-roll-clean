import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

const Tooltip = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // Определяем ширину подсказки в зависимости от размера экрана
    let tooltipWidth = 300;
    if (windowWidth <= 480) {
      tooltipWidth = 250;
    } else if (windowWidth <= 768) {
      tooltipWidth = 280;
    }
    
    // Вычисляем позицию X с учетом границ экрана
    let x = rect.left + rect.width / 2;
    
    // Проверяем, не выходит ли подсказка за левую границу
    if (x - tooltipWidth / 2 < 10) {
      x = tooltipWidth / 2 + 10;
    }
    
    // Проверяем, не выходит ли подсказка за правую границу
    if (x + tooltipWidth / 2 > windowWidth - 10) {
      x = windowWidth - tooltipWidth / 2 - 10;
    }
    
    setPosition({
      x: x,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  // Закрытие подсказки при клике вне её
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  return (
    <div className="tooltip-container">
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={showTooltip}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <div className="tooltip-content">
            {content}
          </div>
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip; 