// Утилиты для ротации ассортимента магазина

// Получить текущую неделю (начиная с 1 января 2024)
export const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  return Math.floor(days / 7) + 1;
};

// Получить случайные предметы из массива
export const getRandomItems = (items, count) => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Получить предметы для текущей недели
export const getWeeklyItems = (allItems, week) => {
  // Предметы, которые всегда доступны (расходуемые, ключи, подарки, одежда)
  const alwaysAvailable = allItems.filter(item => 
    item.type === 'consumable' || item.type === 'key' || item.type === 'gift' || item.type === 'clothing'
  );

  // Только питомцы ротируются
  const pets = allItems.filter(item => item.type === 'pet');

  // Используем номер недели как seed для генерации случайных питомцев
  const seed = week;
  const shuffledPets = [...pets].sort((a, b) => {
    const hashA = (a.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = (b.id + seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hashA - hashB;
  });

  // Выбираем случайных питомцев для ротации (максимум 8 питомцев)
  const selectedPets = shuffledPets.slice(0, 8);

  return [...alwaysAvailable, ...selectedPets];
};

// Получить информацию о ротации
export const getRotationInfo = () => {
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