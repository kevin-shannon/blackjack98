import { useEffect, useState } from 'react';

export function CountPeek({
  count,
  enabled,
}: {
  count: number;
  enabled: boolean;
}) {
  const [holding, setHolding] = useState<'pointer' | 'keyboard' | null>(null);
  useEffect(() => {
    const hide = () => setHolding(null);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  useEffect(() => {
    if (!enabled) setHolding(null);
  }, [enabled]);
  const showing = enabled && holding !== null;
  return (
    <div className="count-peek">
      <button
        type="button"
        className="count-peek-button"
        disabled={!enabled}
        aria-label="Peek count"
        aria-describedby="peek-hint"
        aria-controls="peek-count"
        aria-pressed={showing}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setHolding('pointer');
        }}
        onPointerUp={() => setHolding(null)}
        onPointerCancel={() => setHolding(null)}
        onLostPointerCapture={() => setHolding(null)}
        onBlur={() => setHolding(null)}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) setHolding('keyboard');
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            setHolding(null);
          }
        }}
      >
        Peek count
      </button>
      <output
        id="peek-count"
        className="count-peek-value"
        aria-label="Running count"
        aria-live="off"
      >
        {showing ? `${count > 0 ? '+' : ''}${count}` : '—'}
      </output>
      <span id="peek-hint" className="visually-hidden">
        Hold to reveal the Hi-Lo running count. Release to hide. Keyboard: hold
        Space or Enter.
      </span>
    </div>
  );
}
