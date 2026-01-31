/**
 * Weave Roll Logger
 * 
 * Formats Weave roll results for Thread Card engine.
 * Maps Weave roll data to Thread Card format:
 * - Table name → header
 * - Roll → content
 * - Result → result
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { createOracleCard } from '../../utils/threadCardFactory';
import type { RollResult, Table } from '../../types/weave';

export async function logWeaveRoll(
  tableName: string,
  table: Table,
  rollResult: RollResult
): Promise<void> {
  try {
    const { activeSessionId, addCard } = useSessionStore.getState();
    if (!activeSessionId) return;

    // Use the factory to create the card
    const card = createOracleCard(activeSessionId, {
      tableId: table.id,
      tableName: tableName,
      category: table.category,
      tableChain: rollResult.tableChain,
      rollValue: rollResult.rolls,
      result: formatResultDisplay(rollResult.result), // We still need this helper or logic
    });

    // Add custom metadata from weave if needed (buildContentAndMeta logic was complex, 
    // maybe we can simplify or keep it in meta?)
    // The factory sets basic meta. Let's restart buildContentAndMeta logic if we want rich text?
    // Actually createOracleCard expects simple args.
    // If we want the "Result Summary" with Aspect/Domain handling, we should probably keep buildContentAndMeta logic
    // but pass resultSummary as 'result'.

    // Let's re-use the helpers below (formatRollDisplay etc) but just for result string.
    const builtData = await buildContentAndMeta(rollResult, table);

    // Override factory defaults if we want specific formatting
    card.result = builtData.resultSummary;
    card.content = [
      { label: 'Roll', value: formatRollDisplay(rollResult.rolls), type: 'roll' },
      { label: 'Result', value: builtData.resultSummary }
    ];
    if (builtData.weaveMeta) {
      card.meta = { ...card.meta, ...builtData.weaveMeta };
    }

    addCard(card);

  } catch (error) {
    console.error('Failed to log Weave roll to Thread Card engine:', error);
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
    // Handle known object shapes
    const r = result as any;
    if (r.tag) return r.tag;
    if (r.name) return r.name;
    if (r.id) return r.id; // Fallback to ID if name missing

    // For table references or object results, stringify nicely
    return JSON.stringify(result, null, 2);
  }
  return String(result);
}

/**
 * Build content string and metadata
 * Format:
 * Roll: [Roll] --> [Result]
 * [Chain]
 * [Warnings]
 */
// Helper interface for the build result
interface BuildContentResult {
  content: string;
  resultSummary: string;
  weaveMeta: {
    resultType?: 'aspect' | 'domain' | 'macro' | 'table' | 'panel' | 'text';
    targetId?: string;
    targetLabel?: string;
  };
}

/**
 * Build content string and metadata
 */
