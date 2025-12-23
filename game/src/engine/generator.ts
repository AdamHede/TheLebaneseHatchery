/**
 * Procedural union name and stats generator
 * 
 * Generates "union eggs" with satirically absurd names
 * and stats that reflect their dubious legitimacy.
 */

import { createRNG, type RNG } from './rng';
import type { UnionEntity } from './state';

// ============================================
// NAME PARTS (will move to JSON later)
// ============================================

const NAME_PARTS = {
    prefixes: [
        'United',
        'Democratic',
        'Free',
        'National',
        'Workers\'',
        'People\'s',
        'Progressive',
        'Independent',
        'Sovereign',
        'Authentic',
        'Reformed',
        'New',
    ],
    sectors: [
        'Textile',
        'Transport',
        'Municipal',
        'Agricultural',
        'Hospitality',
        'Construction',
        'Maritime',
        'Printing',
        'Banking',
        'Telecommunications',
        'Postal',
        'Railway',
    ],
    suffixes: [
        'Federation',
        'Syndicate',
        'Brotherhood',
        'Assembly',
        'Council',
        'Alliance',
        'Union',
        'Collective',
        'Association',
        'Movement',
    ],
    modifiers: [
        'of Greater Beirut',
        'of the North',
        'of the South',
        'of the Coast',
        'of Mount Lebanon',
        '(Reformed)',
        '(Unified)',
        '(Traditional)',
        '(Modernized)',
        '',
        '',
        '', // Empty strings for variety
    ],
};

// ============================================
// GENERATOR FUNCTIONS
// ============================================

let idCounter = 0;

function generateId(): string {
    return `union_${Date.now()}_${++idCounter}`;
}

/**
 * Generate a procedural union name
 */
export function generateUnionName(rng: RNG): { name: string; sector: string } {
    const prefix = rng.pick(NAME_PARTS.prefixes);
    const sector = rng.pick(NAME_PARTS.sectors);
    const suffix = rng.pick(NAME_PARTS.suffixes);
    const modifier = rng.pick(NAME_PARTS.modifiers);

    const name = modifier
        ? `${prefix} ${sector} ${suffix} ${modifier}`
        : `${prefix} ${sector} ${suffix}`;

    return { name: name.trim(), sector };
}

/**
 * Generate union stats
 * 
 * Stats are inversely correlated to reflect the core satire:
 * - High plausibility often means low integrity (paper unions)
 * - High integrity means harder to control (real workers)
 */
export function generateUnionStats(rng: RNG): {
    plausibility: number;
    loyalty: number;
    integrity: number;
    maintenanceCost: number;
    tags: string[];
} {
    // Roll base archetype
    const archetype = rng.weightedPick(
        ['shell', 'captured', 'authentic', 'volatile'],
        [40, 30, 20, 10]
    );

    let plausibility: number;
    let loyalty: number;
    let integrity: number;
    let maintenanceCost: number;
    const tags: string[] = [archetype];

    switch (archetype) {
        case 'shell':
            // Paper union: looks great, no workers
            plausibility = rng.nextInt(70, 95);
            loyalty = rng.nextInt(80, 100);
            integrity = rng.nextInt(5, 20);
            maintenanceCost = 0; // The Reform: Shells are free to keep
            tags.push('compliant');
            break;

        case 'captured':
            // Real workers, but controlled
            plausibility = rng.nextInt(50, 75);
            loyalty = rng.nextInt(60, 85);
            integrity = rng.nextInt(30, 50);
            maintenanceCost = 1; // Controlled unions are cheap
            break;

        case 'authentic':
            // Actual worker representation - dangerous
            plausibility = rng.nextInt(30, 60);
            loyalty = rng.nextInt(20, 50);
            integrity = rng.nextInt(70, 95);
            maintenanceCost = rng.nextInt(3, 5);
            tags.push('restless');
            break;

        case 'volatile':
            // Unpredictable wildcard
            plausibility = rng.nextInt(20, 80);
            loyalty = rng.nextInt(10, 40);
            integrity = rng.nextInt(40, 70);
            maintenanceCost = rng.nextInt(2, 4);
            tags.push('unpredictable');
            break;

        default:
            // Fallback
            plausibility = 50;
            loyalty = 50;
            integrity = 50;
            maintenanceCost = 2;
    }

    return { plausibility, loyalty, integrity, maintenanceCost, tags };
}

/**
 * Generate a complete new union entity
 */
export function generateUnion(rngOrSeed: RNG | number): UnionEntity {
    const rng = typeof rngOrSeed === 'number' ? createRNG(rngOrSeed) : rngOrSeed;

    const { name, sector } = generateUnionName(rng);
    const stats = generateUnionStats(rng);

    return {
        id: generateId(),
        name,
        sector,
        ...stats,
        isIncubated: false,
        isLicensed: false,
        isCracked: false,
    };
}

/**
 * Generate multiple unions
 */
export function generateUnions(rng: RNG, count: number): UnionEntity[] {
    return Array.from({ length: count }, () => generateUnion(rng));
}

// ============================================
// FEDERATION NAME GENERATOR
// ============================================

const FEDERATION_PREFIXES = [
    'General',
    'Central',
    'National',
    'United',
    'Federated',
    'Allied',
    'Combined',
];

const FEDERATION_SUFFIXES = [
    'Labor Coalition',
    'Workers\' Federation',
    'Trade Council',
    'Syndicate Alliance',
    'Union Bloc',
];

export function generateFederationName(
    rng: RNG,
    unions: UnionEntity[]
): string {
    const prefix = rng.pick(FEDERATION_PREFIXES);
    const suffix = rng.pick(FEDERATION_SUFFIXES);

    // Sometimes include a sector from member unions
    if (unions.length > 0 && rng.next() > 0.5) {
        const sector = rng.pick(unions).sector;
        return `${prefix} ${sector} ${suffix}`;
    }

    return `${prefix} ${suffix}`;
}
