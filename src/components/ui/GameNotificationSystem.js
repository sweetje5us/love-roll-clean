import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../contexts/NotificationContext';
import './GameNotificationSystem.css';

const GameNotificationSystem = () => {
  const { notifications, removeNotification } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'item_received':
        return '🎁';
      case 'quest_item_received':
        return '🗝️';
      case 'item_removed':
        return '❌';
      case 'quest_item_removed':
        return '🗑️';
      case 'relationship_positive':
        return '❤️';
      case 'relationship_negative':
        return '💔';
      case 'important_choice':
        return '⭐';
      case 'experience_gained':
        return '🎯';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'item_received':
      case 'quest_item_received':
      case 'relationship_positive':
      case 'experience_gained':
        return 'success';
      case 'item_removed':
      case 'quest_item_removed':
      case 'relationship_negative':
        return 'error';
      case 'important_choice':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="game-notification-container">
      <AnimatePresence>
        {notifications && notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`game-notification game-notification-${getNotificationClass(notification.type)}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="game-notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="game-notification-content">
              <div className="game-notification-message">
                {notification.data?.message || 'Уведомление'}
              </div>
            </div>
            <button 
              className="game-notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GameNotificationSystem; 