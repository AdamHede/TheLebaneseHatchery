# hatchery simulator: technical architecture note v0.1

## Purpose

Describe a build that is:

* browser-first, static deploy
* data-driven (events, footnotes, name parts in JSON)
* deterministic enough to debug (seeded RNG recommended)
* easy to extend without refactoring

Assumptions:

* Single-player only
* No backend required
* No analytics required in v0.1

---

## stack

### recommended

* **Vite + React + TypeScript**
* **CSS:** Tailwind (fast) or plain CSS modules (simpler dependency story)
* **Runtime validation:** Zod (optional but strongly recommended)
* **State:** React state + a small reducer (no Redux needed)

### alternatives (if you want ultra-minimal)

* Vite + TypeScript + no React (vanilla DOM)
* Still keep the same data contracts and reducer logic

---

## app architecture

### key principle

**All game content lives in JSON**. Code is a small engine that:

1. loads content
2. generates unions
3. applies event choice effects
4. resolves election/endings
5. persists state

### high-level modules

* `content/` loaders and validators
* `engine/` pure logic (no React)
* `ui/` React components and screens
* `persistence/` localStorage + version migrations
* `audio/` simple sound manager (v0.2)

---

## repo layout

Suggested folder structure:

```
src/
  app/
    App.tsx
    routes.ts
  ui/
    screens/
      Dashboard.tsx
      Registry.tsx
      FederationBuilder.tsx
      News.tsx
      Election.tsx
      Museum.tsx
    components/
      ResourceBar.tsx
      UnionCard.tsx
      FederationCard.tsx
      EventModal.tsx
      Tooltip.tsx
  engine/
    reducer.ts
    state.ts
    rng.ts
    turn.ts
    effects.ts
    generator.ts
    election.ts
    selectors.ts
  content/
    schemas.ts
    loadContent.ts
    contentTypes.ts
  persistence/
    storage.ts
    migrations.ts
  assets/
    icons/
    sfx/ (optional later)
public/
  content/
    events.v1.json
    footnotes.v1.json
    nameParts.v1.json
```

---

## data contracts

Everything below should exist as TypeScript types and (ideally) Zod schemas.

### content files (JSON)

* `events.v1.json`: array of EventCard
* `footnotes.v1.json`: array of FootnoteCard
* `nameParts.v1.json`: generator tables

### runtime state

* `RunState` persisted in localStorage
* `UnlockedState` for museum progression

### minimal type skeleton

```ts
export type Resources = {
  paperwork: number;
  patronage: number;
  legitimacy: number;
  auditRisk: number;
  streetHeat: number;
};

export type UnionEntity = {
  id: string;
  name: string;
  sector: string;
  plausibility: number; // 0-100
  loyalty: number;      // 0-100
  integrity: number;    // 0-100
  maintenanceCost: number;
  tags: string[];
};

export type FederationEntity = {
  id: string;
  name: string;
  unionIds: string[];
  delegates: number; // always 2
  recognition: "recognized" | "unrecognized";
  visibility: number; // 0-100
};

export type EventChoice = {
  id: string;
  label: string;
  conditions?: { patronageMin?: number; legitimacyMin?: number; };
  effects: Partial<Resources> & { delegates?: number };
  unlocks?: string[]; // footnote ids
};

export type EventCard = {
  id: string;
  category: string;
  headline: string;
  flavor: string;
  weight: number;
  choices: EventChoice[];
};
```

Note: don’t store derived values (like “total delegates”) in state. Compute via selectors.

---

## engine design

### reducer-first, pure functions

Use a reducer that takes `(state, action) -> newState`. Keep it deterministic and testable.

Actions you’ll need:

* `RUN_START(seed?)`
* `TURN_ADVANCE`
* `UNION_GENERATE(n)`
* `UNION_LICENSE(unionId)`
* `UNION_INCUBATE(unionId)`
* `FEDERATION_CREATE(unionIds[])`
* `EVENT_DRAW(eventId)`
* `EVENT_CHOOSE(eventId, choiceId)`
* `ELECTION_RESOLVE`
* `RUN_RESET`

### rng and determinism

Implement a small seeded PRNG (Mulberry32 is fine). Store `seed` and `rngCursor` or just store the RNG state. This lets you reproduce runs exactly.

```ts
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### event draw

Weighted random choice from events whose conditions are satisfied by current state.

Keep it simple:

1. filter eligible events
2. build cumulative weights
3. roll once
4. return event id

### effects application

Centralize effects in `engine/effects.ts`. Apply deltas and clamp.

Rules:

* resources clamp at min 0, max optional
* integrity, plausibility, loyalty clamp 0–100
* delegates are derived from federations, but some events grant “temporary delegates” for finale. If you allow that, store it as `bonusDelegates` in run state.

---

## persistence

### localStorage contract

Persist a single blob:

* `runState`
* `unlocks`
* `appVersion`

Keys:

* `hatchery.save.v1`

### migrations

When you change schemas:

* bump save version: `hatchery.save.v2`
* add `migrations.ts` to upgrade older save structures

Minimum viable:

* if migration fails, warn and reset run (don’t brick the app)

---

## deployment

Static hosting target. Any of these works:

* Cloudflare Pages
* GitHub Pages
* Netlify

Build:

* `npm ci`
* `npm run build`
* output `dist/`

If hosting on GitHub Pages, ensure Vite base path config is set.

---

## testing strategy

### unit tests (high ROI)

* RNG determinism test
* event weight selection correctness
* effect application and clamping
* lose conditions triggering
* election resolution logic

### content sanity tests

Run a script in CI that validates:

* all IDs unique
* all unlock ids exist
* every event has 2–3 choices
* no impossible condition dead-ends (optional)

### manual playtest checklist

* run completes in 10–20 minutes
* at least 3 distinct run outcomes across 10 seeds
* player never gets stuck with zero legal actions unless it is a loss state

---

## performance and accessibility

* Avoid heavy animation frameworks
* Keep lists virtualized only if they grow huge (likely unnecessary)
* Keyboard navigation:

  * tab order sensible
  * escape closes modals
  * buttons have aria-labels
* High contrast mode optional (v0.2)

---

## security and safety notes

* No user-generated content beyond a seed input. If you allow custom names, sanitize and escape.
* Don’t embed real people/party names in content JSON. Use fictional factions and composite references.
* Educational citations can be stored as internal “source pointers” (pdf name + page) without linking externally.

---

## recommended dev milestones (technical)

1. **Core engine** (reducer, rng, generator, federation builder)
2. **Event system** (deck, modal, apply effects)
3. **Persistence** (save/load/reset)
4. **Museum unlocks** (footnotes and timeline list)
5. **Balance hooks** (config file for thresholds and clamps)
6. **Deployment** (Cloudflare/GitHub pages)

---

If you want the next doc, I’d do **data contracts + JSON schema definitions** (with a validation script) because that’s what stops content work from turning into bug soup.
