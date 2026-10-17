import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { execute, importConfigurationTemplate, listResponsibilities } from "../src/index";
import { testContext, unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

const input = { template: "conference-venue" as const };

async function joinAsCaller({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const db = getDb();
  await db.user.create({
    data: { id: userId, name: "Admin", email: `${userId}@example.test`, emailVerified: true },
  });
  const data = { id: createId(), organizationId, userId, role: "admin", createdAt: new Date() };
  await db.member.create({ data });
}

describe("configuration.importTemplate responsibilities (ADR 0034)", () => {
  it("ships Sales, Coordinator and Head of kitchen, defaulting to the importing member", async () => {
    const context = await testOrg();
    const { organizationId } = context;
    await joinAsCaller({ userId: context.actor.userId ?? "", organizationId });
    const result = unwrap({
      result: await execute({ operation: importConfigurationTemplate, input, context }),
    });
    expect(result.created.responsibilities.map((row) => row.name)).toEqual([
      "Sales",
      "Coordinator",
      "Head of kitchen",
    ]);
    const types = result.created.entityTypes;
    const kitchen = result.created.responsibilities.find((row) => row.name === "Head of kitchen");
    expect(kitchen?.entityTypeIds).toEqual(
      ["Dish", "Drink", "Meal"].map((name) => types.find((type) => type.name === name)?.id),
    );
    expect(kitchen?.defaultAssigneeId).toBe(context.actor.userId);
    const again = unwrap({
      result: await execute({ operation: importConfigurationTemplate, input, context }),
    });
    expect(again.created.responsibilities).toEqual([]);
    expect(again.skipped.responsibilities).toHaveLength(3);
    const listed = unwrap({
      result: await execute({ operation: listResponsibilities, input: {}, context }),
    });
    expect(listed.items).toHaveLength(3);
  });

  it("creates no responsibilities for a caller who is not a member", async () => {
    const context = testContext();
    const result = unwrap({
      result: await execute({ operation: importConfigurationTemplate, input, context }),
    });
    expect(result.created.responsibilities).toEqual([]);
    expect(result.created.entityTypes.length).toBeGreaterThan(0);
  });
});
