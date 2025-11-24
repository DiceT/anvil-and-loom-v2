import { ToolIconRail } from '../tools/ToolIconRail';
import { ToolPanel } from '../tools/ToolPanel';
import { ResultsHistory } from '../results/ResultsHistory';
import { GlobalLastResult } from '../results/GlobalLastResult';

export function RightLane() {
  return (
    <div className="bg-slate-900 border-l border-slate-800 flex flex-col h-full">
      <div className="px-3 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">
          Tools & Results
        </h2>
        <ToolIconRail />
      </div>

      <ToolPanel />

      <ResultsHistory />

      <GlobalLastResult />
    </div>
  );
}
