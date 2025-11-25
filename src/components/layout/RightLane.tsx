import { ToolPanel } from '../tools/ToolPanel';
import { GlobalLastResult } from '../results/GlobalLastResult';
import { ResultsFullPane } from '../results/ResultsFullPane';
import { EnvironmentsPane } from '../environments/EnvironmentsPane';
import { OraclesPane } from '../oracles/OraclesPane';
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
        return <ResultsFullPane />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col relative">
      {/* Scrollable Content Area - fills space, scrolls independently */}
      <div className="flex-1 overflow-y-auto app-scroll min-h-0">
        {renderContent()}
      </div>

      {/* Last Result (independent window at bottom - always visible) */}
      <div className="flex-shrink-0 border-t border-slate-800">
        <GlobalLastResult />
      </div>
    </div>
  );
}
