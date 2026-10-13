/** Below core's 256 kB `message.append` limit, with headroom for the JSON envelope. */
export const MAX_STORED_PARTS_CHARS = 240_000;

const TRUNCATED = { truncated: true, note: "Tool output too large to store" };

type Part = Record<string, unknown>;

const size = ({ parts }: { parts: readonly unknown[] }): number => JSON.stringify(parts).length;

export type FitPartsInput = { parts: readonly unknown[]; max?: number };

/**
 * Makes a message storable: drops transient parts and, largest first, replaces tool outputs with
 * a marker until the parts fit. Text is never truncated (the user saw it); if text alone is too
 * big the caller's append fails with VALIDATION and is logged.
 */
export function fitParts({ parts, max = MAX_STORED_PARTS_CHARS }: FitPartsInput): Part[] {
  const result: Part[] = parts.flatMap((part) =>
    typeof part === "object" && part !== null && !Array.isArray(part) ? [{ ...part }] : [],
  );
  const withOutput = result
    .map((part, index) => ({ index, length: JSON.stringify(part.output ?? null).length }))
    .filter(({ length }) => length > 100)
    .sort((a, b) => b.length - a.length);
  for (const { index } of withOutput) {
    if (size({ parts: result }) <= max) break;
    const part = result[index];
    if (part) result[index] = { ...part, output: TRUNCATED };
  }
  return result;
}
