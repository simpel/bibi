import { fortnoxGateway } from "./fortnox-gateway";
import type { FortnoxGateway } from "./gateway";

export type * from "./gateway";

let current: FortnoxGateway = fortnoxGateway;

export type SetFortnoxGatewayInput = { gateway: FortnoxGateway | undefined };

/** Tests swap in a fake; `undefined` restores the Fortnox implementation. */
export function setFortnoxGateway({ gateway }: SetFortnoxGatewayInput): void {
  current = gateway ?? fortnoxGateway;
}

export function getFortnoxGateway(): FortnoxGateway {
  return current;
}
