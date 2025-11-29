import { logThread } from '../results/threadEngine';
import type { Weave, WeaveRow } from './weaveTypes';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRowLabel(row: WeaveRow): string {
  switch (row.targetType) {
    case 'aspect':
      return `Aspect: ${capitalize(row.targetId)}`;
    case 'domain':
      return `Domain: ${capitalize(row.targetId)}`;
    case 'oracle':
      return `Oracle: ${row.targetId}`;
    case 'oracleCombo':
      return row.targetId;
    default:
      return row.targetId;
  }
}

export function logWeaveResult(weave: Weave, roll: number, row: WeaveRow): void {
  const targetLabel = getRowLabel(row);

  logThread({
    header: `Weave: ${weave.name}`,
    result: targetLabel,
    content: `Roll: ${roll}`,
    source: 'weave',
    meta: {
      type: 'weave',
      weaveId: weave.id,
      rowId: row.id,
      roll,
      maxRoll: weave.maxRoll,
      targetType: row.targetType,
      targetId: row.targetId,
    },
  });
}
