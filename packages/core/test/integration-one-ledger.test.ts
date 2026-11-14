import { describe, expect, it } from "vitest";
import {
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  execute,
  getPaymentSettings,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import {
  installFakeFortnox,
  sessionAdmin,
  startFortnox,
  useFortnoxEnv,
} from "./integration-helpers";
import { connectLedger } from "./ledger-helpers";

useFortnoxEnv();

const connect = ({ context }: { context: ReturnType<typeof sessionAdmin> }) =>
  execute({ operation: connectIntegration, input: { provider: "FORTNOX" }, context });

const finish = ({ context, state }: { context: ReturnType<typeof sessionAdmin>; state: string }) =>
  execute({
    operation: completeIntegrationConnect,
    input: { provider: "FORTNOX", code: "code-1", state },
    context,
  });

describe("one accounting system at a time (ADR 0108)", () => {
  it("refuses connecting a second ledger until the first is disconnected", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    await connectLedger({ context });
    const refused = await connect({ context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    unwrap({
      result: await execute({
        operation: disconnectIntegration,
        input: { provider: "VISMA" },
        context,
      }),
    });
    expect(unwrap({ result: await connect({ context }) }).status).toBe("PENDING");
  });

  it("moves a saved INVOICE route to the ledger that connects after a switch", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    await connectLedger({ context });
    unwrap({
      result: await execute({
        operation: disconnectIntegration,
        input: { provider: "VISMA" },
        context,
      }),
    });
    const { state } = await startFortnox({ context });
    unwrap({ result: await finish({ context, state }) });
    const settings = unwrap({
      result: await execute({ operation: getPaymentSettings, input: {}, context }),
    });
    expect(settings.routes).toContainEqual({ method: "INVOICE", provider: "FORTNOX" });
  });

  it("refuses the callback when another ledger was connected while the approval was open", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    const { state } = await startFortnox({ context });
    await connectLedger({ context });
    expect(errorCode({ result: await finish({ context, state }) })).toBe("CONFLICT");
  });

  it("keeps the slot while the connected ledger is expired", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    await connectLedger({ context });
    await context.db.providerConnection.updateMany({
      where: { provider: "VISMA" },
      data: { status: "EXPIRED" },
    });
    expect(errorCode({ result: await connect({ context }) })).toBe("CONFLICT");
  });

  it("lets the connected ledger reconnect", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    const first = await startFortnox({ context });
    unwrap({ result: await finish({ context, state: first.state }) });
    expect(unwrap({ result: await connect({ context }) }).authorizeUrl).not.toBeNull();
  });
});
