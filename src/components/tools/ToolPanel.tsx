import { tools } from './registry';
import { useToolStore } from '../../stores/useToolStore';

export function ToolPanel() {
  const activeTool = useToolStore((state) => state.activeTool);

  if (!activeTool) {
    return null;
  }

  const tool = tools.find((t) => t.id === activeTool);

  if (!tool) {
    return null;
  }

  const ToolComponent = tool.component;

  return (
    <div className="bg-slate-850 border-y border-slate-800 px-3 py-2">
      <ToolComponent />
    </div>
  );
}
