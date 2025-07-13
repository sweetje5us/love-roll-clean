const fs = require('fs');
const path = require('path');

// Функция для проверки сцены
function checkScene(scenePath) {
  try {
    const sceneData = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
    const sceneId = sceneData.id;
    
    let issues = [];
    
    // Проверяем chapterId
    if (sceneData.chapterId !== 5) {
      issues.push(`chapterId должен быть 5, а не ${sceneData.chapterId}`);
    }
    
    // Проверяем ID выборов
    if (sceneData.choices && Array.isArray(sceneData.choices)) {
      sceneData.choices.forEach((choice, index) => {
        if (!choice.id) {
          issues.push(`Выбор ${index + 1} не имеет ID`);
        } else if (!choice.id.startsWith(sceneId)) {
          issues.push(`ID выбора ${index + 1} должен начинаться с ${sceneId}_`);
        }
      });
    }
    
    if (issues.length === 0) {
      console.log(`✓ Сцена ${sceneId} в порядке`);
    } else {
      console.log(`⚠ Сцена ${sceneId} имеет проблемы:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return issues.length === 0;
  } catch (error) {
    console.error(`Ошибка при проверке ${scenePath}:`, error.message);
    return false;
  }
}

// Сцены главы 5
const chapter5Scenes = [
  'scene76.json', 'scene77.json', 'scene79.json', 'scene80.json',
  'scene81.json', 'scene82.json', 'scene83.json', 'scene84.json', 'scene85.json',
  'scene86.json', 'scene87.json', 'scene88.json', 'scene89.json', 'scene90.json', 'scene91.json'
];

const scenesDir = path.join(__dirname, 'public', 'episodes', 'tutorial', 'scenes');

console.log('Проверка сцен главы 5...\n');

let allGood = true;
chapter5Scenes.forEach(sceneFile => {
  const scenePath = path.join(scenesDir, sceneFile);
  if (fs.existsSync(scenePath)) {
    if (!checkScene(scenePath)) {
      allGood = false;
    }
  } else {
    console.log(`⚠ Сцена ${sceneFile} не найдена`);
    allGood = false;
  }
});

console.log('\n' + (allGood ? '✓ Все сцены главы 5 в порядке!' : '⚠ Есть проблемы в сценах главы 5')); 