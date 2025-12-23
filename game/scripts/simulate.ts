
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { gameReducer, actions, type GameAction } from '../src/engine/reducer';
import { createInitialState, type RunState } from '../src/engine/state';
import { createRNG } from '../src/engine/rng';
import { getEligibleEvents, getEligibleChoices } from '../src/content/loadContent';
// We don't import loadContent because it uses fetch. We'll implement a custom loader.
import type { EventCard, ContentBundle } from '../src/content/types';

// ============================================
// NODE CONTENT LOADER
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function loadJson<T>(relativePath: string): T {
    const fullPath = path.join(PROJECT_ROOT, 'public', relativePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content);
}

async function loadContentNode(): Promise<ContentBundle> {
    const events = loadJson<EventCard[]>('content/events.v1.json');
    // We don't strictly need footnotes or nameParts for simulation unless logic depends on them
    // But types might require them if we used the full loadContent bundle.
    // However, our simulator manages its own bundle.
    return {
        events,
        footnotes: [], // Mock empty
        nameParts: { prefixes: [], sectors: [], suffixes: [], modifiers: [] } // Mock empty
    };
}

// ============================================
// BOT INTERFACE
// ============================================

interface Bot {
    name: string;
    // Called when in 'playing' phase
    // Returns an action to take, or null to end turn
    act(state: RunState): GameAction | null;

    // Called when in 'event' phase
    // Returns a choice ID from the options
    choose(state: RunState, event: EventCard): string;
}

// ============================================
// BOTS
// ============================================

class RandomBot implements Bot {
    name = "RandomBot";

    act(state: RunState): GameAction | null {
        // Simple random bot: 
        // 10% chance to end turn
        // Otherwise try random actions
        const rng = Math.random();
        if (rng < 0.1) return null;

        const { resources } = state;
        const availableUnions = Object.values(state.unions).filter(u => u.isLicensed && !Object.values(state.federations).some(f => f.unionIds.includes(u.id)));

        // Actions
        const actionsList: (() => GameAction)[] = [];

        // Generate Unions (Cost: 1 Paperwork)
        if (resources.paperwork >= 1) {
            actionsList.push(() => actions.generateUnions(3));
        }

        // License Union (Cost: 1 Paperwork)
        // Find unlicensed unions
        const unlicensed = Object.values(state.unions).filter(u => !u.isLicensed);
        if (resources.paperwork >= 1 && unlicensed.length > 0) {
            actionsList.push(() => actions.licenseUnion(unlicensed[0].id)); // Just pick first for simplicity
        }

        // Incubate Union (Cost: 2 Patronage)
        const incubator = Object.values(state.unions).filter(u => !u.isIncubated);
        if (resources.patronage >= 2 && incubator.length > 0) {
            actionsList.push(() => actions.incubateUnion(incubator[0].id));
        }

        // Create Federation (Cost: 2 Paperwork, 1 Patronage)
        // Need 2+ licensed unions
        if (resources.paperwork >= 2 && resources.patronage >= 1 && availableUnions.length >= 2) {
            actionsList.push(() => actions.createFederation([availableUnions[0].id, availableUnions[1].id]));
        }

        if (actionsList.length === 0) return null;

        const actionCreator = actionsList[Math.floor(Math.random() * actionsList.length)];
        return actionCreator();
    }

    choose(state: RunState, event: EventCard): string {
        const choices = getEligibleChoices(event, state);
        if (choices.length === 0) {
            // Should not happen if event is eligible
            return event.choices[0].id; // Fallback
        }
        const choice = choices[Math.floor(Math.random() * choices.length)];
        return choice.id;
    }
}

class ReformBot implements Bot {
    name = "ReformBot";

    act(state: RunState): GameAction | null {
        const { resources } = state;
        const availableUnions = Object.values(state.unions).filter(u => u.isLicensed && !Object.values(state.federations).some(f => f.unionIds.includes(u.id)));
        const unlicensed = Object.values(state.unions).filter(u => !u.isLicensed);

        // 1. RUSH FIRST FEDERATION (Crucial for Patronage drip)
        // New Cost: 2 Paperwork, 3 Patronage
        const canCreateFed = availableUnions.length >= 2 && resources.paperwork >= 2 && resources.patronage >= 3;

        if (canCreateFed) {
            return actions.createFederation([availableUnions[0].id, availableUnions[1].id]);
        }

        // 2. LICENSE UNIONS (If we can afford and need them for Fed)
        // Prioritize until we have 2 licensed unions for the Fed
        if (availableUnions.length < 2 && unlicensed.length > 0) {
            // New Cost: 1 Paperwork, 1 Patronage
            if (resources.paperwork >= 1 && resources.patronage >= 1) {
                // Try to pick NON-SHELL unions if possible to avoid Audit Risk, unless desperate
                // Shells have tag 'compliant'
                const bestUnion = unlicensed.find(u => !u.tags.includes('compliant')) || unlicensed[0];
                return actions.licenseUnion(bestUnion.id);
            }
        }

        // 3. GENERATE UNIONS (If empty)
        // Cost: 1 Paperwork
        // We need raw material.
        if (Object.keys(state.unions).length < 2 && resources.paperwork >= 1) {
            return actions.generateUnions(3);
        }

        // 4. STAY ALIVE (Manage Audit Risk)
        // If Audit Risk is high (>60), stop generating new shells (unless we must).
        // Actually, we can't delete them. We just stop creating NEW ones.

        // 5. SPEND EXCESS PAPERWORK
        // If we have paperwork but no patronage, we are stuck. 
        // Generate unions to fish for non-shells?
        if (resources.paperwork >= 2 && Object.keys(state.unions).length < 5) {
            return actions.generateUnions(3);
        }

        // Pass turn if no high priority actions
        return null;
    }

