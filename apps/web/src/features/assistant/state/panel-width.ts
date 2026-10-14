export const DEFAULT_WIDTH = 420;
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 720;

export type ClampWidthInput = { width: number };

export const clampWidth = ({ width }: ClampWidthInput): number =>
  Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));

/** Stored panel width, or null when the stored value is not a usable width. */
export const parseWidth = ({ raw }: { raw: string }): number | null => {
  const width = Number(raw);
  return Number.isFinite(width) && width >= MIN_WIDTH && width <= MAX_WIDTH ? width : null;
};
