export interface RollResult {
  value: number;
  sides: number;
}

export interface DiceRollResult {
  expression: string;
  total: number;
  rolls: RollResult[];
  modifier?: number;
  meta?: Record<string, unknown>;
}

export interface DiceOptions {
  // Reserved for future extensions (e.g., advantage, disadvantage)
  meta?: Record<string, unknown>;
}
