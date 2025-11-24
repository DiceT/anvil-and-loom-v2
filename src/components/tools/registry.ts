import { LucideIcon, Dices } from 'lucide-react';
import { ComponentType } from 'react';

export interface ToolConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  component: ComponentType;
}

// Import tool components (will be added as we build them)
import { DiceTool } from './dice/DiceTool';

export const tools: ToolConfig[] = [
  {
    id: 'dice',
    name: 'Dice',
    icon: Dices,
    component: DiceTool,
  },
  // More tools will be added here:
  // { id: 'environments', name: 'Environments', icon: Mountain, component: EnvironmentsTool },
  // { id: 'oracles', name: 'Oracles', icon: Eye, component: OraclesTool },
  // { id: 'ai', name: 'AI', icon: Sparkles, component: AITool },
];
