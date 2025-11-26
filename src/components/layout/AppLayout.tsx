import { TopBar } from './TopBar';
import { LeftLane } from './LeftLane';
import { CenterLane } from './CenterLane';
import { RightLane } from './RightLane';
import { GlobalLastResult } from '../results/GlobalLastResult';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <LeftLane />
        </div>
        <div className="flex-1 overflow-hidden">
          <CenterLane />
        </div>
        <div className="w-80 flex-shrink-0 overflow-visible flex flex-col">
          {/* Tool Panes Area - scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
            <RightLane />
          </div>
          {/* Last Result - Fixed Status Bar */}
          <div className="flex-shrink-0 border-t border-slate-800">
            <GlobalLastResult />
          </div>
        </div>
      </div>
    </div>
  );
}
