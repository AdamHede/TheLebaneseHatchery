/**
 * Main game reducer
 * 
 * All state transitions flow through this reducer.
 * Pure function: (state, action) -> newState
 */

import type { RunState, UnionEntity, FederationEntity } from './state';
import { createInitialState, checkLoseCondition, getLicenseChance, getDissolveReward, getReassignReward } from './state';
import { createRNG } from './rng';
import { generateUnion, generateFederationName } from './generator';
import { applyResourceEffects, applyCycleEnd, type ResourceEffects } from './effects';

// ============================================
// ACTION TYPES
// ============================================

export type GameAction =
    | { type: 'RUN_START'; seed?: number; showTips?: boolean }
    | { type: 'RUN_RESET' }
    | { type: 'TURN_ADVANCE' }
    | { type: 'UNION_GENERATE'; count: number }
    | { type: 'UNION_LICENSE'; unionId: string }
    | { type: 'UNION_LICENSE_RESULT'; unionId: string; success: boolean }
    | { type: 'UNION_INCUBATE'; unionId: string; mode: 'paperwork' | 'discipline' }
    | { type: 'UNION_DISSOLVE'; unionId: string }
    | { type: 'UNION_REASSIGN'; unionId: string }
    | { type: 'FEDERATION_CREATE'; unionIds: string[] }
    | { type: 'EVENT_DRAW'; eventId: string }
    | { type: 'EVENT_CHOOSE'; eventId: string; choiceId: string; effects: ResourceEffects; unlocks?: string[] }
    | { type: 'EVENT_DISMISS' }
    | { type: 'ELECTION_RESOLVE' }
    | { type: 'TUTORIAL_DISMISS' }
    | { type: 'SET_PHASE'; phase: RunState['phase'] };

// ============================================
// ACTION COSTS
// ============================================

const COSTS = {
    license: { paperwork: 1, patronage: 1 }, // Upfront licensing cost
    incubate: { patronage: 2 },
    generateUnions: { paperwork: 1 },
    createFederation: { paperwork: 2, patronage: 3 }, // Expensive establishment
} as const;

// ============================================
// REDUCER
// ============================================

