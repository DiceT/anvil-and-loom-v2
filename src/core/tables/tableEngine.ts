/**
 * Table Rolling Engine
 *
 * Core logic for rolling on RollTables and resolving results.
 */

import { RollTable, TableRollResult, TableRow, MacroType } from './types';

/**
 * Roll a d100
 */
function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * Find the table row that matches the given roll value
 */
export function resolveRoll(table: RollTable, roll: number): TableRow | null {
  return table.tableData.find((row) => roll >= row.floor && roll <= row.ceiling) || null;
}

/**
 * Check if a result string is a macro
 */
export function isMacroResult(result: string): boolean {
  const macros = ['ACTION + THEME', 'DESCRIPTOR + FOCUS', 'ROLL TWICE', 'OBJECTIVES', 'THE WEAVE'];
  return macros.includes(result.trim().toUpperCase());
}

/**
 * Determine the macro type from a result string
 */
export function getMacroType(result: string): MacroType | null {
  const normalized = result.trim().toUpperCase();

  switch (normalized) {
    case 'ACTION + THEME':
      return 'ACTION_THEME';
    case 'DESCRIPTOR + FOCUS':
      return 'DESCRIPTOR_FOCUS';
    case 'ROLL TWICE':
      return 'ROLL_TWICE';
    case 'OBJECTIVES':
      return 'OBJECTIVES';
    case 'THE WEAVE':
      return 'THE_WEAVE';
    default:
      return null;
  }
}

/**
 * Roll on a table and return the result
 *
 * @param table - The table to roll on
 * @param explicitRoll - Optional explicit roll value (for testing/debugging)
 * @returns TableRollResult with roll value and result text
 */
import { diceEngine } from '../../integrations/anvil-dice-app';

/**
 * Roll on a table and return the result
 *
 * @param table - The table to roll on
 * @param explicitRoll - Optional explicit roll value (for testing/debugging)
 * @returns TableRollResult with roll value and result text
 */
export async function rollOnTable(table: RollTable, explicitRoll?: number): Promise<TableRollResult> {
  let roll = explicitRoll;

  if (roll === undefined) {
    try {
      // Try 3D dice first
      // If table has maxRoll, use it. Otherwise d100.
      const sides = table.maxRoll || 100;
      const notation = sides === 100 ? 'd%' : `d${sides}`;
      const result = await diceEngine.roll(notation, { meta: { suppressLog: true } });
      roll = result.total;
    } catch (error) {
      // Fallback to internal RNG if engine not ready or fails
      // console.warn('Dice engine unavailable, using fallback', error);
      roll = rollD100();
    }
  }

  const row = resolveRoll(table, roll);

  if (!row) {
    throw new Error(
      `Failed to resolve roll ${roll} on table ${table.id} (max: ${table.maxRoll})`
    );
  }

  const result = row.result;
  const isMacro = isMacroResult(result);
  const macroType = isMacro ? (getMacroType(result) ?? undefined) : undefined;

  return {
    tableId: table.id,
    tableName: table.name,
    roll,
    result,
    isMacro,
    macroType,
  };
}

/**
 * Roll on multiple tables (for combo oracles like Action + Theme)
 *
 * @param tables - Array of tables to roll on
 * @returns Array of TableRollResult
 */
export async function rollOnTables(tables: RollTable[]): Promise<TableRollResult[]> {
  return Promise.all(tables.map((table) => rollOnTable(table)));
}
