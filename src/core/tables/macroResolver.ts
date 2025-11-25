/**
 * Macro Resolver
 *
 * Handles resolution of macro results:
 * - ACTION + THEME
 * - DESCRIPTOR + FOCUS
 * - ROLL TWICE
 * - OBJECTIVES
 * - THE WEAVE
 */

import { TableRegistry, TableRollResult } from './types';
import { rollOnTable } from './tableEngine';
import { selectRandomOracleByTag, getTableById } from './tableLoader';
import { parseTableId, getParentId } from './tableId';

// ============================================================================
// Macro Resolution
// ============================================================================

export interface MacroResolutionResult {
  type: 'combo' | 'repeat' | 'reference' | 'placeholder';
  rolls: TableRollResult[];
  sourceTableId?: string;  // For OBJECTIVES, ROLL TWICE
  selectedTables?: string[]; // For ACTION+THEME, DESCRIPTOR+FOCUS
  message?: string;        // For THE WEAVE
}

/**
 * Resolve ACTION + THEME macro
 * Selects random action and theme oracle tables, rolls on each
 */
export function resolveActionTheme(registry: TableRegistry): MacroResolutionResult | null {
  const actionTable = selectRandomOracleByTag(registry, 'action');
  const themeTable = selectRandomOracleByTag(registry, 'theme');

  if (!actionTable || !themeTable) {
    console.error('Failed to find action or theme tables');
    return null;
  }

  const actionRoll = rollOnTable(actionTable);
  const themeRoll = rollOnTable(themeTable);

  return {
    type: 'combo',
    rolls: [actionRoll, themeRoll],
    selectedTables: [actionTable.id, themeTable.id],
  };
}

/**
 * Resolve DESCRIPTOR + FOCUS macro
 * Selects random descriptor and focus oracle tables, rolls on each
 */
export function resolveDescriptorFocus(registry: TableRegistry): MacroResolutionResult | null {
  const descriptorTable = selectRandomOracleByTag(registry, 'descriptor');
  const focusTable = selectRandomOracleByTag(registry, 'focus');

  if (!descriptorTable || !focusTable) {
    console.error('Failed to find descriptor or focus tables');
    return null;
  }

  const descriptorRoll = rollOnTable(descriptorTable);
  const focusRoll = rollOnTable(focusTable);

  return {
    type: 'combo',
    rolls: [descriptorRoll, focusRoll],
    selectedTables: [descriptorTable.id, focusTable.id],
  };
}

/**
 * Resolve ROLL TWICE macro
 * Rolls on the same table two more times
 *
 * @param registry - The table registry
 * @param sourceTableId - The table that produced the ROLL TWICE result
 * @param depth - Recursion depth to prevent infinite loops
 */
export function resolveRollTwice(
  registry: TableRegistry,
  sourceTableId: string,
  depth = 0
): MacroResolutionResult | null {
  if (depth > 5) {
    console.warn('ROLL TWICE recursion depth exceeded');
    return null;
  }

  const table = getTableById(registry, sourceTableId);
  if (!table) {
    console.error(`Table not found for ROLL TWICE: ${sourceTableId}`);
    return null;
  }

  const roll1 = rollOnTable(table);
  const roll2 = rollOnTable(table);

  const rolls: TableRollResult[] = [];

  // Add first roll (recursive if it's also a macro)
  if (roll1.isMacro && roll1.macroType === 'ROLL_TWICE') {
    const nested = resolveRollTwice(registry, sourceTableId, depth + 1);
    if (nested) {
      rolls.push(...nested.rolls);
    }
  } else {
    rolls.push(roll1);
  }

  // Add second roll (recursive if it's also a macro)
  if (roll2.isMacro && roll2.macroType === 'ROLL_TWICE') {
    const nested = resolveRollTwice(registry, sourceTableId, depth + 1);
    if (nested) {
      rolls.push(...nested.rolls);
    }
  } else {
    rolls.push(roll2);
  }

  return {
    type: 'repeat',
    rolls,
    sourceTableId,
  };
}

/**
 * Resolve OBJECTIVES macro
 * Rolls on the Objectives subtable of the current Aspect or Domain
 *
 * @param registry - The table registry
 * @param sourceTableId - The table that produced the OBJECTIVES result
 */
export function resolveObjectives(
  registry: TableRegistry,
  sourceTableId: string
): MacroResolutionResult | null {
  try {
    const parts = parseTableId(sourceTableId);

    if (parts.type !== 'aspect' && parts.type !== 'domain') {
      console.error('OBJECTIVES macro can only be used in Aspect/Domain tables');
      return null;
    }

    const parentId = getParentId(sourceTableId);
    if (!parentId) {
      console.error('Failed to determine parent for OBJECTIVES');
      return null;
    }

    // Build the Objectives table ID
    const objectivesTableId = `${parts.type}:${parentId}:objectives`;
    const objectivesTable = getTableById(registry, objectivesTableId);

    if (!objectivesTable) {
      console.error(`Objectives table not found: ${objectivesTableId}`);
      return null;
    }

    const roll = rollOnTable(objectivesTable);

    return {
      type: 'reference',
      rolls: [roll],
      sourceTableId,
    };
  } catch (error) {
    console.error('Error resolving OBJECTIVES:', error);
    return null;
  }
}

/**
 * Resolve THE WEAVE macro
 * For now, returns a placeholder message
 */
export function resolveTheWeave(): MacroResolutionResult {
  return {
    type: 'placeholder',
    rolls: [],
    message: 'THE WEAVE (not yet implemented)',
  };
}

/**
 * Main macro resolution dispatcher
 *
 * @param registry - The table registry
 * @param rollResult - The roll result that contains a macro
 * @param sourceTableId - The table the roll came from (for ROLL TWICE, OBJECTIVES)
 */
export function resolveMacro(
  registry: TableRegistry,
  rollResult: TableRollResult,
  sourceTableId?: string
): MacroResolutionResult | null {
  if (!rollResult.isMacro || !rollResult.macroType) {
    return null;
  }

  switch (rollResult.macroType) {
    case 'ACTION_THEME':
      return resolveActionTheme(registry);

    case 'DESCRIPTOR_FOCUS':
      return resolveDescriptorFocus(registry);

    case 'ROLL_TWICE':
      if (!sourceTableId) {
        console.error('ROLL TWICE requires sourceTableId');
        return null;
      }
      return resolveRollTwice(registry, sourceTableId);

    case 'OBJECTIVES':
      if (!sourceTableId) {
        console.error('OBJECTIVES requires sourceTableId');
        return null;
      }
      return resolveObjectives(registry, sourceTableId);

    case 'THE_WEAVE':
      return resolveTheWeave();

    default:
      console.warn(`Unknown macro type: ${rollResult.macroType}`);
      return null;
  }
}
