import React from 'react';
import { EntryCategory } from '../../types/tapestry';

interface CategoryBadgeProps {
    category: EntryCategory;
}

const categoryConfig: Record<EntryCategory, { label: string; color: string }> = {
    world: { label: 'World', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    session: { label: 'Session', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    place: { label: 'Place', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    npc: { label: 'NPC', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
    lore: { label: 'Lore', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    mechanics: { label: 'Mechanics', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    other: { label: 'Other', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
    const config = categoryConfig[category];

    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${config.color}`}
        >
            {config.label}
        </span>
    );
}
