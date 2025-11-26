import { ToolPanel } from '../tools/ToolPanel';
import { ResultsFullPane } from '../results/ResultsFullPane';
import { EnvironmentsPane } from '../environments/EnvironmentsPane';
import { OraclesPane } from '../oracles/OraclesPane';
import { WeaveTool } from '../tools/weave/WeaveTool';
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

      case 'weave':
        return <WeaveTool />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 border-l border-slate-800 h-full">
      {renderContent()}
    </div>
  );
}
