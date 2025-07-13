const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Запуск Love & Roll в режиме разработки...');

// Функция для проверки доступности сервера
function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Функция для ожидания сервера
async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`⏳ Ожидание сервера... (попытка ${i + 1}/${maxAttempts})`);
    const isReady = await checkServer(url);
    if (isReady) {
      console.log('✅ Сервер готов!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return false;
}

// Основная функция
async function main() {
  // Запускаем React сервер
  console.log('📦 Запуск React сервера...');
  const reactProcess = spawn('npm', ['start'], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd()
  });

  // Логируем вывод React сервера
  reactProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:')) {
      console.log('🌐 React сервер запущен на http://localhost:3000');
    }
  });

  reactProcess.stderr.on('data', (data) => {
    console.error('❌ React ошибка:', data.toString());
  });

  // Ждем запуска сервера
  const serverReady = await waitForServer('http://localhost:3000');
  
  if (!serverReady) {
    console.error('❌ Не удалось запустить сервер');
    reactProcess.kill();
    process.exit(1);
  }

  // Запускаем Electron
  console.log('⚡ Запуск Electron...');
  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Обработка закрытия процессов
  electronProcess.on('close', (code) => {
    console.log(`🔚 Electron закрыт с кодом ${code}`);
    reactProcess.kill();
    process.exit(0);
  });

  reactProcess.on('close', (code) => {
    console.log(`🔚 React сервер закрыт с кодом ${code}`);
    electronProcess.kill();
    process.exit(0);
  });

  // Обработка сигналов завершения
  process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал SIGINT, закрытие...');
    reactProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал SIGTERM, закрытие...');
    reactProcess.kill();
    electronProcess.kill();
    process.exit(0);
  });
}

// Запускаем основную функцию
main().catch((error) => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
}); 