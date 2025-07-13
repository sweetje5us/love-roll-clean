import React, { useState, useEffect } from 'react';
import './OptionsCarousel.css';

const OptionsCarousel = ({ 
  options, 
  selectedValue, 
  onSelect, 
  displayName = (option) => option
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Находим индекс выбранного значения
  useEffect(() => {
    const selectedIndex = options.findIndex(option => option === selectedValue);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedValue, options]);
  
  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    setCurrentIndex(newIndex);
    onSelect(options[newIndex]);
  };
  
  const goToNext = () => {
    const newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onSelect(options[newIndex]);
  };
  
  if (options.length === 0) {
    return <div className="no-options">Нет доступных вариантов</div>;
  }
  
  if (options.length === 1) {
    return (
      <div className="single-option">
        {displayName(options[0])}
      </div>
    );
  }
  
  return (
    <div className="options-carousel">
      <button
        className="carousel-button"
        onClick={goToPrevious}
        aria-label="Предыдущий вариант"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      
      <div className="current-option">
        {displayName(options[currentIndex])}
      </div>
      
      <button
        className="carousel-button"
        onClick={goToNext}
        aria-label="Следующий вариант"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
      
      {/* Индикатор позиции */}
      <div className="position-indicator">
        {currentIndex + 1} / {options.length}
      </div>
    </div>
  );
};

export default OptionsCarousel; 