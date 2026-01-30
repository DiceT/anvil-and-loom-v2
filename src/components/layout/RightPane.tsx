import { ToolPanel } from '../tools/ToolPanel';
import { SessionTimeline } from '../session/SessionTimeline';
import { Stitchboard } from '../stitches/Stitchboard';
import { WeavePanel } from '../weave/WeavePanel';
import { EnvironmentFileTree } from '../environment/EnvironmentFileTree';
import { DmChatPanel } from '../dm-chat/DmChatPanel';
import { CurationPanel } from '../session/CurationPanel';
import { useToolStore } from '../../stores/useToolStore';


export function RightPane() {
  const { rightPaneMode } = useToolStore();

  const renderContent = () => {
    switch (rightPaneMode) {
      case 'dice':
        return <ToolPanel />;
      case 'results':
        return <SessionTimeline className="h-full" />;

      case 'stitchboard':
        return <Stitchboard />;
      case 'weave':
        return <WeavePanel />;
      case 'environment':
        return <EnvironmentFileTree />;
      case 'dm-chat':
        return <DmChatPanel />;
      case 'session':
        return <CurationPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col overflow-hidden">
      {/* Pane Content Area - scrollable */}
      <div className="flex-1 min-h-0 overflow-hidden bg-slate-900">
        {renderContent()}
      </div>
    </div>
  );
}

