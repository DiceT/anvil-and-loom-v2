/**
 * DropZone - Visual drop zone for drag-and-drop operations
 *
 * Provides visual feedback when dragging over a valid drop zone.
 * Handles dropping tables to reorder or move to macro slots.
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DropZoneProps {
  id: string;
  type: 'macro-slot' | 'category' | 'table-reorder';
  onDrop: (data: { tableId: string }) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DropZone({
  id,
  type,
  onDrop,
  children,
  className = '',
  disabled = false,
}: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type,
      onDrop,
    },
    disabled,
  });

  const getZoneStyle = () => {
    if (disabled) {
      return '';
    }
    
    if (isOver) {
      switch (type) {
        case 'macro-slot':
          return 'border-purple-500 bg-purple-900/30';
        case 'category':
          return 'border-purple-500 bg-purple-900/20';
        case 'table-reorder':
          return 'border-purple-500 bg-purple-900/20';
        default:
          return 'border-purple-500 bg-purple-900/20';
      }
    }
    
    return 'border-transparent';
  };

  return (
    <div
      ref={setNodeRef}
      className={`relative border-2 border-dashed rounded-lg transition-all ${getZoneStyle()} ${className}`}
    >
      {children}
      
      {/* Visual feedback when hovering */}
      {isOver && !disabled && (
        <div className="absolute inset-0 bg-purple-500/10 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}
