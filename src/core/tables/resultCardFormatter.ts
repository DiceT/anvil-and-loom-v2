/**
 * Result Card Formatter for Tables
 *
 * Formats table roll results into Result Cards
 */

import { TableRollResult, TableRegistry } from './types';
import { MacroResolutionResult } from './macroResolver';
import { logResultCard } from '../results/resultCardEngine';
import { getOraclesByTag } from './tableLoader';

/**
 * Format a single table roll as a result card
 *
 * @param roll - The table roll result
 * @param category - "ASPECT", "DOMAIN", "ORACLE"
 * @param parentName - For subtables: "Haunted", "Forest", etc.
 * @param packId - The pack ID for aspect/domain results (e.g., "haunted", "forest")
 */
export function formatTableRollCard(
  roll: TableRollResult,
  category: string,
  parentName?: string,
  packId?: string
): void {
  const header = parentName
    ? `${category}: ${parentName}: ${roll.tableName}`.toUpperCase()
    : `${category}: ${roll.tableName}`.toUpperCase();

  const content = `Roll: ${roll.roll}\nResult: ${roll.result}`;

  // Determine source based on category
  let source: 'aspect' | 'domain' | 'oracle' | 'table' = 'table';
  if (category.toUpperCase() === 'ASPECT') source = 'aspect';
  else if (category.toUpperCase() === 'DOMAIN') source = 'domain';
  else if (category.toUpperCase() === 'ORACLE') source = 'oracle';

  logResultCard({
    header,
    result: roll.result,
    content,
    source,
    meta: {
      tableId: roll.tableId,
      roll: roll.roll,
      packId: packId,
      packName: parentName,
    },
  });
}

/**
 * Format a combo oracle result (Action + Theme, Descriptor + Focus)
 */
export function formatComboOracleCard(
  macroResult: MacroResolutionResult,
  oracleLabel: string,
  registry: TableRegistry
): void {
  if (macroResult.type !== 'combo' || macroResult.rolls.length !== 2) {
    console.error('Invalid combo oracle result');
    return;
  }

  const [roll1, roll2] = macroResult.rolls;

  // Header: Just the oracle label (e.g., "ACTION + THEME")
  const header = oracleLabel.toUpperCase();

  // Result: "Advance + Shadows" (combined)
  const result = `${roll1.result} + ${roll2.result}`;

  // Content: Show each roll and which table was selected
  const tag1 = oracleLabel.split(' + ')[0].toLowerCase();
  const tag2 = oracleLabel.split(' + ')[1].toLowerCase();

  const tablesWithTag1 = getOraclesByTag(registry, tag1);
  const tablesWithTag2 = getOraclesByTag(registry, tag2);

  const contentLines = [
    `${roll1.tableName} (${roll1.roll}): ${roll1.result}`,
  ];

  // Only show selection info if there's more than one table with this tag
  if (tablesWithTag1.length > 1) {
    contentLines.push(`  Selected ${roll1.tableName} from ${tablesWithTag1.length} tables with '${tag1}' tag`);
  }

  contentLines.push('');
  contentLines.push(`${roll2.tableName} (${roll2.roll}): ${roll2.result}`);

  if (tablesWithTag2.length > 1) {
    contentLines.push(`  Selected ${roll2.tableName} from ${tablesWithTag2.length} tables with '${tag2}' tag`);
  }

  contentLines.push('');
  contentLines.push(`Prompt: "${roll1.result} ${roll2.result}"`);

  const content = contentLines.join('\n');

  logResultCard({
    header,
    result,
    content,
    source: 'oracle',
    meta: {
      oracleType: oracleLabel,
      rolls: macroResult.rolls,
      selectedTables: macroResult.selectedTables,
    },
  });
}

/**
 * Format a ROLL TWICE result
 */
export function formatRollTwiceCard(macroResult: MacroResolutionResult, tableName: string): void {
  if (macroResult.type !== 'repeat') {
    console.error('Invalid ROLL TWICE result');
    return;
  }

  const header = `TABLE: ${tableName} (ROLL TWICE)`.toUpperCase();

  const results = macroResult.rolls.map((r) => r.result);
  const result = results.join('\n');

  const content = macroResult.rolls
    .map((roll, index) => `Roll ${index + 1} (${roll.roll}): ${roll.result}`)
    .join('\n');

  logResultCard({
    header,
    result,
    content,
    source: 'table',
    meta: {
      sourceTableId: macroResult.sourceTableId,
      rolls: macroResult.rolls,
    },
  });
}

/**
 * Format an OBJECTIVES result
 */
export function formatObjectivesCard(
  macroResult: MacroResolutionResult,
  sourceTableName: string
): void {
  if (macroResult.type !== 'reference' || macroResult.rolls.length === 0) {
    console.error('Invalid OBJECTIVES result');
    return;
  }

  const roll = macroResult.rolls[0];

  const header = `TABLE: ${sourceTableName} → OBJECTIVES`.toUpperCase();
  const result = roll.result;

  const content = `Triggered by: ${sourceTableName}\nObjectives Roll (${roll.roll}): ${roll.result}`;

  logResultCard({
    header,
    result,
    content,
    source: 'table',
    meta: {
      sourceTableId: macroResult.sourceTableId,
      objectivesTableId: roll.tableId,
      roll: roll.roll,
    },
  });
}

/**
 * Format a THE WEAVE placeholder result
 */
export function formatTheWeaveCard(): void {
  logResultCard({
    header: 'THE WEAVE',
    result: 'Not yet implemented',
    content: 'THE WEAVE macro was rolled, but this feature is not yet implemented.',
    source: 'system',
    meta: {
      macroType: 'THE_WEAVE',
    },
  });
}
