/**
 * Content loading utilities
 */

import type { EventCard, ContentBundle } from './types';
import { validateEvents, validateFootnotes, validateNameParts, runContentSanityChecks } from './schemas';

// ============================================
// CONTENT LOADING
// ============================================

async function loadJson<T>(path: string): Promise<T> {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return response.json();
}

/**
 * Load and validate all game content
 */
export async function loadContent(): Promise<ContentBundle> {
    const [eventsRaw, footnotesRaw, namePartsRaw] = await Promise.all([
        loadJson('/content/events.v1.json'),
        loadJson('/content/footnotes.v1.json'),
        loadJson('/content/nameParts.v1.json'),
    ]);

    // Validate with Zod
    const events = validateEvents(eventsRaw);
    const footnotes = validateFootnotes(footnotesRaw);
    const nameParts = validateNameParts(namePartsRaw);

    // Run sanity checks
    const errors = runContentSanityChecks(events, footnotes);
    if (errors.length > 0) {
        console.error('Content sanity check failures:', errors);
        // Don't throw in dev, but log warnings
        if (import.meta.env.PROD) {
            throw new Error(`Content validation failed: ${errors.join(', ')}`);
        }
    }

    return { events, footnotes, nameParts };
}

// ============================================
// EVENT SELECTION
// ============================================

import type { RunState } from '../engine/state';

/**
 * Check if event conditions are satisfied
 */
export function checkConditions(
    conditions: EventCard['conditions'],
    state: RunState
): boolean {
    if (!conditions) return true;

    const { resources } = state;

    if (conditions.patronageMin !== undefined && resources.patronage < conditions.patronageMin) return false;
    if (conditions.patronageMax !== undefined && resources.patronage > conditions.patronageMax) return false;
    if (conditions.legitimacyMin !== undefined && resources.legitimacy < conditions.legitimacyMin) return false;
    if (conditions.legitimacyMax !== undefined && resources.legitimacy > conditions.legitimacyMax) return false;
    if (conditions.auditRiskMin !== undefined && resources.auditRisk < conditions.auditRiskMin) return false;
    if (conditions.auditRiskMax !== undefined && resources.auditRisk > conditions.auditRiskMax) return false;
    if (conditions.streetHeatMin !== undefined && resources.streetHeat < conditions.streetHeatMin) return false;
    if (conditions.streetHeatMax !== undefined && resources.streetHeat > conditions.streetHeatMax) return false;
    if (conditions.cycleMin !== undefined && state.cycle < conditions.cycleMin) return false;
    if (conditions.cycleMax !== undefined && state.cycle > conditions.cycleMax) return false;
    if (conditions.federationCountMin !== undefined && Object.keys(state.federations).length < conditions.federationCountMin) return false;
    if (conditions.unionCountMin !== undefined && Object.keys(state.unions).length < conditions.unionCountMin) return false;

    return true;
}

/**
 * Check if a choice's conditions are satisfied
 */
export function checkChoiceConditions(
    conditions: EventCard['choices'][0]['conditions'],
    state: RunState
): boolean {
    return checkConditions(conditions, state);
}

/**
 * Get eligible events for current state
 */
export function getEligibleEvents(
    events: EventCard[],
    state: RunState
): EventCard[] {
    return events.filter(event => {
        // Check event conditions
        if (!checkConditions(event.conditions, state)) return false;

        // Ensure at least one choice is available
        const hasAvailableChoice = event.choices.some(
            choice => checkChoiceConditions(choice.conditions, state)
        );

        return hasAvailableChoice;
    });
}

/**
 * Get eligible choices for an event
 */
export function getEligibleChoices(
    event: EventCard,
    state: RunState
): EventCard['choices'] {
    return event.choices.filter(choice =>
        checkChoiceConditions(choice.conditions, state)
    );
}
