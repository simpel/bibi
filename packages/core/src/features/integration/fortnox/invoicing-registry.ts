import { fortnoxInvoicing } from "./fortnox-invoicing";
import type { FortnoxInvoicingGateway } from "./invoicing-gateway";

let current: FortnoxInvoicingGateway = fortnoxInvoicing;

export type SetFortnoxInvoicingInput = { gateway: FortnoxInvoicingGateway | undefined };

/** Tests swap in a fake; `undefined` restores the Fortnox implementation. */
export function setFortnoxInvoicingGateway({ gateway }: SetFortnoxInvoicingInput): void {
  current = gateway ?? fortnoxInvoicing;
}

export function getFortnoxInvoicingGateway(): FortnoxInvoicingGateway {
  return current;
}
