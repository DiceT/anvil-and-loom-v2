import { DiceRollResult, DiceOptions, RollResult } from './types';
import { parseDiceExpression } from './diceParser';

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export async function rollDiceExpression(
  expression: string,
  options?: DiceOptions
): Promise<DiceRollResult> {
  // Validate expression is not empty
  if (!expression || !expression.trim()) {
    throw new Error('Dice expression cannot be empty');
  }

  const parsed = parseDiceExpression(expression);

  // Validate we have at least one die to roll
  if (parsed.dice.length === 0) {
    throw new Error(
      `Invalid dice expression: "${expression}". Expected format: XdY, dY, or XdY+Z`
    );
  }

  // Validate dice have valid sides
  for (const diceGroup of parsed.dice) {
    if (diceGroup.sides < 1) {
      throw new Error(`Invalid die: d${diceGroup.sides}. Dice must have at least 1 side.`);
    }
    if (diceGroup.count < 1) {
      throw new Error(`Invalid die count: ${diceGroup.count}. Must roll at least 1 die.`);
    }
  }

  const rolls: RollResult[] = [];

  // Roll all dice in the expression
  for (const diceGroup of parsed.dice) {
    const groupRolls: RollResult[] = [];

    for (let i = 0; i < diceGroup.count; i++) {
      groupRolls.push({
        value: rollDie(diceGroup.sides),
        sides: diceGroup.sides,
        kept: false,
      });
    }

    // Handle keep modifiers (advantage/disadvantage)
    if (diceGroup.keepModifier) {
      // Determine how many dice to keep (default to 1 if not specified)
      const keepCount = diceGroup.keepCount ?? 1;

      if (diceGroup.keepModifier === 'kh') {
        // Keep highest N dice
        // Sort by value descending and mark the first keepCount as kept
        const sortedIndices = groupRolls
          .map((roll, idx) => ({ roll, idx }))
          .sort((a, b) => b.roll.value - a.roll.value)
          .slice(0, keepCount)
          .map((item) => item.idx);

        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      } else if (diceGroup.keepModifier === 'kl') {
        // Keep lowest N dice
        // Sort by value ascending and mark the first keepCount as kept
        const sortedIndices = groupRolls
          .map((roll, idx) => ({ roll, idx }))
          .sort((a, b) => a.roll.value - b.roll.value)
          .slice(0, keepCount)
          .map((item) => item.idx);

        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      }
    } else {
      // No keep modifier, keep all dice
      groupRolls.forEach((roll) => (roll.kept = true));
    }

    rolls.push(...groupRolls);
  }

  // Calculate total (only from kept dice)
  const diceTotal = rolls
    .filter((roll) => roll.kept)
    .reduce((sum, roll) => sum + roll.value, 0);
  const total = diceTotal + parsed.modifier;

  return {
    expression,
    total,
    rolls,
    modifier: parsed.modifier !== 0 ? parsed.modifier : undefined,
    meta: options?.meta,
  };
}
