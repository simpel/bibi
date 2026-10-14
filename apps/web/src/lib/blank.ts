export type BlankInput = { value: string };

/** Form text inputs are "" when empty; core schemas expect null (clears the field on update). */
export function blankToNull({ value }: BlankInput): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** For optional-but-not-nullable core fields (country, VAT): empty means "not provided". */
export function blankToUndefined({ value }: BlankInput): string | undefined {
  return blankToNull({ value }) ?? undefined;
}

const parseNumber = ({ value }: BlankInput): number => Number(value.trim().replace(",", "."));

/** Empty input → null; otherwise the number (NaN is kept so validation can reject it). */
export function numberOrNull({ value }: BlankInput): number | null {
  return value.trim() === "" ? null : parseNumber({ value });
}

/** Empty input → undefined; otherwise the number (NaN is kept so validation can reject it). */
export function numberOrUndefined({ value }: BlankInput): number | undefined {
  return numberOrNull({ value }) ?? undefined;
}
