# hatchery simulator: feature list and MVP definition v0.1

## overview

This doc defines what we’re building, what “MVP” means, and what we’re explicitly **not** building (so the project doesn’t quietly mutate into a 3D MMO about stamps).

## product pillars

* **Asset-light:** UI, icons, text, simple counters. No character art required.
* **Short runs:** 10–15 minutes, replayable.
* **Systems-first satire:** mechanics tell the story.
* **Educational but optional:** footnotes and museum never block play.
* **Content-driven:** new events/footnotes/names via JSON, not code.

---

## MVP scope v0.1

### must-have features

1. **Run loop**

* New run, 3–5 cycles, election finale, ending screen.
* Deterministic enough to test (seed support is recommended, not required for v0.1).

2. **Core entities**

* Union “eggs” with stats (plausibility, loyalty, integrity, maintenanceCost).
* Federations built from unions.
* Fixed delegates per federation (the key rule).

3. **Resources and risk**

* Paperwork, patronage, legitimacy, audit risk, street heat.
* Turn progression that applies upkeep and triggers 1 event per cycle.

4. **Event card system**

* Draw 1 event per cycle from a weighted deck.
* Each event has 2–3 choices with effects and optional conditions.
* Minimum: **30 events**.

5. **Screens**

* Dashboard (incubator grid + counters + actions)
* Registry (list unions + quick actions)
* Federation builder (create and view federations + delegate count)
* News ticker (headline log + trend indicators)
* Election night (resolve and show outcome)
* Museum (view unlocked footnotes)

6. **Educational layer v0.1**

* Footnote cards unlocked by specific events or actions.
* Minimum: **12 footnotes**.
* Museum tab displays unlocked footnotes and a simple timeline list.

7. **Persistence**

* Save current run state to localStorage.
* “Continue run” on reload.
* “Reset run” button.

8. **Deployment**

* Static hosting compatible build (Cloudflare Pages, GitHub Pages, Netlify).

### definition of done for MVP

* A player can complete a run without bugs that block progress.
* The three endings exist (capture, collapse, whistleblower or equivalent).
* Content is editable without touching code (events/footnotes/name parts live in JSON).
* New run time is consistently within 10–20 minutes in playtesting.

---

## v0.1 explicit out of scope

* Multiplayer, leaderboards, social sharing (optional later)
* Complex animations, particle effects, 3D, characters, voice acting
* Real political parties, real people, or direct “who did what” accusations
* Full tutorial campaign, multiple chapters, or long narrative branches
* Analytics pipeline (unless you really want it)

---

## v0.2 “good polish” scope

If MVP lands, these are the high ROI upgrades.

1. **Tutorial**

* 3-step guided intro, then free play.

2. **Balance pass**

* Tuning stat ranges, event weights, thresholds.
* Add difficulty options (Normal, Cynical, Bureaucratic Nightmare).

3. **Better readability**

* Risk panel with “why this risk is rising” explanations.
* Clear tooltips for every stat and effect.

4. **Seeded runs**

* Share a seed string for reproducing runs (great for debugging and sharing).

5. **Audio**

* Printer, stamp thunk, fluorescent hum, distant crowd.
* Toggle and volume slider.

6. **Accessibility**

* Keyboard navigation across main actions.
* Font scaling and high-contrast mode.

---

## v1.0 scope (full “public release”)

1. **Content expansion**

* 60–90 event cards.
* 25–40 footnotes.
* 3–4 “scenario packs” that bias the deck (for different historical eras).

2. **Museum upgrade**

* Timeline entries grouped by era with simple filters.
* “Learn more” references section (still light, no essay walls).

3. **Meta progression**

* Unlock cosmetic UI themes or new name-part tables via endings.
* No power creep, just variety.

4. **Quality**

* Full QA pass, cross-browser support, mobile layout solid.
* Save compatibility across versions (basic migration).

---

## non-functional requirements

* **Performance:** runs smoothly on typical laptops and mid-range phones.
* **Content safety:** no real names, no sect caricatures, no calls for violence, no defamatory claims.
* **Maintainability:** data-driven content; straightforward state model.
* **Localization-ready (optional):** strings separated enough to translate later.

---

## acceptance tests (quick checklist)

* Can start a new run in < 10 seconds.
* Can create at least 1 federation and see delegates update.
* Each cycle triggers exactly 1 event and applies effects correctly.
* Lose states trigger correctly (legitimacy 0, audit purge, street shutdown).
* Museum shows unlocked footnotes and persists across reload.
* “Reset run” truly resets.

---

If you want, I can make the **third doc next** as either:

* the **Rules and systems spec** (numbers, formulas, thresholds), or
* the **Wireframes** (screen-by-screen component breakdown).
