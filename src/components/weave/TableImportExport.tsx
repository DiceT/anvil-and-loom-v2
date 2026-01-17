/**
 * TableImportExport - Component for importing and exporting Weave tables
 * 
 * Features:
 * - Export table to JSON file
 * - Import table from JSON file
 * - Bulk import rows from CSV/JSON
 * - Validation of imported data
 */

import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { WeaveService } from '../../core/weave/WeaveService';
import type { Table, TableRow } from '../../types/weave';

/**
 * Parse CSV content with support for quoted fields, escaped characters, and multi-line entries
 * @param content - CSV content to parse
 * @returns Array of parsed rows (arrays of strings)
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
      // Handle escaped quotes
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      // End of quoted field
      if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      // Regular character inside quotes
      currentField += char;
      i++;
    } else {
      // Start of quoted field
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      // Field separator
      if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }
      // Row separator (CRLF or LF)
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
      // Regular character
      currentField += char;
      i++;
    }
  }

  // Don't forget the last field and row
  if (currentField !== '' || inQuotes) {
    currentRow.push(currentField.trim());
  }
  if (currentRow.some(field => field !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Validate CSV row structure
 * @param row - Array of field values
 * @returns True if the row appears valid
 */
function isValidCSVRow(row: string[]): boolean {
  if (row.length < 2) return false;
  
  // First two fields should be numbers (floor and ceiling)
  const floor = parseInt(row[0]);
  const ceiling = parseInt(row[1]);
  
  return !isNaN(floor) && !isNaN(ceiling) && floor <= ceiling;
}

interface TableImportExportProps {
  table?: Table;
  onImportComplete?: (table: Table) => void;
  mode?: 'single' | 'bulk';
}

type ImportMode = 'table' | 'rows';

