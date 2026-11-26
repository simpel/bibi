import { describe, expect, it } from "vitest";
import {
  createDiningService,
  createLayout,
  deleteDiningServiceException,
  execute,
  getBookingPage,
  getLayout,
  listDiningRooms,
  listDiningServiceExceptions,
  listTableCombinations,
  saveTableCombinations,
  setDiningRoom,
  setDiningServiceException,
  updateBookingPage,
  updateDiningService,
} from "../src/index";
import { roomWithLayout, saveTables } from "./dining-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

const DINNER = {
  name: "Dinner",
  weekdays: [1, 2, 3, 4, 5],
  firstStartMinute: 17 * 60,
  lastStartMinute: 21 * 60,
  turnTimes: [
    { upToParty: 2, minutes: 90 },
    { upToParty: 4, minutes: 120 },
    { upToParty: 8, minutes: 150 },
  ],
  maxCoversPerSlot: 24,
};

describe("table booking setup (ADR 0119)", () => {
  it("sets a room up, creates a sitting and refuses what does not fit", async () => {
    const context = testContext();
    const { item, layout } = await roomWithLayout({ context });
    const sitting = { roomItemId: item.id, layoutId: layout.id, ...DINNER };

    const early = await execute({ operation: createDiningService, input: sitting, context });
    expect(errorCode({ result: early })).toBe("VALIDATION");

    const roomInput = { itemId: item.id, slug: "kajen" };
    unwrap({ result: await execute({ operation: setDiningRoom, input: roomInput, context }) });
    const rooms = unwrap({
      result: await execute({ operation: listDiningRooms, input: {}, context }),
    });
    expect(rooms.items).toMatchObject([{ itemId: item.id, slug: "kajen", openUntil: null }]);

    const dinner = unwrap({
      result: await execute({ operation: createDiningService, input: sitting, context }),
    });
    expect(dinner).toMatchObject({ slotMinutes: 15, maxOnlineParty: 8, status: "ACTIVE" });
    const twice = await execute({ operation: createDiningService, input: sitting, context });
    expect(errorCode({ result: twice })).toBe("CONFLICT");

    const backwards = { id: dinner.id, lastStartMinute: 16 * 60 };
    const refused = await execute({ operation: updateDiningService, input: backwards, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
    const halfDeposit = { id: dinner.id, depositFromParty: 8 };
    const noAmount = await execute({ operation: updateDiningService, input: halfDeposit, context });
    expect(errorCode({ result: noAmount })).toBe("VALIDATION");
    const unordered = {
      ...sitting,
      name: "Late",
      turnTimes: [
        { upToParty: 4, minutes: 120 },
        { upToParty: 2, minutes: 90 },
      ],
    };
    const badTurns = await execute({ operation: createDiningService, input: unordered, context });
    expect(errorCode({ result: badTurns })).toBe("VALIDATION");
  });

  it("keeps one exception per sitting and date", async () => {
    const context = testContext();
    const { item, layout } = await roomWithLayout({ context });
    const roomInput = { itemId: item.id, slug: "kajen" };
    unwrap({ result: await execute({ operation: setDiningRoom, input: roomInput, context }) });
    const dinner = unwrap({
      result: await execute({
        operation: createDiningService,
        input: { roomItemId: item.id, layoutId: layout.id, ...DINNER },
        context,
      }),
    });
    const christmas = unwrap({
      result: await execute({
        operation: createLayout,
        input: { itemId: item.id, name: "Christmas" },
        context,
      }),
    });
    const set = ({ ...input }: Record<string, unknown>) =>
      execute({
        operation: setDiningServiceException,
        input: { serviceId: dinner.id, date: "2026-12-24", ...input },
        context,
      });
    unwrap({ result: await set({ closed: true }) });
    const changed = unwrap({
      result: await set({ firstStartMinute: 720, lastStartMinute: 900, layoutId: christmas.id }),
    });
    expect(changed).toMatchObject({ closed: false, date: "2026-12-24", layoutId: christmas.id });
    expect(errorCode({ result: await set({ firstStartMinute: 720 }) })).toBe("VALIDATION");

    const listed = unwrap({
      result: await execute({
        operation: listDiningServiceExceptions,
        input: { serviceId: dinner.id, from: "2026-12-01", to: "2026-12-31" },
        context,
      }),
    });
    expect(listed.items.map((row) => row.date)).toEqual(["2026-12-24"]);
    const key = { serviceId: dinner.id, date: "2026-12-24" };
    unwrap({
      result: await execute({ operation: deleteDiningServiceException, input: key, context }),
    });
    const again = await execute({ operation: deleteDiningServiceException, input: key, context });
    expect(errorCode({ result: again })).toBe("NOT_FOUND");
  });

  it("saves table fields and combinations of a layout's tables", async () => {
    const context = testContext();
    const { layout, roundId } = await roomWithLayout({ context });
    const saved = await saveTables({
      ...{ context, id: layout.id, version: 1 },
      elements: [
        { kindId: roundId, xCm: 200, yCm: 200, label: "7", maxCovers: 4 },
        { kindId: roundId, xCm: 500, yCm: 200, label: "8", onlineBookable: false },
        { kindId: roundId, xCm: 800, yCm: 200, label: "9" },
      ],
    });
    const [seven, eight, nine] = saved.elements;
    if (!seven || !eight || !nine) throw new Error("tables missing");
    expect(seven).toMatchObject({ maxCovers: 4, minCovers: null, onlineBookable: true });
    expect(eight.onlineBookable).toBe(false);
    // A save that leaves the table fields out keeps them.
    await saveTables({
      ...{ context, id: layout.id, version: 2 },
      elements: saved.elements.map(({ id, kindId, xCm, yCm, label }) => ({
        ...{ id, kindId, xCm, yCm, label: label ?? undefined },
      })),
    });
    const read = unwrap({
      result: await execute({ operation: getLayout, input: { id: layout.id }, context }),
    });
    expect(read.elements.map((piece) => [piece.maxCovers, piece.onlineBookable])).toEqual([
      [4, true],
      [null, false],
      [null, true],
    ]);

    const save = ({ combinations }: { combinations: unknown[] }) =>
      execute({
        operation: saveTableCombinations,
        input: { layoutId: layout.id, combinations },
        context,
      });
    const long = {
      name: "Long table",
      elementIds: [seven.id, eight.id],
      minCovers: 6,
      maxCovers: 8,
    };
    const first = unwrap({ result: await save({ combinations: [long] }) });
    expect(first.items).toMatchObject([{ name: "Long table", elementIds: [seven.id, eight.id] }]);
    const id = first.items[0]?.id;
    const renamed = unwrap({
      result: await save({
        combinations: [{ ...long, id, name: "Big table", elementIds: [seven.id, nine.id] }],
      }),
    });
    expect(renamed.items).toMatchObject([{ id, name: "Big table" }]);
    expect(
      errorCode({
        result: await save({ combinations: [{ ...long, elementIds: [seven.id, "nope"] }] }),
      }),
    ).toBe("VALIDATION");
    unwrap({ result: await save({ combinations: [] }) });
    const empty = unwrap({
      result: await execute({
        operation: listTableCombinations,
        input: { layoutId: layout.id },
        context,
      }),
    });
    expect(empty.items).toEqual([]);
  });

  it("white-labels the booking page within its limits", async () => {
    const context = testContext();
    const empty = unwrap({
      result: await execute({ operation: getBookingPage, input: {}, context }),
    });
    expect(empty).toMatchObject({ slug: null, published: false });
    const update = ({ ...input }: Record<string, unknown>) =>
      execute({ operation: updateBookingPage, input, context });

    expect(errorCode({ result: await update({ published: true }) })).toBe("VALIDATION");
    const slug = `kajen-${Date.now()}`;
    const page = unwrap({
      result: await update({
        slug,
        accentColor: "#1c3f6e",
        intro: { sv: "Lunch på vardagar", en: "Lunch on weekdays" },
        embedOrigins: ["https://www.worldofvolvo.com"],
        published: true,
      }),
    });
    expect(page).toMatchObject({ slug, published: true, intro: { en: "Lunch on weekdays" } });
    expect(errorCode({ result: await update({ accentColor: "#ffee88" }) })).toBe("VALIDATION");
    expect(errorCode({ result: await update({ logoKey: "someone-else/logo" }) })).toBe(
      "VALIDATION",
    );
    expect(errorCode({ result: await update({ embedOrigins: ["http://insecure.example"] }) })).toBe(
      "VALIDATION",
    );

    const other = testContext();
    const taken = await execute({ operation: updateBookingPage, input: { slug }, context: other });
    expect(errorCode({ result: taken })).toBe("CONFLICT");
  });
});
