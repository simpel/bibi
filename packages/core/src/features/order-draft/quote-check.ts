/** Lowercase with every run of whitespace as one space, for comparing quotes. */
export function normaliseQuote({ text }: { text: string }): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export type QuoteFoundInput = { quote: string; source: string };

/**
 * Whether the model's quote is in the message (ADR 0084 decision 2), ignoring case and
 * whitespace. An empty quote is never found, so its value counts as guessed.
 */
export function quoteFound({ quote, source }: QuoteFoundInput): boolean {
  const wanted = normaliseQuote({ text: quote });
  return wanted !== "" && normaliseQuote({ text: source }).includes(wanted);
}

export type EvidenceOfInput = { quote: string; guessed: boolean; source: string };

/** The quote as given, guessed when the model says so or when the quote is not in the message. */
export function evidenceOf({ quote, guessed, source }: EvidenceOfInput) {
  return { quote, guessed: guessed || !quoteFound({ quote, source }) };
}
