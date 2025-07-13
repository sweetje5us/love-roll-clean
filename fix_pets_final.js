const fs = require('fs');
const path = require('path');

// Читаем текущий JSON файл
const itemsPath = path.join(__dirname, 'src', 'data', 'items.json');
const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Список питомцев с правильными настройками
const availablePets = [
  // Common (15) - за золото
  { id: 'slime', name: 'Слайм', description: 'Милое слизистое создание', price: 10, rarity: 'common', currency: 'coins' },
  { id: 'rat', name: 'Крыса', description: 'Маленький грызун', price: 8, rarity: 'common', currency: 'coins' },
  { id: 'frog', name: 'Лягушка', description: 'Зеленая квакушка', price: 12, rarity: 'common', currency: 'coins' },
  { id: 'fish', name: 'Рыба', description: 'Обычная рыбка', price: 15, rarity: 'common', currency: 'coins' },
  { id: 'sheep', name: 'Овца', description: 'Пушистая овечка', price: 20, rarity: 'common', currency: 'coins' },
  { id: 'turtle', name: 'Черепаха', description: 'Медлительная черепаха', price: 18, rarity: 'common', currency: 'coins' },
  { id: 'crab', name: 'Краб', description: 'Клешнистый краб', price: 16, rarity: 'common', currency: 'coins' },
  { id: 'spider', name: 'Паук', description: 'Восьминогий паук', price: 14, rarity: 'common', currency: 'coins' },
  { id: 'snake', name: 'Змея', description: 'Извивающаяся змея', price: 22, rarity: 'common', currency: 'coins' },
  { id: 'bat', name: 'Летучая мышь', description: 'Ночная летучая мышь', price: 25, rarity: 'common', currency: 'coins' },
  { id: 'monkey', name: 'Обезьяна', description: 'Игривая обезьянка', price: 30, rarity: 'common', currency: 'coins' },
  { id: 'fox', name: 'Лиса', description: 'Рыжая лиса', price: 28, rarity: 'common', currency: 'coins' },
  { id: 'wolf', name: 'Волк', description: 'Дикий волк', price: 35, rarity: 'common', currency: 'coins' },
  { id: 'plant', name: 'Растение', description: 'Живое растение', price: 12, rarity: 'common', currency: 'coins' },
  { id: 'scallop', name: 'Морской гребешок', description: 'Морской моллюск', price: 18, rarity: 'common', currency: 'coins' },

  // Rare (50) - часть за золото, часть за самоцветы
  { id: 'fairy', name: 'Фея', description: 'Магическое существо', price: 50, rarity: 'rare', currency: 'coins' },
  { id: 'big_slime', name: 'Большой слайм', description: 'Увеличенный слайм', price: 40, rarity: 'rare', currency: 'coins' },
  { id: 'fire_slime', name: 'Огненный слайм', description: 'Горящий слайм', price: 45, rarity: 'rare', currency: 'coins' },
  { id: 'nature_slime', name: 'Природный слайм', description: 'Зеленый слайм', price: 42, rarity: 'rare', currency: 'coins' },
  { id: 'thunder_slime', name: 'Громовой слайм', description: 'Электрический слайм', price: 48, rarity: 'rare', currency: 'coins' },
  { id: 'frost_sprite', name: 'Ледяной дух', description: 'Холодный дух', price: 55, rarity: 'rare', currency: 'coins' },
  { id: 'fire_wisp', name: 'Огненный огонек', description: 'Пламенный дух', price: 52, rarity: 'rare', currency: 'coins' },
  { id: 'whispering_wisp', name: 'Шепчущий огонек', description: 'Говорящий дух', price: 60, rarity: 'rare', currency: 'coins' },
  { id: 'plant_sprite', name: 'Дух растения', description: 'Растительный дух', price: 45, rarity: 'rare', currency: 'coins' },
  { id: 'fluffy_bear', name: 'Пушистый медведь', description: 'Мягкий медведь', price: 65, rarity: 'rare', currency: 'coins' },
  { id: 'horned_rabbit', name: 'Рогатый кролик', description: 'Кролик с рогами', price: 55, rarity: 'rare', currency: 'coins' },
  { id: 'tiger', name: 'Тигр', description: 'Полосатый хищник', price: 70, rarity: 'rare', currency: 'coins' },
  { id: 'crocodile', name: 'Крокодил', description: 'Зубастый крокодил', price: 68, rarity: 'rare', currency: 'coins' },
  { id: 'shark', name: 'Акула', description: 'Морской хищник', price: 75, rarity: 'rare', currency: 'coins' },
  { id: 'raven', name: 'Ворон', description: 'Мудрый ворон', price: 50, rarity: 'rare', currency: 'coins' },
  { id: 'goblin', name: 'Гоблин', description: 'Маленький гоблин', price: 45, rarity: 'rare', currency: 'coins' },
  { id: 'goblin_swordfighter', name: 'Гоблин-мечник', description: 'Вооруженный гоблин', price: 60, rarity: 'rare', currency: 'coins' },
  { id: 'red_imp', name: 'Красный бес', description: 'Огненный бес', price: 45, rarity: 'rare', currency: 'coins' },
  { id: 'black_imp', name: 'Черный бес', description: 'Темный бес', price: 50, rarity: 'rare', currency: 'coins' },
  { id: 'golem', name: 'Голем', description: 'Каменный голем', price: 80, rarity: 'rare', currency: 'coins' },
  { id: 'clay_golem', name: 'Глиняный голем', description: 'Глиняный страж', price: 70, rarity: 'rare', currency: 'coins' },
  { id: 'automaton_fighter', name: 'Автомат-боец', description: 'Механический боец', price: 85, rarity: 'rare', currency: 'coins' },
  { id: 'cyber_minibot', name: 'Кибер-миник', description: 'Маленький робот', price: 75, rarity: 'rare', currency: 'coins' },
  { id: 'cyber_unit', name: 'Кибер-юнит', description: 'Боевой робот', price: 90, rarity: 'rare', currency: 'coins' },
  { id: 'cyber_fighter', name: 'Кибер-боец', description: 'Робот-воин', price: 95, rarity: 'rare', currency: 'coins' },
  { id: 'fire_robot', name: 'Огненный робот', description: 'Горящий робот', price: 88, rarity: 'rare', currency: 'coins' },
  { id: 'ice_robot', name: 'Ледяной робот', description: 'Холодный робот', price: 85, rarity: 'rare', currency: 'coins' },
  { id: 'jellyfish', name: 'Медуза', description: 'Прозрачная медуза', price: 55, rarity: 'rare', currency: 'coins' },
  { id: 'scorpion', name: 'Скорпион', description: 'Ядовитый скорпион', price: 65, rarity: 'rare', currency: 'coins' },
  { id: 'wasp', name: 'Оса', description: 'Жужжащая оса', price: 45, rarity: 'rare', currency: 'coins' },
  { id: 'salamander', name: 'Саламандра', description: 'Огненная саламандра', price: 70, rarity: 'rare', currency: 'coins' },
  { id: 'tortoise', name: 'Черепаха', description: 'Большая черепаха', price: 60, rarity: 'rare', currency: 'coins' },
  { id: 'viper', name: 'Гадюка', description: 'Ядовитая змея', price: 75, rarity: 'rare', currency: 'coins' },
  { id: 'shadow', name: 'Тень', description: 'Темная тень', price: 80, rarity: 'rare', currency: 'coins' },
  { id: 'spirit', name: 'Дух', description: 'Бестелесный дух', price: 85, rarity: 'rare', currency: 'coins' },
  { id: 'bogling', name: 'Болотник', description: 'Болотное существо', price: 55, rarity: 'rare', currency: 'coins' },
  { id: 'bogwine', name: 'Болотное вино', description: 'Болотный дух', price: 60, rarity: 'rare', currency: 'coins' },
  { id: 'cumulus', name: 'Кучевое облако', description: 'Облачный дух', price: 65, rarity: 'rare', currency: 'coins' },
  { id: 'glistening_fish', name: 'Блестящая рыба', description: 'Сверкающая рыба', price: 70, rarity: 'rare', currency: 'coins' },
  { id: 'starfish_monster', name: 'Морская звезда', description: 'Монстр-звезда', price: 75, rarity: 'rare', currency: 'coins' },
  { id: 'frog_monster', name: 'Лягушка-монстр', description: 'Увеличенная лягушка', price: 80, rarity: 'rare', currency: 'coins' },
  { id: 'mushroom_monster', name: 'Гриб-монстр', description: 'Живой гриб', price: 65, rarity: 'rare', currency: 'coins' },
  { id: 'cactus_monster', name: 'Кактус-монстр', description: 'Колючий монстр', price: 70, rarity: 'rare', currency: 'coins' },
  { id: 'plant_behemoth', name: 'Растительный бегемот', description: 'Гигантское растение', price: 85, rarity: 'rare', currency: 'coins' },
  { id: 'living_boulder', name: 'Живой валун', description: 'Оживший камень', price: 90, rarity: 'rare', currency: 'coins' },
  { id: 'tentacle_monster', name: 'Монстр-щупальце', description: 'Щупальцевидный монстр', price: 95, rarity: 'rare', currency: 'coins' },
  { id: 'sand_worm', name: 'Песчаный червь', description: 'Песочный червь', price: 80, rarity: 'rare', currency: 'coins' },
  { id: 'snow_worm', name: 'Снежный червь', description: 'Ледяной червь', price: 85, rarity: 'rare', currency: 'coins' },
  { id: 'merfolk', name: 'Русалка', description: 'Морская дева', price: 100, rarity: 'rare', currency: 'coins' },
  { id: 'dryad', name: 'Дриада', description: 'Лесная нимфа', price: 95, rarity: 'rare', currency: 'coins' },
  { id: 'harpy', name: 'Гарпия', description: 'Крылатая гарпия', price: 110, rarity: 'rare', currency: 'coins' },
  { id: 'gargoyle', name: 'Гаргулья', description: 'Каменная гаргулья', price: 105, rarity: 'rare', currency: 'coins' },
  { id: 'mummy', name: 'Мумия', description: 'Древняя мумия', price: 90, rarity: 'rare', currency: 'coins' },
  { id: 'troll', name: 'Тролль', description: 'Большой тролль', price: 120, rarity: 'rare', currency: 'coins' },
  { id: 'cockatrice', name: 'Кокатрис', description: 'Петух-дракон', price: 130, rarity: 'rare', currency: 'coins' },
  { id: 'basilisk', name: 'Василиск', description: 'Король змей', price: 140, rarity: 'rare', currency: 'coins' },
  { id: 'cyclops', name: 'Циклоп', description: 'Одноглазый великан', price: 160, rarity: 'rare', currency: 'coins' },
  { id: 'minos', name: 'Минос', description: 'Быкоголовый воин', price: 145, rarity: 'rare', currency: 'coins' },
  { id: 'tengu', name: 'Тэнгу', description: 'Японский демон', price: 135, rarity: 'rare', currency: 'coins' },
  { id: 'abyssal_beast', name: 'Бездонный зверь', description: 'Существо из бездны', price: 300, rarity: 'rare', currency: 'coins' },
  { id: 'abyssal_dweller', name: 'Обитатель бездны', description: 'Житель глубин', price: 280, rarity: 'rare', currency: 'coins' },
  { id: 'treant', name: 'Древень', description: 'Древний страж леса', price: 350, rarity: 'rare', currency: 'coins' },

  // Mythical (15) - за самоцветы
  { id: 'dragon', name: 'Дракон', description: 'Могущественное существо', price: 500, rarity: 'mythical', currency: 'gems' },
  { id: 'griffin', name: 'Грифон', description: 'Крылатый грифон', price: 150, rarity: 'mythical', currency: 'gems' },
  { id: 'gorgon', name: 'Горгона', description: 'Змееволосая горгона', price: 170, rarity: 'mythical', currency: 'gems' },
  { id: 'djinn', name: 'Джинн', description: 'Магический джинн', price: 180, rarity: 'mythical', currency: 'gems' },
  { id: 'kraken', name: 'Кракен', description: 'Морское чудовище', price: 200, rarity: 'mythical', currency: 'gems' },
  { id: 'reaper', name: 'Жнец', description: 'Жнец душ', price: 250, rarity: 'mythical', currency: 'gems' },
  { id: 'banshee', name: 'Банши', description: 'Плачущий дух', price: 220, rarity: 'mythical', currency: 'gems' },
  { id: 'wraith', name: 'Призрак', description: 'Темный призрак', price: 240, rarity: 'mythical', currency: 'gems' },

  // Legendary (6) - за самоцветы
  { id: 'phoenix', name: 'Феникс', description: 'Возрождающаяся птица', price: 600, rarity: 'legendary', currency: 'gems' },
  { id: 'unicorn', name: 'Единорог', description: 'Магический единорог', price: 550, rarity: 'legendary', currency: 'gems' },
  { id: 'pegasus', name: 'Пегас', description: 'Крылатый конь', price: 580, rarity: 'legendary', currency: 'gems' },
  { id: 'baby_dragon', name: 'Детеныш дракона', description: 'Маленький дракончик', price: 400, rarity: 'legendary', currency: 'gems' },
  { id: 'kitten', name: 'Котенок', description: 'Маленький котенок', price: 350, rarity: 'legendary', currency: 'gems' },
  { id: 'puppy', name: 'Щенок', description: 'Маленький щенок', price: 350, rarity: 'legendary', currency: 'gems' }
];

