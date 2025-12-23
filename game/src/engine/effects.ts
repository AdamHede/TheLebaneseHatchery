/**
 * Effect application and clamping logic
 * 
 * Centralizes all state mutations to ensure consistent clamping
 * and validation of resource/stat changes.
 */

import type { Resources, RunState, UnionEntity } from './state';
import { getCrackRisk } from './state';
import { createRNG } from './rng';

// ============================================
// CLAMP BOUNDARIES
// ============================================

export const CLAMPS = {
    // Resources
    paperwork: { min: 0, max: 10 },
    patronage: { min: 0, max: 20 },
    legitimacy: { min: 0, max: 100 },
    auditRisk: { min: 0, max: 100 },
    streetHeat: { min: 0, max: 100 },

    // Union stats
    plausibility: { min: 0, max: 100 },
    loyalty: { min: 0, max: 100 },
    integrity: { min: 0, max: 100 },
} as const;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ============================================
// RESOURCE EFFECTS
// ============================================

export type ResourceEffects = Partial<Resources>;

/**
 * Apply resource deltas with clamping
 */
export function applyResourceEffects(
    resources: Resources,
    effects: ResourceEffects
): Resources {
    return {
        paperwork: clamp(
            resources.paperwork + (effects.paperwork ?? 0),
            CLAMPS.paperwork.min,
            CLAMPS.paperwork.max
        ),
        patronage: clamp(
            resources.patronage + (effects.patronage ?? 0),
            CLAMPS.patronage.min,
            CLAMPS.patronage.max
        ),
        legitimacy: clamp(
            resources.legitimacy + (effects.legitimacy ?? 0),
            CLAMPS.legitimacy.min,
            CLAMPS.legitimacy.max
        ),
        auditRisk: clamp(
            resources.auditRisk + (effects.auditRisk ?? 0),
            CLAMPS.auditRisk.min,
            CLAMPS.auditRisk.max
        ),
        streetHeat: clamp(
            resources.streetHeat + (effects.streetHeat ?? 0),
            CLAMPS.streetHeat.min,
            CLAMPS.streetHeat.max
        ),
    };
}

// ============================================
// UNION STAT EFFECTS
// ============================================

export type UnionStatEffects = {
    plausibility?: number;
    loyalty?: number;
    integrity?: number;
};

/**
 * Apply stat changes to a union
 */
export function applyUnionEffects(
    union: UnionEntity,
    effects: UnionStatEffects
): UnionEntity {
    return {
        ...union,
        plausibility: clamp(
            union.plausibility + (effects.plausibility ?? 0),
            CLAMPS.plausibility.min,
            CLAMPS.plausibility.max
        ),
        loyalty: clamp(
            union.loyalty + (effects.loyalty ?? 0),
            CLAMPS.loyalty.min,
            CLAMPS.loyalty.max
        ),
        integrity: clamp(
            union.integrity + (effects.integrity ?? 0),
            CLAMPS.integrity.min,
            CLAMPS.integrity.max
        ),
    };
}

// ============================================
// UPKEEP CALCULATION
// ============================================

/**
 * Calculate end-of-cycle upkeep effects
 */
export function calculateUpkeep(state: RunState): ResourceEffects {
    const unionCount = Object.keys(state.unions).length;
    const federationCount = Object.keys(state.federations).length;
    const unions = Object.values(state.unions);

    // 1. Audit Risk: Base + Shell Risk
    // Shells are defined as maintaining 0 cost (or tagged 'compliant'/'shell' if we relied on tags, 
    // but generator now sets cost to 0 for shells).
    // Let's rely on low integrity (< 30) or specific tags to identify 'risk generating' shells.
    // For now, let's use the 'compliant' tag as a proxy for shells/paper unions.
    const shellCount = unions.filter(u => u.tags.includes('compliant') || u.tags.includes('shell')).length;

    // Each shell adds 1 risk per turn directly (accumulating time bomb)
    // Plus standard risk from scaling size
    const auditIncrease = Math.floor(unionCount / 5) + federationCount + shellCount;

    // 2. Paperwork Refresh
    // Stays at flat refresh for now to represent limited bureaucratic hours
    const paperworkRefresh = 6 - state.resources.paperwork;

    // 3. Patronage Income (The Reform)
    // Base 2 + 1 per Delegate controlled
    const totalDelegates = Object.values(state.federations)
        .filter(f => f.recognition === 'recognized')
        .reduce((sum, f) => sum + f.delegates, 0);

    // We want to ADD to current patronage, not set it to a fixed value?
    // The previous logic was: `paperwork: 3 - current` (refill to 3)
    // `auditRisk: increase` (add)
    // `streetHeat: decay` (add negative)

    // For Patronage, let's make it additive income.
    // User requested "massive boost", so Base 7.
    const patronageIncome = 7 + (totalDelegates * 1);

    // 4. Street Heat Decay
    const streetHeatDecay = state.resources.streetHeat > 0 ? -2 : 0;

    // 5. Legitimacy Decay from Shells
    // If you have too many shells, people start to notice.
    const legitimacyDecay = shellCount > 2 ? -(shellCount - 2) : 0;

    return {
        paperwork: paperworkRefresh, // Refill to 3
        patronage: patronageIncome, // Additive income
        auditRisk: auditIncrease,
        streetHeat: streetHeatDecay,
        legitimacy: legitimacyDecay,
    };
}

// ============================================
// CYCLE PROGRESSION
// ============================================

/**
 * Check for union cracks and handle dissolution
 * Returns updated unions and resource penalties
 */
function processCrackChecks(
    state: RunState
): { unions: Record<string, UnionEntity>; penalties: ResourceEffects } {
    const rng = createRNG(state.rngCursor);
    const unions = { ...state.unions };
    let legitimacyPenalty = 0;
    let auditPenalty = 0;

    for (const unionId of Object.keys(unions)) {
        const union = unions[unionId];

        // Skip already cracked unions or unions not yet licensed
        if (union.isCracked || !union.isLicensed) continue;

        const crackRisk = getCrackRisk(union);
        const roll = rng.nextInt(1, 100);

        if (roll <= crackRisk) {
            // Union cracked! Quiet dissolution
            unions[unionId] = {
                ...union,
                isCracked: true,
                isLicensed: false, // Lose licensed status
            };

            // Penalty for quiet dissolution
            legitimacyPenalty -= 2;
            auditPenalty += 2;
        }
    }

    return {
        unions,
        penalties: {
            legitimacy: legitimacyPenalty,
            auditRisk: auditPenalty,
        },
    };
}

/**
 * Apply all end-of-cycle effects
 */
export function applyCycleEnd(state: RunState): RunState {
    const upkeep = calculateUpkeep(state);

    // Process crack checks
    const { unions: updatedUnions, penalties } = processCrackChecks(state);

    // Combine upkeep and crack penalties
    const combinedEffects: ResourceEffects = {
        ...upkeep,
        legitimacy: (upkeep.legitimacy ?? 0) + (penalties.legitimacy ?? 0),
        auditRisk: (upkeep.auditRisk ?? 0) + (penalties.auditRisk ?? 0),
    };

    const newResources = applyResourceEffects(state.resources, combinedEffects);

    return {
        ...state,
        unions: updatedUnions,
        resources: newResources,
        cycle: state.cycle + 1,
        unionsGeneratedInCycle: false,
    };
}
