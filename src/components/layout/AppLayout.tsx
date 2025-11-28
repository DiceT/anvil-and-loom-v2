import { TopBar } from './TopBar';
import { DockContainer } from '../docking/DockContainer';
import { TapestryManager } from '../tapestry/TapestryManager';
import { useTapestryStore } from '../../stores/useTapestryStore';

export function AppLayout() {
  const activeTapestryId = useTapestryStore((state) => state.activeTapestryId);

  // Show TapestryManager if no tapestry is active
  if (!activeTapestryId) {
    return <TapestryManager />;
  }

  // Show main app with docking system
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-950">
      <TopBar />

      {/* Main Docking Area */}
      <div className="flex-1 min-h-0 relative">
        <DockContainer />
      </div>
    </div>
  );
}
