import { DiceRollResult, DiceOptions, RollResult } from './types';
import { parseDiceExpression } from './diceParser';

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export async function rollDiceExpression(
  expression: string,
  options?: DiceOptions
): Promise<DiceRollResult> {
  const parsed = parseDiceExpression(expression);

  const rolls: RollResult[] = [];

  // Roll all dice in the expression
  for (const diceGroup of parsed.dice) {
    for (let i = 0; i < diceGroup.count; i++) {
      rolls.push({
        value: rollDie(diceGroup.sides),
        sides: diceGroup.sides,
      });
    }
  }

  // Calculate total
  const diceTotal = rolls.reduce((sum, roll) => sum + roll.value, 0);
  const total = diceTotal + parsed.modifier;

  return {
    expression,
    total,
    rolls,
    modifier: parsed.modifier !== 0 ? parsed.modifier : undefined,
    meta: options?.meta,
  };
}