    choose(state: RunState, event: EventCard): string {
        const choices = getEligibleChoices(event, state);

        // Priority: Reduce Audit Risk -> Gain Patronage -> Gain Legitimacy
        choices.sort((a, b) => {
            // Heavily penalize Audit Risk
            const scoreA = (a.effects?.auditRisk ?? 0) * -3 + (a.effects?.patronage ?? 0) * 2 + (a.effects?.legitimacy ?? 0) * 1;
            const scoreB = (b.effects?.auditRisk ?? 0) * -3 + (b.effects?.patronage ?? 0) * 2 + (b.effects?.legitimacy ?? 0) * 1;
            return scoreB - scoreA;
        });

        return choices[0].id;
    }
}

// ============================================
// SIMULATION ENGINE
// ============================================

type SimResult = {
    ending: string | null; // 'capture', 'collapse', etc
    cycles: number;
    finalResources: any;
    federationCount: number;
    delegateCount: number;
};

async function simulateRun(bot: Bot, content: ContentBundle): Promise<SimResult> {
    let state = createInitialState(Math.floor(Math.random() * 100000));
    state.phase = 'playing'; // Start playing

    let steps = 0;
    const MAX_STEPS = 1000; // Safety break

    while (state.phase !== 'ended' && steps < MAX_STEPS) {
        steps++;

        if (state.phase === 'playing') {
            const action = bot.act(state);
            if (action) {
                state = gameReducer(state, action);
            } else {
                // End turn logic

                // Draw Event
                const eligible = getEligibleEvents(content.events, state);
                if (eligible.length > 0) {
                    const rng = createRNG(state.rngCursor);
                    const weights = eligible.map(e => e.weight);
                    const event = rng.weightedPick(eligible, weights);
                    state = gameReducer(state, actions.drawEvent(event.id));
                } else {
                    // No events? Just advance (shouldn't happen usually)
                    state = gameReducer(state, actions.advanceTurn());
                }
            }
        }
        else if (state.phase === 'event') {
            const event = content.events.find(e => e.id === state.currentEventId);
            if (!event) throw new Error("Current event not found: " + state.currentEventId);

            const choiceId = bot.choose(state, event);
            const choice = event.choices.find(c => c.id === choiceId);
            if (!choice) throw new Error("Choice not found");

            state = gameReducer(state, actions.chooseEvent(event.id, choice.id, choice.effects, choice.unlocks));
        }
        else if (state.phase === 'election') {
            state = gameReducer(state, actions.resolveElection());
        }
    }

    return {
        ending: state.ending,
        cycles: state.cycle,
        finalResources: state.resources,
        federationCount: Object.keys(state.federations).length,
        delegateCount: Object.values(state.federations).reduce((sum, f) => sum + (f.recognition === 'recognized' ? f.delegates : 0), 0)
    };
}

// ============================================
// MAIN CLI
// ============================================

const ITERATIONS = 100;

async function run() {
    console.log("Loading content...");
    const content = await loadContentNode();
    console.log(`Loaded ${content.events.length} events.`);

    const bots = [new RandomBot(), new ReformBot()];

    for (const bot of bots) {
        console.log(`\nSimulating ${ITERATIONS} runs with ${bot.name}...`);

        const results: SimResult[] = [];
        for (let i = 0; i < ITERATIONS; i++) {
            results.push(await simulateRun(bot, content));
        }

        const wins = results.filter(r => r.ending === 'capture').length;
        const losses = results.filter(r => r.ending === 'collapse').length; // or other loss types
        const winRate = (wins / ITERATIONS) * 100;

        const avgCycles = results.reduce((sum, r) => sum + r.cycles, 0) / ITERATIONS;
        const avgDelegates = results.reduce((sum, r) => sum + r.delegateCount, 0) / ITERATIONS;

        console.log(`RESULTS for ${bot.name}:`);
        console.log(`Win Rate: ${winRate.toFixed(1)}% (${wins} wins, ${losses} losses)`);
        console.log(`Avg Cycles: ${avgCycles.toFixed(1)}`);
        console.log(`Avg Delegates: ${avgDelegates.toFixed(1)}`);
    }
}

run().catch(console.error);
