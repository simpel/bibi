/** A money document as the accounting system or, before ADR 0106, Bibi numbered it. */
export type NumberedDocument = { providerReference: string | null; number: number | null };

/**
 * The number staff and customers see (ADR 0106): the accounting system's document number, else
 * Bibi's own from before ADR 0106, else null (not raised there yet).
 */
export const documentNumberOf = ({ providerReference, number }: NumberedDocument): string | null =>
  providerReference ?? (number === null ? null : String(number));
