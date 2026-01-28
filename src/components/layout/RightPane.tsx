import { ToolPanel } from '../tools/ToolPanel';
import { ThreadsFullPane } from '../results/ThreadsFullPane';
import { GlobalLastThread } from '../results/GlobalLastThread';
import { Stitchboard } from '../stitches/Stitchboard';
import { WeavePanel } from '../weave/WeavePanel';
import { EnvironmentFileTree } from '../environment/EnvironmentFileTree';
import { DmChatPanel } from '../dm-chat/DmChatPanel';
import { useToolStore } from '../../stores/useToolStore';

export function RightPane() {
  const { rightPaneMode } = useToolStore();

  const renderContent = () => {
    switch (rightPaneMode) {
      case 'dice':
        return <ToolPanel />;
      case 'results':
        return <ThreadsFullPane />;
      case 'stitchboard':
        return <Stitchboard />;
      case 'weave':
        return <WeavePanel />;
      case 'environment':
        return <EnvironmentFileTree />;
      case 'dm-chat':
        return <DmChatPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col overflow-hidden">
      {/* Pane Content Area - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
        {renderContent()}
      </div>

      {/* Last Thread - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-800">
        <GlobalLastThread />
      </div>
    </div>
  );
}
