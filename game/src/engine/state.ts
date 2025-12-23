/**
 * Core game state types for The Hatchery
 * 
 * Key mechanic: Federations yield FIXED delegates (2) regardless of
 * actual worker representation - rewarding bureaucratic manipulation.
 */

// ============================================
// RESOURCE TYPES
// ============================================

export type Resources = {
  /** Actions available per cycle */
  paperwork: number;
  /** Political protection & acceleration */
  patronage: number;
  /** Public trust (0-100) - at 0, you lose */
  legitimacy: number;
  /** Investigation probability (0-100) - at 100, you're purged */
  auditRisk: number;
  /** Mobilization risk (0-100) - at 100, shutdown */
  streetHeat: number;
};

// ============================================
// ENTITY TYPES
// ============================================

export type UnionEntity = {
  id: string;
  name: string;
  sector: string;
  /** How "real" the union looks (0-100) */
  plausibility: number;
  /** Obedience to player (0-100) */
  loyalty: number;
  /** Actual worker representation (0-100) */
  integrity: number;
  /** Cost per cycle to maintain */
  maintenanceCost: number;
  tags: string[];
  /** Whether it's been through incubation */
  isIncubated: boolean;
  /** Whether it can be bundled into a federation */
  isLicensed: boolean;
  /** Whether it has cracked (exposed/dissolved) */
  isCracked: boolean;
  /** Last incubation mode used */
  incubationMode?: 'paperwork' | 'discipline';
};

export type FederationEntity = {
  id: string;
  name: string;
  unionIds: string[];
  /** ALWAYS 2 - this is THE core mechanic */
  delegates: 2;
  recognition: 'recognized' | 'unrecognized';
  /** How visible to auditors (0-100) */
  visibility: number;
};

// ============================================
// GAME STATE
// ============================================

export type GamePhase = 'menu' | 'playing' | 'event' | 'election' | 'ended';

export type Ending = 'capture' | 'collapse' | 'whistleblower' | null;

export type RunState = {
  /** RNG seed for reproducibility */
  seed: number;
  /** Current RNG state */
  rngCursor: number;
  /** Current cycle (1-indexed) */
  cycle: number;
  /** Maximum cycles before election */
  maxCycles: number;
  /** Current game phase */
  phase: GamePhase;
  /** Player resources */
  resources: Resources;
  /** All unions (keyed by id) */
  unions: Record<string, UnionEntity>;
  /** All federations (keyed by id) */
  federations: Record<string, FederationEntity>;
  /** IDs of events that have occurred */
  eventHistory: string[];
  /** Current event being displayed (if in 'event' phase) */
  currentEventId: string | null;
  /** Footnote IDs unlocked by player */
  unlockedFootnotes: string[];
  /** How the run ended */
  ending: Ending;
  /** Whether to show tutorial tips */
  showTips: boolean;
  /** Whether unions have already been generated in the current cycle */
  unionsGeneratedInCycle: boolean;
};

// ============================================
// INITIAL STATE
// ============================================

export const DEFAULT_RESOURCES: Resources = {
  paperwork: 3,
  patronage: 5,
  legitimacy: 70,
  auditRisk: 10,
  streetHeat: 5,
};

export function createInitialState(seed?: number, showTips: boolean = false): RunState {
  console.log('[createInitialState] Called with seed:', seed);
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  console.log('[createInitialState] Actual seed:', actualSeed);

  const state: RunState = {
    seed: actualSeed,
    rngCursor: actualSeed,
    cycle: 1,
    maxCycles: 5,
    phase: 'menu',
    resources: { ...DEFAULT_RESOURCES },
    unions: {},
    federations: {},
    eventHistory: [],
    currentEventId: null,
    unlockedFootnotes: [],
    ending: null,
    showTips,
    unionsGeneratedInCycle: false,
  };

  console.log('[createInitialState] Created state with phase:', state.phase);
  return state;
}

// ============================================
// DERIVED STATE SELECTORS
// ============================================

/** Calculate total delegates from all recognized federations */
export function getTotalDelegates(state: RunState): number {
  return Object.values(state.federations)
    .filter(f => f.recognition === 'recognized')
    .reduce((sum, f) => sum + f.delegates, 0);
}

/** Get all licensed unions not yet in a federation */
export function getAvailableUnions(state: RunState): UnionEntity[] {
  const usedUnionIds = new Set(
    Object.values(state.federations).flatMap(f => f.unionIds)
  );

  return Object.values(state.unions)
    .filter(u => u.isLicensed && !usedUnionIds.has(u.id));
}

/** Check if any lose condition is met */
export function checkLoseCondition(state: RunState): 'legitimacy' | 'audit' | 'street' | null {
  if (state.resources.legitimacy <= 0) return 'legitimacy';
  if (state.resources.auditRisk >= 100) return 'audit';
  if (state.resources.streetHeat >= 100) return 'street';
  return null;
}

/** Calculate total maintenance cost */
export function getTotalMaintenanceCost(state: RunState): number {
  return Object.values(state.unions).reduce((sum, u) => sum + u.maintenanceCost, 0);
}

// ============================================
// PROBABILITY CALCULATIONS
// ============================================

/**
 * Calculate license success chance based on plausibility
 * Higher plausibility = higher chance of successful licensing
 * Range: 30-95%
 */
export function getLicenseChance(union: UnionEntity): number {
  // Base 30% + 0.6 * plausibility
  // At plausibility 50: 60%
  // At plausibility 100: 90%
  // At plausibility 0: 30%
  return Math.min(95, 30 + Math.floor(union.plausibility * 0.6));
}

/**
 * Calculate crack risk per cycle based on integrity
 * Lower integrity = higher crack risk (shells are fragile)
 * Range: 5-40%
 */
export function getCrackRisk(union: UnionEntity): number {
  // Low integrity = high crack risk
  // At integrity 0: 40%
  // At integrity 50: 22%
  // At integrity 100: 5%
  return Math.max(5, 40 - Math.floor(union.integrity * 0.35));
}

/**
 * Calculate delegate reliability based on loyalty
 * Returns expected value out of 2 delegates
 * Higher loyalty = more reliable voting
 */
export function getDelegateReliability(union: UnionEntity): number {
  // Each delegate has loyalty% chance to vote for you
  // Returns expected value out of 2
  return (union.loyalty / 100) * 2;
}

/**
 * Calculate average delegate reliability for a federation
 * Based on average loyalty of member unions
 */
export function getFederationReliability(
  federation: FederationEntity,
  unions: Record<string, UnionEntity>
): number {
  const memberUnions = federation.unionIds
    .map(id => unions[id])
    .filter(Boolean);

  if (memberUnions.length === 0) return 0;

  const avgLoyalty = memberUnions.reduce((sum, u) => sum + u.loyalty, 0) / memberUnions.length;
  return (avgLoyalty / 100) * 2;
}

// ============================================
// HARVEST REWARD CALCULATIONS
// ============================================

/**
 * Calculate paperwork reward from dissolving a union
 * Based on plausibility - higher plausibility = more paperwork
 * Range: 1-4 paperwork
 */
export function getDissolveReward(union: UnionEntity): number {
  // Base 1 + bonus for every 30 plausibility
  return 1 + Math.floor(union.plausibility / 30);
}

/**
 * Calculate patronage reward from reassigning a union
 * Based on loyalty - higher loyalty = more patronage
 * Range: 1-5 patronage
 */
export function getReassignReward(union: UnionEntity): number {
  // Base 1 + bonus for every 25 loyalty
  return 1 + Math.floor(union.loyalty / 25);
}
