import { useEffect, useRef } from 'react';
import { clamp } from '../model/cards';
export function ShoeMeter({
  remaining,
  total,
  penetration,
}: {
  remaining: number;
  total: number;
  penetration: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fraction = clamp(remaining / Math.max(1, total), 0, 1);
  useEffect(() => {
    const canvas = ref.current!;
    function paint() {
      const rect = canvas.getBoundingClientRect(),
        dpr = window.devicePixelRatio || 1;
      const width = Math.max(0, Math.round(rect.width * dpr)),
        height = Math.max(0, Math.round(rect.height * dpr));
      if (!width || !height) return;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000080';
      const filled = Math.round(width * fraction),
        step = Math.max(8, Math.round(8 * dpr)),
        gap = Math.max(2, Math.round(2 * dpr));
      for (let x = 0; x < filled; x += step)
        ctx.fillRect(x, 0, Math.min(step - gap, filled - x), height);
    }
    paint();
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(paint) : null;
    observer?.observe(canvas);
    window.addEventListener('resize', paint);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', paint);
    };
  }, [fraction]);
  return (
    <div className="shoe-progress">
      <span className="shoe-progress-label">SHOE</span>
      <div
        id="shoe-track"
        className="shoe-track"
        role="progressbar"
        aria-label="Cards remaining in shoe"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fraction * 100)}
        aria-valuetext={`${remaining} of ${total} cards remaining`}
        title={`${remaining} of ${total} cards remaining · reshuffle at ${penetration}% penetration (next round)`}
      >
        <div className="shoe-track-inner">
          <canvas ref={ref} className="shoe-canvas" aria-hidden="true" />
          <div
            className="shoe-cut"
            style={{ left: `${100 - penetration}%` }}
            title="Reshuffle threshold"
          />
        </div>
      </div>
    </div>
  );
}
