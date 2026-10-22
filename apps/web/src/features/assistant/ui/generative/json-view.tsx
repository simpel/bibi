"use client";

import { Card } from "@bibi/ui";
import type { GenerativeProps } from "./generative-props";

export type JsonViewProps = GenerativeProps<"json">;

const MAX_CHARS = 4000;

/** Fallback for results without a dedicated card: pretty-printed JSON (as text, never HTML). */
export function JsonView({ value }: JsonViewProps) {
  const text = JSON.stringify(value, null, 2) ?? "null";
  return (
    <Card data-slot="json-result" className="shadow-none">
      <pre className="max-h-64 overflow-auto p-3 font-mono text-xs">
        {text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n…` : text}
      </pre>
    </Card>
  );
}
