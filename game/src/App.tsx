/**
 * Main App Component
 * 
 * Routes between game screens based on phase
 */

import { GameProvider, useGame } from './app/GameProvider';
import { StartMenu } from './ui/screens/StartMenu';
import { Dashboard } from './ui/screens/Dashboard';
import { ElectionNight } from './ui/screens/ElectionNight';
import { EndingScreen } from './ui/screens/EndingScreen';
import './App.css';

function GameRouter() {
  const { state } = useGame();

  console.log('[GameRouter] Current phase:', state.phase);
  console.log('[GameRouter] Rendering screen for phase:', state.phase);

  switch (state.phase) {
    case 'menu':
      console.log('[GameRouter] Rendering StartMenu');
      return <StartMenu />;
    case 'playing':
    case 'event':
      console.log('[GameRouter] Rendering Dashboard');
      return <Dashboard />;
    case 'election':
      console.log('[GameRouter] Rendering ElectionNight');
      return <ElectionNight />;
    case 'ended':
      console.log('[GameRouter] Rendering EndingScreen');
      return <EndingScreen />;
    default:
      console.log('[GameRouter] Rendering default StartMenu');
      return <StartMenu />;
  }
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