// Создаем новый объект питомцев
const newPets = {};

// Добавляем питомцев
availablePets.forEach(pet => {
  newPets[pet.id] = {
    id: pet.id,
    name: pet.name,
    description: pet.description,
    type: 'pet',
    rarity: pet.rarity,
    price: {
      currency: pet.currency,
      amount: pet.price
    },
    sellPrice: 0,
    canSell: false,
    sprite: `sprites/items/pets/${pet.id.replace(/_/g, ' ')}.png`
  };
});

// Заменяем секцию питомцев в JSON
itemsData.items.pet = newPets;

// Записываем обновленный JSON файл
fs.writeFileSync(itemsPath, JSON.stringify(itemsData, null, 2), 'utf8');

console.log('✅ Питомцы успешно исправлены в JSON файле!');
console.log(`📊 Всего питомцев: ${Object.keys(newPets).length}`);
console.log(`   - Обычные: ${availablePets.filter(p => p.rarity === 'common').length}`);
console.log(`   - Редкие: ${availablePets.filter(p => p.rarity === 'rare').length}`);
console.log(`   - Мистические: ${availablePets.filter(p => p.rarity === 'mythical').length}`);
console.log(`   - Невероятные: ${availablePets.filter(p => p.rarity === 'legendary').length}`);

console.log('\n💰 Валюта:');
console.log(`   - За золото: ${availablePets.filter(p => p.currency === 'coins').length}`);
console.log(`   - За самоцветы: ${availablePets.filter(p => p.currency === 'gems').length}`);

// Проверяем, что все файлы изображений существуют
const petsDir = path.join(__dirname, 'public', 'sprites', 'items', 'pets');
const missingFiles = [];

availablePets.forEach(pet => {
  const fileName = `${pet.id.replace(/_/g, ' ')}.png`;
  const filePath = path.join(petsDir, fileName);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(fileName);
  }
});

if (missingFiles.length > 0) {
  console.log('\n❌ Отсутствующие файлы изображений:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log('\n✅ Все файлы изображений найдены!');
}

console.log('\n🔄 Ротация магазина:');
console.log('   - В магазине показывается максимум 4 питомца');
console.log('   - Ассортимент меняется раз в 7 дней');
console.log('   - Питомцы выбираются случайно из всех доступных'); 