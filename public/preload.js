const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем безопасные API для рендерер процесса
contextBridge.exposeInMainWorld('electronAPI', {
  // Здесь можно добавить функции для взаимодействия с основным процессом
  // Например, для сохранения файлов, работы с файловой системой и т.д.
  
  // Пример функции для получения версии приложения
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Пример функции для показа диалога сохранения
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Пример функции для показа диалога открытия
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options)
}); 