/**
 * TableEditor - Spreadsheet-style editor for table rows
 */

import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Table, TableRow, ResultType } from '../../../types/weave';
import { QuickImportModal } from './QuickImportModal';
import { downloadMarkdown } from './MarkdownExporter';
import './TableEditor.css';

interface TableEditorProps {
    table: Table;
    onUpdate: (table: Table) => void;
}

// Sortable Row Component
function SortableRow({ row, rowIndex, updateRow, deleteRow, handleKeyDown, dragOverCell, setDragOverCell }: {
    row: TableRow;
    rowIndex: number;
    updateRow: (rowIndex: number, updates: Partial<TableRow>) => void;
    deleteRow: (rowIndex: number) => void;
    handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
    dragOverCell: { row: number, type: 'result' } | null;
    setDragOverCell: (state: { row: number, type: 'result' } | null) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: rowIndex });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="editor-row sortable-row">
            {/* Drag handle */}
            <div className="drag-handle" {...attributes} {...listeners}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="3" cy="3" r="1.5" />
                    <circle cx="3" cy="8" r="1.5" />
                    <circle cx="3" cy="13" r="1.5" />
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                    <circle cx="13" cy="3" r="1.5" />
                    <circle cx="13" cy="8" r="1.5" />
                    <circle cx="13" cy="13" r="1.5" />
                </svg>
            </div>

            {/* Existing row content */}
            <div className="cell cell-roll">
                <input
                    type="number"
                    className="input-small"
                    value={row.floor}
                    onChange={(e) => updateRow(rowIndex, { floor: parseInt(e.target.value) || 0 })}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                />
                <span className="roll-separator">-</span>
                <input
                    type="number"
                    className="input-small"
                    value={row.ceiling}
                    onChange={(e) => updateRow(rowIndex, { ceiling: parseInt(e.target.value) || 0 })}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                />
            </div>

            <div className="cell cell-weight">
                <input
                    type="number"
                    className="input-weight"
                    value={row.weight ?? 1}
                    min={1}
                    onChange={(e) => updateRow(rowIndex, { weight: parseInt(e.target.value) || 1 })}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                />
            </div>

            <div
                className={`cell cell-result ${dragOverCell?.row === rowIndex ? 'bg-amethyst/20 ring-2 ring-amethyst ring-inset' : ''}`}
                onDragEnter={() => setDragOverCell({ row: rowIndex, type: 'result' })}
                onDragLeave={(e) => {
                    // Only clear if we really left the cell (not entered a child)
                    if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverCell(null);
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCell(null);
                    const data = e.dataTransfer.getData('application/anl+json');
                    if (data) {
                        try {
                            const item = JSON.parse(data);
                            // Support Panel type explicitly
                            if (['table', 'aspect', 'domain', 'macro', 'panel'].includes(item.type)) {
                                let resultValue: any = '';
                                if (item.type === 'macro') {
                                    const macro = item.macro;
                                    if (macro.type === 'oracle') {
                                        resultValue = macro.oracleName || 'Oracle';
                                    } else if (macro.type === 'table') {
                                        resultValue = macro.tableName || 'Table';
                                    } else {
                                        resultValue = macro.label || 'Macro';
                                    }
                                    if (macro.oracleTableNames && Array.isArray(macro.oracleTableNames)) {
                                        resultValue = macro.oracleTableNames.join(' + ');
                                    }
                                } else {
                                    resultValue = { tag: item.name };
                                }

                                updateRow(rowIndex, {
                                    resultType: item.type as ResultType,
                                    result: resultValue
                                });
                            }
                        } catch (err) {
                            console.error('Failed to parse drop data', err);
                        }
                    }
                }}
            >
                {row.resultType === 'text' || row.resultType === 'macro' ? (
                    <input
                        type="text"
                        className="input-result"
                        value={typeof row.result === 'string' ? row.result : ''}
                        placeholder={row.resultType === 'macro' ? "Macro Description" : "Enter result..."}
                        onChange={(e) => updateRow(rowIndex, { result: e.target.value })}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverCell(null);
                            // Re-trigger drop logic on parent or handle here?
                            // Simpler to just copy the logic or let it bubble?
                            // Inputs STOP bubbling for valid drops (text).
                            // So we must handle it here manually or invoke a shared handler.
                            // Let's invoke the shared handler logic by faking the event or extracting logic.
                            // Actually, let's just copy the logic for now or rely on bubbling if we preventDefault?
                            // If we preventDefault on dragover, it allows drop.
                            // If we preventDefault on drop, does it bubble?
                            // Yes, unless stopPropagation is called.
                            // BUT text inputs naturally consume drops.
                            // Let's explicitly manually trigger the drop logic.

                            // Better: Let's extract the drop handler.
                            const data = e.dataTransfer.getData('application/anl+json');
                            if (data) {
                                try {
                                    const item = JSON.parse(data);
                                    if (['table', 'aspect', 'domain', 'macro', 'panel'].includes(item.type)) {
                                        let resultValue: any = '';
                                        if (item.type === 'macro') {
                                            const macro = item.macro;
                                            if (macro.type === 'oracle') {
                                                resultValue = macro.oracleName || 'Oracle';
                                            } else if (macro.type === 'table') {
                                                resultValue = macro.tableName || 'Table';
                                            } else {
                                                resultValue = macro.label || 'Macro';
                                            }
                                            if (macro.oracleTableNames && Array.isArray(macro.oracleTableNames)) {
                                                resultValue = macro.oracleTableNames.join(' + ');
                                            }
                                        } else {
                                            resultValue = { tag: item.name };
                                        }
                                        updateRow(rowIndex, {
                                            resultType: item.type as ResultType,
                                            result: resultValue
                                        });
                                    }
                                } catch (err) { }
                            }
                        }}
                    />
                ) : row.resultType === 'table' || row.resultType === 'aspect' || row.resultType === 'domain' || row.resultType === 'panel' ? (
                    <input
                        type="text"
                        className={`input-result input-tag ${row.resultType === 'aspect' ? 'text-teal-400' : row.resultType === 'domain' ? 'text-amber-400' : row.resultType === 'panel' ? 'text-sky-400' : ''}`}
                        value={typeof row.result === 'object' && 'tag' in row.result ? (row.result.tag as string) : typeof row.result === 'string' ? row.result : ''}
                        placeholder={`Enter ${row.resultType} name...`}
                        onChange={(e) => updateRow(rowIndex, { result: { tag: e.target.value } })}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverCell(null);
                            const data = e.dataTransfer.getData('application/anl+json');
                            if (data) {
                                try {
                                    const item = JSON.parse(data);
                                    if (['table', 'aspect', 'domain', 'macro', 'panel'].includes(item.type)) {
                                        let resultValue: any = '';
                                        if (item.type === 'macro') {
                                            const macro = item.macro;
                                            if (macro.type === 'oracle') { resultValue = macro.oracleName || 'Oracle'; }
                                            else if (macro.type === 'table') { resultValue = macro.tableName || 'Table'; }
                                            else { resultValue = macro.label || 'Macro'; }
                                            if (macro.oracleTableNames && Array.isArray(macro.oracleTableNames)) { resultValue = macro.oracleTableNames.join(' + '); }
                                        } else { resultValue = { tag: item.name }; }
                                        updateRow(rowIndex, { resultType: item.type as ResultType, result: resultValue });
                                    }
                                } catch (err) { }
                            }
                        }}
                    />
                ) : (
                    <textarea
                        className="input-result input-panel"
                        value={typeof row.result === 'object' ? JSON.stringify(row.result, null, 2) : '{}'}
                        placeholder='{"key": "value"}'
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value);
                                updateRow(rowIndex, { result: parsed });
                            } catch {
                                // Keep current value while editing
                            }
                        }}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverCell(null);
                            const data = e.dataTransfer.getData('application/anl+json');
                            if (data) {
                                try {
                                    const item = JSON.parse(data);
                                    if (['table', 'aspect', 'domain', 'macro', 'panel'].includes(item.type)) {
                                        let resultValue: any = '';
                                        if (item.type === 'macro') {
                                            const macro = item.macro;
                                            if (macro.type === 'oracle') {
                                                resultValue = macro.oracleName || 'Oracle';
                                            } else if (macro.type === 'table') {
                                                resultValue = macro.tableName || 'Table';
                                            } else {
                                                resultValue = macro.label || 'Macro';
                                            }
                                            if (macro.oracleTableNames && Array.isArray(macro.oracleTableNames)) {
                                                resultValue = macro.oracleTableNames.join(' + ');
                                            }
                                        } else {
                                            resultValue = { tag: item.name };
                                        }
                                        updateRow(rowIndex, { resultType: item.type as ResultType, result: resultValue });
                                    }
                                } catch (err) { }
                            }
                        }}
                    />
                )}
            </div>

            <div className="cell cell-type">
                <select
                    className="select-type"
                    value={row.resultType}
                    onChange={(e) => {
                        const newType = e.target.value as ResultType;
                        let newResult: TableRow['result'] = '';
                        if (newType === 'table' || newType === 'aspect' || newType === 'domain') newResult = { tag: '' };
                        if (newType === 'panel') newResult = {};
                        updateRow(rowIndex, { resultType: newType, result: newResult });
                    }}
                >
                    <option value="text">Text</option>
                    <option value="table">Table</option>
                    <option value="aspect">Aspect</option>
                    <option value="domain">Domain</option>
                    <option value="macro">Macro</option>
                    <option value="panel">Panel</option>
                </select>
            </div>

            <div className="cell cell-actions">
                <button
                    className="btn-delete"
                    onClick={() => deleteRow(rowIndex)}
                    title="Delete row"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M3 4h8v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" stroke="currentColor" fill="none" />
                        <path d="M5 2h4M2 4h10" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export function TableEditor({ table, onUpdate }: TableEditorProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [dragOverCell, setDragOverCell] = useState<{ row: number, type: 'result' } | null>(null);

    // Drag-and-drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = table.tableData.findIndex((_, i) => i === active.id);
            const newIndex = table.tableData.findIndex((_, i) => i === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newTableData = arrayMove(table.tableData, oldIndex, newIndex);
                onUpdate({ ...table, tableData: newTableData });
            }
        }
    };

    const handleImportRows = (newRows: TableRow[]) => {
        // Re-number imported rows to continue from existing table
        const lastRow = table.tableData[table.tableData.length - 1];
        const startFloor = lastRow ? lastRow.ceiling + 1 : 1;

        const renumberedRows = newRows.map((row, i) => ({
            ...row,
            floor: startFloor + i,
            ceiling: startFloor + i,
        }));

        onUpdate({ ...table, tableData: [...table.tableData, ...renumberedRows] });
    };

    const updateTableMeta = (updates: Partial<Table>) => {
        onUpdate({ ...table, ...updates });
    };

    const updateRow = (rowIndex: number, updates: Partial<TableRow>) => {
        const newTableData = [...table.tableData];
        newTableData[rowIndex] = { ...newTableData[rowIndex], ...updates };
        onUpdate({ ...table, tableData: newTableData });
    };

    const addRow = () => {
        const lastRow = table.tableData[table.tableData.length - 1];
        const newFloor = lastRow ? lastRow.ceiling + 1 : 1;
        const newRow: TableRow = {
            floor: newFloor,
            ceiling: newFloor,
            weight: 1,
            resultType: 'text' as ResultType,
            result: '',
        };
        onUpdate({ ...table, tableData: [...table.tableData, newRow] });
    };

    const deleteRow = (rowIndex: number) => {
        const newTableData = table.tableData.filter((_, i) => i !== rowIndex);
        onUpdate({ ...table, tableData: newTableData });
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
        if (e.key === 'Tab' && rowIndex === table.tableData.length - 1 && !e.shiftKey) {
            e.preventDefault();
            addRow();
        }
    };

    // Suggest maxRoll based on total weights
    const suggestMaxRoll = () => {
        const totalWeight = table.tableData.reduce((sum, row) => sum + (row.weight ?? 1), 0);
        // Find smallest standard die that fits
        const standardDice = [6, 8, 10, 12, 20, 66, 88, 100];
        const suggested = standardDice.find(d => d >= totalWeight) || totalWeight;
        return suggested;
    };

    const autoNumberRows = () => {
        const numRows = table.tableData.length;

        // Check if the table is a d66 or d88 based on maxRoll or row count
        let isDice66 = table.maxRoll === 66 || numRows === 36;
        let isDice88 = table.maxRoll === 88 || numRows === 64;

        // For d66: 36 entries using 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
        if (isDice66) {
            const d66Numbers: number[] = [];
            for (let tens = 1; tens <= 6; tens++) {
                for (let ones = 1; ones <= 6; ones++) {
                    d66Numbers.push(tens * 10 + ones);
                }
            }

            const newTableData = table.tableData.map((row, index) => {
                if (index < d66Numbers.length) {
                    const rollValue = d66Numbers[index];
                    return { ...row, floor: rollValue, ceiling: rollValue, weight: 1 };
                }
                return row;
            });

            onUpdate({ ...table, tableData: newTableData, maxRoll: 66, tableType: 'd66' });
            return;
        }

        // For d88: 64 entries using 11-18, 21-28, ..., 81-88
        if (isDice88) {
            const d88Numbers: number[] = [];
            for (let tens = 1; tens <= 8; tens++) {
                for (let ones = 1; ones <= 8; ones++) {
                    d88Numbers.push(tens * 10 + ones);
                }
            }

            const newTableData = table.tableData.map((row, index) => {
                if (index < d88Numbers.length) {
                    const rollValue = d88Numbers[index];
                    return { ...row, floor: rollValue, ceiling: rollValue, weight: 1 };
                }
                return row;
            });

            onUpdate({ ...table, tableData: newTableData, maxRoll: 88, tableType: 'd88' });
            return;
        }

        // For 2d6: 11 entries from 2 to 12 (starts at 2, not 1)
        if (table.tableType === '2d6' || table.maxRoll === 12) {
            let currentFloor = 2;  // 2d6 starts at 2
            const newTableData = table.tableData.map(row => {
                const weight = row.weight ?? 1;
                const newRow = {
                    ...row,
                    floor: currentFloor,
                    ceiling: currentFloor + weight - 1,
                };
                currentFloor = newRow.ceiling + 1;
                return newRow;
            });

            onUpdate({ ...table, tableData: newTableData, maxRoll: 12, tableType: '2d6' });
            return;
        }

        // For 2d8: 15 entries from 2 to 16 (starts at 2, not 1)
        if (table.tableType === '2d8' || table.maxRoll === 16) {
            let currentFloor = 2;  // 2d8 starts at 2
            const newTableData = table.tableData.map(row => {
                const weight = row.weight ?? 1;
                const newRow = {
                    ...row,
                    floor: currentFloor,
                    ceiling: currentFloor + weight - 1,
                };
                currentFloor = newRow.ceiling + 1;
                return newRow;
            });

            onUpdate({ ...table, tableData: newTableData, maxRoll: 16, tableType: '2d8' });
            return;
        }

        // For standard dice (d6, d8, d10, d12, d20, d100): use weight-based sequential numbering from 1
        let currentFloor = 1;
        const newTableData = table.tableData.map(row => {
            const weight = row.weight ?? 1;
            const newRow = {
                ...row,
                floor: currentFloor,
                ceiling: currentFloor + weight - 1,
            };
            currentFloor = newRow.ceiling + 1;
            return newRow;
        });

        const suggestedMax = suggestMaxRoll();
        onUpdate({ ...table, tableData: newTableData, maxRoll: suggestedMax });
    };

    return (
        <div className="table-editor">
            {/* Settings Panel */}
            <div className="editor-settings">
                <button
                    className={`settings-toggle ${showSettings ? 'active' : ''}`}
                    onClick={() => setShowSettings(!showSettings)}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <circle cx="7" cy="7" r="2" stroke="currentColor" fill="none" />
                        <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.5 2.5l1.4 1.4M10.1 10.1l1.4 1.4M2.5 11.5l1.4-1.4M10.1 3.9l1.4-1.4" stroke="currentColor" strokeLinecap="round" />
                    </svg>
                    Table Settings
                </button>

                {showSettings && (
                    <div className="settings-panel">
                        <div className="setting-row setting-row-full">
                            <label>Table Name</label>
                            <input
                                type="text"
                                className="input-name"
                                value={table.name}
                                placeholder="Enter table name..."
                                onChange={(e) => updateTableMeta({ name: e.target.value })}
                            />
                        </div>
                        <div className="setting-row setting-row-full">
                            <label>Description</label>
                            <textarea
                                className="input-description"
                                value={table.description}
                                placeholder="Describe what this table is for..."
                                rows={2}
                                onChange={(e) => updateTableMeta({ description: e.target.value })}
                            />
                        </div>
                        <div className="setting-row">
                            <label>Max Roll (Die Type)</label>
                            <select
                                value={table.tableType || `d${table.maxRoll}`}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '2d6') {
                                        updateTableMeta({ tableType: '2d6', maxRoll: 12 });
                                    } else if (value === '2d8') {
                                        updateTableMeta({ tableType: '2d8', maxRoll: 16 });
                                    } else if (value === 'd66') {
                                        updateTableMeta({ tableType: 'd66', maxRoll: 66 });
                                    } else if (value === 'd88') {
                                        updateTableMeta({ tableType: 'd88', maxRoll: 88 });
                                    } else {
                                        // Standard dice: d6, d8, d10, d12, d20, d100
                                        const maxRoll = parseInt(value.replace('d', ''));
                                        updateTableMeta({ tableType: value, maxRoll });
                                    }
                                }}
                            >
                                <option value="d6">d6</option>
                                <option value="d8">d8</option>
                                <option value="d10">d10</option>
                                <option value="d12">d12</option>
                                <option value="d20">d20</option>
                                <option value="2d6">2d6</option>
                                <option value="2d8">2d8</option>
                                <option value="d66">d66</option>
                                <option value="d88">d88</option>
                                <option value="d100">d100</option>
                            </select>
                        </div>
                        <div className="setting-row setting-row-full">
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                className="input-tags"
                                value={table.tags.join(', ')}
                                placeholder="e.g., gemstone, treasure"
                                onChange={(e) => {
                                    const newTags = e.target.value
                                        .split(',')
                                        .map(t => t.trim())
                                        .filter(t => t.length > 0);
                                    updateTableMeta({ tags: newTags });
                                }}
                            />
                            <span className="setting-hint-inline">Used for [[ TAG ]] references</span>
                        </div>
                        <div className="setting-row">
                            <label>Auto-Number by Weight</label>
                            <button className="btn-sm" onClick={autoNumberRows}>
                                Apply Smart Numbering
                            </button>
                        </div>
                        <div className="setting-hint">
                            Total weight: {table.tableData.reduce((sum, row) => sum + (row.weight ?? 1), 0)}
                            {' '} | Suggested: d{suggestMaxRoll()}
                        </div>
                    </div>
                )}
            </div>

            {/* Table Header */}
            <div className="editor-header">
                <div className="header-cell"></div>
                <div className="header-cell cell-roll">ROLL</div>
                <div className="header-cell cell-weight">WT</div>
                <div className="header-cell cell-result">RESULT</div>
                <div className="header-cell cell-type">TYPE</div>
                <div className="header-cell cell-actions"></div>
            </div>

            {/* Table Body */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={table.tableData.map((_, i) => i)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="editor-body">
                        {table.tableData.map((row, rowIndex) => (
                            <SortableRow
                                key={rowIndex}
                                row={row}
                                rowIndex={rowIndex}
                                updateRow={updateRow}
                                deleteRow={deleteRow}
                                handleKeyDown={handleKeyDown}
                                dragOverCell={dragOverCell}
                                setDragOverCell={setDragOverCell}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <div className="editor-footer">
                <div className="footer-actions">
                    <button className="btn-add-row" onClick={addRow}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add Row
                    </button>
                    <button className="btn-import" onClick={() => setShowImport(true)}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d="M2 10v2h10v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                        Quick Import
                    </button>
                    <button className="btn-export" onClick={() => downloadMarkdown(table)} title="Export as Markdown">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M2 9v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                        Export MD
                    </button>
                </div>
                <span className="row-count">{table.tableData.length} rows</span>
            </div>

            <QuickImportModal
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onImport={handleImportRows}
            />
        </div>
    );
}
