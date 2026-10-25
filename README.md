# Blackjack 98

React + TypeScript migration of `blackjack-98-free-play-v14.html`. The Windows 98 styling, responsive layout, embedded artwork, and Free Play behavior are retained. Vite provides development serving and production builds.

## Run locally

Use Node.js 22.12 or newer and npm. From this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. `npm.cmd` also works when PowerShell blocks the `npm.ps1` shim; other shells can use `npm`.

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The production build is written to `dist/`. Its relative asset paths support hosting below a subdirectory. The app currently needs only static hosting.

## GitHub Pages

Live site: https://kevinshannon.com/blackjack98/

This project inherits the account's existing `kevinshannon.com` Pages domain. The default https://kevin-shannon.github.io/blackjack98/ address redirects there.

Every push to `main` runs `.github/workflows/deploy-pages.yml`: install locked dependencies with `npm ci`, run the game regression tests, type-check and build, and deploy `dist/` to GitHub Pages. Failed tests or builds prevent deployment. You can also run it manually from the repository's Actions tab.

The repository's Settings → Pages → Source must be **GitHub Actions**. The workflow uses GitHub's built-in token and Pages environment; no deployment secret or `gh-pages` branch is needed. It obtains the site's base path from Pages metadata and passes it to Vite so assets load under `/blackjack98/`. Local development retains its relative base path.

## Organization

```text
src/
  app/
    App.tsx                    Application composition
    trainingModes.ts           Mode menu metadata
    ModeNavigation.tsx         Mode switching and a single resumable session
    ModeMenu.tsx               Shared mode selection and resume controls
  assets/
    cards.ts                   Original 53 base64 card images
    brand.ts                   Original base64 app icon
  features/
    basic-strategy/
      BasicStrategy.tsx        Rapid-fire practice screen
      components/              Relevant rules, options, and dialogs
      hooks/                   React subscription to the trainer
      model/
        strategy.ts            Total-dependent strategy and rule variations
        questions.ts           Independent draws from all 52 cards
        createStrategyTrainer.ts  Basic Strategy grading and lifecycle adapter
        settings.ts            Separate validated preference storage
        *.test.ts              Strategy and trainer regression tests
    blackjack/
      FreePlay.tsx             Free Play screen and window chrome
      components/              Cards, hands, table, betting, actions, dialogs
      hooks/                   React store subscription and keyboard lifecycle
      model/
        types.ts               Rules, options, cards, hands, phases, snapshots
        constants.ts           Defaults and limits
        cards.ts               Scoring and Hi-Lo functions
        createBlackjackGame.ts Round controller; no React or DOM dependency
        *.test.ts              Deterministic game regression tests
    deviations/
      Deviations.tsx           True-count decision practice screen
      components/              H17/S17, practice sets, options, and help
      model/
        indices.ts             Sourced Illustrious 18 / Fab 4 index tables
        questions.ts           Rule-specific threshold and adjacent-count deals
        createDeviationTrainer.ts  Grading and independent session adapter
        settings.ts            Separate validated preference storage
    training/
      components/DecisionPractice.tsx  Shared decision table, actions, and counters
      model/createDecisionTrainer.ts  Shared timers, feedback, and session lifecycle
      model/types.ts           Typed practice state, settings, and feedback
    settings/
      SettingsFields.tsx       Shared setup and live-settings controls
      settingsRepository.ts    Validated browser persistence
      *.test.ts                Saved-settings compatibility tests
    stats/
      sessionStats.ts          Mode-tagged stats contracts and update functions
  shared/
    lib/format.ts              Currency display
    ui/                        Reusable beveled buttons and accessible dialogs
    ui/GameWindow.tsx          Shared window chrome for all modes
  styles/
    legacy.css                 Original CSS, including its v14 refinements
tests/browser/
  free-play.spec.ts            Browser workflows and optional legacy captures
  basic-strategy.spec.ts       Practice, timers, preferences, and mode isolation
  deviations.spec.ts           Count boundaries, insurance, surrender, and mode isolation
  practice-review.spec.ts      Manual mistake review, skip preference, and card visibility
```

## Behavior preserved

