/**
 * TableTooltip - Tooltip component for table items
 *
 * Displays table information on hover including name, description, die type,
 * row count, and validation status when there are warnings or errors.
 */

import React from 'react';
import { FileText, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Table } from '../../types/weave';
import type { ValidationResult } from '../../stores/useWeaveStore';

interface TableTooltipProps {
  table: Table;
  validation: ValidationResult;
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function TableTooltip({
  table,
  validation,
  visible,
  position,
  onClose,
}: TableTooltipProps) {
  if (!visible) return null;

  const getDieTypeText = (maxRoll: number) => {
    if (maxRoll === 66) return 'd66';
    if (maxRoll === 88) return 'd88';
    return `d${maxRoll}`;
  };

  const getValidationIcon = () => {
    if (!validation.valid) {
      return <XCircle className="w-4 h-4 text-red-400" />;
    } else if (validation.warnings.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-400" />;
  };

  const getValidationText = () => {
    if (!validation.valid) {
      return 'Not Rollable';
    } else if (validation.warnings.length > 0) {
      return 'Has Warnings';
    }
    return 'Valid';
  };

  const getValidationColor = () => {
    if (!validation.valid) {
      return 'text-red-400';
    } else if (validation.warnings.length > 0) {
      return 'text-yellow-400';
    }
    return 'text-green-400';
  };

  return (
    <div
      className="fixed z-50 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-5 h-5 flex-shrink-0 text-purple-400" />
          <h3 className="font-semibold text-slate-200 truncate">{table.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-3">
          {table.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-800 rounded px-3 py-2">
          <div className="text-xs text-slate-500 mb-1">Die Type</div>
          <div className="text-sm font-medium text-slate-200">
            {getDieTypeText(table.maxRoll)}
          </div>
        </div>
        <div className="bg-slate-800 rounded px-3 py-2">
          <div className="text-xs text-slate-500 mb-1">Rows</div>
          <div className="text-sm font-medium text-slate-200">
            {table.tableData.length}
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`flex items-center gap-2 bg-slate-800 rounded px-3 py-2 ${getValidationColor()}`}>
        {getValidationIcon()}
        <span className="text-sm font-medium">{getValidationText()}</span>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-red-400 mb-1">Errors:</div>
          <ul className="text-xs text-red-300 space-y-0.5">
            {validation.errors.map((error, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-red-400">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-yellow-400 mb-1">Warnings:</div>
          <ul className="text-xs text-yellow-300 space-y-0.5">
            {validation.warnings.map((warning, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-yellow-400">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {table.tags && table.tags.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-slate-500 mb-1">Tags:</div>
          <div className="flex flex-wrap gap-1">
            {table.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
