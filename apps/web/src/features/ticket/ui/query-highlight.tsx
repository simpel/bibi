import { cn } from "@bibi/ui";
import { type RefObject, useLayoutEffect, useMemo, useRef } from "react";
import { queryParts } from "../lib/query-highlight";
import type { QueryVocabulary } from "../lib/query-vocabulary";

export type QueryHighlightProps = {
  value: string;
  vocabulary: QueryVocabulary;
  /** The input it lies under; its scroll position is mirrored. */
  input: RefObject<HTMLInputElement | null>;
};

const SYNC_EVENTS = ["scroll", "input", "keyup", "select", "click", "focus"] as const;

/** Mirrors the input's horizontal scroll onto the highlight while the search is longer than it. */
function useScrollSync({ input, value }: Pick<QueryHighlightProps, "input" | "value">) {
  const mirror = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: value is the trigger
  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    const sync = () => {
      if (mirror.current) mirror.current.scrollLeft = field.scrollLeft;
    };
    sync();
    for (const name of SYNC_EVENTS) field.addEventListener(name, sync);
    return () => {
      for (const name of SYNC_EVENTS) field.removeEventListener(name, sync);
    };
  }, [input, value]);
  return mirror;
}

/**
 * The search drawn under a transparent input (GitHub style): known qualifiers in the text
 * colour, their values marked. Same box and font as the input, no padding on the marks, so the
 * caret lines up with the letters.
 */
export function QueryHighlight({ value, vocabulary, input }: QueryHighlightProps) {
  const parts = useMemo(() => queryParts({ text: value, vocabulary }), [value, vocabulary]);
  const mirror = useScrollSync({ input, value });
  return (
    <div
      ref={mirror}
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded-[inherit] border border-transparent px-3 py-1 text-sm"
    >
      {parts.map((part, index) => (
        <span
          // The parts of one value never reorder; the index is a stable key.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          key={index}
          className={cn(part.kind === "value" && "rounded-sm bg-primary/15 text-primary")}
        >
          {part.text}
        </span>
      ))}
    </div>
  );
}
