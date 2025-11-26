import type { WeaveRow } from './weaveTypes';

/**
 * Auto-distributes ranges across rows to ensure all possible rolls are covered.
 * Distributes remainder evenly across first N rows.
 */
export function recalculateRanges(rows: WeaveRow[], maxRoll: number): WeaveRow[] {
  if (rows.length === 0) return rows;

  const base = Math.floor(maxRoll / rows.length);
  let remainder = maxRoll % rows.length;

  let current = 1;
  return rows.map(row => {
    const span = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;

    const from = current;
    const to = current + span - 1;
    current = to + 1;

    return { ...row, from, to };
  });
}

/**
 * Generates a unique row ID
 */
export function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a slug-safe ID from a name
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
