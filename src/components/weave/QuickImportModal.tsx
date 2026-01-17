/**
 * QuickImportModal - Modal for bulk row import with multiple format support
 * 
 * Features:
 * - Support for list, CSV, and JSON formats
 * - Format selector dropdown
 * - Text area for pasting content
 * - Preview of parsed rows before import
 * - Import and Cancel buttons
 */

import { useState, useEffect } from 'react';
import { X, Upload, FileText, List, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseList, listToTableRows } from '../../utils/listParser';
import type { Table, TableRow } from '../../types/weave';

type ImportFormat = 'list' | 'csv' | 'json';

interface QuickImportModalProps {
  table?: Table;
  onClose: () => void;
  onImport: (rows: TableRow[]) => void;
}

/**
 * Parse CSV content with support for quoted fields, escaped characters, and multi-line entries
 */
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }
      if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i += 2;
        continue;
      }
      if (char === '\n' || char === '\r') {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      }
      currentField += char;
      i++;
    }
  }

  if (currentField !== '' || inQuotes) {
    currentRow.push(currentField.trim());
  }
  if (currentRow.some(field => field !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

export function QuickImportModal({ table, onClose, onImport }: QuickImportModalProps) {
  const [format, setFormat] = useState<ImportFormat>('list');
  const [content, setContent] = useState('');
  const [parsedRows, setParsedRows] = useState<TableRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Parse content when format or content changes
  useEffect(() => {
    if (!content.trim()) {
      setParsedRows([]);
      setError(null);
      setIsValid(false);
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      let rows: TableRow[] = [];

      switch (format) {
        case 'list':
          const items = parseList(content);
          if (items.length === 0) {
            throw new Error('No valid list items found');
          }
          const maxRoll = table?.maxRoll || items.length;
          rows = listToTableRows(items, maxRoll);
          break;

        case 'csv':
          const csvRows = parseCSV(content);
          if (csvRows.length === 0) {
            throw new Error('No valid CSV rows found');
          }
          
          // Skip header row if it looks like a header
          const startIndex = csvRows.length > 1 && isNaN(parseInt(csvRows[0][0])) ? 1 : 0;
          
          for (let i = startIndex; i < csvRows.length; i++) {
            const row = csvRows[i];
            if (row.length < 2) continue;
            
            const floor = parseInt(row[0]);
            const ceiling = parseInt(row[1]);
            
            if (isNaN(floor) || isNaN(ceiling)) continue;
            
            rows.push({
              floor,
              ceiling,
              resultType: 'text',
              result: row.slice(2).join(', ') || '',
              weight: 1,
            });
          }
          
          if (rows.length === 0) {
            throw new Error('No valid CSV rows found. Format: floor,ceiling,result');
          }
          break;

        case 'json':
          const jsonData = JSON.parse(content);
          if (!Array.isArray(jsonData)) {
            throw new Error('JSON must be an array of table rows');
          }
          
          rows = jsonData.map((item, index) => {
            if (typeof item !== 'object' || item === null) {
              throw new Error(`Invalid row at index ${index}`);
            }
            
            const row = item as Record<string, unknown>;
            
            if (typeof row.floor !== 'number' || typeof row.ceiling !== 'number') {
              throw new Error(`Row at index ${index} is missing floor or ceiling`);
            }
            
            // Handle result field properly based on type
            let resultValue: string | { tag: string } | Record<string, unknown>;
            const resultType = (row.resultType as 'text' | 'table' | 'object') || 'text';
            
            if (resultType === 'table' && typeof row.result === 'object' && row.result !== null && 'tag' in row.result) {
              resultValue = { tag: String((row.result as { tag: unknown }).tag) };
            } else if (resultType === 'object' && typeof row.result === 'object' && row.result !== null) {
              resultValue = row.result as Record<string, unknown>;
            } else {
              resultValue = String(row.result || '');
            }
            
            return {
              floor: row.floor,
              ceiling: row.ceiling,
              resultType,
              result: resultValue,
              weight: typeof row.weight === 'number' ? row.weight : 1,
            };
          });
          
          if (rows.length === 0) {
            throw new Error('No valid JSON rows found');
          }
          break;
      }

      setParsedRows(rows);
      setIsValid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse content');
      setParsedRows([]);
      setIsValid(false);
    } finally {
      setIsParsing(false);
    }
  }, [content, format, table?.maxRoll]);

  const handleImport = () => {
    if (isValid && parsedRows.length > 0) {
      onImport(parsedRows);
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const getFormatIcon = (fmt: ImportFormat) => {
    switch (fmt) {
      case 'list': return <List className="w-4 h-4" />;
      case 'csv': return <FileText className="w-4 h-4" />;
      case 'json': return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatLabel = (fmt: ImportFormat) => {
    switch (fmt) {
      case 'list': return 'List';
      case 'csv': return 'CSV';
      case 'json': return 'JSON';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-200">Quick Import</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Format Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['list', 'csv', 'json'] as ImportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    format === fmt
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {getFormatIcon(fmt)}
                  {getFormatLabel(fmt)}
                </button>
              ))}
            </div>
          </div>

          {/* Format Help Text */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              {format === 'list' && 'Paste a numbered list (1., 2., 3.), bullet list (-, *), or plain text with one item per line.'}
              {format === 'csv' && 'Paste CSV data with format: floor,ceiling,result. Quoted fields and commas in results are supported.'}
              {format === 'json' && 'Paste a JSON array of table rows with floor, ceiling, resultType, and result fields.'}
            </p>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                format === 'list'
                  ? '1. First item\n2. Second item\n3. Third item'
                  : format === 'csv'
                  ? '1,2,First result\n3,4,Second result\n5,6,Third result'
                  : '[\n  {"floor": 1, "ceiling": 2, "resultType": "text", "result": "First result"},\n  {"floor": 3, "ceiling": 4, "resultType": "text", "result": "Second result"}\n]'
              }
              className="w-full h-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none font-mono"
            />
          </div>

          {/* Parsing Status */}
          {isParsing && (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Parsing...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Preview ({parsedRows.length} {parsedRows.length === 1 ? 'row' : 'rows'})
                </label>
                {isValid && (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Valid</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-1 px-2 font-medium">Roll</th>
                      <th className="text-left py-1 px-2 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, index) => (
                      <tr key={index} className="border-b border-slate-700/50 last:border-b-0">
                        <td className="py-1 px-2 text-slate-300 font-mono text-xs">
                          {row.floor}-{row.ceiling}
                        </td>
                        <td className="py-1 px-2 text-slate-400 text-xs truncate max-w-md">
                          {typeof row.result === 'string' ? row.result : JSON.stringify(row.result)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!isValid || parsedRows.length === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import {parsedRows.length} {parsedRows.length === 1 ? 'Row' : 'Rows'}
          </button>
        </div>
      </div>
    </div>
  );
}
