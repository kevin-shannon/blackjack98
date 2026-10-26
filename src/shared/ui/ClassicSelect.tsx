import { useEffect, useRef, useState } from 'react';

export function ClassicSelect<T extends string>({
  id,
  label,
  value,
  options,
  getLabel = (option) => option,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  getLabel?: (value: T) => string;
  onChange: (value: T) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = `${id}-list`;
  const selected = options.indexOf(value);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  function choose(index: number) {
    onChange(options[index]);
    setOpen(false);
  }

  return (
    <div
      ref={ref}
      className="classic-select"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        id={id}
        type="button"
        className="classic-select-control"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => {
          setActive(selected);
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          const index = open ? active : selected;
          switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
              event.preventDefault();
              setActive(
                open
                  ? Math.max(
                      0,
                      Math.min(
                        options.length - 1,
                        index + (event.key === 'ArrowDown' ? 1 : -1),
                      ),
                    )
                  : selected,
              );
              setOpen(true);
              break;
            case 'Home':
            case 'End':
              event.preventDefault();
              setActive(event.key === 'Home' ? 0 : options.length - 1);
              setOpen(true);
              break;
            case 'Enter':
            case ' ':
              event.preventDefault();
              if (open) choose(active);
              else {
                setActive(selected);
                setOpen(true);
              }
              break;
            case 'Escape':
              if (open) {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
              }
              break;
            case 'Tab':
              setOpen(false);
              break;
            default: {
              if (
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.key.length !== 1
              )
                break;
              const match = options.findIndex((option) =>
                getLabel(option)
                  .toLowerCase()
                  .startsWith(event.key.toLowerCase()),
              );
              if (match !== -1) {
                event.preventDefault();
                setActive(match);
                setOpen(true);
              }
            }
          }
        }}
      >
        <span className="classic-select-value">{getLabel(value)}</span>
        <span className="classic-select-arrow" aria-hidden="true" />
      </button>
      {open && (
        <div
          id={listId}
          className="classic-select-list"
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => (
            <div
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option === value}
              className={`classic-select-option${index === active ? ' active' : ''}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => choose(index)}
            >
              {getLabel(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
