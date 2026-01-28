import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppLayout } from './components/layout/AppLayout';

import { DiceOverlay } from './components/overlays/DiceOverlay';

import { useEffect } from 'react';
import { initializeThreadEngine } from './core/results/threadEngine';

function App() {
  useEffect(() => {
    return initializeThreadEngine();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <DiceOverlay />
      <AppLayout />
    </DndProvider>
  );
}

export default App;
