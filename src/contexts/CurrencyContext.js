import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [gold, setGold] = useState(() => {
    const savedGold = localStorage.getItem('game_gold');
    return savedGold ? parseInt(savedGold) : 0;
  });
  
  const [gems, setGems] = useState(() => {
    const savedGems = localStorage.getItem('game_gems');
    return savedGems ? parseInt(savedGems) : 0;
  });

  // Сохранение валюты в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('game_gold', gold.toString());
  }, [gold]);

  useEffect(() => {
    localStorage.setItem('game_gems', gems.toString());
  }, [gems]);

  // Функции для изменения валюты
  const addGold = (amount) => {
    setGold(prev => Math.max(0, prev + amount));
  };

  const removeGold = (amount) => {
    setGold(prev => Math.max(0, prev - amount));
  };

  const addGems = (amount) => {
    setGems(prev => Math.max(0, prev + amount));
  };

  const removeGems = (amount) => {
    setGems(prev => Math.max(0, prev - amount));
  };

  const setGoldAmount = (amount) => {
    setGold(Math.max(0, amount));
  };

  const setGemsAmount = (amount) => {
    setGems(Math.max(0, amount));
  };

  // Сброс валюты (для тестирования)
  const resetCurrency = () => {
    setGold(0);
    setGems(0);
  };

  // Проверка достаточности валюты
  const hasEnoughGold = (amount) => {
    return gold >= amount;
  };

  const hasEnoughGems = (amount) => {
    return gems >= amount;
  };

  const value = {
    gold,
    gems,
    addGold,
    removeGold,
    addGems,
    removeGems,
    setGoldAmount,
    setGemsAmount,
    resetCurrency,
    hasEnoughGold,
    hasEnoughGems
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}; 