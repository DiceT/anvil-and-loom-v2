import { rollDie } from '../dice/diceEngine';
import type { Weave, WeaveRow } from './weaveTypes';

export function rollWeave(weave: Weave): { roll: number; row: WeaveRow } {
  if (!weave.rows.length) {
    throw new Error(`Weave ${weave.id} has no rows`);
  }

  const roll = rollDie(weave.maxRoll);

  const row = weave.rows.find(r => roll >= r.from && roll <= r.to);
  if (!row) {
    throw new Error(`No row matched roll ${roll} in Weave ${weave.id}`);
  }

  return { roll, row };
}