- Configurable decks, penetration, blackjack payout (3:2 or 6:5), soft 17, double after split, resplit aces (RSA), and late surrender. The payout dropdown uses a classic Windows list with keyboard navigation; retired 1:1 and 2:1 settings fall back to 3:2.
- Insurance, up to four split hands, virtual bankroll, and per-session win/loss/push totals. When the dealer shows an Ace, Insurance and Decline replace the normal action buttons; the table status shows the side-bet cost. There is no insurance popup.
- Split Aces always receive one card, with no further hits or doubles. With RSA enabled, another Ace can be resplit up to four hands if funds allow; other Ace hands stand automatically. Split 21 pays as an ordinary win. Retired HSA preferences are ignored. Free Play rules are ordered by the supplied chart: DAS (Very common), H17 (Fairly common), RSA (Uncommon), and late surrender (Uncommon). Fresh defaults enable DAS/H17 and disable RSA/surrender; saved choices are preserved.
- Timed decisions pause for menus. The Hi-Lo running count tracks exposed cards and resets after a shuffle. Hold the table's Peek count button (mouse, touch, Space, or Enter) to reveal it; releasing hides it. Automatic count quizzes are reserved for a future training mode, and their old saved preferences are ignored.
- Setup changes are drafts until Start. Live rule changes void an unfinished round and refund all its stakes.
- Free Play wagers use the supplied chip icons displayed at 48px on desktop, 44px on smaller screens, and 38px on phones in the lower-right felt corner. Chip buttons retain at least 44px tap targets. The controls overlay the felt without reserving height or horizontal space; hands retain their original centered layout. New sessions start with a $0 wager. Clicking adds that denomination; Clear resets the bet to zero. The wager appears beneath the bankroll. Bets can be built below the table minimum, but Deal stays disabled until the minimum is reached. Adds are capped at the table maximum and available bankroll. Chips and Clear hide during rounds (including insurance) and return when the round ends. The Free Play round counter is replaced by these controls; rounds are still tracked internally. Keyboard shortcuts and card animations remain available.

Game Options now has a Stakes selector: Small Fry ($500 bankroll, $5–$250 bets), Average Joe ($2,500, $25–$1,000), High Roller ($10,000, $100–$5,000), and Custom. The three sliders show preset amounts and unlock in Custom, using discrete value lists. Conflicting custom values adjust to keep the minimum affordable and no higher than the maximum. Stakes apply to the next new session. Existing preferences migrate to Custom with their original limits.

Dialogs now retain React-controlled fields while sliders move, keep keyboard focus inside, and make the underlying table inert. Event listeners, observers, and timers have explicit cleanup. In-flight rounds use cancellation tokens so a reset cannot resume stale dealing animations.

Rules and Options dialogs keep edits pending until OK or Apply. OK saves and closes; Apply saves and stays open; Cancel (or Escape) discards edits since the last Apply. Apply is disabled when nothing has changed. Applying rule changes retains each mode's existing session-reset behavior.

## Basic Strategy

Choose Basic Strategy from the main menu, set DAS, H17, late surrender, difficulty, and optional timed hands, then start. Every question deals two player cards and one dealer upcard. One action is graded immediately and the correct action is highlighted. Correct answers advance after 1.1 seconds. Mistakes and timeouts open a small explanation window and wait for Next hand. No hand plays out.

Both drill modes offer Skip explanations, off by default, in setup and Options. Enable it to hide mistake explanations and advance after the same short feedback delay. The preference is saved separately for each mode. The explanation window is centered over the felt between the dealer and player areas on desktop and mobile, keeping cards unobscured. Feedback uses the highlighted answer buttons and explanation window, without a status box. Opening the menu preserves a pending review; Next hand continues it. Selecting a different mode discards the previous run, including pending reviews.

Normal gives every physical card a 1/52 chance on each draw, with replacement; ten-valued ranks retain their natural combined probability of 4/13. Naturals are skipped because they have no initial decision. Difficult samples uniformly from the [rule-specific edge-case cells](docs/basic-strategy-edge-cases.md), with replacement, then varies the card composition, order, suits, and ten-valued ranks. A cell qualifies if its correct action differs from an immediately adjacent dealer upcard or player total within the same hand family. Pairs compare dealer upcards only. Both difficulties continue indefinitely.

