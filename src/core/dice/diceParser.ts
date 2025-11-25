interface ParsedDice {
  count: number;
  sides: number;
  keepModifier?: 'kl' | 'kh'; // keep lowest or keep highest
  keepCount?: number; // how many dice to keep
}

interface ParsedExpression {
  dice: ParsedDice[];
  modifier: number;
}

export function parseDiceExpression(expression: string): ParsedExpression {
  // Normalize: lowercase, remove spaces, strip trailing operators
  let normalized = expression.toLowerCase().replace(/\s/g, '');
  normalized = normalized.replace(/[+\-]+$/, ''); // Strip trailing + or -

  const dice: ParsedDice[] = [];
  let modifier = 0;

  // Match patterns like: 2d6kh3, d20kl, 4d6kh3, 3d8, d100
  // Allow optional count (empty = 1), optional keep modifier (kh/kl), and optional keep count
  const diceRegex = /(\d*)d(\d+)(kh|kl)?(\d*)/g;
  let match;

  while ((match = diceRegex.exec(normalized)) !== null) {
    const count = match[1] ? parseInt(match[1], 10) : 1; // Default to 1 if empty
    const sides = parseInt(match[2], 10);
    const keepModifier = match[3] as 'kl' | 'kh' | undefined;
    const keepCount = match[4] ? parseInt(match[4], 10) : undefined;

    dice.push({ count, sides, keepModifier, keepCount });
  }

  // Match modifier at the end: +5, -2, etc.
  const modifierMatch = normalized.match(/([+\-]\d+)$/);
  if (modifierMatch) {
    modifier = parseInt(modifierMatch[1], 10);
  }

  return { dice, modifier };
}
