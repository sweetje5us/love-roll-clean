// Система скидочных предложений

// Получить текущую неделю (используем ту же логику, что и в ротации)
export const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  return Math.floor(days / 7) + 1;
};

// Генерируем скидки для текущей недели
export const generateWeeklyDiscounts = (shopItems, week) => {
  // Используем номер недели как seed для детерминированной генерации
  const seed = week;
  
  // Фильтруем предметы, которые можно скидывать (исключаем очень дешевые)
  const discountableItems = shopItems.filter(item => 
    item.price.amount >= 20 && 
    (item.type === 'consumable' || item.type === 'material' || item.type === 'key')
  );

  // Сортируем с использованием seed для детерминированности
  const shuffled = [...discountableItems].sort((a, b) => {
    const hashA = (a.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = (b.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hashA - hashB;
  });

  // Выбираем 3-5 предметов для скидки
  const discountCount = 3 + (seed % 3); // 3-5 предметов
  const selectedItems = shuffled.slice(0, discountCount);

  // Генерируем скидки для каждого предмета
  return selectedItems.map((item, index) => {
    const baseDiscount = 15 + (seed % 20); // 15-35% базовая скидка
    const itemDiscount = baseDiscount + (index * 5); // Увеличиваем скидку для каждого следующего предмета
    const finalDiscount = Math.min(itemDiscount, 50); // Максимум 50%
    
    const discountedPrice = Math.floor(item.price.amount * (1 - finalDiscount / 100));
    
    return {
      ...item,
      originalPrice: item.price.amount,
      discountPrice: discountedPrice,
      discountPercent: finalDiscount,
      currency: item.price.currency
    };
  });
};

// Получить скидочные предложения для текущей недели
export const getCurrentDiscounts = (shopItems) => {
  const currentWeek = getCurrentWeek();
  return generateWeeklyDiscounts(shopItems, currentWeek);
};

// Проверить, есть ли скидка на предмет
export const hasDiscount = (itemId, discounts) => {
  return discounts.some(discount => discount.id === itemId);
};

// Получить скидку для предмета
export const getItemDiscount = (itemId, discounts) => {
  return discounts.find(discount => discount.id === itemId);
};

// Получить информацию о скидках
export const getDiscountInfo = () => {
  const currentWeek = getCurrentWeek();
  const nextRotation = new Date();
  nextRotation.setDate(nextRotation.getDate() + (7 - nextRotation.getDay()));
  nextRotation.setHours(0, 0, 0, 0);

  return {
    currentWeek,
    nextRotation,
    daysUntilRotation: Math.ceil((nextRotation - new Date()) / (1000 * 60 * 60 * 24))
  };
}; 