export function TableImportExport({ table, onImportComplete, mode = 'single' }: TableImportExportProps) {
  const { saveTable } = useWeaveStore();
  
  const [importMode, setImportMode] = useState<ImportMode>('table');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTable = async () => {
    if (!table) return;
    
    setIsExporting(true);
    try {
      const exportData = JSON.stringify(table, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export table:', err);
      setImportError('Failed to export table');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    setImportWarnings([]);

    try {
      const content = await file.text();
      
      if (file.name.endsWith('.json')) {
        await handleJsonImport(content);
      } else if (file.name.endsWith('.csv')) {
        if (importMode === 'table') {
          throw new Error('CSV import is only supported for bulk row import');
        }
        await handleCsvImport(content);
      } else {
        throw new Error('Unsupported file type. Please use .json or .csv files.');
      }
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleJsonImport = async (content: string) => {
    let data: unknown;
    
    try {
      data = JSON.parse(content);
    } catch (err) {
      throw new Error('Invalid JSON format');
    }

    if (importMode === 'table') {
      // Import entire table
      if (!isValidTable(data)) {
        throw new Error('Invalid table structure');
      }

      const importedTable = data as Table;
      
      // Validate table data
      const warnings = validateTableData(importedTable);
      setImportWarnings(warnings);

      // Create or update table
      const result = await WeaveService.saveTable({
        ...importedTable,
        id: crypto.randomUUID(), // Generate new ID for imported table
        sourcePath: `${importedTable.category || 'Uncategorized'}/${importedTable.name}.json`,
      });

      if (result.error || !result.table) {
        throw new Error(result.error || 'Failed to import table');
      }

      setImportSuccess(true);
      if (onImportComplete) {
        onImportComplete(result.table);
      }
    } else {
      // Import rows to existing table
      if (!table) {
        throw new Error('No table selected for row import');
      }

      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of rows');
      }

      const importedRows = data as unknown[];
      const validatedRows = importedRows.map((row, index) => {
        if (!isValidTableRow(row)) {
          throw new Error(`Invalid row at index ${index}`);
        }
        return row as TableRow;
      });

      // Add imported rows to table
      const updatedTable = {
        ...table,
        tableData: [...table.tableData, ...validatedRows],
      };

      await saveTable(updatedTable);
      setImportSuccess(true);
      if (onImportComplete) {
        onImportComplete(updatedTable);
      }
    }
  };

  const handleCsvImport = async (content: string) => {
    if (!table) {
      throw new Error('No table selected for row import');
    }

    if (!content.trim()) {
      throw new Error('CSV file is empty');
    }

    // Parse CSV using robust parser
    const parsedRows = parseCSV(content);
    
    if (parsedRows.length === 0) {
      throw new Error('No valid rows found in CSV file');
    }

    // Skip header row if it looks like a header (non-numeric first field)
    const startIndex = parsedRows.length > 1 && isNaN(parseInt(parsedRows[0][0])) ? 1 : 0;
    
    const newRows: TableRow[] = [];
    const validationErrors: string[] = [];

    for (let i = startIndex; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      
      if (!isValidCSVRow(row)) {
        validationErrors.push(`Row ${i + 1}: Invalid format (expected: floor, ceiling, result...)`);
        continue;
      }

      const floor = parseInt(row[0]);
      const ceiling = parseInt(row[1]);
      const result = row.slice(2).join(', ') || '';

      newRows.push({
        floor,
        ceiling,
        weight: 1,
        resultType: 'text',
        result,
      });
    }

    if (newRows.length === 0) {
      throw new Error('No valid rows could be imported. Check CSV format: floor,ceiling,result');
    }

    if (validationErrors.length > 0) {
      setImportWarnings([...importWarnings, ...validationErrors]);
    }

    // Add imported rows to table
    const updatedTable = {
      ...table,
      tableData: [...table.tableData, ...newRows],
    };

    await saveTable(updatedTable);
    setImportSuccess(true);
    if (onImportComplete) {
      onImportComplete(updatedTable);
    }
  };

  const isValidTable = (data: unknown): data is Table => {
    if (typeof data !== 'object' || data === null) return false;
    
    const table = data as Record<string, unknown>;
    return (
      typeof table.name === 'string' &&
      typeof table.maxRoll === 'number' &&
      Array.isArray(table.tableData) &&
      typeof table.schemaVersion === 'number'
    );
  };

  const isValidTableRow = (data: unknown): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    
    const row = data as Record<string, unknown>;
    return (
      typeof row.floor === 'number' &&
      typeof row.ceiling === 'number' &&
      typeof row.resultType === 'string' &&
      row.result !== undefined
    );
  };

  const validateTableData = (table: Table): string[] => {
    const warnings: string[] = [];

    // Check for gaps in roll ranges
    const sortedRows = [...table.tableData].sort((a, b) => a.floor - b.floor);
    for (let i = 1; i < sortedRows.length; i++) {
      if (sortedRows[i].floor > sortedRows[i - 1].ceiling + 1) {
        warnings.push(`Gap between rolls ${sortedRows[i - 1].ceiling} and ${sortedRows[i].floor}`);
      }
    }

    // Check for overlapping ranges
    for (let i = 0; i < sortedRows.length; i++) {
      for (let j = i + 1; j < sortedRows.length; j++) {
        if (rangesOverlap(sortedRows[i], sortedRows[j])) {
          warnings.push(`Overlapping roll ranges: ${sortedRows[i].floor}-${sortedRows[i].ceiling} and ${sortedRows[j].floor}-${sortedRows[j].ceiling}`);
        }
      }
    }

    // Check for empty results
    const emptyResults = table.tableData.filter(row => row.result === '' || row.result === null);
    if (emptyResults.length > 0) {
      warnings.push(`${emptyResults.length} row(s) have empty results`);
    }

    return warnings;
  };

  const rangesOverlap = (a: TableRow, b: TableRow): boolean => {
    return !(a.ceiling < b.floor || b.ceiling < a.floor);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    handleExportTable();
  };

  return (
    <div className="space-y-4">
      {/* Export Section */}
      {mode === 'single' && table && (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Table
          </h3>
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Export as JSON
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Section */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import
        </h3>

        {/* Import Mode Toggle */}
        {mode === 'single' && table && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setImportMode('table')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                importMode === 'table'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              disabled={isImporting}
            >
              Import Table
            </button>
            <button
              onClick={() => setImportMode('rows')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                importMode === 'rows'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              disabled={isImporting}
            >
              Import Rows
            </button>
          </div>
        )}

        {/* Import Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept={importMode === 'table' ? '.json' : '.json,.csv'}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isImporting}
        />
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import {importMode === 'table' ? 'Table' : 'Rows'}
            </>
          )}
        </button>

        {/* Success Message */}
        {importSuccess && (
          <div className="mt-3 p-3 bg-green-900/20 border border-green-700/50 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-400">
                {importMode === 'table' ? 'Table imported successfully!' : 'Rows imported successfully!'}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {importError && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-400">{importError}</p>
            </div>
          </div>
        )}

        {/* Warnings */}
        {importWarnings.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-400 font-medium">Import Warnings</p>
            </div>
            <ul className="space-y-1 ml-6">
              {importWarnings.map((warning, index) => (
                <li key={index} className="text-xs text-yellow-300">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-3 text-xs text-slate-500">
          <p>
            {importMode === 'table' 
              ? 'Import a table from a JSON file. The table will be added to your collection.'
              : 'Import rows from a JSON or CSV file to add to the current table.'}
          </p>
        </div>
      </div>
    </div>
  );
}
