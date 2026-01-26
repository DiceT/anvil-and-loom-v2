/**
 * WeaveAIPanel - AI-powered table operations panel for Weave
 *
 * Mirrors the-weave's AIPanel implementation.
 * Uses Anvil and Loom's AI settings from useAiStore.
 * 
 * Features:
 * - Generate new tables from prompts (with dice notation detection)
 * - Fill existing tables with AI-generated entries (target count approach)
 * - Review tables for quality and consistency
 */

import { useState } from 'react';
import { Sparkles, RotateCcw, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { weaveAIService } from '../../core/weave/WeaveAIService';
import { useAiStore } from '../../stores/useAiStore';
import type { Table, TableRow } from '../../types/weave';
import { v4 as uuidv4 } from 'uuid';

interface WeaveAIPanelProps {
  table?: Table | null;
  onGeneratedTable?: (table: Table) => void;
  onTableUpdated?: (table: Table) => void;
}

export function WeaveAIPanel({ table, onGeneratedTable, onTableUpdated }: WeaveAIPanelProps) {
  // Generate mode state
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [fillCount, setFillCount] = useState(10);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Check if AI is configured
  const isConfigured = useAiStore(state => state.isConfigured());

  /**
   * Handle Review - analyze table for quality and consistency
   */
  const handleReview = async () => {
    if (!table) return;
    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      const rows = table.tableData.map(row =>
        typeof row.result === 'string' ? row.result : JSON.stringify(row.result)
      );
      const result = await weaveAIService.reviewTable(table.name, table.description, rows);
      const suggestionMessages = result.suggestions.map(s => `• ${s}`).join('\n');
      setLastResult(`Suggestions:\n${suggestionMessages || 'No suggestions'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review table');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Generate - create a new table from prompt
   * Includes dice notation detection (d66, d88, 2dX)
   */
  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      // Detect dice notation in prompt
      const promptLower = generatePrompt.toLowerCase();
      const d66Match = promptLower.match(/\bd66\b/);
      const d88Match = promptLower.match(/\bd88\b/);
      const twoDiceMatch = promptLower.match(/\b2d(6|8|10|12|20)\b/);

      let entryCount = fillCount;
      let tableType: 'standard' | 'd66' | 'd88' | '2d6' | '2d8' | '2d10' | '2d12' | '2d20' = 'standard';
      let minRoll = 1;
      let maxRoll = fillCount;
      let bellCurveInstructions = '';

      if (d66Match) {
        entryCount = 36;
        tableType = 'd66';
        maxRoll = 66;
      } else if (d88Match) {
        entryCount = 64;
        tableType = 'd88';
        maxRoll = 88;
      } else if (twoDiceMatch) {
        const dieSize = parseInt(twoDiceMatch[1]);
        tableType = `2d${dieSize}` as typeof tableType;
        minRoll = 2;
        maxRoll = dieSize * 2;
        entryCount = maxRoll - minRoll + 1; // 2d6 = 11 entries (2-12)

        // Bell curve explanation for AI
        const midRoll = dieSize + 1; // Most common roll
        bellCurveInstructions = `
IMPORTANT - RARITY DISTRIBUTION:
This is a 2d${dieSize} table with a bell curve probability distribution.
- Rolls of ${minRoll} and ${maxRoll} are EXTREMELY RARE (most powerful/valuable/dangerous)
- Roll of ${midRoll} is the MOST COMMON (mundane/ordinary)
- Rarity increases as you move away from ${midRoll} in either direction

Order your ${entryCount} results from roll ${minRoll} to ${maxRoll}:
- Entry 1 (roll ${minRoll}): Extremely rare, legendary, or catastrophic
- Entries near ${Math.floor(entryCount / 2) + 1} (roll ${midRoll}): Common, ordinary, mundane
- Entry ${entryCount} (roll ${maxRoll}): Extremely rare, legendary, or exceptional

The items should reflect their probability - rare rolls deserve rare outcomes!`;
      }

      // Combine prompt with custom instructions and bell curve guidance
      let fullDescription = generatePrompt;
      if (bellCurveInstructions) {
        fullDescription += '\n' + bellCurveInstructions;
      }
      if (customInstructions) {
        fullDescription += '\n\nAdditional instructions: ' + customInstructions;
      }

      const result = await weaveAIService.generateTable(generatePrompt, fullDescription, entryCount);

      // Create table data with correct roll notation
      const tableData: TableRow[] = result.rows.map((row, index) => {
        let floor: number, ceiling: number;

        if (tableType === 'd66') {
          // d66: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
          const tens = Math.floor(index / 6) + 1;
          const ones = (index % 6) + 1;
          floor = tens * 10 + ones;
          ceiling = floor;
        } else if (tableType === 'd88') {
          // d88: 11-18, 21-28..., 81-88
          const tens = Math.floor(index / 8) + 1;
          const ones = (index % 8) + 1;
          floor = tens * 10 + ones;
          ceiling = floor;
        } else if (tableType.startsWith('2d')) {
          // 2dX: sequential from min to max
          floor = minRoll + index;
          ceiling = floor;
        } else {
          floor = row.floor;
          ceiling = row.ceiling;
        }

        return {
          floor,
          ceiling,
          weight: 1,
          resultType: 'text' as const,
          result: row.result,
        };
      });

      // Clean table name (remove dice notation)
      const tableName = generatePrompt
        .replace(/\bd66\b|\bd88\b|\b2d(6|8|10|12|20)\b/gi, '')
        .trim();

      const newTable: Table = {
        id: uuidv4(),
        schemaVersion: 1,
        sourcePath: `tables/${tableName.toLowerCase().replace(/\s+/g, '_')}.json`,
        name: tableName || generatePrompt,
        tags: tableType !== 'standard' ? [tableType] : [],
        description: generatePrompt,
        maxRoll: maxRoll,
        headers: ['ROLL', 'RESULT'],
        tableData,
      };

      onGeneratedTable?.(newTable);
      setLastResult(`Generated ${tableType !== 'standard' ? tableType.toUpperCase() + ' ' : ''}table "${newTable.name}" with ${newTable.tableData.length} entries`);
      setGeneratePrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate table');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Fill - add more rows to existing table
   * Uses target count approach (total rows desired)
   * Overwrites empty rows if available
   */
  const handleFill = async () => {
    if (!table) return;
    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      // 1. Filter out empty rows for context (so AI doesn't see 50 empty strings)
      const meaningfulRows = table.tableData
        .filter(row => {
          if (!row.result) return false;
          if (typeof row.result === 'string' && !row.result.trim()) return false;
          if (typeof row.result === 'object' && Object.keys(row.result).length === 0) return false; // Empty object
          // Checks for empty tag object if applicable, though usually result is string or {tag: ''}
          if (typeof row.result === 'object' && 'tag' in row.result && !row.result.tag) return false;
          return true;
        })
        .map(row =>
          typeof row.result === 'string' ? row.result : JSON.stringify(row.result)
        );

      const result = await weaveAIService.fillTable(table.name, table.description, meaningfulRows, fillCount);

      const generatedRows = result.rows;
      let currentIndex = 0;

      // 2. Merge into existing empty rows first
      const updatedTableData = table.tableData.map(row => {
        // If we still have generated rows and this row is "empty"
        const isEmpty = !row.result ||
          (typeof row.result === 'string' && !row.result.trim()) ||
          (typeof row.result === 'object' && Object.keys(row.result).length === 0) ||
          (typeof row.result === 'object' && 'tag' in row.result && !row.result.tag);

        if (isEmpty && currentIndex < generatedRows.length) {
          const genRow = generatedRows[currentIndex++];
          return {
            ...row,
            result: genRow.result,
            // Keep existing weights/floors if they exist, or update if we want AI control. 
            // Usually we just want to fill the content.
          };
        }
        return row;
      });

      // 3. Append remaining generated rows if any
      const newRows: TableRow[] = [];
      while (currentIndex < generatedRows.length) {
        const genRow = generatedRows[currentIndex++];
        newRows.push({
          floor: genRow.floor, // These floors might need adjustment if we are appending
          ceiling: genRow.ceiling,
          weight: 1,
          resultType: 'text' as const,
          result: genRow.result,
        });
      }

      // If we appended, we might need to fix floors/ceilings. 
      // But usually fillTable returns correct floors for the *whole* set? 
      // Or just the new ones? The service usually returns "N new rows".
      // If we matched them to existing empty slots, floors are fine. 
      // If we append, we need to ensure floors continue correctly.

      let finalTableData = [...updatedTableData, ...newRows];

      // Auto-renumber if we appended (simple check)
      if (newRows.length > 0) {
        const lastRow = updatedTableData[updatedTableData.length - 1];
        let startFloor = lastRow ? lastRow.ceiling + 1 : 1;

        finalTableData = [...updatedTableData];

        newRows.forEach(row => {
          finalTableData.push({
            ...row,
            floor: startFloor,
            ceiling: startFloor // Simplistic weight 1
          });
          startFloor++;
        });
      }

      const filledTable: Table = {
        ...table,
        tableData: finalTableData,
      };

      onTableUpdated?.(filledTable);
      setLastResult(`Added ${generatedRows.length} rows`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill table');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-slate-900 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">AI Not Configured</span>
        </div>
        <p className="text-sm text-slate-400">
          Configure your API key, endpoint, and model in Settings to enable AI features.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-canvas-panel">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-ruby" />
          <h2 className="text-lg font-semibold text-type-primary">AI Assistant</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Generate New Table */}
        <div className="bg-canvas-panel rounded-lg p-4">
          <h3 className="text-sm font-medium text-type-secondary mb-3">Generate New Table</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Table topic (e.g., Cursed Items, Random Encounters, d66 Treasures)"
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              className="w-full bg-canvas-surface border border-border rounded-lg px-3 py-2 text-sm text-type-primary placeholder-type-tertiary focus:outline-none focus:border-ruby"
            />
            <textarea
              className="w-full bg-canvas-surface border border-border rounded-lg px-3 py-2 text-sm text-type-primary placeholder-type-tertiary focus:outline-none focus:border-ruby resize-none"
              placeholder="Optional: Add detailed instructions (e.g., 'Focus on horror themes, each item should have a drawback')"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-type-tertiary">Entries</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={fillCount}
                  onChange={(e) => setFillCount(Number(e.target.value) || 10)}
                  className="w-20 bg-canvas-surface border border-border rounded px-2 py-1 text-sm text-type-primary focus:outline-none focus:border-ruby"
                />
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-ruby hover:opacity-90 disabled:bg-canvas-surface disabled:text-type-tertiary rounded-lg text-sm font-medium text-canvas transition-colors"
                onClick={handleGenerate}
                disabled={isLoading || !generatePrompt.trim()}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
            </div>
            <p className="text-xs text-type-tertiary">
              Tip: Include "d66", "d88", or "2d6" in your topic for automatic dice notation handling.
            </p>
          </div>
        </div>

        {/* Fill Table */}
        {table && (
          <div className="bg-canvas-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-type-secondary mb-3">Fill Current Table</h3>
            <p className="text-xs text-type-tertiary mb-3">
              Add more rows to "{table.name}" using AI
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-type-tertiary">Target Rows</label>
                <input
                  type="number"
                  min={table.tableData.length + 1}
                  value={fillCount}
                  onChange={(e) => setFillCount(Number(e.target.value))}
                  className="w-20 bg-canvas-surface border border-border rounded px-2 py-1 text-sm text-type-primary focus:outline-none focus:border-ruby"
                />
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-ruby hover:opacity-90 disabled:bg-canvas-surface disabled:text-type-tertiary rounded-lg text-sm font-medium text-canvas transition-colors"
                onClick={handleFill}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Fill Table
              </button>
            </div>
            <p className="text-xs text-type-tertiary mt-2">
              Currently {table.tableData.length} rows. Will add {Math.max(0, fillCount - table.tableData.length)} more.
            </p>
          </div>
        )}

        {/* Review Table */}
        {table && table.tableData.length > 0 && (
          <div className="bg-canvas-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-type-secondary mb-3">Review Table</h3>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-canvas-surface hover:bg-border disabled:bg-canvas-surface disabled:text-type-tertiary rounded-lg text-sm font-medium text-type-primary transition-colors"
              onClick={handleReview}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Check for Tone, Style & Duplicates
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-error/10 border border-error/50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {lastResult && !error && (
          <div className="bg-jade/10 border border-jade/50 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-jade flex-shrink-0 mt-0.5" />
            <p className="text-sm text-jade whitespace-pre-wrap">{lastResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
