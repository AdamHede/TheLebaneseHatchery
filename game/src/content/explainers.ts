/**
 * Game Concept Explainers
 * 
 * Tooltip content for various game mechanics.
 * Updated for tangible probability mechanics.
 */

export const EXPLAINER_CONTENT: Record<string, { title: string; description: string }> = {
    // Resources
    'Paperwork': {
        title: '📋 Paperwork',
        description: 'Your bureaucratic bandwidth. Used to Generate Unions (-1) and License Unions (-1). Regenerates each cycle. License attempts may FAIL if plausibility is low!'
    },
    'Patronage': {
        title: '🤝 Patronage',
        description: 'Political favors and bribe money. Used to Incubate Unions (-2) and Create Federations (-3). Choose between Paperwork mode or Discipline mode when incubating.'
    },
    'Legitimacy': {
        title: '⚖️ Legitimacy',
        description: 'Public trust in your institution. If this hits 0%, the game ends. Unions that "crack" will cost you legitimacy!'
    },
    'Audit Risk': {
        title: '🔍 Audit Risk',
        description: 'The chance of an external investigation. Creating Federations and failed license attempts increase this. If it hits 100%, you are purged.'
    },
    'Street Heat': {
        title: '🔥 Street Heat',
        description: 'Actual worker anger. Using Paperwork mode incubation generates Street Heat as real workers notice activity. If it hits 100%, the office is burned down.'
    },

    // Union Stats (now probability-based)
    'Plausibility': {
        title: '📄 Plausibility → License Chance',
        description: 'How "real" the union looks on paper. Higher plausibility = higher chance of successful licensing. At 50%, you have ~60% license success chance. Paperwork incubation increases this.'
    },
    'Loyalty': {
        title: '🤝 Loyalty → Delegate Reliability',
        description: 'Obedience to your directives. On Election Night, each delegate has LOYALTY% chance to actually vote for you. Low loyalty = unreliable delegates. Discipline incubation increases this.'
    },
    'Integrity': {
        title: '⚖️ Integrity → Crack Risk',
        description: 'Structural soundness of the union. LOW integrity = HIGH crack risk. Every cycle, unions roll against their crack risk - if they crack, they\'re dissolved and you lose legitimacy. Incubation (either mode) improves this.'
    },

    // Union Tags
    'Licensed': {
        title: '✅ Licensed',
        description: 'This union is officially recognized by the state. Only licensed unions can join Federations and contribute delegates.'
    },
    'Incubated': {
        title: '🥚 Incubated',
        description: 'This union has been processed through your incubation program. The mode used determines its new strengths.'
    },
    'Cracked': {
        title: '💔 Cracked',
        description: 'This union has been exposed and quietly dissolved. It can no longer be used. You lost legitimacy when this happened.'
    },
    'shell': {
        title: '⚠️ Shell Organization',
        description: 'Exists mostly on paper. High plausibility but LOW integrity - very likely to crack! Free to maintain but risky to keep.'
    },
    'compliant': {
        title: '⚠️ Compliant (Shell)',
        description: 'Exists mostly on paper. High plausibility but LOW integrity - very likely to crack! Free to maintain but risky to keep.'
    },
    'captured': {
        title: '🎯 Captured',
        description: 'Leadership is completely compromised. High loyalty means reliable delegates. Moderate integrity means lower crack risk.'
    },
    'authentic': {
        title: '✊ Authentic',
        description: 'Actual worker representation. HIGH integrity means low crack risk, but LOW loyalty means delegates may defect on Election Night!'
    },
    'volatile': {
        title: '⚡ Volatile',
        description: 'Unpredictable organization. Moderate stats across the board. Could go either way.'
    },
    'restless': {
        title: '😤 Restless',
        description: 'Workers are getting impatient. This union has low loyalty and may cause trouble.'
    },
    'unpredictable': {
        title: '🎲 Unpredictable',
        description: 'You never know which way this one will go. Mixed loyalties and uncertain reliability.'
    },
    'CAPTURED': {
        title: 'Captured',
        description: 'Leadership is completely compromised. 100% Loyalty, 0% Integrity. The perfect union.'
    },
    'SHELL': {
        title: 'Shell Organization',
        description: 'Exists only on paper. High Plausibility, no actual members. Safe but generates no events.'
    },
    'COMPLAINT': {
        title: 'Active Complaint',
        description: 'This union has filed a formal grievance. Increases Audit Risk every turn until resolved.'
    },
    'RADICAL': {
        title: 'Radical Elements',
        description: 'This union has been infiltrated by actual organizers. Generates double Street Heat.'
    }
};
