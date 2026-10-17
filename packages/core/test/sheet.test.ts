import { describe, expect, it } from "vitest";
import {
  execute,
  generateSheet,
  getSheet,
  listSheets,
  type SheetDto,
  sendSheet,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { confirmBooking, setCount, sheetSetup } from "./sheet-helpers";

type SetupResult = Awaited<ReturnType<typeof sheetSetup>>;

const generate = ({ context, booking, definition }: SetupResult) =>
  execute({
    operation: generateSheet,
    input: { bookingId: booking.id, sheetDefinitionId: definition.id },
    context,
  });

type SendInput = { setup: SetupResult; sheet: SheetDto };

const send = ({ setup, sheet }: SendInput) =>
  execute({ operation: sendSheet, input: { id: sheet.id }, context: setup.context });

describe("sheet.generate (ADR 0021)", () => {
  it("snapshots the booking, the included items with fields and the counts", async () => {
    const setup = await sheetSetup();
    const sheet = unwrap({ result: await generate(setup) });
    expect(sheet).toMatchObject({ version: 1, roleId: "owner", baseVersion: null, sentAt: null });
    expect(sheet.changes).toEqual([]);
    const [head, item, count] = sheet.content.rows;
    expect(head).toMatchObject({ kind: "BOOKING", key: setup.booking.id });
    expect(item).toMatchObject({
      kind: "ITEM",
      key: setup.held.id,
      itemName: "Älvsalen",
      values: { [setup.floor.key]: "Second" },
    });
    expect(count).toMatchObject({
      kind: "REQUIREMENT",
      label: "Gluten",
      quantity: 5,
      parentKey: null,
      values: { list: "Allergens" },
    });
    expect(sheet.content.rows).toHaveLength(3);
  });

  it("returns the latest version while the booking is unchanged", async () => {
    const setup = await sheetSetup();
    const first = unwrap({ result: await generate(setup) });
    const again = unwrap({ result: await generate(setup) });
    expect(again.id).toBe(first.id);
    const list = unwrap({
      result: await execute({ operation: listSheets, input: {}, context: setup.context }),
    });
    expect(list.items).toHaveLength(1);
  });

  it("marks the rows changed since the last SENT version with ★ data", async () => {
    const setup = await sheetSetup();
    await confirmBooking({ context: setup.context, bookingId: setup.booking.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await send({ setup, sheet: first }) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 7 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(second).toMatchObject({ version: 2, baseVersion: 1 });
    expect(second.changes).toEqual([
      {
        key: `booking:${setup.gluten}`,
        kind: "REQUIREMENT",
        change: "CHANGED",
        label: "Gluten",
        changed: ["quantity"],
      },
    ]);
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 8 }) });
    const third = unwrap({ result: await generate(setup) });
    expect(third).toMatchObject({ version: 3, baseVersion: 1 });
    expect(third.changes.map((change) => change.changed)).toEqual([["quantity"]]);
  });

  it("refuses an unknown booking or definition, and other organizations' ids", async () => {
    const setup = await sheetSetup();
    const other = await sheetSetup();
    const unknown = { ...setup, booking: { ...setup.booking, id: "nope" } };
    expect(errorCode({ result: await generate(unknown) })).toBe("NOT_FOUND");
    const foreign = { ...setup, definition: other.definition };
    expect(errorCode({ result: await generate(foreign) })).toBe("NOT_FOUND");
    const reader = peer({ of: setup.context, access: "read" });
    expect(errorCode({ result: await generate({ ...setup, context: reader }) })).toBe("FORBIDDEN");
  });
});

describe("sheet.send (ADR 0022)", () => {
  it("is rejected in the TENTATIVE phase and works from CONFIRMED, once", async () => {
    const setup = await sheetSetup();
    const sheet = unwrap({ result: await generate(setup) });
    expect(errorCode({ result: await send({ setup, sheet }) })).toBe("CONFLICT");
    await confirmBooking({ context: setup.context, bookingId: setup.booking.id });
    const sent = unwrap({ result: await send({ setup, sheet }) });
    expect(sent.sentAt).toBeInstanceOf(Date);
    expect(errorCode({ result: await send({ setup, sheet }) })).toBe("CONFLICT");
  });

  it("sends only the latest version", async () => {
    const setup = await sheetSetup();
    await confirmBooking({ context: setup.context, bookingId: setup.booking.id });
    const first = unwrap({ result: await generate(setup) });
    unwrap({ result: await setCount({ ...setup, id: setup.count.id, quantity: 6 }) });
    const second = unwrap({ result: await generate(setup) });
    expect(errorCode({ result: await send({ setup, sheet: first }) })).toBe("CONFLICT");
    expect(errorCode({ result: await send({ setup, sheet: second }) })).toBeNull();
  });

  it("gets a version by id and keeps it hidden from other organizations", async () => {
    const setup = await sheetSetup();
    const sheet = unwrap({ result: await generate(setup) });
    const input = { id: sheet.id };
    const got = unwrap({
      result: await execute({ operation: getSheet, input, context: setup.context }),
    });
    expect(got.id).toBe(sheet.id);
    const other = await sheetSetup();
    const hidden = await execute({ operation: getSheet, input, context: other.context });
    expect(errorCode({ result: hidden })).toBe("NOT_FOUND");
  });
});
