/** Add mode metadata here; give each new mode its own feature directory and screen. */
export const trainingModes = [
  {
    id: 'basic-strategy',
    title: 'BASIC STRATEGY',
    description: 'Drill until you know the basics',
    category: 'train',
  },
  {
    id: 'deviations',
    title: 'DEVIATIONS',
    description: 'Learn when to bend the rules',
    category: 'train',
  },
  {
    id: 'free-play',
    title: 'FREE PLAY',
    description: 'Build a bankroll at your own pace with what you’ve learned',
    category: 'play',
  },
] as const;
export type TrainingModeId = (typeof trainingModes)[number]['id'];
