import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/mobile-performance.css';
import { initializeCordovaOptimizations } from './utils/cordovaUtils';

// Асинхронная инициализация с определением частоты экрана
const initializeApp = async () => {
  // Инициализируем оптимизации для Cordova (включая определение частоты экрана)
  await initializeCordovaOptimizations();
  
  // Запускаем React приложение после инициализации
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Запускаем инициализацию
initializeApp().catch(error => {
  console.error('Ошибка инициализации приложения:', error);
  
  // Запускаем приложение без оптимизаций в случае ошибки
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}); 