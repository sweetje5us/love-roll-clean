const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let isDev = false;

async function createWindow() {
  // Динамический импорт electron-is-dev
  try {
    isDev = (await import('electron-is-dev')).default;
  } catch {
    isDev = false;
  }

  // Создаем окно браузера
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Love & Roll',
    show: false
  });

  // Загружаем приложение
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  console.log('Загружаем URL:', startUrl);

  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Ошибка загрузки URL:', err);
    mainWindow.loadURL(`data:text/html,<html><body><h1>Ошибка загрузки</h1><p>${err.message}</p><p>URL: ${startUrl}</p></body></html>`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Ошибка загрузки страницы:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.on('closed', () => {
    app.quit();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function createMenu() {
  const template = [
    {
      label: 'Файл',
      submenu: [
        {
          label: 'Выход',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(async () => {
  await createWindow();
  createMenu();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
}); 