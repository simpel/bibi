import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ok } from "../src/errors/result";
import { addChangeover } from "../src/features/occupancy/add-changeover";
import {
  createOccupancy,
  createSetup,
  type ExecuteContext,
  execute,
  OccupancySchema,
} from "../src/index";
import { defineOperation } from "../src/operations/define-operation";
import { errorCode, testContext, unwrap } from "./helpers";
import { createBookableItem, hours } from "./occupancy-helpers";

/** A stand-in for the ticket commands that will call the helper (ADR 0025). */
const book = defineOperation({
  name: "test.book",
  kind: "command",
  description: "Test only",
  input: z.object({ itemId: z.string(), setupId: z.string(), startsAt: z.date() }),
  output: OccupancySchema.nullable(),
  permission: "ticket:edit",
  handler: async ({ input, context }) => {
    const source = { sourceType: "test", sourceId: "ticket-1" };
    const added = await addChangeover({ context, ...input, ...source });
    return added.ok ? ok({ value: added.value }) : added;
  },
});

type SetupInput = { context: ExecuteContext; changeoverMinutes: number };

const setupWith = async ({ context, changeoverMinutes }: SetupInput) =>
  unwrap({
    result: await execute({
      operation: createSetup,
      input: { name: `Theatre ${changeoverMinutes}`, changeoverMinutes },
      context,
    }),
  });

describe("changeover as SETUP occupancy (ADR 0022)", () => {
  it("occupies the setup's changeover time right before the start", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const setup = await setupWith({ context, changeoverMinutes: 90 });
    const { startsAt } = hours({ from: 10, to: 12 });
    const input = { itemId: item.id, setupId: setup.id, startsAt };
    const added = unwrap({ result: await execute({ operation: book, input, context }) });
    expect(added).toMatchObject({
      type: "SETUP",
      startsAt: new Date(Date.UTC(2026, 10, 1, 8, 30)),
      endsAt: startsAt,
      sourceType: "test",
      sourceId: "ticket-1",
    });
  });

  it("adds nothing without changeover time and conflicts with a block", async () => {
    const context = testContext();
    const item = await createBookableItem({ context });
    const none = await setupWith({ context, changeoverMinutes: 0 });
    const { startsAt } = hours({ from: 10, to: 12 });
    const input = { itemId: item.id, setupId: none.id, startsAt };
    expect(unwrap({ result: await execute({ operation: book, input, context }) })).toBeNull();
    const block = { itemId: item.id, type: "MAINTENANCE" as const, ...hours({ from: 9, to: 10 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const setup = await setupWith({ context, changeoverMinutes: 30 });
    const clash = { ...input, setupId: setup.id };
    expect(errorCode({ result: await execute({ operation: book, input: clash, context }) })).toBe(
      "CONFLICT",
    );
  });
});
