import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createOrg, signUp } from "./helpers";

describe("organization defaults (ADR 0043)", () => {
  it("gives a new organization a minimal set of ticket phases, created by SYSTEM", async () => {
    const { headers } = await signUp();
    const organizationId = await createOrg({ headers });
    const phases = await getDb().ticketPhase.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
    });
    expect(phases.map((phase) => phase.name)).toEqual(["Lead", "Confirmed", "Completed", "Lost"]);
    expect(phases.filter((phase) => phase.entry).map((phase) => phase.name)).toEqual(["Lead"]);
    expect(phases.filter((phase) => phase.terminal)).toHaveLength(2);
    expect(new Set(phases.map((phase) => phase.createdBy))).toEqual(new Set(["system"]));
    const audit = await getDb().auditLog.count({
      where: { organizationId, operation: "ticketPhase.importTemplate", actorType: "SYSTEM" },
    });
    expect(audit).toBeGreaterThan(0);
  });
});
