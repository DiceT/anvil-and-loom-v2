/**
 * WeaveMacroTooltip - Tooltip showing tables in a macro slot
 *
 * Displays a list of tables when hovering over a macro slot.
 * Shows table names, die types, and row counts.
 */

import React from 'react';
import { X, FileText } from 'lucide-react';
import type { Table } from '../../types/weave';

interface WeaveMacroTooltipProps {
  tables: Table[];
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WeaveMacroTooltip({ tables, visible, position, onClose }: WeaveMacroTooltipProps) {
  if (!visible || tables.length === 0) {
    return null;
  }

  const getDieTypeText = (maxRoll: number) => {
    if (maxRoll === 66) return 'd66';
    if (maxRoll === 88) return 'd88';
    return `d${maxRoll}`;
  };

  return (
    <div
      className="fixed z-50 w-64 bg-canvas-surface border border-border rounded-lg shadow-xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium text-type-primary">
          {tables.length} table{tables.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-canvas-panel rounded transition-colors"
          aria-label="Close tooltip"
        >
          <X className="w-4 h-4 text-type-tertiary" />
        </button>
      </div>

      {/* Table List */}
      <div className="max-h-48 overflow-y-auto">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex items-start gap-2 px-3 py-2 hover:bg-canvas-panel/50 transition-colors border-b border-border last:border-b-0"
          >
            <FileText className="w-4 h-4 text-type-tertiary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-type-primary truncate">
                {table.name}
              </div>
              {table.description && (
                <div className="text-xs text-type-tertiary truncate mt-0.5">
                  {table.description}
                </div>
              )}
              <div className="text-xs text-type-tertiary mt-1">
                {table.tableData.length} row{table.tableData.length !== 1 ? 's' : ''} · {getDieTypeText(table.maxRoll)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
