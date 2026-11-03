import { useEffect, useRef, useState } from "react";

/**
 * Counts the times `value` rose since mount, e.g. to replay an animation keyed on it. The first
 * value and any fall (the caller marking things read) do not count.
 */
export function useBumpOnRise({ value }: { value: number }) {
  const [bumps, setBumps] = useState(0);
  const previous = useRef(value);
  useEffect(() => {
    if (value > previous.current) setBumps((count) => count + 1);
    previous.current = value;
  }, [value]);
  return bumps;
}
