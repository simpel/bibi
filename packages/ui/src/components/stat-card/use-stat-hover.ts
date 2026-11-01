import { useState } from "react";

export type UseStatHoverInput = { count: number };

/** Index of the series point nearest to the pointer's x on the card; `null` when the pointer is away. */
export function useStatHover({ count }: UseStatHoverInput) {
  const [index, setIndex] = useState<number | null>(null);
  const handlers = {
    onPointerMove: (event: { currentTarget: HTMLElement; clientX: number }) => {
      if (count < 2) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
      setIndex(Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1)))));
    },
    onPointerLeave: () => setIndex(null),
  };
  return { index, handlers };
}
