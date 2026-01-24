import { Plus, ChevronRight, Dices } from 'lucide-react';
import { usePaneStore } from '../../stores/usePaneStore';
import { useToolStore } from '../../stores/useToolStore';
import { IconButton } from '../ui/IconButton';

export function RightSidebar() {
  const { isRightPaneCollapsed, setRightPaneCollapsed } = usePaneStore();
  const { setRightPaneMode } = useToolStore();

  const handleOpenDice = () => {
    setRightPaneMode('dice');
    if (isRightPaneCollapsed) {
      setRightPaneCollapsed(false);
    }
  };

  return (
    <div className="w-12 bg-canvas-surface border-l border-border flex flex-col items-center justify-between py-2">
      {/* Top Toolbar */}
      <div className="flex flex-col gap-1">
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
