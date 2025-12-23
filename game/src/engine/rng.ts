/**
 * Seeded PRNG using Mulberry32 algorithm
 * 
 * Provides deterministic random number generation for reproducible runs.
 * Store the cursor state to resume RNG from any point.
 */

export type RNG = {
    /** Get next random float in [0, 1) */
    next(): number;
    /** Get next random integer in [min, max] inclusive */
    nextInt(min: number, max: number): number;
    /** Pick random item from array */
    pick<T>(items: T[]): T;
    /** Pick N random items from array (no duplicates) */
    pickN<T>(items: T[], n: number): T[];
    /** Weighted random selection */
    weightedPick<T>(items: T[], weights: number[]): T;
    /** Shuffle array (returns new array) */
    shuffle<T>(items: T[]): T[];
    /** Get current cursor state for serialization */
    getCursor(): number;
};

/**
 * Create a seeded RNG instance using Mulberry32
 */
export function createRNG(seed: number): RNG {
    let a = seed >>> 0;

    function next(): number {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function nextInt(min: number, max: number): number {
        return Math.floor(next() * (max - min + 1)) + min;
    }

    function pick<T>(items: T[]): T {
        if (items.length === 0) {
            throw new Error('Cannot pick from empty array');
        }
        return items[nextInt(0, items.length - 1)];
    }

    function pickN<T>(items: T[], n: number): T[] {
        if (n > items.length) {
            throw new Error(`Cannot pick ${n} items from array of length ${items.length}`);
        }
        const shuffled = shuffle(items);
        return shuffled.slice(0, n);
    }

    function weightedPick<T>(items: T[], weights: number[]): T {
        if (items.length !== weights.length) {
            throw new Error('Items and weights must have same length');
        }
        if (items.length === 0) {
            throw new Error('Cannot pick from empty array');
        }

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let roll = next() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            roll -= weights[i];
            if (roll <= 0) {
                return items[i];
            }
        }

        // Fallback (shouldn't happen with valid weights)
        return items[items.length - 1];
    }

    function shuffle<T>(items: T[]): T[] {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = nextInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function getCursor(): number {
        return a;
    }

    return {
        next,
        nextInt,
        pick,
        pickN,
        weightedPick,
        shuffle,
        getCursor,
    };
}
