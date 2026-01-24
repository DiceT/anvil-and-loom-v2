/**
 * WeaveContextMenu - Right-click context menu for table operations
 *
 * Provides a context menu that appears on right-click for table items.
 * Supports export (JSON/Markdown), duplicate, move to category, and delete operations.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Copy,
  Folder,
  Trash2,
  ChevronRight,
  FileJson,
  FileText as FileTextIcon,
} from 'lucide-react';
import type { Table } from '../../types/weave';

interface WeaveContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  table: Table | null;
  onExport: (table: Table, format: 'json' | 'markdown') => void;
  onDuplicate: (table: Table) => void;
  onMoveToCategory: (table: Table, category: string) => void;
  onDelete: (table: Table) => void;
  onClose: () => void;
  categories: string[];
}

export function WeaveContextMenu({
  visible,
  position,
  table,
  onExport,
  onDuplicate,
  onMoveToCategory,
  onDelete,
  onClose,
  categories,
}: WeaveContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCategorySubmenu, setShowCategorySubmenu] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Menu items configuration
  const menuItems = [
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      hasSubmenu: true,
      action: () => setShowCategorySubmenu(false),
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      hasSubmenu: false,
      action: () => table && onDuplicate(table),
    },
    {
      id: 'move',
      label: 'Move to Category',
      icon: Folder,
      hasSubmenu: true,
      action: () => setShowCategorySubmenu(true),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      hasSubmenu: false,
      action: () => table && onDelete(table),
    },
  ];

  // Submenu items for Export
  const exportSubmenuItems = [
    {
      id: 'export-json',
      label: 'Export as JSON',
      icon: FileJson,
      action: () => table && onExport(table, 'json'),
    },
    {
      id: 'export-markdown',
      label: 'Export as Markdown',
      icon: FileTextIcon,
      action: () => table && onExport(table, 'markdown'),
    },
  ];

  // Calculate position to keep menu on screen
  const calculatePosition = () => {
    if (!menuRef.current) return position;

    const menuRect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position if menu would go off-screen
    if (x + menuRect.width > windowWidth) {
      x = windowWidth - menuRect.width - 10;
    }

    // Adjust vertical position if menu would go off-screen
    if (y + menuRect.height > windowHeight) {
      y = windowHeight - menuRect.height - 10;
    }

    return { x, y };
  };

  const adjustedPosition = calculatePosition();

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!visible) return;

      const totalItems = menuItems.length;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < totalItems) {
            menuItems[focusedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, focusedIndex]);

  // Reset focus when menu opens
  useEffect(() => {
    if (visible) {
      setFocusedIndex(-1);
      setShowCategorySubmenu(false);
    }
  }, [visible]);

  // Handle menu item click
  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    item.action();
    if (!item.hasSubmenu) {
      onClose();
    }
  };

  // Handle export submenu click
  const handleExportSubmenuClick = (item: typeof exportSubmenuItems[0]) => {
    item.action();
    setShowCategorySubmenu(false);
    onClose();
  };

  // Handle category selection
  const handleCategoryClick = (category: string) => {
    if (table) {
      onMoveToCategory(table, category);
    }
    setShowCategorySubmenu(false);
    onClose();
  };

  if (!visible || !table) {
    return null;
  }

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-canvas-surface border border-border rounded-lg shadow-xl overflow-hidden"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
      role="menu"
      aria-label="Table context menu"
    >
      {/* Main Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => handleMenuItemClick(item)}
              onMouseEnter={() => {
                setFocusedIndex(index);
                if (item.id === 'export') {
                  setShowCategorySubmenu(true);
                } else if (item.id === 'move') {
                  setShowCategorySubmenu(true);
                } else {
                  setShowCategorySubmenu(false);
                }
              }}
              className={`w-full px-3 py-2 flex items-center justify-between text-sm transition-colors ${focusedIndex === index
                  ? 'bg-amethyst/10 text-amethyst'
                  : 'text-type-secondary hover:bg-canvas-panel'
                }`}
              role="menuitem"
              tabIndex={index === focusedIndex ? 0 : -1}
            >
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.hasSubmenu && <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Export Submenu */}
            {item.id === 'export' && showCategorySubmenu && (
              <div
                className="absolute left-full top-0 ml-1 min-w-48 bg-canvas-surface border border-border rounded-lg shadow-xl overflow-hidden"
                role="menu"
                aria-label="Export options"
              >
                {exportSubmenuItems.map((exportItem) => (
                  <button
                    key={exportItem.id}
                    onClick={() => handleExportSubmenuClick(exportItem)}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-type-secondary hover:bg-canvas-panel transition-colors"
                    role="menuitem"
                  >
                    <exportItem.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{exportItem.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Move to Category Submenu */}
            {item.id === 'move' && showCategorySubmenu && (
              <div
                className="absolute left-full top-0 ml-1 min-w-48 bg-canvas-surface border border-border rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                role="menu"
                aria-label="Categories"
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-type-secondary hover:bg-canvas-panel transition-colors"
                    role="menuitem"
                  >
                    <Folder className="w-4 h-4 flex-shrink-0" />
                    <span>{category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table Name Display */}
      <div className="px-3 py-2 border-t border-border bg-canvas-panel">
        <p className="text-xs text-type-tertiary truncate">{table.name}</p>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
