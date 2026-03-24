// 역할: Debounced Value 관련 상태와 부수효과를 캡슐화한 훅이다.

import { useEffect, useState } from "react";

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [value, delayMs]);

  return debounced;
};
