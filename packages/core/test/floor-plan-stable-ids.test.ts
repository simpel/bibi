import { describe, expect, it } from "vitest";
import {
  createItem,
  createLayout,
  type ExecuteContext,
  execute,
  importFloorElementKinds,
  listFloorElementKinds,
  saveLayout,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

type Ctx = { context: ExecuteContext };

/** A room with the starter library and one empty layout; the round table's kind id. */
async function roomWithLayout({ context }: Ctx) {
  const type = await createRoomType({ context });
  const input = { entityTypeId: type.id, name: "Kajen", maxPeople: 100 };
  const item = unwrap({ result: await execute({ operation: createItem, input, context }) });
  const template = { template: "conference-banquet" as const };
  unwrap({
    result: await execute({ operation: importFloorElementKinds, input: template, context }),
  });
  const kinds = unwrap({
    result: await execute({ operation: listFloorElementKinds, input: { limit: 100 }, context }),
  });
  const round = kinds.items.find((kind) => kind.name === "Round table Ø180");
  if (!round) throw new Error("round table kind missing");
  const layout = unwrap({
    result: await execute({
      operation: createLayout,
      input: { itemId: item.id, name: "Dinner" },
      context,
    }),
  });
  return { item, layout, roundId: round.id };
}

type SaveInput = Ctx & {
  id: string;
  version: number;
  elements: { id?: string; kindId: string; xCm: number; yCm: number; label?: string }[];
};

const save = async ({ context, id, version, elements }: SaveInput) =>
  unwrap({
    result: await execute({
      operation: saveLayout,
      input: { id, expectedVersion: version, elements },
      context,
    }),
  });

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
});