export function gameReducer(state: RunState, action: GameAction): RunState {
    console.log('[Reducer] Action received:', action.type);
    console.log('[Reducer] Current phase:', state.phase);

    switch (action.type) {
        // ----------------------------------------
        // RUN MANAGEMENT
        // ----------------------------------------

        case 'RUN_START': {
            console.log('=== [Reducer] Processing RUN_START ===');
            console.log('[Reducer] Seed:', action.seed, 'ShowTips:', action.showTips);
            console.log('[Reducer] Creating initial state...');
            const initialState = createInitialState(action.seed, action.showTips);
            console.log('[Reducer] Initial state created:', {
                phase: initialState.phase,
                cycle: initialState.cycle,
                maxCycles: initialState.maxCycles,
                rngCursor: initialState.rngCursor
            });
            const newState = {
                ...initialState,
                phase: 'playing' as const,
            };
            console.log('[Reducer] New state phase set to:', newState.phase);
            console.log('[Reducer] Returning new state');
            return newState;
        }

        case 'RUN_RESET': {
            return createInitialState();
        }

        // ----------------------------------------
        // TURN PROGRESSION
        // ----------------------------------------

        case 'TURN_ADVANCE': {
            // Check if we should trigger election
            if (state.cycle >= state.maxCycles) {
                return {
                    ...state,
                    phase: 'election',
                };
            }

            // Apply end-of-cycle effects
            const newState = applyCycleEnd(state);

            // Check lose conditions after upkeep
            const loseCondition = checkLoseCondition(newState);
            if (loseCondition) {
                return {
                    ...newState,
                    phase: 'ended',
                    ending: 'collapse',
                };
            }

            return {
                ...newState,
                phase: 'playing',
            };
        }

        // ----------------------------------------
        // UNION ACTIONS
        // ----------------------------------------

        case 'UNION_GENERATE': {
            // Check cost and limit
            if (
                state.resources.paperwork < COSTS.generateUnions.paperwork ||
                state.unionsGeneratedInCycle
            ) {
                return state; // Can't afford or already done this cycle
            }

            const rng = createRNG(state.rngCursor);
            const newUnions: Record<string, UnionEntity> = { ...state.unions };

            for (let i = 0; i < action.count; i++) {
                const union = generateUnion(rng);
                newUnions[union.id] = union;
            }

            return {
                ...state,
                unions: newUnions,
                rngCursor: rng.getCursor(),
                unionsGeneratedInCycle: true,
                resources: applyResourceEffects(state.resources, {
                    paperwork: -COSTS.generateUnions.paperwork,
                }),
            };
        }

        case 'UNION_LICENSE': {
            const union = state.unions[action.unionId];
            if (!union || union.isLicensed || union.isCracked) return state;

            if (state.resources.paperwork < COSTS.license.paperwork) {
                return state; // Can't afford
            }

            // Roll against license chance based on plausibility
            const rng = createRNG(state.rngCursor);
            const licenseChance = getLicenseChance(union);
            const roll = rng.nextInt(1, 100);
            const success = roll <= licenseChance;

            if (success) {
                return {
                    ...state,
                    unions: {
                        ...state.unions,
                        [action.unionId]: {
                            ...union,
                            isLicensed: true,
                        },
                    },
                    resources: applyResourceEffects(state.resources, {
                        paperwork: -COSTS.license.paperwork,
                    }),
                    rngCursor: rng.getCursor(),
                };
            } else {
                // License failed - lose paperwork AND gain audit risk
                return {
                    ...state,
                    resources: applyResourceEffects(state.resources, {
                        paperwork: -COSTS.license.paperwork,
                        auditRisk: 3, // Suspicious file returned
                    }),
                    rngCursor: rng.getCursor(),
                };
            }
        }

        case 'UNION_INCUBATE': {
            const union = state.unions[action.unionId];
            if (!union || union.isIncubated || union.isCracked) return state;

            if (state.resources.patronage < COSTS.incubate.patronage) {
                return state; // Can't afford
            }

            const mode = action.mode;
            let updatedUnion: UnionEntity;

            if (mode === 'paperwork') {
                // Paperwork mode: Clean the file
                // +plausibility, +integrity, -loyalty, +streetHeat
                updatedUnion = {
                    ...union,
                    isIncubated: true,
                    incubationMode: 'paperwork',
                    plausibility: Math.min(100, union.plausibility + 15),
                    integrity: Math.min(100, union.integrity + 10),
                    loyalty: Math.max(0, union.loyalty - 10),
                };
            } else {
                // Discipline mode: Tighten control
                // +loyalty, +integrity, -plausibility
                updatedUnion = {
                    ...union,
                    isIncubated: true,
                    incubationMode: 'discipline',
                    loyalty: Math.min(100, union.loyalty + 15),
                    integrity: Math.min(100, union.integrity + 10),
                    plausibility: Math.max(0, union.plausibility - 10),
                };
            }

            const resourceEffects: ResourceEffects = {
                patronage: -COSTS.incubate.patronage,
            };

            // Paperwork mode generates street heat (real workers notice)
            if (mode === 'paperwork') {
                resourceEffects.streetHeat = 2;
            }

            return {
                ...state,
                unions: {
                    ...state.unions,
                    [action.unionId]: updatedUnion,
                },
                resources: applyResourceEffects(state.resources, resourceEffects),
            };
        }

        case 'UNION_DISSOLVE': {
            const union = state.unions[action.unionId];
            if (!union) return state;

            // Check if union is in a federation
            const isInFederation = Object.values(state.federations).some(
                f => f.unionIds.includes(action.unionId)
            );

            if (isInFederation) {
                return state; // Can't dissolve unions in federations
            }

            // Calculate reward
            const paperworkReward = getDissolveReward(union);

            // Remove union and grant paperwork
            const { [action.unionId]: removed, ...remainingUnions } = state.unions;

            return {
                ...state,
                unions: remainingUnions,
                resources: applyResourceEffects(state.resources, {
                    paperwork: paperworkReward,
                }),
            };
        }

        case 'UNION_REASSIGN': {
            const union = state.unions[action.unionId];
            if (!union) return state;

            // Check if union is in a federation
            const isInFederation = Object.values(state.federations).some(
                f => f.unionIds.includes(action.unionId)
            );

            if (isInFederation) {
                return state; // Can't reassign unions in federations
            }

            // Calculate reward
            const patronageReward = getReassignReward(union);

            // Remove union and grant patronage
            const { [action.unionId]: removed, ...remainingUnions } = state.unions;

            return {
                ...state,
                unions: remainingUnions,
                resources: applyResourceEffects(state.resources, {
                    patronage: patronageReward,
                }),
            };
        }

        // ----------------------------------------
        // FEDERATION ACTIONS
        // ----------------------------------------

        case 'FEDERATION_CREATE': {
            if (action.unionIds.length < 2) return state;

            // Check all unions are licensed and available
            const unions = action.unionIds
                .map(id => state.unions[id])
                .filter(Boolean);

            if (unions.length !== action.unionIds.length) return state;
            if (!unions.every(u => u.isLicensed)) return state;

            // Check if any union is already in a federation
            const existingFederatedUnions = new Set(
                Object.values(state.federations).flatMap(f => f.unionIds)
            );

            if (action.unionIds.some(id => existingFederatedUnions.has(id))) {
                return state;
            }

            // Check cost
            if (
                state.resources.paperwork < COSTS.createFederation.paperwork ||
                state.resources.patronage < COSTS.createFederation.patronage
            ) {
                return state;
            }

            const rng = createRNG(state.rngCursor);
            const name = generateFederationName(rng, unions);

            const federation: FederationEntity = {
                id: `fed_${Date.now()}`,
                name,
                unionIds: action.unionIds,
                delegates: 2, // THE CORE MECHANIC
                recognition: 'recognized',
                visibility: 50,
            };

            return {
                ...state,
                federations: {
                    ...state.federations,
                    [federation.id]: federation,
                },
                rngCursor: rng.getCursor(),
                resources: applyResourceEffects(state.resources, {
                    paperwork: -COSTS.createFederation.paperwork,
                    patronage: -COSTS.createFederation.patronage,
                    // Creating federations increases audit risk
                    auditRisk: 5,
                }),
            };
        }

        // ----------------------------------------
        // EVENT ACTIONS
        // ----------------------------------------

        case 'EVENT_DRAW': {
            return {
                ...state,
                phase: 'event',
                currentEventId: action.eventId,
            };
        }

        case 'EVENT_CHOOSE': {
            // Apply effects
            const newResources = applyResourceEffects(state.resources, action.effects);

            // Add unlocked footnotes
            const newUnlocks = action.unlocks
                ? [...new Set([...state.unlockedFootnotes, ...action.unlocks])]
                : state.unlockedFootnotes;

            // Create validation state (post-event, pre-upkeep)
            let intermediateState: RunState = {
                ...state,
                resources: newResources,
                unlockedFootnotes: newUnlocks,
                eventHistory: [...state.eventHistory, action.eventId],
                currentEventId: null,
            };

            // Check if post-event state causes loss (e.g. Legitimacy hit)
            let loseCondition = checkLoseCondition(intermediateState);
            if (loseCondition) {
                return {
                    ...intermediateState,
                    phase: 'ended',
                    ending: 'collapse',
                };
            }

            // ================================================
            // TURN ADVANCEMENT (Merged from TURN_ADVANCE)
            // ================================================

            // 1. Check for Election (Max Cycles Reached)
            // If we are currently at max cycles, this event was the end of the last cycle.
            if (intermediateState.cycle >= intermediateState.maxCycles) {
                return {
                    ...intermediateState,
                    phase: 'election',
                };
            }

            // 2. Apply Upkeep & Cycle Advance
            intermediateState = applyCycleEnd(intermediateState);

            // 3. Check Lose Conditions AGAIN (after upkeep effects like Audit Risk increase)
            loseCondition = checkLoseCondition(intermediateState);
            if (loseCondition) {
                return {
                    ...intermediateState,
                    phase: 'ended',
                    ending: 'collapse',
                };
            }

            return {
                ...intermediateState,
                phase: 'playing',
            };
        }

        case 'EVENT_DISMISS': {
            return {
                ...state,
                phase: 'playing',
                currentEventId: null,
            };
        }

        // ----------------------------------------
        // ELECTION
        // ----------------------------------------

        case 'ELECTION_RESOLVE': {
            // TODO: Implement proper election logic
            // For now, simple delegate threshold
            const totalDelegates = Object.values(state.federations)
                .filter(f => f.recognition === 'recognized')
                .reduce((sum, f) => sum + f.delegates, 0);

            const ending = totalDelegates >= 6 ? 'capture' : 'collapse';

            return {
                ...state,
                phase: 'ended',
                ending,
            };
        }

        // ----------------------------------------
        // PHASE CONTROL
        // ----------------------------------------

        case 'SET_PHASE': {
            return {
                ...state,
                phase: action.phase,
            };
        }

        case 'TUTORIAL_DISMISS': {
            return {
                ...state,
                showTips: false,
            };
        }

        default:
            return state;
    }
}

