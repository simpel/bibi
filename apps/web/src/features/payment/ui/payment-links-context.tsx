"use client";

import { createContext, type ReactNode, useContext } from "react";

const PaymentLinksContext = createContext(true);

export type PaymentLinksProviderProps = { available: boolean; children: ReactNode };

/**
 * Whether a connected provider takes a payment method (ADR 0090, 0100), read once on the server
 * for the order's payments; every payment-link button under it is dimmed when none does.
 */
export function PaymentLinksProvider({ available, children }: PaymentLinksProviderProps) {
  return <PaymentLinksContext value={available}>{children}</PaymentLinksContext>;
}

/** False under a `PaymentLinksProvider` whose organization has no provider for a method. */
export function usePaymentLinksAvailable(): boolean {
  return useContext(PaymentLinksContext);
}
