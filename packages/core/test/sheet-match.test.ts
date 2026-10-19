import { describe, expect, it } from "vitest";
import { execute, generateSheet, type SheetDto, sendSheet, updateRequirement } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addRequirement } from "./requirement-helpers";
import { confirmTicket } from "./sheet-helpers";
import { countOnTicket, type MatchSetup, matchSetup, serve } from "./sheet-match-helpers";

const generate = ({ context, ticket, definition }: MatchSetup) =>
  execute({
    operation: generateSheet,
    input: { ticketId: ticket.id, sheetDefinitionId: definition.id },
    context,
  });

const send = ({ setup, sheet }: { setup: MatchSetup; sheet: SheetDto }) =>
  execute({ operation: sendSheet, input: { id: sheet.id }, context: setup.context });

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

describe("sheet matches (ADR 0021)", () => {
  it.each(CASES)("$title", async ({ menu, count, kind, carriers }) => {
    const setup = await matchSetup();
    await serve({ setup, menu });
    await countOnTicket({ setup, value: setup[count], quantity: 3 });
    const sheet = unwrap({ result: await generate(setup) });
    if (!kind) {
      expect(sheet).toMatchObject({ blocked: false, matches: [] });
      return;
    }
    expect(sheet.blocked).toBe(kind === "CONTAINS");
    expect(sheet.matches).toHaveLength(1);
    expect(sheet.matches[0]).toMatchObject({
      kind,
      carriers,
      quantity: 3,
      itemName: expect.any(String),
    });
  });

  it("refuses to send a blocked sheet until the count is gone", async () => {
    const setup = await matchSetup();
    await serve({ setup, menu: "mandatory" });
    const count = await countOnTicket({ setup, value: setup.gluten, quantity: 2 });
    await confirmTicket({ context: setup.context, ticketId: setup.ticket.id });
    const blocked = unwrap({ result: await generate(setup) });
    expect(blocked.blocked).toBe(true);
    expect(errorCode({ result: await send({ setup, sheet: blocked }) })).toBe("CONFLICT");
    const input = { id: count.id, quantity: 0 };
    unwrap({
      result: await execute({ operation: updateRequirement, input, context: setup.context }),
    });
    const cleared = unwrap({ result: await generate(setup) });
    expect(cleared).toMatchObject({ version: 2, blocked: false, matches: [] });
    expect(errorCode({ result: await send({ setup, sheet: cleared }) })).toBeNull();
  });

  it("does not block on a may-contain match, and lists blocking matches first", async () => {
    const setup = await matchSetup();
    await serve({ setup, menu: "optional" });
    await serve({ setup, menu: "mandatory" });
    await countOnTicket({ setup, value: setup.gluten, quantity: 4 });
    const sheet = unwrap({ result: await generate(setup) });
    expect(sheet.matches.map((match) => match.kind)).toEqual(["CONTAINS", "MAY_CONTAIN"]);
    expect(sheet.blocked).toBe(true);
  });

  it("lets a line's own count of 0 replace the ticket's count", async () => {
    const setup = await matchSetup();
    const held = await serve({ setup, menu: "mandatory" });
    await countOnTicket({ setup, value: setup.gluten, quantity: 4 });
    const own = {
      context: setup.context,
      ticketId: setup.ticket.id,
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
    const sheet = unwrap({ result: await generate(setup) });
    expect(sheet).toMatchObject({ blocked: false, matches: [] });
  });
});
