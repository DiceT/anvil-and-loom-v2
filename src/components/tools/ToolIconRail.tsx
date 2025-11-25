import { List } from 'lucide-react';
import { tools } from './registry';
import { IconButton } from '../ui/IconButton';
import { useToolStore } from '../../stores/useToolStore';

export function ToolIconRail() {
  const { activeTool, setActiveTool, setRightPaneMode } = useToolStore();

  const handleToolClick = (toolId: string) => {
    // Toggle: if clicking active tool, deactivate it
    if (activeTool === toolId) {
      setActiveTool(null);
    } else {
      setActiveTool(toolId);
    }
  };

  const handleResultsClick = () => {
    setRightPaneMode('results');
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
          tooltip={tool.name}
        />
      ))}
      {/* Results icon on the far right */}
      <IconButton
        icon={List}
        size="l"
        active={false}
        onClick={handleResultsClick}
        tooltip="View All Results"
      />
    </div>
  );
}
