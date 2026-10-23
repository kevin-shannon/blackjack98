export function RoundCounter({ round }: { round: number }) {
  return (
    <span aria-label="Current round">
      ROUND {String(round).padStart(2, '0')}
    </span>
  );
}
