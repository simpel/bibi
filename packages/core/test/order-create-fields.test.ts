import { describe, expect, it } from "vitest";
import { createFieldDefinition, execute } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import {
  type CreateSetup,
  createSetup,
  createWith,
  linesOf,
  orderCount,
} from "./order-create-helpers";
import { draftLine, preview, previewSetup } from "./preview-helpers";

/** A required TEXT field on the setup's line type. */
async function requiredField({ setup }: { setup: Pick<CreateSetup, "context" | "lineType"> }) {
  const input = {
    entityTypeId: setup.lineType.id,
    name: "Room sign",
    kind: "TEXT",
    required: true,
  };
  const result = await execute({
    operation: createFieldDefinition,
    input: input as never,
    context: setup.context,
  });
  return unwrap({ result });
}

const untimed = ({ setup, fields }: { setup: CreateSetup; fields?: Record<string, unknown> }) => ({
  entityTypeId: setup.lineType.id,
  name: "Welcome sign",
  ...(fields ? { fields } : {}),
});

describe("order.create: a line type's own fields (ADR 0081, 0021)", () => {
  it("writes a draft line's own field values", async () => {
    const setup = await createSetup();
    const field = await requiredField({ setup });
    const lines = [untimed({ setup, fields: { [field.key]: "Acme AB" } })];
    const order = unwrap({ result: await createWith({ setup, input: { lines } }) });
    const [line] = await linesOf({ context: setup.context, orderId: order.id });
    expect(line?.fields).toEqual({ [field.key]: "Acme AB" });
  });

  it("refuses a missing required field at its line's path and creates nothing", async () => {
    const setup = await createSetup();
    const field = await requiredField({ setup });
    const before = await orderCount({ context: setup.context });
    const result = await createWith({ setup, input: { lines: [untimed({ setup })] } });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      `lines.0.fields.${field.key}`,
    ]);
    expect(await orderCount({ context: setup.context })).toBe(before);
  });

  it("previews a draft line with its fields without checking them", async () => {
    const setup = await previewSetup();
    await requiredField({ setup });
    const line = { ...draftLine({ setup, from: 9, to: 11 }), fields: {} };
    const result = await preview({ setup, input: { lines: [line] } });
    expect(result.entries[0]?.lines).toHaveLength(1);
  });
});
