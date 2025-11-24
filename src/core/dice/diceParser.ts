interface ParsedDice {
  count: number;
  sides: number;
}

interface ParsedExpression {
  dice: ParsedDice[];
  modifier: number;
}

export function parseDiceExpression(expression: string): ParsedExpression {
  const normalized = expression.toLowerCase().replace(/\s/g, '');

  const dice: ParsedDice[] = [];
  let modifier = 0;

  // Match patterns like: 2d6, 1d20, 3d8, 1d100
  const diceRegex = /(\d+)d(\d+)/g;
  let match;

  while ((match = diceRegex.exec(normalized)) !== null) {
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    dice.push({ count, sides });
  }

  // Match modifier at the end: +5, -2, etc.
  const modifierMatch = normalized.match(/([+\-]\d+)$/);
  if (modifierMatch) {
    modifier = parseInt(modifierMatch[1], 10);
  }

  return { dice, modifier };
}
