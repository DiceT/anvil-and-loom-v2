/**
 * MacroBar - Container for 4 macro slots
 */

import { useState } from 'react';
import { MacroSlot } from './MacroSlot';
import { MacroTooltip } from './MacroTooltip';
import type { Table } from '../../../types/weave';
import './MacroBar.css';

interface MacroSlotType {
    id: string;
    macro: { tableIds: string[] } | null;
}

interface MacroBarProps {
    macros: MacroSlotType[];
    tables: Table[];
    onRoll: (slotId: string) => void;
    onClear: (slotId: string) => void;
}

export function MacroBar({ macros, tables, onRoll, onClear }: MacroBarProps) {
    const [hoveredSlot, setHoveredSlot] = useState<{ slotId: string; tables: Table[] } | null>(null);

    const handleHover = (slotId: string, slotTables: Table[]) => {
        setHoveredSlot({ slotId, tables: slotTables });
    };

    const handleLeave = () => {
        setHoveredSlot(null);
    };

    return (
        <div className="macro-bar">
            <div className="macro-slots">
                {macros.map(slot => (
                    <MacroSlot
                        key={slot.id}
                        slot={slot}
                        tables={tables}
                        onRoll={onRoll}
                        onClear={onClear}
                        onHover={handleHover}
                        onLeave={handleLeave}
                    />
                ))}
            </div>
            {hoveredSlot && (
                <MacroTooltip
                    slotId={hoveredSlot.slotId}
                    tables={hoveredSlot.tables}
                    onClose={handleLeave}
                />
            )}
        </div>
    );
}
