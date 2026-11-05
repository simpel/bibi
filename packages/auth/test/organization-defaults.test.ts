import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createOrg, signUp } from "./helpers";

describe("organization defaults (ADR 0043)", () => {
  it("gives a new organization a minimal set of order statuses, created by SYSTEM", async () => {
    const { headers } = await signUp();
    const organizationId = await createOrg({ headers });
    const statuses = await getDb().orderStatus.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
    });
    expect(statuses.map((orderStatus) => orderStatus.name)).toEqual([
      "Lead",
      "Confirmed",
      "Completed",
      "Lost",
    ]);
    expect(
      statuses
        .filter((orderStatus) => orderStatus.entry)
        .map((orderStatus) => orderStatus.name),
    ).toEqual(["Lead"]);
    expect(statuses.filter((orderStatus) => orderStatus.closes)).toHaveLength(2);
    expect(new Set(statuses.map((orderStatus) => orderStatus.createdBy))).toEqual(
      new Set(["system"]),
    );
    const audit = await getDb().auditLog.count({
      where: { organizationId, operation: "orderStatus.importTemplate", actorType: "SYSTEM" },
    });
    expect(audit).toBeGreaterThan(0);
  });
});
