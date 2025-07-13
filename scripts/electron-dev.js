const { spawn } = require('child_process');
const { createServer } = require('http');

// Функция для проверки доступности сервера
function waitForServer(url, callback) {
  const checkServer = () => {
    const req = require('http').get(url, (res) => {
      if (res.statusCode === 200) {
        callback();
      } else {
        setTimeout(checkServer, 1000);
      }
    });
    
    req.on('error', () => {
      setTimeout(checkServer, 1000);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      setTimeout(checkServer, 1000);
    });
  };
  
  checkServer();
}

// Запускаем React сервер
console.log('Запуск React сервера...');
const reactProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Ждем запуска сервера и запускаем Electron
setTimeout(() => {
  waitForServer('http://localhost:3000', () => {
    console.log('React сервер запущен, запуск Electron...');
    
    const electronProcess = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    // Обработка закрытия процессов
    electronProcess.on('close', () => {
      console.log('Electron закрыт');
      reactProcess.kill();
      process.exit(0);
    });
    
    reactProcess.on('close', () => {
      console.log('React сервер закрыт');
      electronProcess.kill();
      process.exit(0);
    });
  });
}, 3000);

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT, закрытие процессов...');
  reactProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM, закрытие процессов...');
  reactProcess.kill();
  process.exit(0);
}); 