import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const addNotificationRef = useRef(null);

  const addNotification = (type, data) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      data,
      timestamp: Date.now()
    };

    setNotifications(prev => {
      const newNotifications = [...prev, notification];
      return newNotifications;
    });

    // Автоматически удаляем уведомление через 3 секунды
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => {
      const newNotifications = prev.filter(notification => notification.id !== id);
      return newNotifications;
    });
  };

  // Сохраняем ссылку на функцию
  addNotificationRef.current = addNotification;

  // Устанавливаем функцию в window
  useEffect(() => {
    window.addNotification = (type, data) => {
      if (addNotificationRef.current) {
        addNotificationRef.current(type, data);
      }
    };

    
    return () => {
      if (window.addNotification === addNotificationRef.current) {
        window.addNotification = null;
      }
    };
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 