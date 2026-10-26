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

## Counts by complete table-rule selection

| Dealer rule | DAS | Late surrender | Hard totals | Soft totals | Pairs | Total |
| ----------- | --- | -------------- | ----------: | ----------: | ----: | ----: |
| S17         | Off | Off            |          55 |          38 |    76 |   169 |
| S17         | Off | On             |          59 |          38 |    76 |   173 |
| S17         | On  | Off            |          55 |          38 |    72 |   165 |
| S17         | On  | On             |          59 |          38 |    72 |   169 |
| H17         | Off | Off            |          57 |          41 |    76 |   174 |
| H17         | Off | On             |          62 |          41 |    76 |   179 |
| H17         | On  | Off            |          57 |          41 |    72 |   170 |
| H17         | On  | On             |          62 |          41 |    72 |   175 |

Numbers count chart cells, not the number of physical card combinations.

## Complete lists for each rule selection

Each row lists the dealer upcards that make that player hand an edge case, grouped by the correct action. "All" means 2 through Ace. Hard totals exclude pairs: for example, hard 16 does not mean 8,8. A 10-valued upcard includes 10/J/Q/K.

### S17 / No DAS / No surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                |
| 11          | **double**: 2, 3, 4, 5, 6, 7, 8, 9, 10; **hit**: A |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6     |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7, 8, 9, 10, A                          |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### S17 / No DAS / Surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action   |
| ----------- | ---------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                  |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6          |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                  |
| 11          | **double**: 2, 3, 4, 5, 6, 7, 8, 9, 10; **hit**: A   |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6       |
| 13          | **stand**: 2, 3, 6; **hit**: 7                       |
| 14          | **stand**: 6; **hit**: 7, 10                         |
| 15          | **stand**: 6; **hit**: 7, 9, A; **surrender**: 10    |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10, A |
| 17          | **stand**: 7, 8, 9, 10, A                            |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### S17 / DAS / No surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                |
| 11          | **double**: 2, 3, 4, 5, 6, 7, 8, 9, 10; **hit**: A |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6     |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7, 8, 9, 10, A                          |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### S17 / DAS / Surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action   |
| ----------- | ---------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                  |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6          |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10                  |
| 11          | **double**: 2, 3, 4, 5, 6, 7, 8, 9, 10; **hit**: A   |
| 12          | **hit**: 2, 3, 7, 8, 9, 10; **stand**: 4, 5, 6       |
| 13          | **stand**: 2, 3, 6; **hit**: 7                       |
| 14          | **stand**: 6; **hit**: 7, 10                         |
| 15          | **stand**: 6; **hit**: 7, 9, A; **surrender**: 10    |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10, A |
| 17          | **stand**: 7, 8, 9, 10, A                            |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
| ----------- | ------------------------------------------------------------- |
| A,2         | **hit**: 4, 7; **double**: 5, 6                               |
| A,3         | **hit**: 4, 7; **double**: 5, 6                               |
| A,4         | **hit**: 3, 7; **double**: 4, 6                               |
| A,5         | **hit**: 3, 7; **double**: 4, 6                               |
| A,6         | **hit**: 2, 7, 8; **double**: 3, 6                            |
| A,7         | **stand**: 2, 7, 8; **double**: 3, 4, 5, 6; **hit**: 9, 10, A |
| A,8         | **stand**: 3, 4, 5, 6, 9, 10, A                               |

**Pairs (dealer-upcard and player-row neighbors)**

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### H17 / No DAS / No surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: All (2-A)                              |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7, 8, 9, 10, A                          |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
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

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### H17 / No DAS / Surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: All (2-A)                              |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7, 10, A                    |
| 15          | **stand**: 6; **hit**: 7, 9; **surrender**: 10, A  |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10  |
| 17          | **stand**: 7, 8, 9, 10; **surrender**: A           |
| 18          | **stand**: A                                       |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
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

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **hit**: 3, 8; **split**: 4, 7                      |
| 3,3         | **hit**: 3, 8; **split**: 4, 5, 6, 7                |
| 4,4         | **hit**: 2, 3, 4, 5, 6, 7, 8, 9                     |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **hit**: 2, 7, 8, 9; **split**: 3, 4, 5, 6          |
| 7,7         | **split**: 2, 7; **hit**: 8, 9, 10, A               |
| 8,8         | **split**: 7, 8, 9, 10; **surrender**: A            |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### H17 / DAS / No surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: All (2-A)                              |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7                           |
| 15          | **stand**: 6; **hit**: 7                           |
| 16          | **stand**: 6; **hit**: 7, 8, 9, 10, A              |
| 17          | **stand**: 7, 8, 9, 10, A                          |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
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

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7, 8, 9, 10, A                           |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

### H17 / DAS / Surrender

**Hard totals**

| Player hand | Eligible dealer upcards, grouped by correct action |
| ----------- | -------------------------------------------------- |
| 8           | **hit**: 3, 4, 5, 6                                |
| 9           | **hit**: 2, 7, 8, 9; **double**: 3, 4, 5, 6        |
| 10          | **double**: 2, 7, 8, 9; **hit**: 10, A             |
| 11          | **double**: All (2-A)                              |
| 12          | **hit**: 2, 3, 7, 8, 9, 10, A; **stand**: 4, 5, 6  |
| 13          | **stand**: 2, 3, 6; **hit**: 7                     |
| 14          | **stand**: 6; **hit**: 7, 10, A                    |
| 15          | **stand**: 6; **hit**: 7, 9; **surrender**: 10, A  |
| 16          | **stand**: 6; **hit**: 7, 8; **surrender**: 9, 10  |
| 17          | **stand**: 7, 8, 9, 10; **surrender**: A           |
| 18          | **stand**: A                                       |

**Soft totals**

| Player hand | Eligible dealer upcards, grouped by correct action            |
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

| Player pair | Eligible dealer upcards, grouped by correct action  |
| ----------- | --------------------------------------------------- |
| 2,2         | **split**: 7; **hit**: 8                            |
| 3,3         | **split**: 2, 3, 4, 7; **hit**: 8                   |
| 4,4         | **hit**: 2, 3, 4, 7, 8, 9; **split**: 5, 6          |
| 5,5         | **double**: 2, 3, 4, 5, 6, 7, 8, 9; **hit**: 10     |
| 6,6         | **split**: 2, 3, 4, 5, 6; **hit**: 7, 8, 9          |
| 7,7         | **split**: 7; **hit**: 8, 9, 10, A                  |
| 8,8         | **split**: 7, 8, 9, 10; **surrender**: A            |
| 9,9         | **split**: 2, 3, 4, 5, 6, 8, 9; **stand**: 7, 10, A |
| 10,10       | **stand**: All                                      |
| A,A         | **split**: All                                      |

## Important consequences for difficulty

- Under S17, hard 8 against 6 qualifies: it is hit, while hard 9 against 6 is double. A boundary filter therefore includes some straightforward decisions.
- Under H17 with late surrender, hard 16 against Ace does not qualify in the non-pair hard-total grid. Its available neighbors (15 against Ace, 17 against Ace, and 16 against 10) all say surrender.
- A,A and ten-valued pairs qualify against every dealer upcard because their adjacent player rows prescribe different actions: split for Aces and stand for tens.
- Under H17 with late surrender, 8,8 against Ace is surrender. Pair eligibility also considers the actions for neighboring 7,7 and 9,9 hands.
- Normal uses the full initial-decision pool. Tricky gives each eligible chart cell an equal chance, regardless of how often it would occur in random deals. Both continue indefinitely. The pool is derived from the same strategy function used for grading in `src/features/basic-strategy/model/difficultHands.ts`.
