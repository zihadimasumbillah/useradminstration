'use client';

import { useEffect, RefObject } from 'react';

/**
 * Hook that alerts when you click outside of the passed ref
 */
const useClickOutside = <T extends HTMLElement | null = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  exceptIds: string[] = []
): void => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      
      // Check if the click was on an excluded element by ID
      if (exceptIds.length) {
        for (const id of exceptIds) {
          const exceptEl = document.getElementById(id);
          if (exceptEl && exceptEl.contains(event.target as Node)) {
            return;
          }
        }
      }

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, exceptIds]);
};

export default useClickOutside;