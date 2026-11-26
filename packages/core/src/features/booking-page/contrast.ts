/** WCAG relative luminance of one sRGB channel (0–255). */
const channel = ({ value }: { value: number }) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** The contrast ratio of a `#rrggbb` colour against white (1 to 21). */
export function contrastOnWhite({ hex }: { hex: string }): number {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  const luminance =
    0.2126 * channel({ value: r ?? 0 }) +
    0.7152 * channel({ value: g ?? 0 }) +
    0.0722 * channel({ value: b ?? 0 });
  return 1.05 / (luminance + 0.05);
}

/** The least contrast an accent colour needs on white, for buttons and links (WCAG AA). */
export const MIN_ACCENT_CONTRAST = 4.5;
