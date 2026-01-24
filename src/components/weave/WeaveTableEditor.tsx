/**
 * WeaveTableEditor - Table editor component for Weave tables
 *
 * Uses the shared TableEditor component from the-weave for exact UI parity.
 * Integrates with A&L's tab system, roll functionality, and AI panel.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dices, Sparkles, X } from 'lucide-react';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { WeaveService } from '../../core/weave/WeaveService';
import { WeaveAIPanel } from './WeaveAIPanel';
import { TableEditor } from './shared/TableEditor';
import type { Table, RollResult } from '../../types/weave';

interface WeaveTableEditorProps {
  tableId: string;
}

export function WeaveTableEditor({ tableId }: WeaveTableEditorProps) {
  const { tables, saveTable } = useWeaveStore();
  const [table, setTable] = useState<Table | null>(null);
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showRollResult, setShowRollResult] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load table data - check store first, then try loading from service if not found
  useEffect(() => {
    const foundTable = tables.find((t: Table) => t.id === tableId);
    if (foundTable) {
      setTable(foundTable);
    } else {
      // Table not in store yet - try loading directly from service
      WeaveService.loadTable(tableId)
        .then(loadedTable => {
          setTable(loadedTable);
        })
        .catch(err => {
          console.error('Failed to load table:', err);
        });
    }
  }, [tableId, tables]);

  // Handle table updates from the editor
  const handleTableUpdate = useCallback(async (updatedTable: Table) => {
    setTable(updatedTable);
    setHasUnsavedChanges(true);

    // Auto-save after a short delay
    try {
      await saveTable(updatedTable);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save table:', err);
    }
  }, [saveTable]);

  // Handle AI-generated table
  const handleTableGenerated = (generatedTable: Table) => {
    handleTableUpdate(generatedTable);
  };

  // Handle AI-updated table
  const handleTableUpdated = (updatedTable: Table) => {
    handleTableUpdate(updatedTable);
  };

  // Roll the table
  const handleRoll = async () => {
    if (!table) return;

    setIsRolling(true);
    setShowRollResult(false);

    try {
      const result = await WeaveService.roll(table.id);
      setRollResult(result);
      setShowRollResult(true);
    } catch (err) {
      console.error('Failed to roll table:', err);
      alert('Failed to roll table. Please try again.');
    } finally {
      setIsRolling(false);
    }
  };

  const getDieTypeText = (maxRoll: number) => {
    if (maxRoll === 66) return 'd66';
    if (maxRoll === 88) return 'd88';
    return `d${maxRoll}`;
  };

  if (!table) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <p>Loading table...</p>
        </div>
      </div>
    );
  }

  const isNotRollable = table.tableData.length === 0;

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* A&L-specific Header with Roll and AI buttons */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-canvas-panel">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-type-primary">
            {table.name}
          </h2>
          <span className="text-xs text-type-tertiary bg-canvas-surface px-2 py-1 rounded">
            {getDieTypeText(table.maxRoll)}
          </span>
          <span className="text-xs text-type-tertiary">
            {table.tableData.length} row{table.tableData.length !== 1 ? 's' : ''}
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs text-warning">• Saving...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${showAIPanel
              ? 'bg-ruby text-canvas'
              : 'text-type-secondary hover:text-type-primary hover:bg-canvas-surface'
              }`}
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>

          <button
            onClick={handleRoll}
            disabled={isRolling || isNotRollable}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${isRolling
              ? 'bg-canvas-surface text-type-tertiary cursor-not-allowed'
              : isNotRollable
                ? 'bg-canvas-surface text-type-tertiary cursor-not-allowed'
                : 'bg-gold hover:opacity-90 text-canvas'
              }`}
          >
            {isRolling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-canvas" />
                Rolling...
              </>
            ) : (
              <>
                <Dices className="w-4 h-4" />
                Roll
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roll Result Display */}
      {showRollResult && rollResult && (
        <div className="px-4 py-3 bg-jade/10 border-b border-jade/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-jade/20 flex items-center justify-center">
              <Dices className="w-5 h-5 text-jade" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-jade font-medium mb-1">
                Roll Result: {rollResult.rolls[0]}/{table.maxRoll}
              </div>
              <div className="text-type-secondary">
                {typeof rollResult.result === 'string' ? rollResult.result : JSON.stringify(rollResult.result)}
              </div>
              {rollResult.warnings.length > 0 && (
                <div className="mt-2 text-xs text-warning">
                  {rollResult.warnings.join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowRollResult(false)}
              className="text-type-tertiary hover:text-type-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Shared TableEditor Component */}
      <div className="flex-1 overflow-auto p-4">
        <TableEditor
          table={table}
          onUpdate={handleTableUpdate}
        />
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="border-t border-border bg-canvas">
          <WeaveAIPanel
            table={table}
            onGeneratedTable={handleTableGenerated}
            onTableUpdated={handleTableUpdated}
          />
        </div>
      )}
    </div>
  );
}
