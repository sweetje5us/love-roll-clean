import React from 'react';
import { motion } from 'framer-motion';

const MenuButton = ({ icon, text, color, hoverColor, onClick }) => {
  return (
    <motion.button
      className={`menu-button menu-button-${color}`}
      onClick={onClick}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 17
      }}
    >
      <i className={`${icon} menu-button-icon`}></i>
      {text}
    </motion.button>
  );
};

export default MenuButton; 