import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppLayout } from './components/layout/AppLayout';

import { DiceOverlay } from './components/overlays/DiceOverlay';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <DiceOverlay />
      <AppLayout />
    </DndProvider>
  );
}

export default App;