async function buildContentAndMeta(rollResult: RollResult, table: Table): Promise<BuildContentResult> {
  const parts: string[] = [];

  // Format Roll line
  const rollVal = formatRollDisplay(rollResult.rolls);
  // Default result text from engine (might be chained result)
  let resultText = formatResultDisplay(rollResult.result);

  // Metadata extraction
  let rowType: 'aspect' | 'domain' | 'macro' | 'table' | 'panel' | 'text' = 'text';
  let targetId = '';
  let targetLabel = ''; // Init empty, will fill based on result

  if (rollResult.rolls.length > 0) {
    // Check Root Table Row
    const firstRoll = rollResult.rolls[0];
    const row = table.tableData.find(r => firstRoll >= r.floor && firstRoll <= r.ceiling);

    if (row) {
      // 1. Determine Type
      if (['aspect', 'domain', 'macro', 'table', 'panel'].includes(row.resultType)) {
        rowType = row.resultType as any;
      }

      // 2. Determine Content 
      // If we have a special type, we likely want the ROOT result (e.g. "Haunted"), NOT the chained result.
      const rowContent = formatResultDisplay(row.result);

      if (rowType !== 'text') {
        // For specific types, the intent comes from the row itself, not the chain
        resultText = rowContent;
      }

      // 3. Resolve Metadata
      if (rowType === 'macro') {
        // row.result might be the ID string OR an object { id: "..." }
        let rawId = '';
        if (typeof row.result === 'string') rawId = row.result;
        else if (typeof row.result === 'object' && (row.result as any).id) rawId = (row.result as any).id;
        else if (typeof row.result === 'object') rawId = JSON.stringify(row.result); // Fallback

        // Import store dynamically
        const { useMacroStore } = await import('../../stores/useMacroStore');
        const store = useMacroStore.getState();

        // Try exact ID match first
        let slot = store.slots.find(s => s.id === rawId);

        // Fallback: Try matching by specific name fields (Label is truncated)
        if (!slot) {
          slot = store.slots.find(s =>
            s.label === rawId ||
            s.oracleName === rawId ||
            s.tableName === rawId ||
            s.diceExpression === rawId ||
            s.clockName === rawId ||
            s.trackName === rawId ||
            s.panelTitle === rawId
          );
        }

        if (slot) {
          // Fix for Truncated Labels:
          // Use rawId (full name from table) if slot label seems truncated or missing
          const useFullName = rawId && (
            !slot.label ||
            slot.label.endsWith('...') ||
            slot.label.length < rawId.length
          );

          targetLabel = useFullName ? rawId : slot.label;
          targetId = slot.id; // The macro ID (Correct UUID for actions)
          resultText = targetLabel; // Display Name
        } else {
          targetId = rawId; // This might be the name
          targetLabel = rawId; // Display whatever we have
          resultText = rawId;
        }
      } else if (rowType === 'table') {
        // Table: Prefer ID, fallback to Name/Tag
        const r = row.result as any;
        if (typeof r === 'object') {
          targetId = r.id || r.tag || r.name || JSON.stringify(r);
          targetLabel = r.tag || r.name || "Table";
          resultText = targetLabel;
        } else {
          targetId = String(r);
          targetLabel = String(r);
        }
      } else if (rowType === 'panel') {
        // Panel: Usually just name (tag) or maybe a path
        const r = row.result as any;
        if (typeof r === 'object') {
          targetId = r.path || r.id || r.tag || "Panel";
          targetLabel = r.tag || r.name || "Panel";
          resultText = targetLabel;
        } else {
          targetId = String(r);
          targetLabel = String(r);
        }
      } else {
        // Aspect / Domain
        // The text IS the target.
        targetLabel = resultText;
        targetId = resultText;
      }
    }
  }

  // Infer Aspect/Domain from Category if not explicit on row
  if (rowType === 'text') {
    const cat = table.category || '';

    if (cat.startsWith('Aspect') || cat.includes('Aspect')) {
      // Only infer navigational link if this is the ROOT table for the Aspect
      // e.g. cat="Aspect - Haunted", name="Haunted"
      const aspectName = cat.replace('Aspect - ', '').replace('Aspect', '').trim();
      if ((aspectName && table.name === aspectName) || table.name === 'Aspect') {
        rowType = 'aspect';
        targetId = resultText;
        targetLabel = resultText;
      }
    } else if (cat.startsWith('Domain') || cat.includes('Domain')) {
      // Only infer navigational link if this is the ROOT table for the Domain
      const domainName = cat.replace('Domain - ', '').replace('Domain', '').trim();
      if ((domainName && table.name === domainName) || table.name === 'Domain') {
        rowType = 'domain';
        targetId = resultText;
        targetLabel = resultText;
      }
    }
  }

  // Content Line: Roll: ## --> Text Result
  // If special type, show only First Roll
  let displayRoll = rollVal;
  if (rowType !== 'text' && rollResult.rolls.length > 0) {
    displayRoll = String(rollResult.rolls[0]);
  }

  parts.push(`Roll: ${displayRoll} --> ${resultText}`);

  if (rowType === 'text' && rollResult.tableChain.length > 1) {
    parts.push(`Chain: ${rollResult.tableChain.join(' → ')}`);
  }

  if (rollResult.warnings.length > 0) {
    parts.push(`Warnings: ${rollResult.warnings.join('; ')}`);
  }

  // Result Summary (Bottom Bar)
  let resultSummary = resultText;
  if (rowType !== 'text') {
    // Capitalize first letter
    const typeLabel = rowType.charAt(0).toUpperCase() + rowType.slice(1);
    resultSummary = `${typeLabel}: ${resultText}`;
  }

  return {
    content: parts.join('\n'),
    resultSummary,
    weaveMeta: {
      resultType: rowType,
      targetId,
      targetLabel
    }
  };
}
