import type { BillingGateway } from "./gateway";
import { createMemoryBillingGateway, type MemoryBillingGateway } from "./memory-gateway";
import { stripeBillingGateway } from "./stripe-billing-gateway";

export type * from "./gateway";
export { createMemoryBillingGateway, type MemoryBillingGateway };

let current: BillingGateway = stripeBillingGateway;

export type SetBillingGatewayInput = { gateway: BillingGateway | undefined };

/** Tests swap in a fake; `undefined` restores the Stripe implementation. */
export function setBillingGateway({ gateway }: SetBillingGatewayInput): void {
  current = gateway ?? stripeBillingGateway;
}

export function getBillingGateway(): BillingGateway {
  return current;
}
