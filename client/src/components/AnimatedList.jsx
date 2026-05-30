import { useCallback, useEffect, useRef, useState } from 'react';

// Plain-CSS port of the React Bits <AnimatedList /> (no Tailwind / no `motion`).
// Items scale + fade in/out as they enter the scroll viewport, with hover and
// arrow-key navigation. Designed to live inside the <Select /> popover.

const getValue = (item) => (item && typeof item === 'object' ? item.value : item);
const getLabel = (item) => (item && typeof item === 'object' ? item.label : String(item));

function AnimatedItem({ item, index, active, rootRef, onMouseEnter, onClick }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root: rootRef.current, threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <div
      ref={ref}
      data-index={index}
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`al-item${active ? ' active' : ''}${inView ? ' in' : ''}`}
      style={{ transitionDelay: `${Math.min(index, 8) * 0.03}s` }}
    >
      <span>{getLabel(item)}</span>
    </div>
  );
}

export default function AnimatedList({
  items = [],
  onItemSelect,
  selectedValue,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  maxVisible = 4
}) {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    items.findIndex((it) => String(getValue(it)) === String(selectedValue))
  );
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopOpacity(Math.min(scrollTop / 40, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 40, 1));
  }, []);

  // Only show the bottom fade when the list actually overflows (scrolls).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    setTopOpacity(0);
    setBottomOpacity(el.scrollHeight <= el.clientHeight ? 0 : 1);
  }, [items]);

  useEffect(() => {
    if (!enableArrowNavigation) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onItemSelect?.(items[selectedIndex], selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const el = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      const margin = 24;
      const itemTop = el.offsetTop;
      const itemBottom = itemTop + el.offsetHeight;
      if (itemTop < container.scrollTop + margin) {
        container.scrollTo({ top: itemTop - margin, behavior: 'smooth' });
      } else if (itemBottom > container.scrollTop + container.clientHeight - margin) {
        container.scrollTo({ top: itemBottom - container.clientHeight + margin, behavior: 'smooth' });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className="al-root">
      <div
        ref={listRef}
        className={`al-scroll${displayScrollbar ? '' : ' al-no-scrollbar'}`}
        style={{ '--al-max': maxVisible }}
        onScroll={handleScroll}
        role="listbox"
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            item={item}
            index={index}
            active={selectedIndex === index}
            rootRef={listRef}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => onItemSelect?.(item, index)}
          />
        ))}
      </div>

      {showGradients && (
        <>
          <div className="al-fade al-fade-top" style={{ opacity: topOpacity }} aria-hidden="true" />
          <div className="al-fade al-fade-bottom" style={{ opacity: bottomOpacity }} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
