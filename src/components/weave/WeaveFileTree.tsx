/**
 * WeaveFileTree - Left sidebar for navigating tables with import/export and category management
 * 
 * Adapted from the-weave's FileTree component for exact UI parity.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { useTabStore } from '../../stores/useTabStore';
import { WeaveService } from '../../core/weave/WeaveService';
import { ContextMenu } from './shared/ContextMenu';
import { MacroBar } from './shared/MacroBar';
import type { Table } from '../../types/weave';
import './shared/FileTree.css';

interface WeaveFileTreeProps {
  onNewTable?: () => void;
  onDeleteTable?: (tableId: string, tableName: string) => void;
}

type MenuType = 'table' | 'category' | null;

interface MenuState {
  isOpen: boolean;
  type: MenuType;
  x: number;
  y: number;
  tableId: string;
  tableName: string;
  category: string;
}

// Preset configurations for quick table creation
const TABLE_PRESETS = {
  d66: {
    name: 'New d66 Table',
    tags: ['d66'],
    description: 'A d66 random table',
    headers: ['Roll', 'Result'],
    tableData: [],
    maxRoll: 66,
  },
  d88: {
    name: 'New d88 Table',
    tags: ['d88'],
    description: 'A d88 random table',
    headers: ['Roll', 'Result'],
    tableData: [],
    maxRoll: 88,
  },
  '2d6': {
    name: 'New 2d6 Table',
    tags: ['2d6'],
    description: 'A 2d6 bell curve table',
    headers: ['Roll', 'Result'],
    tableData: [],
    maxRoll: 12,
  },
  '2d8': {
    name: 'New 2d8 Table',
    tags: ['2d8'],
    description: 'A 2d8 bell curve table',
    headers: ['Roll', 'Result'],
    tableData: [],
    maxRoll: 16,
  },
} as const;

// Draggable Table Item Component
function DraggableTableItem({ table, onClick, onContextMenu, onQuickRoll, selectedTableId, validationStatus }: {
  table: Table;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent, table: Table) => void;
  onQuickRoll: (table: Table, e: React.MouseEvent) => void;
  selectedTableId: string | null;
  validationStatus: { isRollable: boolean; hasWarnings: boolean };
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`table-item ${selectedTableId === table.id ? 'selected' : ''} draggable-table`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onContextMenu={(e) => onContextMenu(e, table)}
    >
      {/* Drag handle */}
      <div className="table-drag-handle" {...attributes} {...listeners}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="2" cy="3" r="1" />
          <circle cx="2" cy="7" r="1" />
          <circle cx="2" cy="11" r="1" />
          <circle cx="6" cy="3" r="1" />
          <circle cx="6" cy="7" r="1" />
          <circle cx="6" cy="11" r="1" />
        </svg>
      </div>

      <svg className="table-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
        <rect x="1" y="2" width="12" height="10" rx="1" stroke="currentColor" fill="none" />
        <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" />
        <line x1="5" y1="5" x2="5" y2="12" stroke="currentColor" />
      </svg>
      <span className="table-name">{table.name}</span>
      {validationStatus && !validationStatus.isRollable && (
        <span className="validation-badge validation-badge-red" title="Not rollable">
          ⚠️
        </span>
      )}
      {validationStatus && validationStatus.isRollable && validationStatus.hasWarnings && (
        <span className="validation-badge validation-badge-yellow" title="Has warnings">
          ⚡
        </span>
      )}
      <button
        className="btn-quick-roll"
        onClick={(e) => onQuickRoll(table, e)}
        title="Quick Roll"
      >
        🎲
      </button>
    </div>
  );
}

// Category Header Drop Zone Component
function CategoryHeaderDropZone({ category, children }: {
  category: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: category });

  return (
    <div
      ref={setNodeRef}
      className={`category-header-drop-zone ${isOver ? 'drop-over' : ''}`}
    >
      {children}
    </div>
  );
}

