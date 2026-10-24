import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createOrg, signUp } from "./helpers";

describe("organization defaults (ADR 0043)", () => {
  it("gives a new organization a minimal set of ticket statuses, created by SYSTEM", async () => {
    const { headers } = await signUp();
    const organizationId = await createOrg({ headers });
    const statuses = await getDb().ticketStatus.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
    });
    expect(statuses.map((ticketStatus) => ticketStatus.name)).toEqual([
      "Lead",
      "Confirmed",
      "Completed",
      "Lost",
    ]);
    expect(
      statuses
        .filter((ticketStatus) => ticketStatus.entry)
        .map((ticketStatus) => ticketStatus.name),
    ).toEqual(["Lead"]);
    expect(statuses.filter((ticketStatus) => ticketStatus.closes)).toHaveLength(2);
    expect(new Set(statuses.map((ticketStatus) => ticketStatus.createdBy))).toEqual(
      new Set(["system"]),
    );
    const audit = await getDb().auditLog.count({
      where: { organizationId, operation: "ticketStatus.importTemplate", actorType: "SYSTEM" },
    });
    expect(audit).toBeGreaterThan(0);
  });
});
