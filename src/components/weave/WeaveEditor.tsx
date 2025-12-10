import { useState, useEffect } from 'react';
import { Dices, Save, Plus, Trash2 } from 'lucide-react';
import { useWeaveStore } from '../../stores/useWeaveStore';
import { useTableStore } from '../../stores/useTableStore';
import { useTabStore } from '../../stores/useTabStore';
import { rollWeave } from '../../core/weave/weaveEngine';
import { logWeaveResult } from '../../core/weave/weaveResult';
import { recalculateRanges, generateRowId } from '../../core/weave/weaveUtils';
import type { Weave, WeaveRow, WeaveTargetType } from '../../core/weave/weaveTypes';

interface WeaveEditorProps {
  weaveId: string;
}

export function WeaveEditor({ weaveId }: WeaveEditorProps) {
  const { registry: weaveRegistry, updateWeave, saveWeave } = useWeaveStore();
  const { registry: tableRegistry } = useTableStore();
  const updateTabTitle = useTabStore((state) => state.updateTabTitle);

  const weave = weaveRegistry?.weaves.get(weaveId);

  const [localWeave, setLocalWeave] = useState<Weave | null>(weave || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (weave) {
      setLocalWeave(weave);
    }
  }, [weave]);

  if (!localWeave) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-slate-500">Weave not found</div>
      </div>
    );
  }

  const handleNameChange = (name: string) => {
    const updated = { ...localWeave, name };
    setLocalWeave(updated);
    updateTabTitle(weaveId, name);
  };

  const handleAuthorChange = (author: string) => {
    setLocalWeave({ ...localWeave, author });
  };

  const handleMaxRollChange = (maxRoll: number) => {
    const updated = {
      ...localWeave,
      maxRoll,
      rows: recalculateRanges(localWeave.rows, maxRoll),
    };
    setLocalWeave(updated);
  };

  const handleRowTypeChange = (rowId: string, targetType: WeaveTargetType) => {
    const updatedRows = localWeave.rows.map((row) =>
      row.id === rowId ? { ...row, targetType, targetId: '' } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };

  const handleRowTargetChange = (rowId: string, targetId: string) => {
    const updatedRows = localWeave.rows.map((row) =>
      row.id === rowId ? { ...row, targetId } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };

  const handleAddRow = () => {
    const newRow: WeaveRow = {
      id: generateRowId(),
      from: 0,
      to: 0,
      targetType: 'aspect',
      targetId: '',
    };
    const updatedRows = recalculateRanges([...localWeave.rows, newRow], localWeave.maxRoll);
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };

  const handleRemoveRow = (rowId: string) => {
    const updatedRows = localWeave.rows.filter((row) => row.id !== rowId);
    const recalculated = recalculateRanges(updatedRows, localWeave.maxRoll);
    setLocalWeave({ ...localWeave, rows: recalculated });
  };

  const handleRowRangeChange = (rowId: string, field: 'from' | 'to', value: number) => {
    const updatedRows = localWeave.rows.map((row) =>
      row.id === rowId ? { ...row, [field]: value } : row
    );
    setLocalWeave({ ...localWeave, rows: updatedRows });
  };

  const handleRoll = async () => {
    try {
      const { roll, row } = await rollWeave(localWeave);
      logWeaveResult(localWeave, roll, row);
    } catch (error) {
      console.error('Failed to roll weave:', error);
      alert(error instanceof Error ? error.message : 'Failed to roll weave');
    }
  };

  const handleSave = async () => {
    // Validate
    if (localWeave.rows.length === 0) {
      alert('Weave must have at least one row');
      return;
    }

    if (localWeave.maxRoll < localWeave.rows.length) {
      alert('Max roll must be at least equal to the number of rows');
      return;
    }

    // Check for empty target IDs
    const emptyTargets = localWeave.rows.filter((row) => !row.targetId);
    if (emptyTargets.length > 0) {
      alert('All rows must have a target selected');
      return;
    }

    setIsSaving(true);
    try {
      updateWeave(localWeave);
      await saveWeave(weaveId);
    } catch (error) {
      console.error('Failed to save weave:', error);
      alert('Failed to save weave');
    } finally {
      setIsSaving(false);
    }
  };

  const getTargetOptions = (targetType: WeaveTargetType): string[] => {
    if (!tableRegistry) return [];

    switch (targetType) {
      case 'aspect':
        return Array.from(tableRegistry.aspectPacks.keys()).sort();
      case 'domain':
        return Array.from(tableRegistry.domainPacks.keys()).sort();
      case 'oracle':
        return ['Action', 'Theme', 'Descriptor', 'Focus'];
      case 'oracleCombo':
        return ['Action + Theme', 'Descriptor + Focus'];
      default:
        return [];
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Weave Editor</h2>

        {/* Metadata Fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Name
            </label>
            <input
              type="text"
              value={localWeave.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Author
            </label>
            <input
              type="text"
              value={localWeave.author}
              onChange={(e) => handleAuthorChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Die Size
            </label>
            <select
              value={localWeave.maxRoll}
              onChange={(e) => handleMaxRollChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-slate-500"
            >
              <option value="4">d4</option>
              <option value="6">d6</option>
              <option value="8">d8</option>
              <option value="10">d10</option>
              <option value="12">d12</option>
              <option value="20">d20</option>
              <option value="100">d100</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRoll}
            disabled={localWeave.rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 rounded transition-colors"
          >
            <Dices className="w-4 h-4" />
            <span className="text-sm font-medium">Roll</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || localWeave.rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Rows Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                From
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                To
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Target
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {localWeave.rows.map((row, index) => {
              const isLastRow = index === localWeave.rows.length - 1;
              const targetOptions = getTargetOptions(row.targetType);

              return (
                <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-850">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.from}
                      onChange={(e) => handleRowRangeChange(row.id, 'from', Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500"
                      min={1}
                      max={localWeave.maxRoll}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.to}
                      onChange={(e) => handleRowRangeChange(row.id, 'to', Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500"
                      min={1}
                      max={localWeave.maxRoll}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.targetType}
                      onChange={(e) => handleRowTypeChange(row.id, e.target.value as WeaveTargetType)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500"
                    >
                      <option value="aspect">Aspect</option>
                      <option value="domain">Domain</option>
                      <option value="oracle">Oracle</option>
                      <option value="oracleCombo">Oracle Combo</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.targetId}
                      onChange={(e) => handleRowTargetChange(row.id, e.target.value)}
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-500"
                    >
                      <option value="">Select target...</option>
                      {targetOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {isLastRow && (
                        <button
                          onClick={handleAddRow}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          data-tooltip="Add row"
                        >
                          <Plus className="w-4 h-4 text-slate-400" />
                        </button>
                      )}
                      {isLastRow && localWeave.rows.length > 1 && (
                        <button
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                          data-tooltip="Remove row"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {localWeave.rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">No rows yet</p>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-300" />
              <span className="text-sm text-slate-300">Add First Row</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
