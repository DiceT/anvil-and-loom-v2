/**
 * WeaveMacroBar - Macro bar for quick rolling of frequently used tables
 *
 * Displays 4 macro slots in a horizontal layout. Each slot can hold up to 4 tables.
 * Clicking a slot rolls all tables in that slot and combines results with "+".
 * Supports drag-and-drop to add tables to slots.
 */

import React, { useState } from 'react';
import { Dices, Zap } from 'lucide-react';
import { WeaveMacroSlot } from './WeaveMacroSlot';
import { useWeaveStore } from '../../stores/useWeaveStore';
import type { MacroSlot } from '../../stores/useWeaveStore';

export function WeaveMacroBar() {
  const { macros, tables, rollMacroSlot, clearMacro, addTableToMacro } = useWeaveStore();
  const [rollingSlot, setRollingSlot] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleRoll = async (slotIndex: number) => {
    const slot = macros[slotIndex];
    if (slot.tables.length === 0) return;

    setRollingSlot(slotIndex);
    try {
      const result = await rollMacroSlot(slotIndex);
      setLastResult(result);

      // Auto-hide result after 5 seconds
      setTimeout(() => {
        setLastResult(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to roll macro slot:', err);
      setLastResult('Error rolling tables');
    } finally {
      setRollingSlot(null);
    }
  };

  const handleClear = (slotIndex: number) => {
    clearMacro(slotIndex);
  };

  const handleDrop = (slotIndex: number, tableId: string) => {
    addTableToMacro(slotIndex, tableId);
  };

  return (
    <div className="flex flex-col border-b border-border bg-canvas-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amethyst" />
          <span className="text-sm font-medium text-type-primary">Quick Roll Macros</span>
        </div>
        <div className="text-xs text-type-tertiary">
          Drag tables to slots · Click to roll
        </div>
      </div>

      {/* Macro Slots */}
      <div className="flex gap-2 p-3">
        {macros.map((slot: MacroSlot, index: number) => (
          <div key={index} className="flex-1">
            <WeaveMacroSlot
              slot={slot}
              slotIndex={index}
              tables={tables}
              onRoll={handleRoll}
              onClear={handleClear}
              onDrop={handleDrop}
            />
          </div>
        ))}
      </div>

      {/* Roll Result Display */}
      {lastResult && (
        <div className="px-3 pb-3">
          <div className="bg-amethyst/10 border border-amethyst/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Dices className="w-5 h-5 text-amethyst flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-amethyst font-medium mb-1">
                  Roll Result
                </div>
                <div className="text-sm text-type-primary break-words">
                  {lastResult}
                </div>
              </div>
              <button
                onClick={() => setLastResult(null)}
                className="flex-shrink-0 p-1 hover:bg-amethyst/20 rounded transition-colors"
                aria-label="Close result"
              >
                <svg className="w-4 h-4 text-type-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
