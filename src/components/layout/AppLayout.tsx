import { useState } from 'react';
import { ChevronLeft, ChevronRight, FolderTree, Tag, Bookmark, Dices, TentTree, Eclipse, List, Infinity, ArrowLeftToLine, ArrowRightFromLine, ArrowRightToLine, ArrowLeftFromLine, Wand2, PlayCircle, StopCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { LeftLane } from './LeftLane';
import { CenterLane } from './CenterLane';
import { RightPane } from './RightPane';
import { IconButton } from '../ui/IconButton';
import { TapestryManager } from '../tapestry/TapestryManager';
import { useTapestryStore } from '../../stores/useTapestryStore';
import { useLeftPaneStore, type LeftPaneMode } from '../../stores/useLeftPaneStore';
import { usePaneStore } from '../../stores/usePaneStore';
import { useToolStore, type RightPaneMode } from '../../stores/useToolStore';
import { useTabStore } from '../../stores/useTabStore';
import { GlobalDialogManager } from '../ui/GlobalDialogManager';
import { createNewSession } from '../../utils/sessionActions';
import { useSessionStore } from '../../stores/useSessionStore';

export function AppLayout() {
  const activeTapestryId = useTapestryStore((state) => state.activeTapestryId);
  const { isLeftPaneCollapsed, leftPaneMode, setLeftPaneMode } = useLeftPaneStore();
  const { isRightPaneCollapsed, leftPaneWidth, setLeftPaneWidth, rightPaneWidth, setRightPaneWidth } = usePaneStore();
  const { rightPaneMode, setRightPaneMode } = useToolStore();

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const leftModes: { mode: LeftPaneMode; icon: typeof FolderTree; label: string }[] = [
    { mode: 'tapestry', icon: FolderTree, label: 'Tapestry' },
    { mode: 'tags', icon: Tag, label: 'Tags' },
    { mode: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
  ];

  const rightModes: { mode: RightPaneMode; icon: typeof Dices; label: string }[] = [
    { mode: 'dice', icon: Dices, label: 'Dice' },
    { mode: 'environments', icon: TentTree, label: 'Environments' },
    { mode: 'oracles', icon: Eclipse, label: 'Oracles' },
    { mode: 'stitchboard', icon: List, label: 'Stitchboard' },
    { mode: 'weave', icon: Infinity, label: 'The Weave' },
    { mode: 'results', icon: List, label: 'Results' },
  ];

  // Show TapestryManager if no tapestry is active
  if (!activeTapestryId) {
    return <TapestryManager />;
  }

  const handleLeftMouseDown = () => {
    setIsDraggingLeft(true);
  };

  const handleRightMouseDown = () => {
    setIsDraggingRight(true);
  };

  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingLeft && !isDraggingRight) return;

    if (isDraggingLeft) {
      // 48px for left sidebar
      const newWidth = Math.max(200, Math.min(600, e.clientX - 48));
      setLeftPaneWidth(newWidth);
    } else if (isDraggingRight) {
      // 48px for right sidebar
      const rightEdge = window.innerWidth - 48;
      const newWidth = Math.max(200, Math.min(600, rightEdge - e.clientX));
      setRightPaneWidth(newWidth);
    }
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden bg-slate-950"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ userSelect: isDraggingLeft || isDraggingRight ? 'none' : 'auto' }}
    >
      <TopBar />

      {/* Main Content Area with Sidebars and Panes */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        {/* Top Toolbar Row - Collapse Buttons and Mode Switchers */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center relative flex-shrink-0 px-0">
          {/* Left Collapse Button */}
          <div className="w-12 flex items-center justify-end px-2 flex-shrink-0">
            <IconButton
              icon={isLeftPaneCollapsed ? ArrowRightFromLine : ArrowLeftToLine}
              size="m"
              active={isLeftPaneCollapsed}
              onClick={() => useLeftPaneStore.setState({ isLeftPaneCollapsed: !isLeftPaneCollapsed })}
              tooltip={isLeftPaneCollapsed ? 'Expand' : 'Collapse'}
            />
          </div>

          {/* Left Mode Switchers */}
          <div className="flex items-center gap-1 px-2 flex-shrink-0">
            {leftModes.map(({ mode, icon, label }) => (
              <IconButton
                key={mode}
                icon={icon}
                size="m"
                active={leftPaneMode === mode}
                onClick={() => setLeftPaneMode(mode)}
                tooltip={label}
              />
            ))}
          </div>

          {/* Spacer / Session Controls */}
          <div className="flex-1 flex items-center justify-center">
            <SessionControl />
          </div>

          {/* Right Mode Switchers */}
          <div className="flex items-center gap-1 px-2 flex-shrink-0">
            {rightModes.map(({ mode, icon, label }) => (
              <IconButton
                key={mode}
                icon={icon}
                size="m"
                active={rightPaneMode === mode}
                onClick={() => {
                  setRightPaneMode(mode);
                  if (mode === 'dice') {
                    useToolStore.getState().setActiveTool('dice');
                  }
                  if (isRightPaneCollapsed) {
                    usePaneStore.setState({ isRightPaneCollapsed: false });
                  }
                }}
                tooltip={label}
              />
            ))}
          </div>

          {/* Table Forge Button */}
          <div className="flex items-center px-2 flex-shrink-0">
            <IconButton
              icon={Wand2}
              size="m"
              tooltip="Table Forge"
              onClick={() => {
                const forgeTabId = `tableforge-${uuidv4()}`;
                useTabStore.getState().openTab({
                  id: forgeTabId,
                  type: 'tableforge',
                  title: 'Table Forge',
                });
              }}
            />
          </div>

          {/* Right Collapse Button */}
          <div className="w-12 flex items-center justify-start px-2 flex-shrink-0">
            <IconButton
              icon={isRightPaneCollapsed ? ArrowLeftFromLine : ArrowRightToLine}
              size="m"
              active={isRightPaneCollapsed}
              onClick={() => usePaneStore.setState({ isRightPaneCollapsed: !isRightPaneCollapsed })}
              tooltip={isRightPaneCollapsed ? 'Expand' : 'Collapse'}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative flex">
          {/* Left Vertical Toolbar */}
          <LeftSidebar />

          {/* Left Pane */}
          {!isLeftPaneCollapsed && (
            <>
              <div style={{ width: `${leftPaneWidth}px` }} className="flex-shrink-0 overflow-hidden">
                <LeftLane />
              </div>
              {/* Left Resize Handle */}
              <div
                onMouseDown={handleLeftMouseDown}
                className={`w-1 cursor-col-resize transition-colors flex-shrink-0 ${isDraggingLeft ? 'bg-purple-500' : 'bg-transparent hover:bg-transparent'
                  }`}
              />
            </>
          )}

          {/* Center Pane (Editor) - Takes remaining space */}
          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            <CenterLane />
          </div>

          {/* Right Pane */}
          {!isRightPaneCollapsed && (
            <>
              {/* Right Resize Handle */}
              <div
                onMouseDown={handleRightMouseDown}
                className={`w-1 cursor-col-resize transition-colors flex-shrink-0 ${isDraggingRight ? 'bg-purple-500' : 'bg-transparent hover:bg-transparent'
                  }`}
              />
              <div style={{ width: `${rightPaneWidth}px` }} className="flex-shrink-0 overflow-hidden">
                <RightPane />
              </div>
            </>
          )}

          {/* Right Vertical Toolbar */}
          <RightSidebar />
        </div>
      </div>

      {/* Global Dialogs */}
      <GlobalDialogManager />
    </div>
  );
}

function SessionControl() {
  const { activeSessionId, endSession } = useSessionStore();

  if (activeSessionId) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full">
        <span className="text-xs text-purple-200 animate-pulse uppercase tracking-wider font-bold">Session Active</span>
        <button
          onClick={endSession}
          className="p-1 hover:text-red-400 text-purple-300 transition-colors"
          title="End Session"
        >
          <StopCircle size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => createNewSession()}
      className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-300 hover:text-white transition-all group"
      title="Start New Session"
    >
      <PlayCircle size={16} className="text-green-500 group-hover:text-green-400" />
      <span className="text-xs font-medium">Start Session</span>
    </button>
  );
}
