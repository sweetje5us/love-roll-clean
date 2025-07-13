const { spawn } = require('child_process');
const path = require('path');

const reactScriptsPath = path.join(__dirname, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');

console.log('Запуск React приложения...');
console.log('Путь к react-scripts:', reactScriptsPath);

const child = spawn('node', [reactScriptsPath, 'start'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Ошибка запуска:', error);
});

child.on('close', (code) => {
  console.log(`Процесс завершен с кодом ${code}`);
}); 