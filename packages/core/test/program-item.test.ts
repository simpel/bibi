import { describe, expect, it } from "vitest";
import {
  assignProgramItem,
  createEntityType,
  createSetup,
  execute,
  getProgramItem,
  listProgramItems,
  updateProgramItem,
} from "../src/index";
import { memberUser } from "./booking-helpers";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { testOrg } from "./org-helpers";
import { addProgramItem, programSetup } from "./program-item-helpers";

type Failure = { ok: boolean; error?: { code: string; issues: readonly { path: string }[] } };

const issueOf = ({ result }: { result: Failure }) =>
  result.ok ? null : { code: result.error?.code, path: result.error?.issues[0]?.path };

describe("programItem (ADR 0022)", () => {
  it("adds program items to a booking with own fields and lists them by time", async () => {
    const { context, booking, type, key } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id };
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
    expect(first).toMatchObject({ quantity: 40, fields: { [key]: "A-12" }, responsibleId: null });
    const input = { bookingId: booking.id };
    const list = unwrap({ result: await execute({ operation: listProgramItems, input, context }) });
    expect(list.items.map((item) => item.id)[0]).toBe(first.id);
    expect(list.items).toHaveLength(2);
  });

  it("refuses an unknown type, booking, item or setup", async () => {
    const { context, booking, type, room, setup } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, from: 9, to: 10 };
    const bookingType = await createTypeWithField({ context, base: "BOOKING", name: "Other" });
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
      [{ entityTypeId: bookingType.type.id }, "entityTypeId"],
      [{ bookingId: "missing" }, "bookingId"],
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

  it("sets, changes and removes the responsible person, audited", async () => {
    const { context, booking, type } = await programSetup();
    const anna = await memberUser({ context, name: "Anna Berg" });
    const johan = await memberUser({ context, name: "Johan Ek" });
    const outsider = await memberUser({ context: await testOrg(), name: "Outsider" });
    const base = { context, bookingId: booking.id, entityTypeId: type.id, from: 9, to: 10 };
    const outside = await addProgramItem({ ...base, responsibleId: outsider });
    expect(issueOf({ result: outside })).toEqual({ code: "VALIDATION", path: "responsibleId" });
    const item = unwrap({ result: await addProgramItem({ ...base, responsibleId: anna }) });
    expect(item.responsibleId).toBe(anna);
    const assign = ({ responsibleId }: { responsibleId: string | null }) =>
      execute({ operation: assignProgramItem, input: { id: item.id, responsibleId }, context });
    expect(unwrap({ result: await assign({ responsibleId: johan }) }).responsibleId).toBe(johan);
    expect(issueOf({ result: await assign({ responsibleId: outsider }) })).toEqual({
      code: "VALIDATION",
      path: "responsibleId",
    });
    expect(unwrap({ result: await assign({ responsibleId: null }) }).responsibleId).toBeNull();
    const rows = await context.db.auditLog.findMany({
      where: { entityId: item.id, operation: "programItem.assign" },
    });
    expect(rows).toHaveLength(2);
  });

  it("hides program items from another organization", async () => {
    const { context, booking, type } = await programSetup();
    const base = { context, bookingId: booking.id, entityTypeId: type.id, from: 9, to: 10 };
    const item = unwrap({ result: await addProgramItem(base) });
    const foreign = await testOrg();
    const input = { id: item.id };
    const result = await execute({ operation: getProgramItem, input, context: foreign });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    const own = await programSetup();
    const crossBooking = await addProgramItem({
      ...base,
      context: own.context,
      entityTypeId: own.type.id,
    });
    expect(issueOf({ result: crossBooking })).toEqual({ code: "VALIDATION", path: "bookingId" });
  });
});
