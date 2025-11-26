import { logResultCard } from '../results/resultCardEngine';
import type { Weave, WeaveRow } from './weaveTypes';

function getRowLabel(row: WeaveRow): string {
  switch (row.targetType) {
    case 'aspect':
      return `Aspect: ${row.targetId}`;
    case 'domain':
      return `Domain: ${row.targetId}`;
    case 'oracle':
      return `Oracle: ${row.targetId}`;
    case 'oracleCombo':
      return `Oracle Combo: ${row.targetId}`;
    default:
      return row.targetId;
  }
}

export function logWeaveResult(weave: Weave, roll: number, row: WeaveRow): void {
  const targetLabel = getRowLabel(row);

  logResultCard({
    header: `Weave: ${weave.name}`,
    result: `${roll}/${weave.maxRoll} → ${targetLabel}`,
    content: [
      `Weave ID: ${weave.id}`,
      `Target Type: ${row.targetType}`,
      `Target ID: ${row.targetId}`
    ].join('\n'),
    source: 'weave',
    meta: {
      type: 'weave',
      weaveId: weave.id,
      rowId: row.id,
      roll,
      maxRoll: weave.maxRoll,
      targetType: row.targetType,
      targetId: row.targetId
    }
  });
}
