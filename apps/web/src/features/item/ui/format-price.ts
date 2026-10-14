export type FormatKrInput = { minor: number; locale: string };

/** minor units → "4 500" (the unit text, kr and per-unit, comes from the messages). */
export function formatKr({ minor, locale }: FormatKrInput): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(minor / 100);
}
