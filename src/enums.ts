export interface Action {
  actionName: string;
  src: string;
  alt: string;
}

export const actions: Action[] = [
  { actionName: "double", src: "2x.png", alt: "Double" },
  { actionName: "surrender", src: "surrender.png", alt: "Surrender" },
  { actionName: "hit", src: "hit.png", alt: "Hit" },
  { actionName: "split", src: "split.png", alt: "Split" },
  { actionName: "stand", src: "stand.png", alt: "Stand" },
  { actionName: "insurance", src: "insurance.png", alt: "Insurance" },
];
