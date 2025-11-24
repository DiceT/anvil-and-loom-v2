import { tools } from './registry';
import { useToolStore } from '../../stores/useToolStore';

export function ToolPanel() {
  const activeTool = useToolStore((state) => state.activeTool);

  if (!activeTool) {
    return (
      <div className="px-3 py-4 text-sm text-slate-500 text-center">
        Select a tool from the icons above
      </div>
    );
  }

  const tool = tools.find((t) => t.id === activeTool);

  if (!tool) {
    return (
      <div className="px-3 py-4 text-sm text-slate-500 text-center">
        Tool not found
      </div>
    );
  }

  const ToolComponent = tool.component;

  return (
    <div className="bg-slate-850 border-y border-slate-800 px-3 py-3 mb-3">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">{tool.name}</h3>
      <ToolComponent />
    </div>
  );
}
