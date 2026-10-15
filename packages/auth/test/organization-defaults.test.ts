import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { createOrg, signUp } from "./helpers";

describe("organization defaults (ADR 0022)", () => {
  it("gives a new organization one booking status per phase, created by SYSTEM", async () => {
    const { headers } = await signUp();
    const organizationId = await createOrg({ headers });
    const statuses = await getDb().bookingStatus.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
    });
    expect(statuses.map((status) => status.phase)).toEqual([
      "TENTATIVE",
      "CONFIRMED",
      "COMPLETED",
      "CANCELLED",
    ]);
    expect(new Set(statuses.map((status) => status.createdBy))).toEqual(new Set(["system"]));
    const audit = await getDb().auditLog.count({
      where: { organizationId, operation: "bookingStatus.importTemplate", actorType: "SYSTEM" },
    });
    expect(audit).toBeGreaterThan(0);
  });
});
