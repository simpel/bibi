import { describe, expect, it } from "vitest";
import { PRESET_PERMISSIONS } from "../src/index";
import { errorCode, testContext } from "./helpers";
import { hours } from "./occupancy-helpers";
import { bookRoom, draftLine, previewSetup, runPreview } from "./preview-helpers";
import { makeTemplate } from "./order-template-helpers";

const PERIOD = { ...hours({ from: 9, to: 13 }), headcount: 8 };

describe("order.previewLines: access and input (ADR 0071, 0081)", () => {
  it("hides availability without item:read and says so", async () => {
    const setup = await previewSetup();
    await bookRoom({ setup, from: 10, hard: true });
    const { item: _item, ...rest } = PRESET_PERMISSIONS.admin;
    const context = testContext({
      organizationId: setup.context.organizationId,
      permissions: rest,
    });
    const lines = [draftLine({ setup, from: 9, to: 11 }), draftLine({ setup, from: 10, to: 12 })];
    const result = await runPreview({
      context,
      input: { customerId: setup.customerId, ...PERIOD, lines },
    });
    if (!result.ok) throw result.error;
    expect(result.value.availabilityHidden).toBe(true);
    const [entry] = result.value.entries;
    expect(entry?.firstFreeStart).toBeNull();
    expect(entry?.group).toBe("AVAILABLE");
    expect(entry?.lines.flatMap((line) => line.issues.map((issue) => issue.kind))).toEqual([
      "SELF_OVERLAP",
      "SELF_OVERLAP",
    ]);
  });

  it("refuses another organization's customer and template, and a missing customer:read", async () => {
    const setup = await previewSetup();
    const other = await previewSetup();
    const template = await makeTemplate({ context: other.context, setup: other });
    const { context } = setup;
    const lines = [draftLine({ setup, from: 9, to: 11 })];
    const foreignCustomer = await runPreview({
      context,
      input: { customerId: other.customerId, ...PERIOD, lines },
    });
    expect(errorCode({ result: foreignCustomer })).toBe("VALIDATION");
    const templateId = template.ok ? template.value.id : "";
    const foreignTemplate = await runPreview({
      context,
      input: { customerId: setup.customerId, ...PERIOD, templateIds: [templateId] },
    });
    expect(errorCode({ result: foreignTemplate })).toBe("NOT_FOUND");
    const foreignItem = await runPreview({
      context,
      input: {
        customerId: setup.customerId,
        ...PERIOD,
        lines: [draftLine({ setup, from: 9, to: 11, itemId: other.room.id })],
      },
    });
    expect(errorCode({ result: foreignItem })).toBe("VALIDATION");
    const { customer: _customer, ...noCustomer } = PRESET_PERMISSIONS.admin;
    const blind = testContext({ organizationId: context.organizationId, permissions: noCustomer });
    const refused = await runPreview({
      context: blind,
      input: { customerId: setup.customerId, ...PERIOD, lines },
    });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });

  it("needs exactly one of templateIds and lines, and a period that ends after it starts", async () => {
    const setup = await previewSetup();
    const { context, customerId } = setup;
    const neither = await runPreview({ context, input: { customerId, ...PERIOD } });
    expect(errorCode({ result: neither })).toBe("VALIDATION");
    const backwards = { ...PERIOD, ...hours({ from: 13, to: 9 }) };
    const lines = [draftLine({ setup, from: 9, to: 11 })];
    const reversed = await runPreview({ context, input: { customerId, ...backwards, lines } });
    expect(errorCode({ result: reversed })).toBe("VALIDATION");
    const halfTimed = [{ ...lines[0], endsAt: null }];
    const half = await runPreview({ context, input: { customerId, ...PERIOD, lines: halfTimed } });
    expect(half.ok ? [] : half.error.issues.map((issue) => issue.path)).toEqual(["lines.0.endsAt"]);
  });

  it("writes nothing", async () => {
    const setup = await previewSetup();
    const { context, customerId } = setup;
    const before = await Promise.all([context.db.order.count(), context.db.line.count()]);
    const lines = [draftLine({ setup, from: 9, to: 11 })];
    await runPreview({ context, input: { customerId, ...PERIOD, lines } });
    expect(await Promise.all([context.db.order.count(), context.db.line.count()])).toEqual(before);
  });
});
