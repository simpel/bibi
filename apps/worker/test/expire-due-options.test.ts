import {
  createEntityType,
  createExecuteContext,
  createItem,
  createOption,
  execute,
  getOption,
  grantAll,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { JOBS } from "../src/jobs";
import { expireDueOptionsJob } from "../src/jobs/expire-due-options";

const db = getDb();

type UnwrapInput<T> = { result: { ok: true; value: T } | { ok: false; error: Error } };

function unwrap<T>({ result }: UnwrapInput<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

async function overdueOption({ organizationId }: { organizationId: string }) {
  const context = createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "user", userId: `user_${createId()}` },
  });
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Room", behaviours: ["BOOKABLE"] },
      context,
    }),
  });
  const item = unwrap({
    result: await execute({
      operation: createItem,
      input: { entityTypeId: type.id, name: "Hall" },
      context,
    }),
  });
  const input = {
    itemId: item.id,
    startsAt: new Date("2026-12-01T08:00:00Z"),
    endsAt: new Date("2026-12-01T12:00:00Z"),
    expiresAt: new Date(Date.now() + 60_000),
  };
  const option = unwrap({ result: await execute({ operation: createOption, input, context }) });
  await context.db.option.update({
    where: { id: option.id },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  return { context, option };
}

describe("option.expireDue job (ADR 0022, 0027)", () => {
  it("is scheduled every 15 minutes", () => {
    expect(JOBS).toContain(expireDueOptionsJob);
    expect(expireDueOptionsJob.cron).toBe("*/15 * * * *");
  });

  it("expires overdue options in every organization as SYSTEM", async () => {
    const organizationId = `org_${createId()}`;
    await db.organization.create({
      data: {
        id: organizationId,
        name: organizationId,
        slug: organizationId,
        createdAt: new Date(),
      },
    });
    const { context, option } = await overdueOption({ organizationId });
    await expireDueOptionsJob.handler({ db });
    const after = unwrap({
      result: await execute({ operation: getOption, input: { id: option.id }, context }),
    });
    expect(after).toMatchObject({ optionStatus: "EXPIRED", rank: null });
    const audit = await db.auditLog.findMany({
      where: { organizationId, operation: "option.expireDue", entityId: option.id },
    });
    expect(audit.map((row) => row.actorType)).toEqual(["SYSTEM"]);
  });
});