// ============================================
// ACTION CREATORS (convenience)
// ============================================

export const actions = {
    startRun: (seed?: number, showTips: boolean = false): GameAction => ({ type: 'RUN_START', seed, showTips }),
    resetRun: (): GameAction => ({ type: 'RUN_RESET' }),
    advanceTurn: (): GameAction => ({ type: 'TURN_ADVANCE' }),
    generateUnions: (count: number): GameAction => ({ type: 'UNION_GENERATE', count }),
    licenseUnion: (unionId: string): GameAction => ({ type: 'UNION_LICENSE', unionId }),
    incubateUnion: (unionId: string, mode: 'paperwork' | 'discipline'): GameAction => ({ type: 'UNION_INCUBATE', unionId, mode }),
    dissolveUnion: (unionId: string): GameAction => ({ type: 'UNION_DISSOLVE', unionId }),
    reassignUnion: (unionId: string): GameAction => ({ type: 'UNION_REASSIGN', unionId }),
    createFederation: (unionIds: string[]): GameAction => ({ type: 'FEDERATION_CREATE', unionIds }),
    drawEvent: (eventId: string): GameAction => ({ type: 'EVENT_DRAW', eventId }),
    chooseEvent: (
        eventId: string,
        choiceId: string,
        effects: ResourceEffects,
        unlocks?: string[]
    ): GameAction => ({ type: 'EVENT_CHOOSE', eventId, choiceId, effects, unlocks }),
    dismissEvent: (): GameAction => ({ type: 'EVENT_DISMISS' }),
    resolveElection: (): GameAction => ({ type: 'ELECTION_RESOLVE' }),
    dismissTutorial: (): GameAction => ({ type: 'TUTORIAL_DISMISS' }),
    setPhase: (phase: RunState['phase']): GameAction => ({ type: 'SET_PHASE', phase }),
};
