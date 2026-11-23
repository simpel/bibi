import type { BuyerKindValue } from "@bibi/core/schemas";
import type { NamedOption } from "@/components/form/named-option";

/** A customer type to pick, with the business-or-private its new customers take (ADR 0106). */
export type CustomerTypeOption = NamedOption & { buyerKind: BuyerKindValue };

export type BuyerKindOfInput = { types: readonly CustomerTypeOption[]; id: string };

/** The kind of the chosen type; BUSINESS when none is chosen. */
export const buyerKindOf = ({ types, id }: BuyerKindOfInput): BuyerKindValue =>
  types.find((type) => type.id === id)?.buyerKind ?? "BUSINESS";
