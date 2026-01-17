/**
 * RandomTableEngine - Core rolling logic for the Random Table Generator.
 * 
 * Handles:
 * - Seeded RNG for deterministic results
 * - Row matching against floor/ceiling ranges
 * - Gap handling (no match)
 * - Duplicate match resolution
 * - d66/d88 domain support
 * - 2dX (2d6, 2d8, 2d10, 2d12, 2d20) support
 * 
 * Note: This engine does NOT handle token resolution.
 * Token resolution is handled by TokenResolver as a separate layer.
 */

import type { Table, TableRow, RollResult, RollOptions } from '../../types/weave';
import { SeededRNG } from './SeededRNG';

/** Roll mode determines how the roll value is generated */
export type RollMode = 'standard' | 'd66' | 'd88' | '2d6' | '2d8' | '2d10' | '2d12' | '2d20';

/**
 * Determines the roll mode based on table tags or maxRoll value.
 */
export function getRollMode(table: Table): RollMode {
    // Check tags first for explicit dice notation (with safety check)
    const tags = table.tags || [];
    const diceTag = tags.find(t => /^(d66|d88|2d\d+)$/i.test(t));
    if (diceTag) {
        const lowerTag = diceTag.toLowerCase();
        if (lowerTag === 'd66') return 'd66';
        if (lowerTag === 'd88') return 'd88';
        if (/^2d(6|8|10|12|20)$/.test(lowerTag)) return lowerTag as RollMode;
    }

    // Fallback to maxRoll detection for legacy tables
    if (table.maxRoll === 66) return 'd66';
    if (table.maxRoll === 88) return 'd88';

    return 'standard';
}

export class RandomTableEngine {
    /**
     * Rolls on a table and returns the result.
     * Does NOT resolve tokens - that's a separate layer.
     */
    roll(table: Table, options: RollOptions = {}): RollResult {
        const rng = new SeededRNG(options.seed);
        const warnings: string[] = [];

        // Determine roll value
        const rollValue = options.rollValue ?? this.generateRollValue(rng, table);

        // Find matching rows
        const matches = this.findMatchingRows(table.tableData, rollValue);

        // Handle results
        let selectedRow: TableRow | null = null;

        if (matches.length === 0) {
            warnings.push(`No match found for roll ${rollValue} on table "${table.name}"`);
        } else if (matches.length === 1) {
            selectedRow = matches[0];
        } else {
            // Multiple matches - randomly select one and warn
            warnings.push(`Multiple matches (${matches.length}) for roll ${rollValue} on table "${table.name}"`);
            const index = rng.int(0, matches.length - 1);
            selectedRow = matches[index];
        }

        return {
            seed: rng.seed,
            tableChain: [table.name],
            rolls: [rollValue],
            warnings,
            result: selectedRow?.result ?? '[NO MATCH]',
        };
    }

    private generateRollValue(rng: SeededRNG, table: Table): number {
        const mode = getRollMode(table);

        switch (mode) {
            case 'd66':
                return rng.d66();
            case 'd88':
                return rng.d88();
            case '2d6':
                return rng.int(1, 6) + rng.int(1, 6);
            case '2d8':
                return rng.int(1, 8) + rng.int(1, 8);
            case '2d10':
                return rng.int(1, 10) + rng.int(1, 10);
            case '2d12':
                return rng.int(1, 12) + rng.int(1, 12);
            case '2d20':
                return rng.int(1, 20) + rng.int(1, 20);
            default:
                return rng.int(1, table.maxRoll);
        }
    }

    private findMatchingRows(tableData: TableRow[], rollValue: number): TableRow[] {
        return tableData.filter(row =>
            rollValue >= row.floor && rollValue <= row.ceiling
        );
    }
}
