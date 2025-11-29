import { ToolPanel } from '../tools/ToolPanel';
import { ThreadsFullPane } from '../results/ThreadsFullPane';
import { EnvironmentsPane } from '../environments/EnvironmentsPane';
import { OraclesPane } from '../oracles/OraclesPane';
import { WeaveTool } from '../tools/weave/WeaveTool';
import { GlobalLastThread } from '../results/GlobalLastThread';
import { useToolStore } from '../../stores/useToolStore';

export function RightLane() {
  const { rightPaneMode } = useToolStore();

  const renderContent = () => {
    switch (rightPaneMode) {
      case 'dice':
        return <ToolPanel />;

      case 'environments':
        return <EnvironmentsPane />;

      case 'oracles':
        return <OraclesPane />;

      case 'results':
        return <ThreadsFullPane />;

      case 'weave':
        return <WeaveTool />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col">
      {/* Tool Panes Area - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
        {renderContent()}
      </div>

      {/* Last Thread - Fixed at bottom of Tools panel */}
      <div className="flex-shrink-0 border-t border-slate-800">
        <GlobalLastThread />
      </div>
    </div>
  );
}
