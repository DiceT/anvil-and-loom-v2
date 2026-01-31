import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppLayout } from './components/layout/AppLayout';

import { DiceOverlay } from './components/overlays/DiceOverlay';
import { AppInitializer } from './components/init/AppInitializer';
import { diceEngine } from './integrations/anvil-dice-app'; // Add explicit import to force bundle


function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      {/* AppInitializer handles splash screen and global setup */}
      <AppInitializer>
        <DiceOverlay />
        <AppLayout />
      </AppInitializer>
    </DndProvider>
  );
}

export default App;
