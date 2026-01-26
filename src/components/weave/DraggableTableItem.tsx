/**
 * DraggableTableItem - Draggable wrapper for table items in WeaveFileTree
 *
 * Makes table items draggable for reordering within categories and moving to macro slots.
 * Shows a drag handle on hover and maintains existing table item functionality.
 * Displays validation badges and table tooltips.
 */

import React, { useId, useState, useRef } from 'react';
import { useDraggable, useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlertTriangle, XCircle } from 'lucide-react';
import type { Table } from '../../types/weave';
import type { ValidationResult } from '../../stores/useWeaveStore';
import { TableTooltip } from './TableTooltip';

interface DraggableTableItemProps {
  table: Table;
  category: string;
  children: React.ReactNode;
  onQuickRoll: (tableId: string) => void;
  onDelete: (tableId: string) => void;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent, table: Table) => void;
  isSelected: boolean;
  validation: ValidationResult;
}

export function DraggableTableItem({
  table,
  category,
  children,
  onQuickRoll,
  onDelete,
  onClick,
  onContextMenu,
  isSelected,
  validation,
}: DraggableTableItemProps) {
  const itemId = `table-${table.id}`;
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: itemId,
    data: {
      type: 'table',
      tableId: table.id,
      category,
    },
  });

  // Adjust drag preview position to originate from handle
  const adjustedTransform = transform ? {
    ...transform,
    x: transform.x - 20, // Offset to align with handle position
  } : null;

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(adjustedTransform || transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, table);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    tooltipTimeoutRef.current = setTimeout(() => {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setTooltipPosition({
          x: rect.left - 320, // Position to the left (320px is the tooltip width from w-80)
          y: rect.top,
        });
        setShowTooltip(true);
      }
    }, 500); // 500ms delay to avoid flickering
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(false);
  };

  const getValidationBadge = () => {
    if (!validation.valid) {
      return (
        <div className="flex-shrink-0" title="Not rollable">
          <XCircle className="w-4 h-4 text-red-400" />
        </div>
      );
    } else if (validation.warnings.length > 0) {
      return (
        <div className="flex-shrink-0" title="Has warnings">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div
        ref={(node) => {
          setNodeRef(node);
          itemRef.current = node;
        }}
        style={style}
        className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors select-none ${isSelected
          ? 'bg-purple-900/30 text-purple-200'
          : 'hover:bg-slate-800/50 text-slate-300'
          }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        draggable={true}
        onDragStart={(e) => {
          // Native drag for dropping onto Result inputs
          e.dataTransfer.setData('text/plain', table.name); // Fallback
          e.dataTransfer.setData('application/anl+json', JSON.stringify({
            type: 'table',
            id: table.id,
            name: table.name,
            category
          }));
          e.dataTransfer.effectAllowed = 'copy';
          // Note: dnd-kit handle stops propagation for its own events, 
          // so this only fires when dragging the ROW background, not the handle.
        }}
      >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded cursor-grab active:cursor-grabbing transition-all"
          title="Drag to reorder or move to macro slot"
        >
          <GripVertical className="w-4 h-4 text-slate-500" />
        </div>

        {/* Table Content */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {children}
          {/* Validation Badge */}
          {getValidationBadge()}
        </div>

        {/* Quick Roll Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickRoll(table.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
          title="Quick Roll"
        >
          <svg className="w-4 h-4 text-slate-400 hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 21l-1.5-1.5m0 0l-1.5 1.5m0 0l1.5-1.5M5 3v4" />
          </svg>
        </button>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(table.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded transition-all"
          title="Delete Table"
        >
          <svg className="w-4 h-4 text-slate-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-2-2v3.172a2 2 0 01.586 1.414l1.414 1.414a2 2 0 011.414 2.828H17a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 011-2-2z" />
          </svg>
        </button>
      </div>

      {/* Table Tooltip */}
      <TableTooltip
        table={table}
        validation={validation}
        visible={showTooltip}
        position={tooltipPosition}
        onClose={() => setShowTooltip(false)}
      />
    </>
  );
}
