import { describe, expect, it } from "vitest";
import { execute, type ItemResolution, resolveItem } from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { type Allergen, createMenu } from "./item-resolve-helpers";
import { testOrg } from "./org-helpers";

type Menu = Awaited<ReturnType<typeof createMenu>>;
type Key = keyof Menu["ids"];

const names = ({ tags }: { tags: ItemResolution["contains"] }) => tags.map((tag) => tag.name);

type Case = {
  root: Key;
  contains: Allergen[];
  mayContain: Partial<Record<Allergen, Key[]>>;
};

/** Expected inherited tags per item (ADR 0021), lists in the list's order (Gluten, Milk, …). */
const CASES: Case[] = [
  { root: "bread", contains: ["Gluten"], mayContain: {} },
  { root: "veal", contains: [], mayContain: {} },
  { root: "starter", contains: ["Gluten"], mayContain: { Milk: ["butter"] } },
  {
    root: "lunch",
    contains: ["Gluten"],
    mayContain: { Milk: ["butter"], Fish: ["cod"], Nuts: ["cake"], Egg: ["cake"] },
  },
  // Salad is mandatory and carries Milk, so the optional butter no longer makes it "may".
  {
    root: "day",
    contains: ["Gluten", "Milk"],
    mayContain: { Fish: ["cod"], Nuts: ["cake"], Egg: ["cake"] },
  },
  // A choice whose only option must be picked has no alternative: it is contained.
  { root: "duo", contains: ["Egg"], mayContain: {} },
];

describe("item.resolve (ADR 0021)", () => {
  it.each(CASES)("inherits the tags of $root", async ({ root, contains, mayContain }) => {
    const context = testContext();
    const { ids } = await createMenu({ context });
    const result = await execute({ operation: resolveItem, input: { id: ids[root] }, context });
    const resolution = unwrap({ result });
    expect(names({ tags: resolution.contains })).toEqual(contains);
    const expected = Object.entries(mayContain).map(([name, keys]) => ({
      name,
      itemIds: keys.map((key) => ids[key]),
    }));
    expect(resolution.mayContain.map(({ name, itemIds }) => ({ name, itemIds }))).toEqual(expected);
    // Inline options ("Style": Gluten) are not list values and never become tags.
    if (root === "veal") expect(resolution.nodes[0]?.tags).toEqual([]);
  });

  it("expands multi-level packages with quantity, timing and mandatory flags", async () => {
    const context = testContext();
    const { ids } = await createMenu({ context });
    const result = await execute({ operation: resolveItem, input: { id: ids.day }, context });
    const { nodes } = unwrap({ result });
    const row = ({ key }: { key: Key }) => nodes.find((node) => node.itemId === ids[key]);
    expect(nodes.map((node) => node.name)).toEqual([
      "Day",
      "Lunch",
      "Starter",
      "Bread",
      "Butter",
      "Cod",
      "Veal",
      "Nut cake",
      "Salad",
    ]);
    expect(row({ key: "bread" })).toMatchObject({
      depth: 3,
      path: [ids.day, ids.lunch, ids.starter, ids.bread],
      totalQuantity: 6,
      offsetMinutes: 180,
      mandatory: true,
    });
    expect(row({ key: "cod" })).toMatchObject({
      choiceGroup: "Main",
      mandatory: false,
      offsetMinutes: 210,
    });
    expect(row({ key: "butter" })).toMatchObject({ required: false, mandatory: false });
    expect(row({ key: "salad" })).toMatchObject({ depth: 1, mandatory: true, offsetMinutes: 200 });
  });

  it("is not found for unknown items and items of other organizations", async () => {
    const context = testContext();
    const { ids } = await createMenu({ context });
    const other = await testOrg();
    const foreign = await execute({
      operation: resolveItem,
      input: { id: ids.day },
      context: other,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    const missing = await execute({ operation: resolveItem, input: { id: "nope" }, context });
    expect(errorCode({ result: missing })).toBe("NOT_FOUND");
  });

  it("needs only item:read", async () => {
    const context = testContext();
    const { ids } = await createMenu({ context });
    const reader = peer({ of: context, access: "read" });
    const result = await execute({
      operation: resolveItem,
      input: { id: ids.lunch },
      context: reader,
    });
    expect(unwrap({ result }).contains).toHaveLength(1);
  });
});
