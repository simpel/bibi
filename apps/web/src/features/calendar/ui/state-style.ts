import type { CSSProperties } from "react";

/** Readable text on a hex background: dark on light colors, white on dark ones. */
function textOn({ color }: { color: string }): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => Number.parseInt(color.slice(at, at + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#ffffff";
}

export type StateStyleInput = { color: string; soft: boolean };

/**
 * A line state's look (ADR 0044): hard holds are solid in the state's color, soft holds hatched
 * with a dashed border. The state's name is always in the text, never the color alone.
 */
export function stateStyle({ color, soft }: StateStyleInput): CSSProperties {
  if (!soft) return { backgroundColor: color, borderColor: color, color: textOn({ color }) };
  return {
    backgroundImage: `repeating-linear-gradient(45deg, ${color}33 0 6px, ${color}88 6px 12px)`,
    borderColor: color,
    borderStyle: "dashed",
    color: "inherit",
  };
}
