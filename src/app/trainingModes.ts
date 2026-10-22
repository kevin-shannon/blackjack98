/** Add mode metadata here; give each new mode its own feature directory and screen. */
export const trainingModes = [
  {
    id: 'basic-strategy',
    title: 'BASIC STRATEGY',
    description: 'Rapid-fire decisions · Instant feedback',
  },
  {
    id: 'free-play',
    title: 'FREE PLAY',
    description: 'Classic blackjack · Virtual bankroll',
  },
] as const;
export type TrainingModeId = (typeof trainingModes)[number]['id'];
