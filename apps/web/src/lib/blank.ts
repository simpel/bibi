export type BlankInput = { value: string };

/** Form text inputs are "" when empty; core schemas expect null (clears the field on update). */
export function blankToNull({ value }: BlankInput): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Empty input → null; otherwise the number (NaN is kept so validation can reject it). */
export function numberOrNull({ value }: BlankInput): number | null {
  const trimmed = value.trim().replace(",", ".");
  return trimmed === "" ? null : Number(trimmed);
}
