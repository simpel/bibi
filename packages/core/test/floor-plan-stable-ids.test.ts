import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createLayout, execute, saveLayout } from "../src/index";
import { roomWithLayout, saveTables as save } from "./dining-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

describe("layout pieces keep their ids across saves (ADR 0119)", () => {
  it("keeps named pieces, creates new ones and deletes the ones left out", async () => {
    const context = testContext();
    const { layout, roundId } = await roomWithLayout({ context });
    const first = await save({
      ...{ context, id: layout.id, version: 1 },
      elements: [
        { kindId: roundId, xCm: 200, yCm: 200, label: "1" },
        { kindId: roundId, xCm: 500, yCm: 200, label: "2" },
        { kindId: roundId, xCm: 800, yCm: 200, label: "3" },
      ],
    });
    const [one, two, three] = first.elements;
    if (!one || !two || !three) throw new Error("pieces missing");

    const second = await save({
      ...{ context, id: layout.id, version: 2 },
      elements: [
        // Table 2 moved and now first; table 1 kept; table 3 left out; a new table 4.
        { id: two.id, kindId: roundId, xCm: 520, yCm: 400, label: "2" },
        { id: one.id, kindId: roundId, xCm: 200, yCm: 200, label: "1" },
        { kindId: roundId, xCm: 800, yCm: 500, label: "4" },
      ],
    });
    expect(second.elements.map((piece) => piece.label)).toEqual(["2", "1", "4"]);
    expect(second.elements[0]).toMatchObject({ id: two.id, xCm: 520, yCm: 400 });
    expect(second.elements[1]?.id).toBe(one.id);
    const four = second.elements[2]?.id;
    expect([one.id, two.id, three.id]).not.toContain(four);
  });

  it("treats another layout's id, or an id named twice, as a new piece", async () => {
    const context = testContext();
    const a = await roomWithLayout({ context });
    const second = unwrap({
      result: await execute({
        operation: createLayout,
        input: { itemId: a.item.id, name: "Lunch" },
        context,
      }),
    });
    const b = { layout: second, roundId: a.roundId };
    const [stranger] = (
      await save({
        ...{ context, id: b.layout.id, version: 1 },
        elements: [{ kindId: b.roundId, xCm: 200, yCm: 200 }],
      })
    ).elements;
    const [own] = (
      await save({
        ...{ context, id: a.layout.id, version: 1 },
        elements: [{ kindId: a.roundId, xCm: 200, yCm: 200 }],
      })
    ).elements;
    if (!stranger || !own) throw new Error("pieces missing");
    const saved = await save({
      ...{ context, id: a.layout.id, version: 2 },
      elements: [
        { id: own.id, kindId: a.roundId, xCm: 200, yCm: 200 },
        { id: own.id, kindId: a.roundId, xCm: 500, yCm: 200 },
        { id: stranger.id, kindId: a.roundId, xCm: 800, yCm: 200 },
      ],
    });
    const ids = saved.elements.map((piece) => piece.id);
    expect(ids[0]).toBe(own.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain(stranger.id);
    const otherLayout = await save({
      ...{ context, id: b.layout.id, version: 2 },
      elements: [{ id: stranger.id, kindId: b.roundId, xCm: 200, yCm: 200 }],
    });
    expect(otherLayout.elements[0]?.id).toBe(stranger.id);
  });

  it("refuses to remove a table with an upcoming hold and archives a broken combination", async () => {
    const context = testContext();
    const { layout, roundId } = await roomWithLayout({ context });
    const saved = await save({
      ...{ context, id: layout.id, version: 1 },
      elements: [
        { kindId: roundId, xCm: 200, yCm: 200, label: "1" },
        { kindId: roundId, xCm: 500, yCm: 200, label: "2" },
        { kindId: roundId, xCm: 800, yCm: 200, label: "3" },
      ],
    });
    const [one, two, three] = saved.elements;
    if (!one || !two || !three) throw new Error("pieces missing");
    const { organizationId } = context;
    const db = getDb();
    const hour = 3_600_000;
    const hold = ({ elementId, from }: { elementId: string; from: number }) =>
      db.tableHold.create({
        data: {
          ...{ organizationId, elementId, kind: "BLOCK" as const },
          startsAt: new Date(Date.now() + from),
          endsAt: new Date(Date.now() + from + hour),
        },
      });
    await hold({ elementId: one.id, from: 24 * hour });
    await hold({ elementId: two.id, from: -48 * hour });
    const combination = await db.tableCombination.create({
      data: { organizationId, layoutId: layout.id, name: "Long table" },
    });
    await db.tableCombinationMember.createMany({
      data: [two.id, three.id].map((elementId) => ({
        ...{ organizationId, combinationId: combination.id, elementId },
      })),
    });
    const keep = ({ piece }: { piece: typeof one }) => ({
      id: piece.id,
      kindId: roundId,
      xCm: piece.xCm,
      yCm: piece.yCm,
    });

    const refused = await execute({
      operation: saveLayout,
      input: {
        id: layout.id,
        expectedVersion: 2,
        elements: [keep({ piece: two }), keep({ piece: three })],
      },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");

    // Table 2 only has a past hold: it goes, and the long table is left with one table.
    await save({
      ...{ context, id: layout.id, version: 2 },
      elements: [keep({ piece: one }), keep({ piece: three })],
    });
    const after = await db.tableCombination.findUnique({ where: { id: combination.id } });
    expect(after?.status).toBe("ARCHIVED");
  });
});
