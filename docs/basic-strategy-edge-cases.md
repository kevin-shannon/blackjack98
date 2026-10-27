# Basic Strategy: Tricky hand lists

These are the eligible hand/upcard combinations for Tricky practice. Normal retains the original random infinite-deck deals. Tricky samples these cells uniformly with replacement and varies card compositions, order, ten-valued ranks, and suits.

Calculated from `src/features/basic-strategy/model/strategy.ts`, using the existing standard multi-deck, total-dependent grading convention. These lists classify decision-chart cells; suits, interchangeable ten-valued ranks, and different non-pair compositions of a hard total do not create additional cells.

## Definition

- A cell is an edge case if at least one valid immediate neighbor has a different prescribed action.
- Check left/right dealer upcards in this order: 2, 3, 4, 5, 6, 7, 8, 9, 10, A. Do not wrap Ace back to 2.
- Check up/down player rows within each hand family: hard totals, soft totals, or pairs. Do not compare across hand families.
- Hard rows represent non-pair two-card totals. Soft rows run A,2 through A,9. Natural blackjacks are not practice questions.
- There are no diagonal comparisons. Cells on both sides of an action change qualify.
- Pair rows follow 2,2 through 10,10, then A,A. Compare adjacent pair ranks as well as adjacent dealer upcards; do not wrap A,A back to 2,2.

Routine rows are thinned after the boundary check: hard 8, 11, and 17, plus pairs of Aces, 8s, 5s, and tens. Each retains every dealer-upcard action boundary and one eligible representative per correct action, preferring the upcard closest to 6 (lower upcard breaks ties). This keeps rule-specific exceptions while reducing repetitive decisions. Other rows keep all eligible cells.

## Counts by complete table-rule selection

| Dealer rule | DAS | Late surrender | Hard totals | Soft totals | Pairs | Total |
| ----------- | --- | -------------- | ----------: | ----------: | ----: | ----: |
| S17         | Off | Off            |          41 |          38 |    48 |   127 |
| S17         | Off | On             |          45 |          38 |    48 |   131 |
| S17         | On  | Off            |          41 |          38 |    44 |   123 |
| S17         | On  | On             |          45 |          38 |    44 |   127 |
| H17         | Off | Off            |          41 |          41 |    48 |   130 |
| H17         | Off | On             |          48 |          41 |    50 |   139 |
| H17         | On  | Off            |          41 |          41 |    44 |   126 |
| H17         | On  | On             |          48 |          41 |    46 |   135 |

Numbers count retained chart cells, not physical card combinations.

## Complete lists for each rule selection

Each row lists retained dealer upcards, grouped by the correct action. Hard totals exclude pairs. A 10-valued upcard includes 10/J/Q/K.

### S17 / No DAS / No surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                |
| 11          | **double**: 6, 10; **hit**: A                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6     |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### S17 / No DAS / Surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action   |
| ----------- | ---------------------------------------------------- |
| 8           | **hit**: 6                                           |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6          |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                  |
| 11          | **double**: 6, 10; **hit**: A                        |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6       |
| 13          | **stand**: 2, 3, 6; **hit**: 7                       |
| 14          | **stand**: 6; **hit**: 7, 10                         |
| 15          | **stand**: 6; **hit**: 7, 9, A; **surrender**: 10    |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10, A |
| 17          | **stand**: 7                                         |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### S17 / DAS / No surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                |
| 11          | **double**: 6, 10; **hit**: A                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6     |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### S17 / DAS / Surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action   |
| ----------- | ---------------------------------------------------- |
| 8           | **hit**: 6                                           |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6          |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                  |
| 11          | **double**: 6, 10; **hit**: A                        |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6       |
| 13          | **stand**: 2, 3, 6; **hit**: 7                       |
| 14          | **stand**: 6; **hit**: 7, 10                         |
| 15          | **stand**: 6; **hit**: 7, 9, A; **surrender**: 10    |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10, A |
| 17          | **stand**: 7                                         |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### H17 / No DAS / No surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: 6                                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **double**: 2, 3, 4, 5, 6; **stand**: 7, 8; **hit**: 9, 10, A |
| A,8         | **stand**: 2, 3, 4, 5, 7, 9, 10, A; **double**: 6             |
| A,9         | **stand**: 6                                                  |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### H17 / No DAS / Surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: 6                                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7, 10, A                    |
| 15          | **stand**: 6; **hit**: 7, 9; **surrender**: 10, A  |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10  |
| 17          | **stand**: 7, 10; **surrender**: A                 |
| 18          | **stand**: A                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **double**: 2, 3, 4, 5, 6; **stand**: 7, 8; **hit**: 9, 10, A |
| A,8         | **stand**: 2, 3, 4, 5, 7, 9, 10, A; **double**: 6             |
| A,9         | **stand**: 6                                                  |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7, 10; **surrender**: A                  |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### H17 / DAS / No surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: 6                                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **double**: 2, 3, 4, 5, 6; **stand**: 7, 8; **hit**: 9, 10, A |
| A,8         | **stand**: 2, 3, 4, 5, 7, 9, 10, A; **double**: 6             |
| A,9         | **stand**: 6                                                  |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7                                        |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

### H17 / DAS / Surrender

**Hard totals**

| Player hand | Retained dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 6                                         |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: 6                                      |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7, 10, A                    |
| 15          | **stand**: 6; **hit**: 7, 9; **surrender**: 10, A  |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10  |
| 17          | **stand**: 7, 10; **surrender**: A                 |
| 18          | **stand**: A                                       |

**Soft totals**

| Player hand | Retained dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **double**: 2, 3, 4, 5, 6; **stand**: 7, 8; **hit**: 9, 10, A |
| A,8         | **stand**: 2, 3, 4, 5, 7, 9, 10, A; **double**: 6             |
| A,9         | **stand**: 6                                                  |

**Pairs (dealer-upcard and player-row neighbors)**

| Player hand | Retained dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 6, 9; **hit**: 10                       |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7, 10; **surrender**: A                  |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: 6                                        |
| A,A         | **split**: 6                                        |

## Important consequences for difficulty

- A,A and ten-valued pairs each retain one reminder against dealer 6 rather than ten repetitive cells.
- Hard 8 retains the dealer 6 example. Hard 11 retains its S17 boundary against 10/Ace; H17 needs only a representative double.
- Under H17 with late surrender, hard 17 and 8,8 retain the Ace surrender exception and the adjacent dealer 10 decision.
- Under H17 with late surrender, hard 16 against Ace still does not qualify: its available neighbors all prescribe surrender.
- Normal uses the full initial-decision pool. Tricky gives each retained cell equal probability, including when filtering to one hand family. Both continue indefinitely. The pool is derived from the same strategy function used for grading in `src/features/basic-strategy/model/difficultHands.ts`.
