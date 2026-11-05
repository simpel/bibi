import { describe, expect, it } from "vitest";
import { createVocabulary, execute, type PermissionSet } from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";
import {
  type CreateSetup,
  createSetup,
  roomLine,
  runCreate,
  orderInput,
} from "./order-create-helpers";
import { makeTemplate } from "./order-template-helpers";

type Refusal = { code: string; paths: string[] } | null;

type TryInput = { setup: CreateSetup; input: Record<string, unknown>; permissions?: PermissionSet };

/** `order.create` in the setup's organization, optionally with only `permissions`. */
async function attempt({ setup, input, permissions }: TryInput): Promise<Refusal> {
  const { organizationId } = setup.context;
  const context = permissions ? testContext({ organizationId, permissions }) : setup.context;
  const result = await runCreate({ context, input: orderInput({ setup, input }) });
  if (result.ok) return null;
  return { code: result.error.code, paths: result.error.issues.map((issue) => issue.path) };
}

const BASE: PermissionSet = { order: ["write"], customer: ["read"] };

describe("order.create: permissions of the parts given (ADR 0081, 0050)", () => {
  it("needs program:write for lines, item:read for items and options, template:read", async () => {
    const setup = await createSetup();
    const template = unwrap({ result: await makeTemplate({ context: setup.context, setup }) });
    const free = { entityTypeId: setup.lineType.id, name: "Sign" };
    const cases: [Record<string, unknown>, PermissionSet, string][] = [
      [{ lines: [free] }, BASE, "lines"],
      [
        { lines: [roomLine({ setup, from: 9, to: 10 })] },
        { ...BASE, program: ["write"] },
        "lines.0.itemId",
      ],
      [
        { lines: [{ ...free, options: [{ itemId: setup.food.dish.id }] }] },
        { ...BASE, program: ["write"] },
        "lines.0.options",
      ],
      [{ templateId: template.id }, BASE, "templateId"],
    ];
    for (const [input, permissions, path] of cases) {
      expect(await attempt({ setup, input, permissions })).toEqual({
        code: "VALIDATION",
        paths: [path],
      });
    }
    expect(
      await attempt({
        setup,
        input: { lines: [free] },
        permissions: { ...BASE, program: ["write"] },
      }),
    ).toBeNull();
  });
});

describe("order.create: ids of another organization (ADR 0004)", () => {
  it("refuses another organization's template, line type, item, option and list value", async () => {
    const mine = await createSetup();
    const theirs = await createSetup();
    const { context } = theirs;
    const template = unwrap({ result: await makeTemplate({ context, setup: theirs }) });
    const list = unwrap({
      result: await execute({
        operation: createVocabulary,
        input: { name: "Allergens", values: ["Gluten"] },
        context,
      }),
    });
    const need = await createTypeWithField({ context, base: "REQUIREMENT", name: "Diet" });
    const own = { entityTypeId: mine.lineType.id, name: "Ours" };
    const cases: [Record<string, unknown>, string[]][] = [
      [{ templateId: template.id }, ["templateId"]],
      [{ lines: [{ ...own, entityTypeId: theirs.lineType.id }] }, ["lines.0.entityTypeId"]],
      [{ lines: [{ ...own, itemId: theirs.room.id }] }, ["lines.0.itemId"]],
      [
        { lines: [{ ...own, options: [{ itemId: theirs.food.dish.id }] }] },
        ["lines.0.options.0.itemId"],
      ],
      [
        {
          lines: [
            {
              ...own,
              requirements: [
                { entityTypeId: need.type.id, vocabularyValueId: list.values[0]?.id, quantity: 1 },
              ],
            },
          ],
        },
        ["lines.0.requirements.0.entityTypeId", "lines.0.requirements.0.vocabularyValueId"],
      ],
    ];
    for (const [input, paths] of cases) {
      expect(await attempt({ setup: mine, input })).toEqual({ code: "VALIDATION", paths });
    }
  });
});
