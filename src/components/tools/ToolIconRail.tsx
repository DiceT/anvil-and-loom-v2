import { tools } from './registry';
import { IconButton } from '../ui/IconButton';
import { useToolStore } from '../../stores/useToolStore';

export function ToolIconRail() {
  const { activeTool, setActiveTool } = useToolStore();

  const handleToolClick = (toolId: string) => {
    // Toggle: if clicking active tool, deactivate it
    if (activeTool === toolId) {
      setActiveTool(null);
    } else {
      setActiveTool(toolId);
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      {tools.map((tool) => (
        <IconButton
          key={tool.id}
          icon={tool.icon}
          size="l"
          active={activeTool === tool.id}
          onClick={() => handleToolClick(tool.id)}
          title={tool.name}
        />
      ))}
    </div>
  );
}
