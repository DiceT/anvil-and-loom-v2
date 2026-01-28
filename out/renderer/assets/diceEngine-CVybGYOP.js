import { d as diceEngine, u as useSettingsStore } from "./index-B67ULY0K.js";
import "uuid";
function parseDiceExpression(expression) {
  let normalized = expression.toLowerCase().replace(/\s/g, "");
  normalized = normalized.replace(/[+\-]+$/, "");
  const dice = [];
  let modifier = 0;
  const diceRegex = /(\d*)d(\d+)(kh|kl)?(\d*)/g;
  let match;
  while ((match = diceRegex.exec(normalized)) !== null) {
    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const keepModifier = match[3];
    const keepCount = match[4] ? parseInt(match[4], 10) : void 0;
    dice.push({ count, sides, keepModifier, keepCount });
  }
  const modifierMatch = normalized.match(/([+\-]\d+)$/);
  if (modifierMatch) {
    modifier = parseInt(modifierMatch[1], 10);
  }
  return { dice, modifier };
}
async function rollDiceExpression(expression, options) {
  if (!expression || !expression.trim()) {
    throw new Error("Dice expression cannot be empty");
  }
  try {
    if (diceEngine.getEngineCore()) {
      let engineExpression = expression.replace(/d100/g, "d%");
      const settings = useSettingsStore.getState().settings;
      if (settings?.dice?.enableRiverPebble) {
        engineExpression = engineExpression.replace(/d6(?!\d)/gi, "driver");
      }
      const result = await diceEngine.roll(engineExpression);
      return {
        expression,
        total: result.total,
        rolls: result.breakdown?.map((r) => ({
          value: r.value,
          sides: parseInt(r.type.replace("d", "")) || 0,
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
  if (parsed.dice.length === 0) {
    throw new Error(
      `Invalid dice expression: "${expression}". Expected format: XdY, dY, or XdY+Z`
    );
  }
  for (const diceGroup of parsed.dice) {
    if (diceGroup.sides < 1) {
      throw new Error(`Invalid die: d${diceGroup.sides}. Dice must have at least 1 side.`);
    }
    if (diceGroup.count < 1) {
      throw new Error(`Invalid die count: ${diceGroup.count}. Must roll at least 1 die.`);
    }
  }
  const rolls = [];
  for (const diceGroup of parsed.dice) {
    const groupRolls = [];
    for (let i = 0; i < diceGroup.count; i++) {
      groupRolls.push({
        value: Math.floor(Math.random() * diceGroup.sides) + 1,
        sides: diceGroup.sides,
        kept: false
      });
    }
    if (diceGroup.keepModifier) {
      const keepCount = diceGroup.keepCount ?? 1;
      if (diceGroup.keepModifier === "kh") {
        const sortedIndices = groupRolls.map((roll, idx) => ({ roll, idx })).sort((a, b) => b.roll.value - a.roll.value).slice(0, keepCount).map((item) => item.idx);
        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      } else if (diceGroup.keepModifier === "kl") {
        const sortedIndices = groupRolls.map((roll, idx) => ({ roll, idx })).sort((a, b) => a.roll.value - b.roll.value).slice(0, keepCount).map((item) => item.idx);
        sortedIndices.forEach((idx) => {
          groupRolls[idx].kept = true;
        });
      }
    } else {
      groupRolls.forEach((roll) => roll.kept = true);
    }
    rolls.push(...groupRolls);
  }
  const diceTotal = rolls.filter((roll) => roll.kept).reduce((sum, roll) => sum + roll.value, 0);
  const total = diceTotal + parsed.modifier;
  return {
    expression,
    total,
    rolls,
    modifier: parsed.modifier !== 0 ? parsed.modifier : void 0,
    meta: options?.meta
  };
}
export {
  rollDiceExpression
};
