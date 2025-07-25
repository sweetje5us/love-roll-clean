// Тест кастомных квестовых предметов
const fs = require('fs');
const path = require('path');

// Загружаем данные предметов
const itemsData = JSON.parse(fs.readFileSync('./src/data/items.json', 'utf8'));

console.log('=== ТЕСТ КАСТОМНЫХ КВЕСТОВЫХ ПРЕДМЕТОВ ===');

// Тест 1: Проверка структуры квестовых предметов в items.json
console.log('\n1. Проверка квестовых предметов в items.json:');
const questItems = Object.values(itemsData.items.quest || {});
console.log(`Найдено квестовых предметов: ${questItems.length}`);

// Проверяем структуру первого квестового предмета
if (questItems.length > 0) {
  const firstQuestItem = questItems[0];
  console.log('\nСтруктура первого квестового предмета:');
  console.log('ID:', firstQuestItem.id);
  console.log('Название:', firstQuestItem.name);
  console.log('Описание:', firstQuestItem.description);
  console.log('Тип:', firstQuestItem.type);
  console.log('Редкость:', firstQuestItem.rarity);
  console.log('Спрайт:', firstQuestItem.sprite);
  console.log('Есть цена:', firstQuestItem.price ? 'ДА' : 'НЕТ');
  console.log('Можно продать:', firstQuestItem.canSell ? 'ДА' : 'НЕТ');
}

// Тест 2: Проверка типов предметов
console.log('\n2. Проверка типов предметов:');
Object.keys(itemsData.types).forEach(type => {
  console.log(`- ${type}: ${itemsData.types[type].name}`);
});

// Тест 3: Проверка наличия категории quest
console.log('\n3. Проверка категории quest:');
console.log('Категория quest существует:', !!itemsData.items.quest);
console.log('Количество предметов в quest:', Object.keys(itemsData.items.quest || {}).length);

// Тест 4: Проверка отсутствия категории special
console.log('\n4. Проверка отсутствия категории special:');
console.log('Категория special существует:', !!itemsData.items.special);
console.log('Количество предметов в special:', Object.keys(itemsData.items.special || {}).length);

console.log('\n=== ТЕСТ ЗАВЕРШЕН ==='); 