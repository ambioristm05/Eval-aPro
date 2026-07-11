import { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_DISMISS_MS = 5000;

export function useTimedState(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  const setTimedValue = useCallback((nextValue) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    setValue(nextValue);

    if (nextValue) {
      timeoutRef.current = window.setTimeout(() => setValue(''), AUTO_DISMISS_MS);
    }
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    []
  );

  return [value, setTimedValue];
}