export function WeaveFileTree({ onNewTable, onDeleteTable }: WeaveFileTreeProps) {
  const { tables, selectedTableId, loadTables, saveTable, deleteTable, addTableToMacro, clearMacro, macros, rollMacroSlot, validateTable } = useWeaveStore();
  const { openTab } = useTabStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // Custom collision detection: use pointer position for macro slots, closestCenter for others
  const customCollisionDetection: CollisionDetection = (args) => {
    // First, check for macro slots using pointer position
    const pointerCollisions = pointerWithin(args);
    const macroCollision = pointerCollisions.find(c => c.id.toString().startsWith('macro-'));

    if (macroCollision) {
      return [macroCollision];
    }

    // Fall back to closestCenter for categories
    return closestCenter(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const table = tables.find(t => t.id === active.id);
      if (table) {
        // Check if over.id is a macro slot
        if (over.id.toString().startsWith('macro-')) {
          const slotIndex = parseInt(over.id.toString().replace('macro-', ''));
          addTableToMacro(slotIndex, table.id);
          return;
        }

        // Check if over.id is a category
        const isCategoryDrop = allCategories.includes(over.id as string);

        if (isCategoryDrop) {
          const newCategory = over.id as string;
          handleMoveToCategory(table.id, newCategory);
        }
      }
    }
  };

  const [menu, setMenu] = useState<MenuState>({
    isOpen: false,
    type: null,
    x: 0,
    y: 0,
    tableId: '',
    tableName: '',
    category: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Compute validation status for all tables
  const validationStatus = useMemo(() => {
    const status: Record<string, { isRollable: boolean; hasWarnings: boolean }> = {};
    for (const table of tables) {
      const result = validateTable(table);
      status[table.id] = {
        isRollable: result.valid,
        hasWarnings: result.warnings.length > 0,
      };
    }
    return status;
  }, [tables, validateTable]);

  // Load tables on mount
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Group tables by category
  const grouped = tables.reduce((acc, table) => {
    const category = table.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(table);
    return acc;
  }, {} as Record<string, typeof tables>);

  // Ensure Uncategorized is always present
  if (!grouped['Uncategorized']) {
    grouped['Uncategorized'] = [];
  }

  // Get all unique categories sorted
  const allCategories = Object.keys(grouped).sort();

  // Filter tables based on search query
  const filteredGrouped = (() => {
    if (!searchQuery.trim()) return grouped;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof tables> = {};

    for (const [category, categoryTables] of Object.entries(grouped)) {
      const matchingTables = categoryTables.filter(table => {
        if (table.name.toLowerCase().includes(query)) return true;
        if (category.toLowerCase().includes(query)) return true;
        if (table.tags && table.tags.some(tag => tag.toLowerCase().includes(query))) return true;
        return false;
      });

      if (matchingTables.length > 0) {
        filtered[category] = matchingTables;
      }
    }

    return filtered;
  })();

  const handleTableContextMenu = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      isOpen: true,
      type: 'table',
      x: e.clientX,
      y: e.clientY,
      tableId: table.id,
      tableName: table.name,
      category: table.category || 'Uncategorized',
    });
  };

  const closeMenu = () => {
    setMenu(m => ({ ...m, isOpen: false }));
  };

  const handleExportAll = () => {
    const json = JSON.stringify(tables, null, 2);
    downloadJSON(json, 'random-tables-export.json');
  };

  const handleExportTable = (tableId: string, tableName: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const json = JSON.stringify(table, null, 2);
    downloadJSON(json, `${tableName.toLowerCase().replace(/\s+/g, '-')}.json`);
  };

  const downloadJSON = (json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const tablesToImport = Array.isArray(data) ? data : [data];

      for (const tableData of tablesToImport) {
        const newId = crypto.randomUUID();
        const importedTable = { ...tableData, id: newId };
        await saveTable(importedTable);
      }

      await loadTables();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import: Invalid JSON format');
    }

    e.target.value = '';
  };

  const handleMoveToCategory = async (tableId: string, newCategory: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updatedTable = { ...table, category: newCategory };
    await saveTable(updatedTable);
  };

  const handleQuickRoll = async (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await WeaveService.roll(table.id);
    } catch (err) {
      console.error('Failed to roll table:', err);
    }
  };

  const handleCreatePresetTable = async (presetType: keyof typeof TABLE_PRESETS) => {
    const preset = TABLE_PRESETS[presetType];
    const newTable: Table = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      sourcePath: '',
      name: preset.name,
      description: preset.description,
      tags: [...preset.tags],
      headers: [...preset.headers],
      tableData: [...preset.tableData],
      maxRoll: preset.maxRoll,
      category: 'Uncategorized',
    };

    await saveTable(newTable);
    await loadTables();

    // Open the new table in a tab
    openTab({
      id: `weave-${newTable.id}`,
      type: 'weave',
      title: newTable.name,
      weaveTableId: newTable.id,
    });
  };

  const handleNewTable = () => {
    if (onNewTable) {
      onNewTable();
    } else {
      // Default: create a blank d20 table
      handleCreatePresetTable('d66');
    }
  };

  const handleDeleteTableAction = async (tableId: string, tableName: string) => {
    if (onDeleteTable) {
      onDeleteTable(tableId, tableName);
    } else {
      if (window.confirm(`Are you sure you want to delete "${tableName}"?`)) {
        await deleteTable(tableId);
      }
    }
  };

  const handleTableClick = (table: Table) => {
    openTab({
      id: `weave-${table.id}`,
      type: 'weave',
      title: table.name,
      weaveTableId: table.id,
    });
  };

  // MacroBar props based on useWeaveStore
  const macroSlots = macros.map((macro, index) => ({
    id: `${index}`,
    macro: macro.tables.length > 0 ? { tableIds: macro.tables } : null,
  }));

  const handleMacroSlotClick = async (slotId: string) => {
    const slotIndex = parseInt(slotId);
    await rollMacroSlot(slotIndex);
  };

  const handleClearMacro = async (slotId: string) => {
    const slotIndex = parseInt(slotId);
    await clearMacro(slotIndex);
  };

  const getTableMenuItems = () => [
    {
      label: 'Export Table',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 9V2M4 5l3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M2 9v3h10v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      ),
      onClick: () => handleExportTable(menu.tableId, menu.tableName),
    },
    {
      label: 'Delete Table',
      variant: 'danger' as const,
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M3 4h8v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" stroke="currentColor" fill="none" />
          <path d="M5 2h4M2 4h10" stroke="currentColor" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => handleDeleteTableAction(menu.tableId, menu.tableName),
    },
  ];

  return (
    <aside className="file-tree">
      <header className="file-tree-header">
        <div className="header-actions">
          <button className="btn-icon" title="New d66 Table" onClick={() => handleCreatePresetTable('d66')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <text x="0" y="14" fontSize="12" fontWeight="bold">66</text>
            </svg>
          </button>
          <button className="btn-icon" title="New d88 Table" onClick={() => handleCreatePresetTable('d88')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <text x="0" y="14" fontSize="12" fontWeight="bold">88</text>
            </svg>
          </button>
          <button className="btn-icon" title="New 2d6 Table" onClick={() => handleCreatePresetTable('2d6')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <text x="0" y="14" fontSize="10" fontWeight="bold">2d!</text>
            </svg>
          </button>
          <button className="btn-icon" title="New 2d8 Table" onClick={() => handleCreatePresetTable('2d8')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <text x="0" y="14" fontSize="10" fontWeight="bold">2d!</text>
            </svg>
          </button>
          <button className="btn-icon" title="Import JSON" onClick={handleImportClick}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M2 10v4h12v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
          <button className="btn-icon" title="Export All" onClick={handleExportAll}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 10V2M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M2 10v4h12v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
          <button className="btn-icon" title="New Table" onClick={handleNewTable}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      <div className="file-tree-search">
        <input
          type="text"
          className="search-input"
          placeholder="Search tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="btn-clear-search"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <DragOverlay>
          {activeId ? (
            <div className="drag-preview">
              {tables.find(t => t.id === activeId)?.name}
            </div>
          ) : null}
        </DragOverlay>

        <MacroBar
          macros={macroSlots}
          tables={tables}
          onRoll={handleMacroSlotClick}
          onClear={handleClearMacro}
        />

        <div className="file-tree-content">
          {Object.entries(filteredGrouped).map(([category, categoryTables]) => (
            <div key={category} className="file-tree-category">
              <CategoryHeaderDropZone category={category}>
                <div className="category-header">
                  <svg className="category-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M1 2h4l1 1h5v7H1V2z" />
                  </svg>
                  <span>{category}</span>
                  <span className="category-count">{categoryTables.length}</span>
                </div>
              </CategoryHeaderDropZone>
              <SortableContext
                items={categoryTables.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="table-list">
                  {categoryTables.map((table) => {
                    const status = validationStatus[table.id];
                    return (
                      <li key={table.id}>
                        <DraggableTableItem
                          table={table}
                          onClick={() => handleTableClick(table)}
                          onContextMenu={(e) => handleTableContextMenu(e, table)}
                          onQuickRoll={handleQuickRoll}
                          selectedTableId={selectedTableId}
                          validationStatus={status}
                        />
                      </li>
                    );
                  })}
                </ul>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {searchQuery && Object.keys(filteredGrouped).length === 0 && (
        <div className="empty-state">
          <p>No results found</p>
          <p className="text-muted">Try a different search term</p>
        </div>
      )}

      {!searchQuery && tables.length === 0 && (
        <div className="empty-state">
          <p>No tables yet</p>
          <p className="text-muted">Create or import a table to get started</p>
        </div>
      )}

      <div className="file-tree-footer">
        <p className="storage-hint">💾 Tables stored in Tapestry .weave folder</p>
      </div>

      {menu.isOpen && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={getTableMenuItems()}
        />
      )}
    </aside>
  );
}
