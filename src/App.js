import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ScreenManager from './components/ScreenManager';
import LevelUpModal from './components/ui/LevelUpModal';
import { ScreenProvider } from './contexts/ScreenContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { CharacterProvider, useCharacters } from './contexts/CharacterContext';
import { DailyRewardsProvider } from './contexts/DailyRewardsContext';
import { RelationshipsProvider } from './contexts/RelationshipsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './styles/App.css';

// Компонент для экспорта контекста в глобальную область видимости
const GameContextExporter = ({ children }) => {
  const characterContext = useCharacters();
  
  React.useEffect(() => {
    // Экспортируем контекст в глобальную область видимости для тестирования
    window.gameContext = characterContext;
    window.LEVEL_SYSTEM = characterContext.LEVEL_SYSTEM;
    
    // Также экспортируем dispatch для прямого тестирования
    if (characterContext.dispatch) {
      window.gameContext.dispatch = characterContext.dispatch;
    }
    
    console.log('Контекст игры экспортирован в window.gameContext');
    console.log('Доступные методы:', Object.keys(characterContext));
  }, [characterContext]);
  
  return children;
};

function App() {
  return (
    <Router>
      <ScreenProvider>
        <CurrencyProvider>
          <InventoryProvider>
            <CharacterProvider>
              <RelationshipsProvider>
                <NotificationProvider>
                  <GameContextExporter>
                    <DailyRewardsProvider>
                      <div className="App">
                        <ScreenManager />
                        <LevelUpModal />
                      </div>
                    </DailyRewardsProvider>
                  </GameContextExporter>
                </NotificationProvider>
              </RelationshipsProvider>
            </CharacterProvider>
          </InventoryProvider>
        </CurrencyProvider>
      </ScreenProvider>
    </Router>
  );
}

export default App; 