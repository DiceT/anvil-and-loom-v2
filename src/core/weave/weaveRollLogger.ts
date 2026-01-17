/**
 * Weave Roll Logger
 * 
 * Formats Weave roll results for Thread Card engine.
 * Maps Weave roll data to Thread Card format:
 * - Table name → header
 * - Roll → content
 * - Result → result
 */

import { logThread, LogThreadInput } from '../results/threadEngine';
import type { RollResult, Table } from '../../types/weave';

/**
 * Log a Weave table roll to the Thread Card engine
 * 
 * @param tableName - The name of the table that was rolled
 * @param table - The full table object (for metadata)
 * @param rollResult - The roll result from the table engine
 */
export function logWeaveRoll(
  tableName: string,
  table: Table,
  rollResult: RollResult
): void {
  try {
    // Format of roll value(s) for display
    const rollDisplay = formatRollDisplay(rollResult.rolls);

    // Format of result for display
    const resultDisplay = formatResultDisplay(rollResult.result);

    // Build content string with roll details
    const content = buildContentString(rollResult, tableName);

    // Create thread input
    const threadInput: LogThreadInput = {
      header: tableName,
      result: resultDisplay,
      content: content,
      source: 'weave',
      meta: {
        tableId: table.id,
        tableName: tableName,
        tableType: table.tableType,
        category: table.category,
        rollValue: rollDisplay,
        rolls: rollResult.rolls,
        seed: rollResult.seed,
        tableChain: rollResult.tableChain,
        warnings: rollResult.warnings,
      },
    };

    // Log to Thread Card engine
    logThread(threadInput);
  } catch (error) {
    console.error('Failed to log Weave roll to Thread Card engine:', error);
    // Don't throw - logging failures shouldn't break the roll
  }
}

/**
 * Format roll values for display
 */
function formatRollDisplay(rolls: number[]): string {
  if (rolls.length === 0) return 'N/A';
  if (rolls.length === 1) return String(rolls[0]);
  return rolls.join(' → ');
}

/**
 * Format result value for display
 */
function formatResultDisplay(result: unknown): string {
  if (typeof result === 'string') {
    return result;
  }
  if (typeof result === 'object' && result !== null) {
    // For table references or object results, stringify nicely
    return JSON.stringify(result, null, 2);
  }
  return String(result);
}

/**
 * Build content string with roll details
 */
function buildContentString(rollResult: RollResult, tableName: string): string {
  const parts: string[] = [];
  
  // Always add table name
  parts.push(`Table: ${tableName}`);
  
  // Always add roll value (die roll) - use formatRollDisplay which handles empty arrays
  parts.push(`Roll: ${formatRollDisplay(rollResult.rolls)}`);
  
  // Add table chain if multiple tables were rolled
  if (rollResult.tableChain.length > 1) {
    parts.push(`Table Chain: ${rollResult.tableChain.join(' → ')}`);
  }
  
  // Add warnings if any
  if (rollResult.warnings.length > 0) {
    parts.push(`Warnings: ${rollResult.warnings.join('; ')}`);
  }
  
  return parts.join('\n');
}
