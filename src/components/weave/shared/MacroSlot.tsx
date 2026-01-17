/**
 * MacroSlot - Individual macro button that accepts dropped tables
 */

import { useDroppable } from '@dnd-kit/core';
import type { Table } from '../../../types/weave';
import './MacroSlot.css';

interface MacroSlotType {
    id: string;
    macro: { tableIds: string[] } | null;
}

interface MacroSlotProps {
    slot: MacroSlotType;
    tables: Table[];
    onRoll: (slotId: string) => void;
    onClear: (slotId: string) => void;
    onHover: (slotId: string, tables: Table[]) => void;
    onLeave: () => void;
}

export function MacroSlot({ slot, tables, onRoll, onClear, onHover, onLeave }: MacroSlotProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `macro-${slot.id}`,
        data: { slotId: slot.id }
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const hasTables = slot.macro !== null && slot.macro.tableIds.length > 0;
    const tableCount = slot.macro?.tableIds.length || 0;

    const handleClick = () => {
        if (hasTables) {
            onRoll(slot.id);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (hasTables) {
            onClear(slot.id);
        }
    };

    const handleMouseEnter = () => {
        if (hasTables && slot.macro) {
            const macroTables = tables.filter(t => slot.macro!.tableIds.includes(t.id));
            onHover(slot.id, macroTables);
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`macro-slot ${hasTables ? 'has-tables' : ''} ${isOver ? 'drag-over' : ''}`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onLeave}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            title={hasTables ? `Click to roll macro ${slot.id}, right-click to clear` : `Drag tables here to create macro ${slot.id}`}
        >
            <span className="slot-number">{slot.id}</span>
            {hasTables && (
                <span className="table-count">{tableCount}</span>
            )}
        </div>
    );
}
