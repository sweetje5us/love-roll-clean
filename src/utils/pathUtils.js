/**
 * Утилиты для работы с путями к статическим файлам
 */

/**
 * Получает правильный путь к статическому файлу
 * @param {string} path - Относительный путь к файлу
 * @returns {string} - Полный путь к файлу
 */
export function getStaticPath(path) {
  // Убираем начальный слеш, если есть
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // В продакшене PUBLIC_URL может быть пустым, поэтому используем относительные пути
  const publicUrl = process.env.PUBLIC_URL || '';
  
  // Если PUBLIC_URL пустой, используем относительный путь
  if (!publicUrl) {
    return `/${cleanPath}`;
  }
  
  // Иначе объединяем PUBLIC_URL с путем
  return `${publicUrl}/${cleanPath}`;
}

/**
 * Получает путь к спрайту персонажа
 * @param {string} spritePath - Путь к спрайту
 * @returns {string} - Полный путь к спрайту
 */
export function getCharacterSpritePath(spritePath) {
  return getStaticPath(`sprites/characters/${spritePath}`);
}

/**
 * Получает путь к спрайту предмета
 * @param {string} itemPath - Путь к предмету
 * @returns {string} - Полный путь к предмету
 */
export function getItemSpritePath(itemPath) {
  return getStaticPath(`sprites/items/${itemPath}`);
}

/**
 * Получает путь к фону локации
 * @param {string} locationPath - Путь к локации
 * @returns {string} - Полный путь к локации
 */
export function getLocationPath(locationPath) {
  return getStaticPath(`sprites/episodes/locations/${locationPath}`);
} 