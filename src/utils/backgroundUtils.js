/**
 * Утилиты для работы с фонами локаций
 */

// Маппинг имен фонов в пути к файлам
const backgroundMapping = {
  // Школа
  'school_class': `${process.env.PUBLIC_URL}/sprites/episodes/locations/school/school_class.png`,
  'school_corridor': `${process.env.PUBLIC_URL}/sprites/episodes/locations/school/school_corridor.png`,
  'school_building': `${process.env.PUBLIC_URL}/sprites/episodes/locations/school/school_building.png`,
  'school_rest_room': `${process.env.PUBLIC_URL}/sprites/episodes/locations/school/school_rest_room.png`,
  
  // Кафе
  'caffe_inside': `${process.env.PUBLIC_URL}/sprites/episodes/locations/caffe/caffe_inside.jfif`,
  'caffe_building': `${process.env.PUBLIC_URL}/sprites/episodes/locations/caffe/caffe_building.jfif`,
  
  // Особняк
  'mansion_inside': `${process.env.PUBLIC_URL}/sprites/episodes/locations/mansion/mansion_inside.png`,
  'attic_inside_day': `${process.env.PUBLIC_URL}/sprites/episodes/locations/mansion/attic_inside_day.png`,
  'attic_inside_night': `${process.env.PUBLIC_URL}/sprites/episodes/locations/mansion/attic_inside_night.png`,
  'mansion_garden': `${process.env.PUBLIC_URL}/sprites/episodes/locations/mansion/mansion_garden.png`,
  'mansion_entrance': `${process.env.PUBLIC_URL}/sprites/episodes/locations/mansion/mansion_entrance.png`
};

/**
 * Получение пути к файлу фона по имени
 * @param {string} backgroundName - Имя фона
 * @returns {string} - Путь к файлу фона
 */
export function getBackgroundPath(backgroundName) {
  if (!backgroundName) {
    return null;
  }
  
  // Если уже полный путь, возвращаем как есть
  if (backgroundName.startsWith('sprites/') || backgroundName.startsWith('/sprites/')) {
    return backgroundName.startsWith('/') ? backgroundName : `${process.env.PUBLIC_URL}/${backgroundName}`;
  }
  
  // Ищем в маппинге
  const mappedPath = backgroundMapping[backgroundName];
  if (mappedPath) {
    return mappedPath;
  }
  
  // Если не найден в маппинге, пробуем стандартный путь
  console.warn(`Фон "${backgroundName}" не найден в маппинге, используем стандартный путь`);
  return `${process.env.PUBLIC_URL}/${backgroundName}`;
}

/**
 * Проверка существования фона
 * @param {string} backgroundName - Имя фона
 * @returns {boolean} - Существует ли фон
 */
export function backgroundExists(backgroundName) {
  return backgroundMapping.hasOwnProperty(backgroundName);
}

/**
 * Получение списка всех доступных фонов
 * @returns {Array} - Массив имен фонов
 */
export function getAvailableBackgrounds() {
  return Object.keys(backgroundMapping);
}

/**
 * Получение фона по умолчанию для локации
 * @param {string} location - Название локации
 * @returns {string} - Путь к фону по умолчанию
 */
export function getDefaultBackgroundForLocation(location) {
  const locationDefaults = {
    'classroom': 'school_class',
    'school': 'school_building',
    'caffe': 'caffe_inside',
    'mansion': 'mansion_inside'
  };
  
  const defaultBackground = locationDefaults[location];
  if (defaultBackground) {
    return getBackgroundPath(defaultBackground);
  }
  
  // Если локация не найдена, возвращаем фон школы по умолчанию
  return getBackgroundPath('school_building');
} 