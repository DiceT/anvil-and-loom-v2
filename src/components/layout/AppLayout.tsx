import { TopBar } from './TopBar';
import { LeftLane } from './LeftLane';
import { CenterLane } from './CenterLane';
import { RightLane } from './RightLane';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <LeftLane />
        </div>
        <div className="flex-1">
          <CenterLane />
        </div>
        <div className="w-80 flex-shrink-0">
          <RightLane />
        </div>
      </div>
    </div>
  );
}
