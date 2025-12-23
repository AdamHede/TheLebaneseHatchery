/**
 * Zod schemas for content validation
 * 
 * Validates JSON content at runtime to catch errors early
 */

import { z } from 'zod';

// ============================================
// EVENT SCHEMAS
// ============================================

export const EventConditionsSchema = z.object({
    patronageMin: z.number().optional(),
    patronageMax: z.number().optional(),
    legitimacyMin: z.number().optional(),
    legitimacyMax: z.number().optional(),
    auditRiskMin: z.number().optional(),
    auditRiskMax: z.number().optional(),
    streetHeatMin: z.number().optional(),
    streetHeatMax: z.number().optional(),
    cycleMin: z.number().optional(),
    cycleMax: z.number().optional(),
    federationCountMin: z.number().optional(),
    unionCountMin: z.number().optional(),
}).strict();

export const EventEffectsSchema = z.object({
    paperwork: z.number().optional(),
    patronage: z.number().optional(),
    legitimacy: z.number().optional(),
    auditRisk: z.number().optional(),
    streetHeat: z.number().optional(),
}).strict();

export const EventChoiceSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    conditions: EventConditionsSchema.optional(),
    effects: EventEffectsSchema,
    unlocks: z.array(z.string()).optional(),
    outcome: z.string().optional(),
}).strict();

export const EventCardSchema = z.object({
    id: z.string().min(1),
    category: z.enum(['audit', 'political', 'labor', 'economic', 'media', 'general']),
    headline: z.string().min(1),
    flavor: z.string().min(1),
    image: z.string().optional(),
    weight: z.number().positive(),
    conditions: EventConditionsSchema.optional(),
    choices: z.array(EventChoiceSchema).min(2).max(3),
}).strict();

export const EventsFileSchema = z.array(EventCardSchema);

// ============================================
// FOOTNOTE SCHEMAS
// ============================================

export const FootnoteCardSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    content: z.string().min(1),
    era: z.string().min(1),
    date: z.string().min(1),
    source: z.string().optional(),
}).strict();

export const FootnotesFileSchema = z.array(FootnoteCardSchema);

// ============================================
// NAME PARTS SCHEMAS
// ============================================

export const NamePartsSchema = z.object({
    prefixes: z.array(z.string().min(1)).min(1),
    sectors: z.array(z.string().min(1)).min(1),
    suffixes: z.array(z.string().min(1)).min(1),
    modifiers: z.array(z.string()),
}).strict();

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateEvents(data: unknown) {
    return EventsFileSchema.parse(data);
}

export function validateFootnotes(data: unknown) {
    return FootnotesFileSchema.parse(data);
}

export function validateNameParts(data: unknown) {
    return NamePartsSchema.parse(data);
}

/**
 * Content sanity checks beyond schema validation
 */
export function runContentSanityChecks(
    events: z.infer<typeof EventsFileSchema>,
    footnotes: z.infer<typeof FootnotesFileSchema>
): string[] {
    const errors: string[] = [];

    // Check for unique event IDs
    const eventIds = new Set<string>();
    for (const event of events) {
        if (eventIds.has(event.id)) {
            errors.push(`Duplicate event ID: ${event.id}`);
        }
        eventIds.add(event.id);

        // Check choice IDs are unique within event
        const choiceIds = new Set<string>();
        for (const choice of event.choices) {
            if (choiceIds.has(choice.id)) {
                errors.push(`Duplicate choice ID in event ${event.id}: ${choice.id}`);
            }
            choiceIds.add(choice.id);
        }
    }

    // Check for unique footnote IDs
    const footnoteIds = new Set<string>();
    for (const footnote of footnotes) {
        if (footnoteIds.has(footnote.id)) {
            errors.push(`Duplicate footnote ID: ${footnote.id}`);
        }
        footnoteIds.add(footnote.id);
    }

    // Check all unlocks reference valid footnote IDs
    for (const event of events) {
        for (const choice of event.choices) {
            if (choice.unlocks) {
                for (const unlockId of choice.unlocks) {
                    if (!footnoteIds.has(unlockId)) {
                        errors.push(`Event ${event.id} choice ${choice.id} unlocks unknown footnote: ${unlockId}`);
                    }
                }
            }
        }
    }

    return errors;
}
