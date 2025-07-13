import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationSystem.css';

const NotificationSystem = ({ hasChoices = false }) => {
  const { notifications, removeNotification } = useNotifications();
  const [position, setPosition] = React.useState('bottom'); // 'bottom' или 'top'
  
  // Автоматически переключаем позицию в зависимости от наличия вариантов выбора
  useEffect(() => {
    setPosition(hasChoices ? 'top' : 'bottom');
  }, [hasChoices]);
  
  return (
    <div className={`notification-container notification-${position}`} style={{ zIndex: 10000 }}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ zIndex: 10001 }}
          >
            <div className="notification-icon">
              {notification.type === 'relationship_positive' && <i className="fas fa-heart"></i>}
              {notification.type === 'relationship_negative' && <i className="fas fa-heart-broken"></i>}
              {notification.type === 'important_choice' && <i className="fas fa-star"></i>}
              {notification.type === 'item_received' && <i className="fas fa-gift"></i>}
              {notification.type === 'item_removed' && <i className="fas fa-minus-circle"></i>}
              {notification.type === 'experience_gained' && <i className="fas fa-star"></i>}
            </div>
            <div className="notification-content">
              <div className="notification-text">{notification.data.message}</div>
              {notification.data.characterName && (
                <div className="notification-character">{notification.data.characterName}</div>
              )}
            </div>
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              <i className="fas fa-times"></i>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem; 