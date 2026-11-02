"use client";

import { createContext, type ReactNode, useContext } from "react";

const PaymentLinksContext = createContext(true);

export type PaymentLinksProviderProps = { available: boolean; children: ReactNode };

/**
 * Whether the organization's own Stripe account is active (ADR 0090), read once on the server
 * for the ticket's payments; every payment-link button under it is dimmed when it is not.
 */
export function PaymentLinksProvider({ available, children }: PaymentLinksProviderProps) {
  return <PaymentLinksContext value={available}>{children}</PaymentLinksContext>;
}

/** False under a `PaymentLinksProvider` whose organization has no active Stripe account. */
export function usePaymentLinksAvailable(): boolean {
  return useContext(PaymentLinksContext);
}
