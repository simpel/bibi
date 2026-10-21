/**
 * Parses a price string into its primary financial amount and optional cadence/unit.
 * E.g.:
 * - "250 kr per person" -> { amount: "250 kr", unit: "per person" }
 * - "1 500 SEK / day" -> { amount: "1 500 SEK", unit: "/ day" }
 * - "500 kr" -> { amount: "500 kr" }
 */
export function parsePrice(
  raw: string,
  explicitUnit?: string | null,
): { amount: string; unit?: string } {
  if (explicitUnit) {
    return { amount: raw.trim(), unit: explicitUnit.trim() };
  }
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.*?)\s+(per\s+[\p{L}\d\s-]+|\/[\s\p{L}\d-]+|flat|fast\s+pris)$/iu);
  if (match?.[1] && match[2]) {
    return {
      amount: match[1].trim(),
      unit: match[2].trim(),
    };
  }
  return { amount: trimmed };
}
