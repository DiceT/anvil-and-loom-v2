/**
 * Seeded random number generator wrapper.
 * Provides deterministic random values when given the same seed.
 */

import seedrandom from 'seedrandom';
import { v4 as uuidv4 } from 'uuid';

export class SeededRNG {
    private rng: seedrandom.PRNG;
    public readonly seed: string;

    constructor(seed?: string) {
        this.seed = seed ?? uuidv4();
        this.rng = seedrandom(this.seed);
    }

    /** Returns a random float between 0 (inclusive) and 1 (exclusive) */
    random(): number {
        return this.rng();
    }

    /** Returns a random integer between min and max (inclusive) */
    int(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /** 
     * Rolls a d66 (two d6 combined as tens and ones).
     * Valid range: 11-16, 21-26, 31-36, 41-46, 51-56, 61-66
     */
    d66(): number {
        const tens = this.int(1, 6);
        const ones = this.int(1, 6);
        return tens * 10 + ones;
    }

    /**
     * Rolls a d88 (two d8 combined as tens and ones).
     * Valid range: 11-18, 21-28, ..., 81-88
     */
    d88(): number {
        const tens = this.int(1, 8);
        const ones = this.int(1, 8);
        return tens * 10 + ones;
    }
}
