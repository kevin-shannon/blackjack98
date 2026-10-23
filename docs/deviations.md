# Deviations practice reference

The mode teaches the Hi-Lo Illustrious 18 and Fab 4 under a six-deck shoe convention, dealer peek, and doubling on any first two cards. Its complete, editable index data lives in `src/features/deviations/model/indices.ts`. Each row has an ID, set, player hand, upcard, S17 and H17 thresholds, and explicit actions on both sides.

## Sources and convention

- The S17 indices follow [Wizard of Odds' Hi-Lo reference](https://wizardofodds.com/games/blackjack/card-counting/high-low/), which republishes Schlesinger's Illustrious 18 and Fab 4 with permission.
- The rule-specific values follow [Blackjack Trainer's H17/S17 comparison and index tables](https://www.blackjacktrainer.fyi/charts/deviations/s17). Its author describes the underlying calculation in [the index generator explanation](https://www.blackjacktrainer.fyi/learn/blackjack-index-generator).
- H17 changes four of the included thresholds relative to S17: double 11 vs Ace (+1 to -1), double 10 vs Ace (+4 to +3), stand 12 vs 6 (-1 to -3), and surrender 15 vs Ace (+1 to -1).

Published tables can use different deck counts, risk assumptions, true-count conversions, and running-count shorthand. This drill consistently uses the explicit integer thresholds above. It supplies the true count directly; it does not test rounding, running-count conversion, risk-averse indices, or additional deviations.

## Boundary sampling

Every selected index is equally likely, with replacement. After choosing the index, a fair independent choice selects its threshold or one integer below it. Card compositions and suits then vary independently.

All rows are normalized to an action at or above the threshold and a different action below it. This also handles negative-count deviations without reversing the comparison accidentally. For example, the S17 stand threshold for 12 vs 5 is -2: hit at -3 and stand at -2. H17 double 11 vs Ace has threshold -1: hit at -2 and double at -1.

Both sets together contain 22 index entries and 44 hand/count cases per dealer rule. The same hand can appear in both sets with different table contexts.

## Surrender and insurance

Illustrious 18 questions use a no-surrender context. Fab 4 questions use late surrender. Each hand identifies that context visibly, and the Surrender action appears only for Fab 4 questions. In particular, 15 vs 10 tests stand at +4 in Illustrious 18 but surrender at 0 in Fab 4.

Insurance remains part of the Illustrious 18. It shows an Ace upcard and random player cards but grades only the insurance decision, using Take insurance / Decline insurance. The threshold is +3 for either dealer rule; generated counts are +2 or +3. A player's natural does not remove this question because insurance or even money still has a decision.

## Session behavior

One answer is graded and the correct action is highlighted. Correct answers advance after 1.1 seconds. By default, mistakes and timeouts show the threshold explanation in a small window centered over the felt between the dealer and player areas, keeping cards unobscured on desktop and mobile. The window waits for Next hand. There is no separate status box. Skip explanations hides the window and advances automatically after the short feedback delay. The preference defaults to off and is saved separately for this mode.

Opening a menu pauses both timers and preserves manual reviews without advancing. Resume Game returns to the current run. Selecting another mode discards this session and its timers; revisiting Deviations starts fresh with the saved preferences. Repeated questions are allowed. The mode keeps only its current question and counters, so the session can continue indefinitely.

Accuracy, streaks, misses, and timeouts use a separate `modeId: 'deviations'` stats record. Settings use `blackjack98-deviations-v1`. Setup changes remain drafts until Start. Changing the dealer rule or practice set during a run clears this mode's stats and feedback and deals a new question with a full decision timer.
