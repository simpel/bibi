import { beforeAll, describe, expect, it } from "vitest";
import {
  applyChangeSetOperation,
  createCoreOperations,
  execute,
  registerOperations,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

beforeAll(() => registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) }));

const apply = ({ context, steps }: { context: ReturnType<typeof testContext>; steps: unknown[] }) =>
  execute({
    operation: applyChangeSetOperation,
    input: { title: "Evening bundle", steps: steps as never },
    context,
  });

describe("changeSet.apply (ADR 0049)", () => {
  it("runs every step in order, resolves $step references and audits each step", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const result = unwrap({
      result: await apply({
        context,
        steps: [
          { operation: "venue.create", input: { name: "Concert hall" } },
          {
            operation: "item.create",
            input: { entityTypeId: type.id, name: "Evening booking", venueId: "$step:0.id" },
          },
        ],
      }),
    });
    const [venue, item] = result.steps.map(
      (step) => step.output as { id: string; venueId?: string },
    );
    expect(item?.venueId).toBe(venue?.id);
    const audit = await context.db.auditLog.findMany({ orderBy: { createdAt: "asc" } });
    const operations = audit.map((row) => row.operation);
    expect(operations).toEqual(expect.arrayContaining(["venue.create", "item.create"]));
    expect(operations).not.toContain("changeSet.apply");
  });

  it("saves nothing when a later step fails", async () => {
    const context = testContext();
    const failed = await apply({
      context,
      steps: [
        { operation: "venue.create", input: { name: "Kept?" } },
        { operation: "item.update", input: { id: "missing_0000000000000000", name: "X" } },
      ],
    });
    expect(errorCode({ result: failed })).toBe("NOT_FOUND");
    expect(await context.db.venue.count()).toBe(0);
  });

  it("refuses an unknown reference, a query step and a nested change set", async () => {
    const context = testContext();
    const reference = await apply({
      context,
      steps: [{ operation: "venue.update", input: { id: "$step:3.id", name: "X" } }],
    });
    expect(errorCode({ result: reference })).toBe("VALIDATION");
    const query = await apply({ context, steps: [{ operation: "venue.list", input: {} }] });
    expect(errorCode({ result: query })).toBe("VALIDATION");
    const nested = await apply({
      context,
      steps: [{ operation: "changeSet.apply", input: { title: "x", steps: [] } }],
    });
    expect(errorCode({ result: nested })).toBe("VALIDATION");
  });

  it("checks each step's own permission: a member cannot bundle a setup change", async () => {
    const admin = testContext();
    const venue = unwrap({
      result: await apply({
        context: admin,
        steps: [{ operation: "venue.create", input: { name: "A" } }],
      }),
    }).steps[0]?.output as { id: string };
    const member = {
      ...admin,
      permissions: { venue: ["read"] as const },
    };
    const denied = await apply({
      context: member,
      steps: [{ operation: "venue.update", input: { id: venue.id, name: "B" } }],
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });
});
