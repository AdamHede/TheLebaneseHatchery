/**
 * Content type definitions
 * 
 * Types for JSON-loaded content (events, footnotes, name parts)
 */

import type { Resources } from '../engine/state';

// ============================================
// EVENT TYPES
// ============================================

export type EventConditions = {
    patronageMin?: number;
    patronageMax?: number;
    legitimacyMin?: number;
    legitimacyMax?: number;
    auditRiskMin?: number;
    auditRiskMax?: number;
    streetHeatMin?: number;
    streetHeatMax?: number;
    cycleMin?: number;
    cycleMax?: number;
    federationCountMin?: number;
    unionCountMin?: number;
};

export type EventChoice = {
    id: string;
    label: string;
    /** Conditions to show this choice */
    conditions?: EventConditions;
    /** Resource deltas to apply */
    effects: Partial<Resources>;
    /** Footnote IDs to unlock */
    unlocks?: string[];
    /** Flavor text shown after choosing (optional) */
    outcome?: string;
};

export type EventCard = {
    id: string;
    category: 'audit' | 'political' | 'labor' | 'economic' | 'media' | 'general';
    headline: string;
    flavor: string;
    /** Path to event image asset */
    image?: string;
    /** Relative weight for draw probability */
    weight: number;
    /** Conditions for event to be eligible */
    conditions?: EventConditions;
    choices: EventChoice[];
};

// ============================================
// FOOTNOTE TYPES
// ============================================

export type FootnoteCard = {
    id: string;
    title: string;
    /** Brief summary shown in museum list */
    summary: string;
    /** Full educational content */
    content: string;
    /** Historical era for grouping */
    era: string;
    /** Year or date range */
    date: string;
    /** Source reference (internal) */
    source?: string;
};

// ============================================
// NAME GENERATION TYPES
// ============================================

export type NameParts = {
    prefixes: string[];
    sectors: string[];
    suffixes: string[];
    modifiers: string[];
};

// ============================================
// CONTENT BUNDLE
// ============================================

export type ContentBundle = {
    events: EventCard[];
    footnotes: FootnoteCard[];
    nameParts: NameParts;
};
