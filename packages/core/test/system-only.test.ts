import { describe, expect, it } from "vitest";
import { applyBillingSignal } from "../src/features/billing/apply-signal-operation";
import { provisionInboundEndpoints } from "../src/features/inbound-message/provision-endpoints";
import { receiveInboundMessage } from "../src/features/inbound-message/receive-operation";
import { applyIntegrationSignal } from "../src/features/integration/apply-signal-operation";
import { applyInvoiceSignal } from "../src/features/invoice/apply-signal-operation";
import { applyPaymentSignal } from "../src/features/payment/apply-signal-operation";
import { retryRefunds } from "../src/features/payment/retry-refunds-operation";
import {
  type Actor,
  type AnyOperation,
  checkPermission,
  createCoreOperations,
  grantAll,
  refreshExpiringIntegrations,
  startPaymentAttempt,
} from "../src/index";
import { authorize } from "../src/operations/authorize";
import { fakeEmbed } from "./fake-embed";

/** Operations only the system runs: provider events, worker jobs and the public pay page. */
const SYSTEM_ONLY: readonly AnyOperation[] = [
  receiveInboundMessage,
  provisionInboundEndpoints,
  applyIntegrationSignal,
  refreshExpiringIntegrations,
  retryRefunds,
  startPaymentAttempt,
  applyPaymentSignal,
  applyBillingSignal,
  applyInvoiceSignal,
];

const admin = grantAll({});
const asActor = ({ actor }: { actor: Actor }) => ({ actor, permissions: admin });
const ACTORS: readonly Actor[] = [
  { type: "user", userId: "u1" },
  { type: "ai", userId: "u1" },
  { type: "apiKey", userId: null, apiKeyId: "k1" },
];

describe("systemOnly operations", () => {
  it("are refused for every actor but the system, even with every permission", () => {
    for (const operation of SYSTEM_ONLY) {
      expect(operation.systemOnly, operation.name).toBe(true);
      for (const actor of ACTORS) {
        const result = authorize({ operation, context: asActor({ actor }) });
        expect(result.ok ? null : result.error.code, `${operation.name} ${actor.type}`).toBe(
          "FORBIDDEN",
        );
      }
      const system = authorize({ operation, context: asActor({ actor: systemActor }) });
      expect(system.ok, operation.name).toBe(true);
    }
  });

  it("never reach the surfaces (createCoreOperations has none)", () => {
    const listed = createCoreOperations({ embed: fakeEmbed });
    expect(listed.filter((operation) => operation.systemOnly)).toEqual([]);
    const names = new Set(listed.map((operation) => operation.name));
    for (const operation of SYSTEM_ONLY) expect(names.has(operation.name)).toBe(false);
  });
});

const systemActor: Actor = { type: "system", userId: null };

describe("checkPermission", () => {
  it("lets an API key with the permission through and refuses one without", () => {
    const key: Actor = { type: "apiKey", userId: null, apiKeyId: "k1" };
    const granted = checkPermission({ context: asActor({ actor: key }), permission: "order:read" });
    expect(granted.ok).toBe(true);
    const context = { actor: key, permissions: {} };
    const refused = checkPermission({ context, permission: "order:read" });
    expect(refused.ok ? null : refused.error.code).toBe("FORBIDDEN");
  });

  it("refuses the AI actor when aiAllowed is false and an anonymous caller as UNAUTHENTICATED", () => {
    const ai = asActor({ actor: { type: "ai", userId: "u1" } });
    const refused = checkPermission({ context: ai, permission: "order:read", aiAllowed: false });
    expect(refused.ok ? null : refused.error.code).toBe("FORBIDDEN");
    const anonymous = asActor({ actor: { type: "user", userId: null } });
    const result = checkPermission({ context: anonymous, permission: "order:read" });
    expect(result.ok ? null : result.error.code).toBe("UNAUTHENTICATED");
  });
});
