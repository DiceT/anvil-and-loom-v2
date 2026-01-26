import { DiceRollResult, DiceOptions, RollResult } from './types';
import { parseDiceExpression } from './diceParser';
import { useSettingsStore } from '../../stores/useSettingsStore';

import { diceEngine } from '../../integrations/anvil-dice-app';

export async function rollDie(sides: number): Promise<number> {
  try {
    const notation = sides === 100 ? 'd%' : `d${sides}`;
    const result = await diceEngine.roll(notation);
    return result.total;
  } catch (e) {
    return Math.floor(Math.random() * sides) + 1;
  }
}

export async function rollDiceExpression(
  expression: string,
  options?: DiceOptions
): Promise<DiceRollResult> {
  // Validate expression is not empty
  if (!expression || !expression.trim()) {
    throw new Error('Dice expression cannot be empty');
  }

  // Check if we can use the 3D engine first
  try {
    if (diceEngine.getEngineCore()) {
      // Create a compatible expression for the 3D engine (e.g. d100 -> d%)
      let engineExpression = expression.replace(/d100/g, 'd%');

      // River Pebble Interception (Global Check)
      const settings = useSettingsStore.getState().settings;
      if (settings?.dice?.enableRiverPebble) {
        // Replace d6 (not d66/d60 stuff) with driver
        engineExpression = engineExpression.replace(/d6(?!\d)/gi, 'driver');
      }

      const result = await diceEngine.roll(engineExpression);
      return {
        expression,
        total: result.total,
        rolls: result.breakdown?.map(r => ({
          value: r.value,
          sides: parseInt(r.type.replace('d', '')) || 0,
          kept: !r.dropped
        })) || [],
        modifier: result.modifier,
        meta: options?.meta
      };
    }
  } catch (e) {
    console.warn("3D Engine failed, using internal logic", e);
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
      // Fallback to naive random if we are here (engine didn't work)
      // or if we need to loop manually (which we shouldn't if we use engine)
      groupRolls.push({
        value: Math.floor(Math.random() * diceGroup.sides) + 1,
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
