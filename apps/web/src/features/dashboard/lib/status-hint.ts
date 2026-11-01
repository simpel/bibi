export type StatusHintInput = {
  confirmedValueMinor: number | null;
  estimatedValueMinor: number | null;
  money: (input: { minor: number }) => string;
  labels: { confirmed: string; estimated: string; none: string };
};

/** "Agreed 120 000 kr · Estimated 40 000 kr", each part only when known; else "No value yet". */
export function statusHint({
  confirmedValueMinor,
  estimatedValueMinor,
  money,
  labels,
}: StatusHintInput): string {
  const parts = [
    confirmedValueMinor === null
      ? null
      : `${labels.confirmed} ${money({ minor: confirmedValueMinor })}`,
    estimatedValueMinor === null
      ? null
      : `${labels.estimated} ${money({ minor: estimatedValueMinor })}`,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : labels.none;
}
