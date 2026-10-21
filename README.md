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

Live site: https://kevin-shannon.github.io/blackjack98/

Every push to `main` runs `.github/workflows/deploy-pages.yml`: install locked dependencies with `npm ci`, run the game regression tests, type-check and build, and deploy `dist/` to GitHub Pages. Failed tests or builds prevent deployment. You can also run it manually from the repository's Actions tab.

The repository's Settings → Pages → Source must be **GitHub Actions**. The workflow uses GitHub's built-in token and Pages environment; no deployment secret or `gh-pages` branch is needed. It obtains the site's base path from Pages metadata and passes it to Vite so assets load under `/blackjack98/`. Local development retains its relative base path.

## Organization

```text
src/
  app/
    App.tsx                    Application composition
    trainingModes.ts           Mode menu metadata
  assets/
    cards.ts                   Original 53 base64 card images
    brand.ts                   Original base64 app icon
  features/
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
    settings/
      SettingsFields.tsx       Shared setup and live-settings controls
      settingsRepository.ts    Validated browser persistence
      *.test.ts                Saved-settings compatibility tests
  shared/
    lib/format.ts              Currency display
    ui/                        Reusable beveled buttons and accessible dialogs
  styles/
    legacy.css                 Original CSS, including its v14 refinements
tests/browser/
  free-play.spec.ts            Browser workflows and optional legacy captures
```

## Behavior preserved

- Configurable decks, penetration, blackjack payouts, soft 17, double after split, resplit aces, and late surrender.
- Insurance, up to four split hands, virtual bankroll, and per-session win/loss/push totals.
- Split aces remain playable after their second cards, matching v14. A split 21 is a regular win.
- Timed decisions pause for menus. The Hi-Lo running count tracks exposed cards and resets after a shuffle. Hold the table's Peek count button (mouse, touch, Space, or Enter) to reveal it; releasing hides it. Automatic count quizzes are reserved for a future training mode, and their old saved preferences are ignored.
- Setup changes are drafts until Start. Live rule changes void an unfinished round and refund all its stakes.
- Chip selection sets the increment; the plus/minus buttons change the wager. Keyboard shortcuts and card animations remain available.

Game Options now has a Stakes selector: Small Fry ($500 bankroll, $5–$250 bets), Average Joe ($2,500, $25–$1,000), High Roller ($10,000, $100–$5,000), and Custom. The three sliders show preset amounts and unlock in Custom, using discrete value lists. Conflicting custom values adjust to keep the minimum affordable and no higher than the maximum. Stakes apply to the next new session. Existing preferences migrate to Custom with their original limits.

Dialogs now retain React-controlled fields while sliders move, keep keyboard focus inside, and make the underlying table inert. Event listeners, observers, and timers have explicit cleanup. In-flight rounds use cancellation tokens so a reset cannot resume stale dealing animations.

## Adding features later

**Training modes:** create a feature directory with its screen and training logic, register its metadata in `app/trainingModes.ts`, and wire menu selection to that screen in `GameDialogs.tsx` or an application-level mode switch. The current registry describes the single implemented mode; routing is intentionally not added yet. Reuse `blackjack/model/cards.ts`, card components, and settings controls where appropriate.

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
