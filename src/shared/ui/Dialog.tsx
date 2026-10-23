import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
export function Dialog({
  title,
  className = '',
  initialFocus = 'first-control',
  children,
}: {
  title: string;
  className?: string;
  initialFocus?: 'first-control' | 'dialog';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current!;
    const first = dialog.querySelector<HTMLElement>(
      '[autofocus], input:not(:disabled), button:not(:disabled), select:not(:disabled), a[href]',
    );
    (initialFocus === 'dialog' ? dialog : first || dialog).focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [initialFocus]);
  return createPortal(
    <div id="overlay-host">
      <div className="overlay">
        <div
          ref={ref}
          className={`modal ${className}`}
          data-title={title}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const controls = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
              ),
            ];
            const first = controls[0],
              last = controls.at(-1);
            if (!first) {
              event.preventDefault();
              return;
            }
            if (
              event.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === event.currentTarget)
            ) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
