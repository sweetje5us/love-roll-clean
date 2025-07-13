// Список доступных питомцев для ежедневных наград (используем реальные ID из JSON)
export const getRandomPetForReward = () => {
  const availablePets = [
    // Common
    'slime', 'rat', 'frog', 'fish', 'sheep', 'turtle', 'crab', 'spider', 'snake', 'bat',
    'monkey', 'fox', 'wolf', 'plant', 'scallop',
    // Rare
    'fairy', 'big_slime', 'fire_slime', 'nature_slime', 'thunder_slime', 'frost_sprite',
    'fire_wisp', 'will_o_wisp', 'whispering_wisp', 'plant_sprite', 'fluffy_bear',
    'horned_rabbit', 'tiger', 'crocodile', 'shark', 'raven', 'goblin', 'goblin_swordfighter',
    'red_imp', 'black_imp', 'golem', 'clay_golem', 'automaton_fighter', 'cyber_minibot',
    'cyber_unit', 'cyber_fighter', 'fire_robot', 'ice_robot', 'jellyfish', 'scorpion',
    'wasp', 'salamander', 'tortoise', 'viper', 'shadow', 'spirit', 'bogling', 'bogwine',
    'cumulus', 'glistening_fish', 'starfish_monster', 'frog_monster', 'mushroom_monster',
    'cactus_monster', 'plant_behemoth', 'living_boulder', 'tentacle_monster', 'sand_worm',
    'snow_worm', 'merfolk', 'dryad', 'harpy', 'gargoyle', 'mummy', 'troll', 'griffin',
    'cockatrice', 'basilisk', 'cyclops', 'minos', 'tengu', 'gorgon', 'djinn', 'kraken',
    'reaper', 'banshee', 'wraith', 'abyssal_beast', 'abyssal_dweller', 'treant',
    // Mythical
    'dragon', 'phoenix', 'unicorn', 'pegasus', 'baby_dragon', 'kitten', 'puppy'
  ];
  
  return availablePets[Math.floor(Math.random() * availablePets.length)];
};

// Получить список питомцев по редкости (используем реальные ID из JSON)
export const getPetsByRarity = (rarity) => {
  const petsByRarity = {
    common: ['slime', 'rat', 'frog', 'fish', 'sheep', 'turtle', 'crab', 'spider', 'snake', 'bat', 'monkey', 'fox', 'wolf', 'plant', 'scallop'],
    rare: ['fairy', 'big_slime', 'fire_slime', 'nature_slime', 'thunder_slime', 'frost_sprite', 'fire_wisp', 'will_o_wisp', 'whispering_wisp', 'plant_sprite', 'fluffy_bear', 'horned_rabbit', 'tiger', 'crocodile', 'shark', 'raven', 'goblin', 'goblin_swordfighter', 'red_imp', 'black_imp', 'golem', 'clay_golem', 'automaton_fighter', 'cyber_minibot', 'cyber_unit', 'cyber_fighter', 'fire_robot', 'ice_robot', 'jellyfish', 'scorpion', 'wasp', 'salamander', 'tortoise', 'viper', 'shadow', 'spirit', 'bogling', 'bogwine', 'cumulus', 'glistening_fish', 'starfish_monster', 'frog_monster', 'mushroom_monster', 'cactus_monster', 'plant_behemoth', 'living_boulder', 'tentacle_monster', 'sand_worm', 'snow_worm', 'merfolk', 'dryad', 'harpy', 'gargoyle', 'mummy', 'troll', 'griffin', 'cockatrice', 'basilisk', 'cyclops', 'minos', 'tengu', 'gorgon', 'djinn', 'kraken', 'reaper', 'banshee', 'wraith', 'abyssal_beast', 'abyssal_dweller', 'treant'],
    mythical: ['dragon', 'phoenix', 'unicorn', 'pegasus', 'baby_dragon', 'kitten', 'puppy']
  };
  
  return petsByRarity[rarity] || [];
};

// Получить случайного питомца определенной редкости
export const getRandomPetByRarity = (rarity) => {
  const pets = getPetsByRarity(rarity);
  if (pets.length === 0) return 'slime'; // fallback на слайма
  
  return pets[Math.floor(Math.random() * pets.length)];
};

// Цвет для типа способности питомца
export function getPetSpecialColor(type) {
  switch (type) {
    case 'stat': return '#4ade80'; // зелёный
    case 'cube': return '#60a5fa'; // синий
    case 'heal': return '#fbbf24'; // жёлтый
    case 'exp': return '#a78bfa'; // фиолетовый
    default: return '#ff8cc6'; // розовый по умолчанию
  }
}

// Иконка для типа способности питомца
export function getPetSpecialIcon(type) {
  switch (type) {
    case 'stat': return <i className="fas fa-chart-bar"></i>;
    case 'cube': return <i className="fas fa-dice-d20"></i>;
    case 'heal': return <i className="fas fa-heart"></i>;
    case 'exp': return <i className="fas fa-star"></i>;
    default: return <i className="fas fa-paw"></i>;
  }
}

// Текстовое описание способности питомца
export function getPetSpecialText(pet) {
  if (!pet || !pet.special) return '';
  const { type, stat_type, bonus, modificator, value } = pet.special;
  switch (type) {
    case 'stat':
      return `+${bonus} к характеристике: ${stat_type}`;
    case 'cube':
      return `+${modificator || 1} к броскам кубика`;
    case 'heal':
      return `Восстанавливает ${value || 10} HP`;
    case 'exp':
      return `+${value || 10} опыта за бой`;
    default:
      return 'Особая способность';
  }
} 