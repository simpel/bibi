import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import {
  completeIntegrationConnect,
  connectIntegration,
  createExecuteContext,
  createMemoryProvider,
  execute,
  type MemoryProvider,
  PRESET_PERMISSIONS,
  resetProviderAdapters,
  setProviderAdapter,
} from "@bibi/core";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { refreshIntegrationsJob } from "../src/jobs/refresh-integrations";

const db = getDb();
let fake: MemoryProvider | null = null;
const refreshCalls = () =>
  (fake?.calls ?? []).flatMap((call) => (call.startsWith("refresh:") ? [call.slice(8)] : []));

afterEach(() => {
  resetProviderAdapters();
  fake = null;
});

/** A real organization with a CONNECTED Fortnox connection whose refresh token dies in 3 days. */
async function connectedOrganization() {
  Object.assign(getEnv(), {
    FORTNOX_CLIENT_ID: "client-id",
    FORTNOX_CLIENT_SECRET: "client-secret",
    INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
  });
  fake = createMemoryProvider({ key: "FORTNOX", connectKind: "OAUTH", invoicing: true });
  setProviderAdapter({ key: "FORTNOX", adapter: fake.adapter });
  const id = `org_${createId()}`;
  await db.organization.create({ data: { id, name: id, slug: id, createdAt: new Date() } });
  const context = {
    ...createExecuteContext({
      organizationId: id,
      roles: ["admin"],
      permissions: PRESET_PERMISSIONS.admin,
      actor: { type: "user", userId: `user_${createId()}` },
    }),
    credential: "session" as const,
  };
  const started = await execute({
    operation: connectIntegration,
    input: { provider: "FORTNOX" },
    context,
  });
  const state = started.ok
    ? (new URL(started.value.authorizeUrl ?? "").searchParams.get("state") ?? "")
    : "";
  const input = { provider: "FORTNOX" as const, code: "code", state };
  expect((await execute({ operation: completeIntegrationConnect, input, context })).ok).toBe(true);
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await db.providerConnection.updateMany({
    where: { organizationId: id },
    data: { refreshExpiresAt: soon },
  });
  return id;
}

describe("integration.refreshExpiring job (ADR 0027, 0087)", () => {
  it("is scheduled daily", () => {
    expect(JOBS).toContain(refreshIntegrationsJob);
    expect(refreshIntegrationsJob.cron).toBe("17 3 * * *");
  });

  it("refreshes a connection near the 45-day limit as SYSTEM", async () => {
    const organizationId = await connectedOrganization();
    // Only this test's organization: the test database is shared with other suites running now.
    await refreshIntegrationsJob.handler({ db, organizationIds: [organizationId] });
    expect(refreshCalls()).toEqual(["refresh-1"]);
    const row = await db.providerConnection.findFirst({ where: { organizationId } });
    expect(row?.refreshExpiresAt?.getTime()).toBeGreaterThan(Date.now() + 40 * 24 * 60 * 60 * 1000);
  });
});