Grading uses standard total-dependent multi-deck strategy with dealer peek, doubling on any first two cards, and the selected rules, based on [Michael Shackleford's strategy reference](https://wizardofodds.com/games/blackjack/strategy/4-decks/). Deck composition and card-count deviations are not used. The Difficult pool is derived from the grading function in `model/difficultHands.ts` and follows changes to table rules.

Accuracy is correct answers divided by all attempts. Timeouts count as incorrect. Streaks, misses, and timeout counts are recorded only in this mode's `BasicStrategyStats`; Free Play keeps its own `FreePlayStats` with net return, rounds, and hand outcomes. The menu has a single Resume Game button for the current run. Opening menus pauses the trainer's decision and feedback clocks. Selecting a different mode discards the previous session, cancels pending timers or dealing, and clears its counters. Returning to that mode starts fresh; saved options remain available. Statistics remain in memory until page reload; no account or server persistence is added.

Basic Strategy mistake and timeout explanations include Show strategy chart. It opens a Windows-style reference window for the current hard, soft, or pair hand, highlights the hand/upcard cell, and uses the same rule-dependent recommendations as grading. Chart headers stay visible while scrolling on phones; closing returns to the same review without advancing or changing accuracy. Deviations does not include this chart.

Basic Strategy preferences, including difficulty, use `blackjack98-basic-strategy-v1`, independently of Free Play's existing storage key. Older preferences default to Normal. Changing a table rule during practice resets the Basic Strategy session: all counters and feedback are cleared, and a fresh hand starts under the new rules with a full decision timer. Difficulty changes skip the current unscored question and retain prior accuracy. Keyboard shortcuts match Free Play: H/S/D/P/R.

## Deviations

Choose H17 or S17 and practice the Illustrious 18, Fab 4, or both. Each question shows a two-card hand, dealer upcard, and integer Hi-Lo true count. Select one action and receive immediate feedback. Mistakes show a brief explanation of the index and wait for Next hand unless Skip explanations is enabled. Every eligible index has an equal chance of being chosen; each side of its boundary has a 50% chance. For a stand index of +2, questions show +1 (hit) or +2 (stand). Negative indices work the same way: a stand index of -2 produces -3 (hit) or -2 (stand).

Indices use the six-deck, dealer-peek convention documented in [the deviation reference](docs/deviations.md), with doubling on any initial two cards. Player card compositions, order, ten-valued ranks, and suits vary without changing the decision being tested. Insurance is included in the 18 and uses Take insurance / Decline insurance actions, including I/N shortcuts. Other hands use H/S/D/P and R when surrender applies. The index is revealed only in mistake explanations.

Illustrious 18 questions explicitly assume no surrender; Fab 4 questions explicitly offer late surrender. This avoids conflicting answers on overlapping hands such as 15 vs 10. Deviations has its own `DeviationsStats` and `blackjack98-deviations-v1` preferences. Timed questions and menus behave like Basic Strategy. Changing table rules or the practice set resets the Deviations session. Switching modes discards the current run while retaining each mode's saved preferences. The shared practice screen and lifecycle live in `features/training`, while index data, dealing, grading, and settings remain in `features/deviations`.

## Adding features later

**Training modes:** create a feature directory with its screen and training logic, register its metadata in `app/trainingModes.ts`, then extend `ModeNavigation.tsx` and the mode switch in `App.tsx`. Give the controller its own typed session stats and preference key. Decision drills can reuse `features/training` with their own typed question generation, grading, action availability, and settings. Other modes can reuse card scoring, artwork, settings controls, and `GameWindow` where appropriate. Modes currently use an application-level switch without URL routing.

**Achievements and progress:** `createBlackjackGame` accepts an optional `onRoundComplete` callback. It receives the mode, round number, net result, bankroll, hand results, and rules once settlement finishes. A future application service can consume that event. Add more detailed decision events when a training mode needs them; the current event does not contain decision history. The settings repository is injectable for tests and future storage adapters.

**Accounts:** add an authentication feature and server-backed repositories when requirements are known. The current app saves preferences locally and keeps session results in memory. No login, achievements, durable progress, or backend is implemented.

**Artwork:** replace entries in `assets/cards.ts` with imported image URLs or paths under `public/`. `PlayingCard` uses that one map, so table code does not need to change. The brand image and favicon remain embedded too.

## Saved settings

The original `blackjack98-v3` key and `{ rules, options, chip }` schema are retained, including migration of the old $250 chip selection to $500. Invalid stored values fall back to validated defaults. Existing settings are available only when served from the same browser origin; opening the old file directly and opening the Vite server use different storage origins.

## Browser verification

Browser tests use an installed Google Chrome, without a separate browser download:

```powershell
npm.cmd run test:browser
```

The optional comparison test captures the original and migrated menu, setup, empty table, playing hand, and settled round at desktop and phone widths. To enable it:

```powershell
$env:BLACKJACK_LEGACY_HTML = 'C:\path\to\blackjack-98-free-play-v14.html'
npm.cmd run test:browser
```

Captures are written under ignored `test-results/`. These are comparison artifacts rather than committed screenshot baselines. Gameplay tests use controlled shoes and fake clocks to verify payouts, insurance, split rules, refunds, race prevention, and timers.
