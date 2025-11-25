export interface RollResult {
  value: number;
  sides: number;
  kept?: boolean; // Whether this die was kept (for advantage/disadvantage)
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
