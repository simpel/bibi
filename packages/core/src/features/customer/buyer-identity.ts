import type { BuyerKindValue } from "./buyer-kind";

export type BuyerIdentityInput = {
  buyerKind: BuyerKindValue;
  organizationNumber?: string | null | undefined;
  personalIdentityNumber?: string | null | undefined;
};

/**
 * A business has an organisation number and no personal identity number; a private customer
 * the other way round (ADR 0106). The number that does not fit the kind is cleared, the other is
 * passed through as given (undefined = unchanged on update).
 */
export function buyerIdentity({
  buyerKind,
  organizationNumber,
  personalIdentityNumber,
}: BuyerIdentityInput) {
  return buyerKind === "PRIVATE"
    ? { organizationNumber: null, personalIdentityNumber }
    : { organizationNumber, personalIdentityNumber: null };
}
