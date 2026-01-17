import { FolderTree, Tag, Bookmark, Dices, List, Infinity } from 'lucide-react';
import { useLeftPaneStore, type LeftPaneMode } from '../../stores/useLeftPaneStore';
import { useToolStore, type RightPaneMode } from '../../stores/useToolStore';
import { IconButton } from '../ui/IconButton';

export function TopToolbar() {
  const { leftPaneMode, setLeftPaneMode } = useLeftPaneStore();
  const { rightPaneMode, setRightPaneMode } = useToolStore();

  const leftModes: { mode: LeftPaneMode; icon: typeof FolderTree; label: string }[] = [
    { mode: 'tapestry', icon: FolderTree, label: 'Tapestry' },
    { mode: 'tags', icon: Tag, label: 'Tags' },
    { mode: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  ];

  const rightModes: { mode: RightPaneMode; icon: typeof Dices; label: string }[] = [
    { mode: 'dice', icon: Dices, label: 'Dice' },
    { mode: 'stitchboard', icon: List, label: 'Stitchboard' },
    { mode: 'results', icon: List, label: 'Results' },
    { mode: 'weave', icon: Infinity, label: 'Weave' },
  ];

  return (
    <div className="h-10 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between gap-4 relative z-10">
      {/* Left Panel Mode Switcher */}
      <div className="flex items-center gap-1">
        {leftModes.map(({ mode, icon, label }) => (
          <IconButton
            key={mode}
            icon={icon}
            size="s"
            active={leftPaneMode === mode}
            onClick={() => setLeftPaneMode(mode)}
            tooltip={label}
          />
        ))}
      </div>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right Panel Mode Switcher */}
      <div className="flex items-center gap-1">
        {rightModes.map(({ mode, icon, label }) => (
          <IconButton
            key={mode}
            icon={icon}
            size="s"
            active={rightPaneMode === mode}
            onClick={() => setRightPaneMode(mode)}
            tooltip={label}
          />
        ))}
      </div>
    </div>
  );
}
