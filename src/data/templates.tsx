import { Castle, BookOpen, MapPin, User, Shield, Gem, FileQuestion, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface PanelTemplate {
    id: string;
    label: string;
    icon: LucideIcon;
    type: 'entry'; // Filesystem type
    subtype: 'session' | 'place' | 'npc' | 'faction' | 'relic' | 'dungeon' | 'lore' | 'map' | 'other' | 'generic'; // Content type
    defaultTitle: string;
    description: string;
}

export const TEMPLATES: PanelTemplate[] = [
    {
        id: 'place',
        label: 'New Place',
        icon: MapPin,
        type: 'entry',
        subtype: 'place',
        defaultTitle: 'New Place',
        description: 'A location or settlement.',
    },
    {
        id: 'dungeon',
        label: 'New Dungeon',
        icon: Castle,
        type: 'entry',
        subtype: 'dungeon',
        defaultTitle: 'New Dungeon',
        description: 'A hostile environment or structure.',
    },
    {
        id: 'npc',
        label: 'New NPC',
        icon: User,
        type: 'entry',
        subtype: 'npc',
        defaultTitle: 'New NPC',
        description: 'A character or creature.',
    },
    {
        id: 'faction',
        label: 'New Faction',
        icon: Shield,
        type: 'entry',
        subtype: 'faction',
        defaultTitle: 'New Faction',
        description: 'A group, organization, or guild.',
    },
    {
        id: 'relic',
        label: 'New Relic',
        icon: Gem,
        type: 'entry',
        subtype: 'relic',
        defaultTitle: 'New Relic',
        description: 'A magical item or significant object.',
    },
    {
        id: 'lore',
        label: 'New Lore',
        icon: BookOpen,
        type: 'entry',
        subtype: 'lore',
        defaultTitle: 'New Lore',
        description: 'History, myths, or mechanics.',
    },
    {
        id: 'map',
        label: 'New Map',
        icon: Map,
        type: 'entry',
        subtype: 'map',
        defaultTitle: 'New Map',
        description: 'A visual map or cartography.',
    },
    {
        id: 'other',
        label: 'New Panel',
        icon: FileQuestion,
        type: 'entry',
        subtype: 'other',
        defaultTitle: 'New Panel',
        description: 'A generic empty panel.',
    },
];
