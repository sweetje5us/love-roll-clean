import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets } from '../../contexts/PetContext';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const { notifications, removeNotification } = usePets();

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach(notification => {
        if (notification.duration) {
          setTimeout(() => {
            removeNotification(notification.id);
          }, notification.duration);
        }
      });
    }
  }, [notifications, removeNotification]);

  return (
    <div className="notification-container">
      <AnimatePresence>
        {notifications && notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="notification-icon">
              <i className={notification.icon}></i>
            </div>
            <div className="notification-content">
              <div className="notification-message">{notification.message}</div>
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