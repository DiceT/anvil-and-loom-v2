import { TopBar } from './TopBar';
import { LeftLane } from './LeftLane';
import { CenterLane } from './CenterLane';
import { RightLane } from './RightLane';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex">
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <LeftLane />
        </div>
        <div className="flex-1 overflow-hidden">
          <CenterLane />
        </div>
        <div className="w-80 flex-shrink-0 overflow-visible">
          <RightLane />
        </div>
      </div>
    </div>
  );
}
