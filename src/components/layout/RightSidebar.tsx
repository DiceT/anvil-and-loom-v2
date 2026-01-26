import { Plus, Disc } from 'lucide-react';
import { useToolStore } from '../../stores/useToolStore';
import { IconButton } from '../ui/IconButton';

export function RightSidebar() {


  return (
    <div className="w-12 bg-canvas-surface border-l border-border flex flex-col items-center justify-between py-2">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-1">
        <IconButton
          icon={Disc}
          size="m"
          active={useToolStore((state) => state.isRingOpen)}
          onClick={useToolStore.getState().toggleRing}
          tooltip="The Ring"
        />
        <IconButton
          icon={Plus}
          size="m"
          tooltip="New Tool/Panel"
          onClick={() => {
            // New tool/panel creation will be handled here
          }}
        />
      </div>

    </div>
  );
}
