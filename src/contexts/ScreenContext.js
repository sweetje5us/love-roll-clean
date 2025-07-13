import React, { createContext, useContext, useReducer } from 'react';

// Типы экранов
export const SCREEN_TYPES = {
  MAIN_MENU: 'MAIN_MENU',
  GAME: 'GAME',
  SHOP: 'SHOP',
  COLLECTION: 'COLLECTION',
  CHARACTER_CREATOR: 'CHARACTER_CREATOR',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  EPISODE_SELECT: 'EPISODE_SELECT',
  SETTINGS: 'SETTINGS',
  LOADING: 'LOADING'
};

// Начальное состояние
const initialState = {
  currentScreen: SCREEN_TYPES.MAIN_MENU,
  previousScreen: null,
  screenHistory: [SCREEN_TYPES.MAIN_MENU],
  navigationParams: {},
  isLoading: false,
  transitionType: 'fade' // fade, slide, scale
};

// Типы действий
const ACTION_TYPES = {
  NAVIGATE_TO: 'NAVIGATE_TO',
  GO_BACK: 'GO_BACK',
  SET_LOADING: 'SET_LOADING',
  SET_TRANSITION: 'SET_TRANSITION'
};

// Редьюсер
const screenReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.NAVIGATE_TO:
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: action.payload.screen,
        screenHistory: [...state.screenHistory, action.payload.screen],
        navigationParams: action.payload.params || {},
        transitionType: action.payload.transition || 'fade'
      };
    
    case ACTION_TYPES.GO_BACK:
      const newHistory = [...state.screenHistory];
      newHistory.pop(); // Удаляем текущий экран
      const previousScreen = newHistory[newHistory.length - 1] || SCREEN_TYPES.MAIN_MENU;
      
      return {
        ...state,
        previousScreen: state.currentScreen,
        currentScreen: previousScreen,
        screenHistory: newHistory,
        transitionType: 'slide'
      };
    
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case ACTION_TYPES.SET_TRANSITION:
      return {
        ...state,
        transitionType: action.payload
      };
    
    default:
      return state;
  }
};

// Создание контекста
const ScreenContext = createContext();

// Провайдер контекста
export const ScreenProvider = ({ children }) => {
  const [state, dispatch] = useReducer(screenReducer, initialState);

  // Функции для навигации
  const navigateTo = (screen, params = {}, transition = 'fade') => {
    dispatch({
      type: ACTION_TYPES.NAVIGATE_TO,
      payload: { screen, params, transition }
    });
  };

  const goBack = () => {
    if (state.screenHistory.length > 1) {
      dispatch({ type: ACTION_TYPES.GO_BACK });
    }
  };

  const setLoading = (isLoading) => {
    dispatch({
      type: ACTION_TYPES.SET_LOADING,
      payload: isLoading
    });
  };

  const setTransition = (transitionType) => {
    dispatch({
      type: ACTION_TYPES.SET_TRANSITION,
      payload: transitionType
    });
  };

  const value = {
    ...state,
    navigateTo,
    goBack,
    setLoading,
    setTransition,
    getNavigationParams: () => state.navigationParams
  };

  return (
    <ScreenContext.Provider value={value}>
      {children}
    </ScreenContext.Provider>
  );
};

// Хук для использования контекста
export const useScreen = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen должен использоваться внутри ScreenProvider');
  }
  return context;
}; 