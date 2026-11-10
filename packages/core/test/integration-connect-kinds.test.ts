import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { connectIntegration, execute, listIntegrations, previewChange } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { stubSwish, swishCredentials, useSwishEnv } from "./swish-helpers";

describe("integration.connect by connect kind (ADR 0100)", () => {
  useSwishEnv();

  it("connects a CREDENTIALS provider at once, without a consent page or a secret in the output", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 404 });
    const context = testContext({ role: "admin" });
    const digits = String(randomBytes(4).readUInt32BE(0) % 10_000_000).padStart(7, "0");
    const credentials = swishCredentials({ number: `123${digits}` });
    const connected = unwrap({
      result: await execute({
        operation: connectIntegration,
        input: { provider: "SWISH", credentials },
        context,
      }),
    });
    expect(connected).toMatchObject({ provider: "SWISH", status: "CONNECTED", authorizeUrl: null });
    expect(JSON.stringify(connected)).not.toContain(credentials.certificate);
    const list = unwrap({
      result: await execute({ operation: listIntegrations, input: {}, context }),
    });
    expect(list.items.find((item) => item.provider === "SWISH")?.capabilities.methods).toEqual([
      "SWISH",
    ]);
  });

  it("refuses a CREDENTIALS provider without credentials, and hosted onboarding", async () => {
    const context = testContext({ role: "admin" });
    const missing = await execute({
      operation: connectIntegration,
      input: { provider: "SWISH" },
      context,
    });
    expect(missing.ok ? null : missing.error.code).toBe("VALIDATION");
    const partial = await execute({
      operation: connectIntegration,
      input: { provider: "SWISH", credentials: { swishNumber: "1231181189" } },
      context,
    });
    expect(partial.ok ? null : partial.error.issues.map((issue) => issue.path)).toContain(
      "credentials.certificate",
    );
    const hosted = await execute({
      operation: connectIntegration,
      input: { provider: "STRIPE" },
      context,
    });
    expect(hosted.ok ? null : hosted.error.code).toBe("CONFLICT");
  });

  it("refuses credentials from the assistant, also in a proposal's preview", async () => {
    const stub = stubSwish();
    stub.route = () => ({ status: 404 });
    const admin = testContext({ role: "admin" });
    const userId = admin.actor.userId ?? "user_ai";
    const ai = {
      ...admin,
      actor: { type: "ai" as const, userId, conversationId: "c", approvedBy: userId },
    };
    const input = { provider: "SWISH" as const, credentials: swishCredentials() };
    const preview = await previewChange({ operation: connectIntegration, input, context: ai });
    expect(preview.ok ? null : preview.error.code).toBe("FORBIDDEN");
    const run = await execute({ operation: connectIntegration, input, context: ai });
    expect(run.ok ? null : run.error.code).toBe("FORBIDDEN");
    expect(stub.calls).toHaveLength(0);
    const rows = await admin.db.providerConnection.count({ where: { provider: "SWISH" } });
    expect(rows).toBe(0);
  });
});
