import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import AnimatedList from './AnimatedList.jsx';

// Custom dropdown that renders an <AnimatedList /> in a body-level portal so it
// is never clipped by a card's `overflow: hidden`. Shows 4 items without scroll.

const normalize = (options) =>
  options.map((option) =>
    option && typeof option === 'object' ? option : { value: option, label: String(option) }
  );

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select',
  ariaLabel,
  className = '',
  triggerClassName = ''
}) {
  const items = normalize(options);
  const current = items.find((option) => String(option.value) === String(value));
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'down' });
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  const reposition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const popHeight = popRef.current?.offsetHeight || 210;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < popHeight + 12 && rect.top > popHeight + 12 ? 'up' : 'down';
    setCoords({
      left: rect.left,
      width: rect.width,
      top: placement === 'down' ? rect.bottom + 6 : rect.top - popHeight - 6,
      placement
    });
  };

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReflow = () => reposition();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={`select-field ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        className={`select-trigger ${triggerClassName}${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={current ? 'select-value' : 'select-placeholder'}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={15} className="select-chevron" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            className={`select-popover place-${coords.placement}`}
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width }}
          >
            <AnimatedList
              items={items}
              selectedValue={value}
              maxVisible={4}
              onItemSelect={(item) => {
                onChange(item.value);
                setOpen(false);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
