import type { StripeConnectGateway } from "./gateway";
import { stripeConnectGateway } from "./stripe-gateway";

export type * from "./gateway";

let current: StripeConnectGateway = stripeConnectGateway;

export type SetGatewayInput = { gateway: StripeConnectGateway | undefined };

/** Tests swap in a fake; `undefined` restores the Stripe implementation. */
export function setStripeConnectGateway({ gateway }: SetGatewayInput): void {
  current = gateway ?? stripeConnectGateway;
}

export function getStripeConnectGateway(): StripeConnectGateway {
  return current;
}
