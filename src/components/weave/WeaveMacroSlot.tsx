/**
 * WeaveMacroSlot - Individual macro slot in the MacroBar
 *
 * Displays a single macro slot with table count, roll button, and clear button.
 * Shows tooltip on hover with table details.
 * Supports drag-and-drop to add tables to the slot.
 */

import React, { useState, useRef } from 'react';
import { Dices, X, Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { WeaveMacroTooltip } from './WeaveMacroTooltip';
import type { Table } from '../../types/weave';

interface WeaveMacroSlotProps {
  slot: any; // Type 'any' to specific handling of tables vs other macro types
  slotIndex: number;
  tables: Table[]; // All available tables to resolve IDs
  onRoll: (slotIndex: number) => void;
  onClear: (slotIndex: number) => void;
  onDrop: (slotIndex: number, tableId: string) => void;
}

export function WeaveMacroSlot({ slot, slotIndex, tables, onRoll, onClear, onDrop }: WeaveMacroSlotProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const slotRef = useRef<HTMLDivElement>(null);

  // Get actual table objects for this slot
  const slotTables = React.useMemo(() => {
    if (!slot.tables) return [];
    return slot.tables
      .map((tableId: string) => tables.find(t => t.id === tableId))
      .filter((t: any): t is Table => t !== undefined);
  }, [slot.tables, tables]);

  // Drop zone for dragging tables to this slot
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `macro-slot-${slotIndex}`,
    data: {
      type: 'macro-slot',
      slotIndex,
      onDrop: (tableId: string) => onDrop(slotIndex, tableId),
    },
    disabled: slotTables.length >= 4, // Disable drop if slot is full
  });

  // Combine refs
  const setNodeRef = (node: HTMLDivElement | null) => {
    slotRef.current = node;
    setDroppableRef(node);
  };

  const handleMouseEnter = () => {
    if (slotTables.length === 0) return;

    const rect = slotRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPosition({
        x: rect.right + 8,
        y: rect.top,
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleRoll = () => {
    onRoll(slotIndex);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear(slotIndex);
  };

  const getDieTypeText = (maxRoll: number) => {
    if (maxRoll === 66) return 'd66';
    if (maxRoll === 88) return 'd88';
    return `d${maxRoll}`;
  };

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative h-16 rounded-lg border-2 transition-all
          ${slotTables.length > 0 || (slot.type && slot.type !== 'empty')
            ? 'bg-amethyst/10 border-amethyst/30 hover:border-amethyst hover:bg-amethyst/20 cursor-pointer'
            : 'bg-canvas-surface border-border hover:border-border-active'
          }
          ${isOver && slotTables.length < 4 ? 'border-amethyst bg-amethyst/20' : ''}
        `}
        draggable={!!slot.type && slot.type !== 'empty'}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/plain', slot.label || 'Macro');
          // Pass full macro object for TableEditor to consume
          e.dataTransfer.setData('application/anl+json', JSON.stringify({
            type: 'macro',
            id: slot.id,
            macro: slot
          }));
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const data = e.dataTransfer.getData('application/anl+json');
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'table') {
                onDrop(slotIndex, parsed.id);
              }
            } catch (err) {
              console.error('Failed to parse drop data', err);
            }
          }
        }}
        onClick={handleRoll}
        role="button"
        tabIndex={0}
        aria-label={`Macro slot ${slotIndex + 1}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRoll();
          }
        }}
      >
        {/* Slot Content */}
        <div className="flex flex-col items-center justify-center h-full px-2">
          {slotTables.length > 0 ? (
            <>
              {/* Table Count */}
              <div className="text-lg font-bold text-amethyst">
                {slotTables.length}/4
              </div>

              {/* Die Types */}
              <div className="flex items-center gap-1 text-xs text-type-tertiary mt-1">
                {slotTables.slice(0, 3).map((table: Table, idx: number) => (
                  <span key={table.id}>
                    {getDieTypeText(table.maxRoll)}
                    {idx < Math.min(slotTables.length, 3) - 1 && '·'}
                  </span>
                ))}
                {slotTables.length > 3 && <span>...</span>}
              </div>

              {/* Roll Icon (visible on hover) */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dices className="w-3 h-3 text-amethyst" />
              </div>
            </>
          ) : (
            <>
              {/* Empty State */}
              <Plus className="w-5 h-5 text-type-tertiary mb-1" />
              <div className="text-xs text-type-tertiary">Empty</div>
            </>
          )}
        </div>

        {/* Clear Button */}
        {slotTables.length > 0 && (
          <button
            onClick={handleClear}
            className="absolute -top-2 -right-2 w-5 h-5 bg-type-tertiary hover:bg-type-secondary rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Clear macro slot"
          >
            <X className="w-3 h-3 text-canvas" />
          </button>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <WeaveMacroTooltip
          tables={slotTables}
          visible={showTooltip}
          position={tooltipPosition}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  );
}
