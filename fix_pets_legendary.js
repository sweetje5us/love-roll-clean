const fs = require('fs');
const path = require('path');

const itemsPath = path.join(__dirname, 'src', 'data', 'items.json');
const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Список несуществующих питомцев
const toRemove = [
  'phoenix', 'unicorn', 'pegasus', 'baby_dragon', 'kitten', 'puppy'
];

// Список новых legendary
const legendary = [
  'dragon', 'griffin', 'gorgon', 'djinn', 'kraken',
  'reaper', 'banshee', 'wraith', 'treant', 'abyssal_beast'
];

// Минимальная цена для питомцев за золото
const minGold = 100;

const pets = itemsData.items.pet;
const newPets = {};

Object.values(pets).forEach(pet => {
  // Удаляем несуществующих
  if (toRemove.includes(pet.id)) return;

  // Legendary
  if (legendary.includes(pet.id)) {
    pet.rarity = 'legendary';
    pet.price = { currency: 'gems', amount: Math.max(300, pet.price.amount * 2) };
  }

  // Mythical (оставляем только для тех, кто был)
  if (pet.rarity === 'mythical' && !legendary.includes(pet.id)) {
    pet.price = { currency: 'gems', amount: Math.max(200, pet.price.amount) };
  }

  // Остальные питомцы за золото — цена от 100
  if (pet.price.currency === 'coins') {
    let base = Math.max(minGold, Math.round(pet.price.amount * 2.5));
    // rare — чуть дороже
    if (pet.rarity === 'rare') base = Math.round(base * 1.2);
    pet.price.amount = base;
  }

  newPets[pet.id] = pet;
});

itemsData.items.pet = newPets;
fs.writeFileSync(itemsPath, JSON.stringify(itemsData, null, 2), 'utf8');

console.log('✅ Питомцы обновлены!');
console.log('Legendary:', legendary.join(', ')); 