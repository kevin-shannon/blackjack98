import { useId } from 'react';

/** Visual-only estimate: exact card counts and percentages would reveal the answer. */
export function DiscardTray({
  decksRemaining,
  totalDecks,
}: {
  decksRemaining: number;
  totalDecks: number;
}) {
  const pattern = `card-edges-${useId().replaceAll(':', '')}`;
  const height = ((totalDecks - decksRemaining) / totalDecks) * 168;
  const top = 197 - height;
  return (
    <figure className="deck-estimation-discard">
      <figcaption>Discard tray · {totalDecks}-deck game</figcaption>
      <svg
        viewBox="0 0 260 230"
        role="img"
        aria-label="Discard pile; estimate decks remaining from the used cards"
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern
            id={pattern}
            width="144"
            height="3"
            patternUnits="userSpaceOnUse"
          >
            <rect width="144" height="3" fill="#f5f5f5" />
            <path d="M0 2h144" stroke="#aaa" />
          </pattern>
        </defs>
        <rect
          x="43"
          y="20"
          width="176"
          height="186"
          fill="#c0c0c0"
          stroke="#000"
          strokeWidth="2"
        />
        <path d="M44 205V21h174" fill="none" stroke="#fff" strokeWidth="2" />
        <rect
          x="51"
          y="28"
          width="160"
          height="170"
          fill="#888"
          stroke="#444"
        />
        {height > 0 && (
          <>
            <rect
              className="deck-stack"
              x="59"
              y={top}
              width="144"
              height={height}
              fill={`url(#${pattern})`}
              stroke="#333"
            />
            <rect
              x="59"
              y={top}
              width="144"
              height="5"
              fill="#000080"
              stroke="#fff"
            />
          </>
        )}
        <path d="M44 207h176v7H44z" fill="#555" />
        <path d="M30 29h12 M30 197h12" stroke="#fff" strokeWidth="2" />
        <text
          x="14"
          y="33"
          fill="#fff"
          fontSize="12"
          fontFamily="Tahoma, sans-serif"
        >
          {totalDecks}
        </text>
        <text
          x="14"
          y="201"
          fill="#fff"
          fontSize="12"
          fontFamily="Tahoma, sans-serif"
        >
          0
        </text>
      </svg>
    </figure>
  );
}
