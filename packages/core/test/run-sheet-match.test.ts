import { describe, expect, it } from "vitest";
import {
  execute,
  generateRunSheet,
  sendRunSheet,
  updateRequirement,
  type RunSheetDto,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addRequirement } from "./requirement-helpers";
import { confirmOrder } from "./run-sheet-helpers";
import { countOnOrder, type MatchSetup, matchSetup, serve } from "./run-sheet-match-helpers";

const generate = ({ context, order, definition }: MatchSetup) =>
  execute({
    operation: generateRunSheet,
    input: { orderId: order.id, runSheetDefinitionId: definition.id },
    context,
  });

const send = ({ setup, runSheet }: { setup: MatchSetup; runSheet: RunSheetDto }) =>
  execute({ operation: sendRunSheet, input: { id: runSheet.id }, context: setup.context });

type Case = {
  title: string;
  menu: keyof MatchSetup["menus"];
  count: "gluten" | "lactose";
  kind: "CONTAINS" | "MAY_CONTAIN" | null;
  carriers: string[];
};

/** Expected matches (ADR 0021): only a mandatory hit without an alternative blocks. */
const CASES: Case[] = [
  {
    title: "mandatory part",
    menu: "mandatory",
    count: "gluten",
    kind: "CONTAINS",
    carriers: ["Bread"],
  },
  {
    title: "item itself",
    menu: "lactose",
    count: "lactose",
    kind: "CONTAINS",
    carriers: ["Butter"],
  },
  {
    title: "optional part",
    menu: "optional",
    count: "gluten",
    kind: "MAY_CONTAIN",
    carriers: ["Bread"],
  },
  {
    title: "option with an alternative",
    menu: "alternative",
    count: "gluten",
    kind: "MAY_CONTAIN",
    carriers: ["Bread"],
  },
  { title: "another list value", menu: "mandatory", count: "lactose", kind: null, carriers: [] },
  { title: "no tags", menu: "plain", count: "gluten", kind: null, carriers: [] },
];

describe("run sheet matches (ADR 0021)", () => {
  it.each(CASES)("$title", async ({ menu, count, kind, carriers }) => {
    const setup = await matchSetup();
    await serve({ setup, menu });
    await countOnOrder({ setup, value: setup[count], quantity: 3 });
    const runSheet = unwrap({ result: await generate(setup) });
    if (!kind) {
      expect(runSheet).toMatchObject({ blocked: false, matches: [] });
      return;
    }
    expect(runSheet.blocked).toBe(kind === "CONTAINS");
    expect(runSheet.matches).toHaveLength(1);
    expect(runSheet.matches[0]).toMatchObject({
      kind,
      carriers,
      quantity: 3,
      itemName: expect.any(String),
    });
  });

  it("refuses to send a blocked run sheet until the count is gone", async () => {
    const setup = await matchSetup();
    await serve({ setup, menu: "mandatory" });
    const count = await countOnOrder({ setup, value: setup.gluten, quantity: 2 });
    await confirmOrder({ context: setup.context, orderId: setup.order.id });
    const blocked = unwrap({ result: await generate(setup) });
    expect(blocked.blocked).toBe(true);
    expect(errorCode({ result: await send({ setup, runSheet: blocked }) })).toBe("CONFLICT");
    const input = { id: count.id, quantity: 0 };
    unwrap({
      result: await execute({ operation: updateRequirement, input, context: setup.context }),
    });
    const cleared = unwrap({ result: await generate(setup) });
    // The count change already generated the newer version (ADR 0092).
    expect(cleared.version).toBeGreaterThan(blocked.version);
    expect(cleared).toMatchObject({ blocked: false, matches: [] });
    expect(errorCode({ result: await send({ setup, runSheet: cleared }) })).toBeNull();
  });

  it("does not block on a may-contain match, and lists blocking matches first", async () => {
    const setup = await matchSetup();
    await serve({ setup, menu: "optional" });
    await serve({ setup, menu: "mandatory" });
    await countOnOrder({ setup, value: setup.gluten, quantity: 4 });
    const runSheet = unwrap({ result: await generate(setup) });
    expect(runSheet.matches.map((match) => match.kind)).toEqual(["CONTAINS", "MAY_CONTAIN"]);
    expect(runSheet.blocked).toBe(true);
  });

  it("lets a line's own count of 0 replace the order's count", async () => {
    const setup = await matchSetup();
    const held = await serve({ setup, menu: "mandatory" });
    await countOnOrder({ setup, value: setup.gluten, quantity: 4 });
    const own = {
      context: setup.context,
      orderId: setup.order.id,
      entityTypeId: setup.type.id,
    };
    unwrap({
      result: await addRequirement({
        ...own,
        lineId: held.id,
        vocabularyValueId: setup.gluten,
        quantity: 0,
      }),
    });
    const runSheet = unwrap({ result: await generate(setup) });
    expect(runSheet).toMatchObject({ blocked: false, matches: [] });
  });
});
