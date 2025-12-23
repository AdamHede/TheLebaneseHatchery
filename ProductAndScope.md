# hatchery simulator: one-page game brief v0.1

## title

**Working title:** *The hatchery*
**Tagline:** “We increased representation by 22%. Workers not included.”

## purpose

A small, browser-based, single-player satirical game that raises awareness about how labor representation can be diluted through bureaucratic mechanics. The player *runs the machine* (dark satire), while an optional museum/footnote layer links mechanics to real historical patterns in Lebanon after 1945 (educational).

## target

* **Platform:** browser (desktop first, mobile acceptable)
* **Session length:** 10–15 minutes per run
* **Replayability:** procedural unions + event deck
* **Audience:** curious general public, students, civic orgs, policy nerds

## core fantasy

You manage a cheery compliance dashboard that “incubates” unions and bundles them into federations to win a major labor election. The UI celebrates “stakeholder diversity,” but the player learns the system rewards paper entities over real membership.

## key mechanic

* The player creates **federations** from unions.
* **Each federation yields a fixed number of delegates (2)** regardless of membership size, making “hatching” shell entities strategically powerful.
* Elections act as the run’s finale.

## player loop

1. generate “union eggs” (procedural names + stats)
2. license/incubate (actions + patronage, affects plausibility/integrity)
3. bundle unions into federations (delegate production)
4. resolve event card (audits, bans, intimidation, economic shocks, media leaks)
5. repeat for 3–5 cycles
6. election night: compare delegate math vs “recognized reality” and determine outcome

## resources

* **Paperwork** (actions per cycle)
* **Patronage** (political protection + acceleration)
* **Legitimacy** (public trust; affects crackdown + narrative tone)
* **Audit risk** (probability of investigation/purge)
* **Street heat** (probability of disruptive mobilization)

## endings

* **Capture:** win the election and take control (dark win)
* **Collapse:** scandal or purge ends the hatchery
* **Secret whistleblower:** optional path that unlocks full museum/timeline mode

## tone and style

* **Voice:** deadpan corporate, like a fintech dashboard describing ethically cursed actions as “optimizations.”
* **Comedy:** absurd specificity (union names, KPI language), not memes.
* **Avoid:** punching down at workers, caricaturing specific sects, naming real individuals/parties as villains.
* **Satire target:** institutional incentives, capture dynamics, bureaucratic absurdity.

## educational layer (optional)

* Footnote cards unlock when the player triggers key mechanics/events (hatching, federation inflation, parallel elections, bans/curfews).
* Museum tab: a timeline of unlocked entries that contextualize the mechanics historically.
* Educational content is skippable and never blocks play.

## scope

### MVP (v0.1)

* 6 screens: dashboard, registry, federation builder, news ticker, election night, museum
* procedural union generator
* federation building + delegate counting
* 30 event cards with 2–3 choices each
* 12–20 footnote cards
* localStorage save for current run

### out of scope (v0.1)

* multiplayer, leaderboards, complex animations, voice acting
* real-world party/person simulation
* detailed map traversal or character art

## success criteria

* A first-time player completes a run in < 20 minutes.
* The player can explain the core insight after one run: “You can win by manufacturing federations, not representing workers.”
* Museum/footnotes are opened by > 30% of players (optional but desirable).
* Content is easily extensible via JSON without code changes.

## tech constraints

* static web deploy (Cloudflare Pages/GitHub Pages)
* content-driven architecture (events, footnotes, name parts as JSON)
* deterministic seeded runs supported for testing (nice-to-have but recommended)

## risks

* Balance: too easy to snowball delegates, or too punitive with audits.
* Tone: needs to stay sharp without becoming defamatory or simplistic.
* Educational content: must inform without lecturing.

## deliverable

A polished, playable browser game with minimal assets, strong UI/microcopy, and a lightweight educational museum tied to the mechanics.
