import { describe, expect, it } from "vitest";
import {
  completeIntegrationConnect,
  disconnectIntegration,
  execute,
  previewChange,
} from "../src/index";
import { unwrap } from "./helpers";
import {
  installFakeFortnox,
  sessionAdmin,
  startFortnox,
  useFortnoxEnv,
} from "./integration-helpers";

useFortnoxEnv();

const complete = async ({ context }: { context: ReturnType<typeof sessionAdmin> }) => {
  const { state } = await startFortnox({ context });
  const input = { provider: "FORTNOX" as const, code: "code-1", state };
  return execute({ operation: completeIntegrationConnect, input, context });
};

describe("integration.disconnect", () => {
  it("revokes after the commit and a preview calls nothing", async () => {
    const fortnox = installFakeFortnox();
    const context = sessionAdmin();
    unwrap({ result: await complete({ context }) });
    const input = { provider: "FORTNOX" as const };
    expect((await previewChange({ operation: disconnectIntegration, input, context })).ok).toBe(
      true,
    );
    expect(fortnox.calls).not.toContain("revoke:refresh-1");
    const after = unwrap({
      result: await execute({ operation: disconnectIntegration, input, context }),
    });
    expect(after.status).toBe("DISCONNECTED");
    expect(fortnox.calls).toContain("revoke:refresh-1");
  });
});
