import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRandomPetForReward } from '../utils/petUtils';

const DailyRewardsContext = createContext();

export const useDailyRewards = () => {
  const context = useContext(DailyRewardsContext);
  if (!context) {
    throw new Error('useDailyRewards must be used within a DailyRewardsProvider');
  }
  return context;
};

export const DailyRewardsProvider = ({ children }) => {
  const [dailyRewards, setDailyRewards] = useState(() => {
    const savedRewards = localStorage.getItem('game_daily_rewards');
    return savedRewards ? JSON.parse(savedRewards) : {
      currentStreak: 0,
      lastClaimDate: null,
      claimedDays: [],
      currentWeek: getCurrentWeek()
    };
  });

  // Получить текущую неделю
  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7) + 1;
  }

  // Получить текущий день недели (0-6, где 0 = воскресенье)
  function getCurrentDayOfWeek() {
    return new Date().getDay();
  }

  // Проверить, можно ли получить награду сегодня
  const canClaimToday = () => {
    const today = new Date().toDateString();
    const lastClaim = dailyRewards.lastClaimDate ? new Date(dailyRewards.lastClaimDate).toDateString() : null;
    
    // Если уже получали сегодня
    if (lastClaim === today) {
      return false;
    }

    // Если это новый день
    return true;
  };

  // Получить награду за день
  const getDayReward = (day) => {
    const rewards = [
      { type: 'coins', amount: 50, icon: 'fas fa-coins' },
      { type: 'item', itemId: 'basic_chest', icon: 'fas fa-box', name: 'Базовый сундук' },
      { type: 'coins', amount: 75, icon: 'fas fa-coins' },
      { type: 'item', itemId: 'old_key', icon: 'fas fa-key', name: 'Старый ключ' },
      { type: 'gems', amount: 15, icon: 'fas fa-gem' },
      { type: 'coins', amount: 100, icon: 'fas fa-coins' },
      { type: 'random_pet', amount: 1, icon: 'fas fa-paw', name: 'Случайный питомец' } // Специальная награда за 7 дней
    ];
    
    return rewards[day - 1] || rewards[0];
  };

  // Получить награду за сегодняшний день
  const getTodayReward = () => {
    const currentDay = dailyRewards.currentStreak % 7 + 1;
    return getDayReward(currentDay);
  };

  // Получить прогресс недели
  const getWeekProgress = () => {
    return dailyRewards.currentStreak % 7;
  };

  // Получить информацию о наградах на неделю
  const getWeekRewards = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      const reward = getDayReward(day);
      const isClaimed = dailyRewards.claimedDays.includes(day);
      const isToday = day === (dailyRewards.currentStreak % 7 + 1);
      const canClaim = isToday && canClaimToday();
      
      return {
        day,
        reward,
        isClaimed,
        isToday,
        canClaim
      };
    });
  };

  // Получить награду
  const claimReward = (addCoins, addGems, addItem) => {
    if (!canClaimToday()) {
      return { success: false, message: 'Вы уже получили награду сегодня!' };
    }

    const today = new Date().toDateString();
    const currentDay = dailyRewards.currentStreak % 7 + 1;
    const reward = getDayReward(currentDay);

    // Обновляем состояние
    setDailyRewards(prev => ({
      ...prev,
      currentStreak: prev.currentStreak + 1,
      lastClaimDate: new Date().toISOString(),
      claimedDays: [...prev.claimedDays, currentDay]
    }));

    // Выдаем награду
    if (reward.type === 'coins') {
      addCoins(reward.amount);
      return { 
        success: true, 
        message: `Получена награда за ${currentDay} день: ${reward.amount} монет!`,
        reward
      };
    } else if (reward.type === 'gems') {
      addGems(reward.amount);
      return { 
        success: true, 
        message: `Получена награда за ${currentDay} день: ${reward.amount} самоцветов!`,
        reward
      };
    } else if (reward.type === 'item') {
      addItem(reward.itemId, 1);
      return { 
        success: true, 
        message: `Получена награда за ${currentDay} день: ${reward.name}!`,
        reward
      };
    } else if (reward.type === 'random_pet') {
      // Случайный питомец из списка
      const randomPetId = getRandomPetForReward();
      addItem(randomPetId, 1);
      return { 
        success: true, 
        message: `Получена награда за ${currentDay} день: Случайный питомец!`,
        reward: { ...reward, actualItemId: randomPetId }
      };
    }

    return { success: false, message: 'Неизвестный тип награды!' };
  };

  // Сбросить прогресс (для тестирования)
  const resetProgress = () => {
    setDailyRewards({
      currentStreak: 0,
      lastClaimDate: null,
      claimedDays: [],
      currentWeek: getCurrentWeek()
    });
  };

  // Проверить, нужно ли сбросить прогресс (новая неделя)
  useEffect(() => {
    const currentWeek = getCurrentWeek();
    if (currentWeek !== dailyRewards.currentWeek) {
      setDailyRewards(prev => ({
        ...prev,
        currentWeek,
        claimedDays: []
      }));
    }
  }, [dailyRewards.currentWeek]);

  // Сохранение в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('game_daily_rewards', JSON.stringify(dailyRewards));
  }, [dailyRewards]);

  const value = {
    dailyRewards,
    canClaimToday,
    getTodayReward,
    getWeekProgress,
    getWeekRewards,
    claimReward,
    resetProgress
  };

  return (
    <DailyRewardsContext.Provider value={value}>
      {children}
    </DailyRewardsContext.Provider>
  );
}; 