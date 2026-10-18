import { describe, expect, it } from "vitest";
import {
  createEntityType,
  createSetup,
  execute,
  getProgramItem,
  listProgramItems,
  updateProgramItem,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { testOrg } from "./org-helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

type Failure = { ok: boolean; error?: { code: string; issues: readonly { path: string }[] } };

const issueOf = ({ result }: { result: Failure }) =>
  result.ok ? null : { code: result.error?.code, path: result.error?.issues[0]?.path };

describe("programItem (ADR 0022)", () => {
  it("adds program items to a ticket with own fields and lists them by time", async () => {
    const { context, ticket, type, key } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id };
    unwrap({ result: await addProgramItem({ ...base, from: 13, to: 14 }) });
    const first = unwrap({
      result: await execute({
        operation: updateProgramItem,
        input: {
          id: unwrap({ result: await addProgramItem({ ...base, from: 9, to: 10 }) }).id,
          quantity: 40,
          fields: { [key]: "A-12" },
        },
        context,
      }),
    });
    expect(first).toMatchObject({ quantity: 40, fields: { [key]: "A-12" } });
    const input = { ticketId: ticket.id };
    const list = unwrap({ result: await execute({ operation: listProgramItems, input, context }) });
    expect(list.items.map((item) => item.id)[0]).toBe(first.id);
    expect(list.items).toHaveLength(2);
  });

  it("refuses an unknown type, ticket, item or setup", async () => {
    const { context, ticket, type, room, setup } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, from: 9, to: 10 };
    const ticketType = await createTypeWithField({ context, base: "TICKET", name: "Other" });
    const plainType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Equipment" },
        context,
      }),
    });
    const plain = await createTestItem({ context, entityTypeId: plainType.id, name: "Projector" });
    const other = unwrap({
      result: await execute({ operation: createSetup, input: { name: "Cabaret" }, context }),
    });
    const cases = [
      [{ entityTypeId: ticketType.type.id }, "entityTypeId"],
      [{ ticketId: "missing" }, "ticketId"],
      [{ itemId: plain.id }, "itemId"],
      [{ setupId: setup.id }, "setupId"],
      [{ itemId: room.id, setupId: other.id }, "setupId"],
    ] as const;
    for (const [input, path] of cases) {
      const result = await addProgramItem({ ...base, ...input });
      expect(issueOf({ result })).toEqual({ code: "VALIDATION", path });
    }
    expect(errorCode({ result: await addProgramItem({ ...base, from: 10, to: 9 }) })).toBe(
      "VALIDATION",
    );
  });

  it("hides program items from another organization", async () => {
    const { context, ticket, type } = await programSetup();
    const base = { context, ticketId: ticket.id, entityTypeId: type.id, from: 9, to: 10 };
    const item = unwrap({ result: await addProgramItem(base) });
    const foreign = await testOrg();
    const input = { id: item.id };
    const result = await execute({ operation: getProgramItem, input, context: foreign });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    const own = await programSetup();
    const crossTicket = await addProgramItem({
      ...base,
      context: own.context,
      entityTypeId: own.type.id,
    });
    expect(issueOf({ result: crossTicket })).toEqual({ code: "VALIDATION", path: "ticketId" });
  });
});
