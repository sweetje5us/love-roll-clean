const fs = require('fs');
const path = require('path');

// Читаем текущий JSON файл
const itemsPath = path.join(__dirname, 'src', 'data', 'items.json');
const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Данные питомцев по редкости
const petsData = {
  common: [
    { id: 'slime', name: 'Слайм', description: 'Милое слизистое создание', price: 10 },
    { id: 'rat', name: 'Крыса', description: 'Маленький грызун', price: 8 },
    { id: 'frog', name: 'Лягушка', description: 'Зеленая квакушка', price: 12 },
    { id: 'fish', name: 'Рыба', description: 'Обычная рыбка', price: 15 },
    { id: 'sheep', name: 'Овца', description: 'Пушистая овечка', price: 20 },
    { id: 'turtle', name: 'Черепаха', description: 'Медлительная черепаха', price: 18 },
    { id: 'crab', name: 'Краб', description: 'Клешнистый краб', price: 16 },
    { id: 'spider', name: 'Паук', description: 'Восьминогий паук', price: 14 },
    { id: 'snake', name: 'Змея', description: 'Извивающаяся змея', price: 22 },
    { id: 'bat', name: 'Летучая мышь', description: 'Ночная летучая мышь', price: 25 },
    { id: 'monkey', name: 'Обезьяна', description: 'Игривая обезьянка', price: 30 },
    { id: 'fox', name: 'Лиса', description: 'Рыжая лиса', price: 28 },
    { id: 'wolf', name: 'Волк', description: 'Дикий волк', price: 35 },
    { id: 'plant', name: 'Растение', description: 'Живое растение', price: 12 },
    { id: 'scallop', name: 'Морской гребешок', description: 'Морской моллюск', price: 18 }
  ],
  rare: [
    { id: 'fairy', name: 'Фея', description: 'Магическое существо', price: 50 },
    { id: 'big_slime', name: 'Большой слайм', description: 'Увеличенный слайм', price: 40 },
    { id: 'fire_slime', name: 'Огненный слайм', description: 'Горящий слайм', price: 45 },
    { id: 'nature_slime', name: 'Природный слайм', description: 'Зеленый слайм', price: 42 },
    { id: 'thunder_slime', name: 'Громовой слайм', description: 'Электрический слайм', price: 48 },
    { id: 'frost_sprite', name: 'Ледяной дух', description: 'Холодный дух', price: 55 },
    { id: 'fire_wisp', name: 'Огненный огонек', description: 'Пламенный дух', price: 52 },
    { id: 'will_o_wisp', name: 'Блуждающий огонек', description: 'Таинственный огонек', price: 58 },
    { id: 'whispering_wisp', name: 'Шепчущий огонек', description: 'Говорящий дух', price: 60 },
    { id: 'plant_sprite', name: 'Дух растения', description: 'Растительный дух', price: 45 },
    { id: 'fluffy_bear', name: 'Пушистый медведь', description: 'Мягкий медведь', price: 65 },
    { id: 'horned_rabbit', name: 'Рогатый кролик', description: 'Кролик с рогами', price: 55 },
    { id: 'tiger', name: 'Тигр', description: 'Полосатый хищник', price: 70 },
    { id: 'crocodile', name: 'Крокодил', description: 'Зубастый крокодил', price: 68 },
    { id: 'shark', name: 'Акула', description: 'Морской хищник', price: 75 },
    { id: 'raven', name: 'Ворон', description: 'Мудрый ворон', price: 50 },
    { id: 'goblin', name: 'Гоблин', description: 'Маленький гоблин', price: 45 },
    { id: 'goblin_swordfighter', name: 'Гоблин-мечник', description: 'Вооруженный гоблин', price: 60 },
    { id: 'red_imp', name: 'Красный бес', description: 'Огненный бес', price: 45 },
    { id: 'black_imp', name: 'Черный бес', description: 'Темный бес', price: 50 },
    { id: 'golem', name: 'Голем', description: 'Каменный голем', price: 80 },
    { id: 'clay_golem', name: 'Глиняный голем', description: 'Глиняный страж', price: 70 },
    { id: 'automaton_fighter', name: 'Автомат-боец', description: 'Механический боец', price: 85 },
    { id: 'cyber_minibot', name: 'Кибер-миник', description: 'Маленький робот', price: 75 },
    { id: 'cyber_unit', name: 'Кибер-юнит', description: 'Боевой робот', price: 90 },
    { id: 'cyber_fighter', name: 'Кибер-боец', description: 'Робот-воин', price: 95 },
    { id: 'fire_robot', name: 'Огненный робот', description: 'Горящий робот', price: 88 },
    { id: 'ice_robot', name: 'Ледяной робот', description: 'Холодный робот', price: 85 },
    { id: 'jellyfish', name: 'Медуза', description: 'Прозрачная медуза', price: 55 },
    { id: 'scorpion', name: 'Скорпион', description: 'Ядовитый скорпион', price: 65 },
    { id: 'wasp', name: 'Оса', description: 'Жужжащая оса', price: 45 },
    { id: 'salamander', name: 'Саламандра', description: 'Огненная саламандра', price: 70 },
    { id: 'tortoise', name: 'Черепаха', description: 'Большая черепаха', price: 60 },
    { id: 'viper', name: 'Гадюка', description: 'Ядовитая змея', price: 75 },
    { id: 'shadow', name: 'Тень', description: 'Темная тень', price: 80 },
    { id: 'spirit', name: 'Дух', description: 'Бестелесный дух', price: 85 },
    { id: 'bogling', name: 'Болотник', description: 'Болотное существо', price: 55 },
    { id: 'bogwine', name: 'Болотное вино', description: 'Болотный дух', price: 60 },
    { id: 'cumulus', name: 'Кучевое облако', description: 'Облачный дух', price: 65 },
    { id: 'glistening_fish', name: 'Блестящая рыба', description: 'Сверкающая рыба', price: 70 },
    { id: 'starfish_monster', name: 'Морская звезда', description: 'Монстр-звезда', price: 75 },
    { id: 'frog_monster', name: 'Лягушка-монстр', description: 'Увеличенная лягушка', price: 80 },
    { id: 'mushroom_monster', name: 'Гриб-монстр', description: 'Живой гриб', price: 65 },
    { id: 'cactus_monster', name: 'Кактус-монстр', description: 'Колючий монстр', price: 70 },
    { id: 'plant_behemoth', name: 'Растительный бегемот', description: 'Гигантское растение', price: 85 },
    { id: 'living_boulder', name: 'Живой валун', description: 'Оживший камень', price: 90 },
    { id: 'tentacle_monster', name: 'Монстр-щупальце', description: 'Щупальцевидный монстр', price: 95 },
    { id: 'sand_worm', name: 'Песчаный червь', description: 'Песочный червь', price: 80 },
    { id: 'snow_worm', name: 'Снежный червь', description: 'Ледяной червь', price: 85 },
    { id: 'merfolk', name: 'Русалка', description: 'Морская дева', price: 100 },
    { id: 'dryad', name: 'Дриада', description: 'Лесная нимфа', price: 95 },
    { id: 'harpy', name: 'Гарпия', description: 'Крылатая гарпия', price: 110 },
    { id: 'gargoyle', name: 'Гаргулья', description: 'Каменная гаргулья', price: 105 },
    { id: 'mummy', name: 'Мумия', description: 'Древняя мумия', price: 90 },
    { id: 'troll', name: 'Тролль', description: 'Большой тролль', price: 120 },
    { id: 'griffin', name: 'Грифон', description: 'Крылатый грифон', price: 150 },
    { id: 'cockatrice', name: 'Кокатрис', description: 'Петух-дракон', price: 130 },
    { id: 'basilisk', name: 'Василиск', description: 'Король змей', price: 140 },
    { id: 'cyclops', name: 'Циклоп', description: 'Одноглазый великан', price: 160 },
    { id: 'minos', name: 'Минос', description: 'Быкоголовый воин', price: 145 },
    { id: 'tengu', name: 'Тэнгу', description: 'Японский демон', price: 135 },
    { id: 'gorgon', name: 'Горгона', description: 'Змееволосая горгона', price: 170 },
    { id: 'djinn', name: 'Джинн', description: 'Магический джинн', price: 180 },
    { id: 'kraken', name: 'Кракен', description: 'Морское чудовище', price: 200 },
    { id: 'reaper', name: 'Жнец', description: 'Жнец душ', price: 250 },
    { id: 'banshee', name: 'Банши', description: 'Плачущий дух', price: 220 },
    { id: 'wraith', name: 'Призрак', description: 'Темный призрак', price: 240 },
    { id: 'abyssal_beast', name: 'Бездонный зверь', description: 'Существо из бездны', price: 300 },
    { id: 'abyssal_dweller', name: 'Обитатель бездны', description: 'Житель глубин', price: 280 },
    { id: 'treant', name: 'Древень', description: 'Древний страж леса', price: 350 }
  ],
  mythical: [
    { id: 'dragon', name: 'Дракон', description: 'Могущественное существо', price: 500 },
    { id: 'phoenix', name: 'Феникс', description: 'Возрождающаяся птица', price: 600 },
    { id: 'unicorn', name: 'Единорог', description: 'Магический единорог', price: 550 },
    { id: 'pegasus', name: 'Пегас', description: 'Крылатый конь', price: 580 },
    { id: 'baby_dragon', name: 'Детеныш дракона', description: 'Маленький дракончик', price: 400 },
    { id: 'kitten', name: 'Котенок', description: 'Маленький котенок', price: 350 },
    { id: 'puppy', name: 'Щенок', description: 'Маленький щенок', price: 350 }
  ]
};

// Создаем новый объект питомцев
const newPets = {};

// Добавляем питомцев по редкости
Object.keys(petsData).forEach(rarity => {
  petsData[rarity].forEach(pet => {
    newPets[pet.id] = {
      id: pet.id,
      name: pet.name,
      description: pet.description,
      type: 'pet',
      rarity: rarity,
      price: {
        currency: rarity === 'mythical' ? 'gems' : 'coins',
        amount: pet.price
      },
      sellPrice: 0,
      canSell: false,
      sprite: `sprites/items/pets/${pet.id.replace(/_/g, ' ')}.png`
    };
  });
});

// Заменяем секцию питомцев в JSON
itemsData.items.pet = newPets;

// Записываем обновленный JSON файл
fs.writeFileSync(itemsPath, JSON.stringify(itemsData, null, 2), 'utf8');

console.log('✅ Все питомцы успешно добавлены в JSON файл!');
console.log(`📊 Добавлено питомцев: ${Object.keys(newPets).length}`);
console.log(`   - Обычные: ${petsData.common.length}`);
console.log(`   - Редкие: ${petsData.rare.length}`);
console.log(`   - Мистические: ${petsData.mythical.length}`); 