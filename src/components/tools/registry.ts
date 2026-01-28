import { LucideIcon, Dices } from 'lucide-react';
import { ComponentType } from 'react';
import { DiceTool } from './dice/DiceTool';
import { MessageSquare } from 'lucide-react';
import { DmChatPanel } from '../dm-chat/DmChatPanel';

export interface ToolConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  component: ComponentType;
}

// Tool registry - tools that appear in the icon rail
export const tools: ToolConfig[] = [
  {
    id: 'dice',
    name: 'Dice',
    icon: Dices,
    component: DiceTool,
  },
  {
    id: 'dm-chat',
    name: 'DM Chat',
    icon: MessageSquare,
    component: DmChatPanel,
  },
];
