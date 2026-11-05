import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTemplate } from "./seed-template";

const PERIOD = { startsAt: "2026-12-01T08:00:00.000Z", endsAt: "2026-12-01T12:00:00.000Z" };

describe("cross-organization isolation: order intake preview (ADR 0081)", () => {
  it("refuses another organization's template, customer, item, add-on item and line type ids", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedTemplate({ client: a });
    const own = await seedTemplate({ client: b });
    const base = { ...PERIOD, headcount: 4 };
    const line = ({ entityTypeId, itemId }: { entityTypeId: string; itemId: string }) => ({
      ...{ name: "Probe", entityTypeId, itemId },
      ...PERIOD,
    });
    const cases = [
      ["NOT_FOUND", { ...base, customerId: own.customerId, templateIds: [secret.id] }],
      ["VALIDATION", { ...base, customerId: secret.customerId, templateIds: [own.id] }],
      [
        "VALIDATION",
        {
          ...{ ...base, customerId: own.customerId },
          lines: [line({ entityTypeId: own.programTypeId, itemId: secret.itemId })],
        },
      ],
      [
        "VALIDATION",
        {
          ...{ ...base, customerId: own.customerId },
          lines: [line({ entityTypeId: secret.programTypeId, itemId: own.itemId })],
        },
      ],
      [
        "VALIDATION",
        {
          ...{ ...base, customerId: own.customerId },
          lines: [
            {
              ...line({ entityTypeId: own.programTypeId, itemId: own.itemId }),
              addOns: [{ itemId: secret.itemId }],
            },
          ],
        },
      ],
    ] as const;
    for (const [code, args] of cases) {
      const refused = await call({ client: b, name: "order_previewLines", args });
      expect(refused.data.code, JSON.stringify(refused.data)).toBe(code);
    }
    const mine = await call({
      client: b,
      name: "order_previewLines",
      args: { ...base, customerId: own.customerId, templateIds: [own.id] },
    });
    expect(mine.isError, JSON.stringify(mine.data)).toBe(false);
    expect(mine.data.entries.map((entry: { templateId: string }) => entry.templateId)).toEqual([
      own.id,
    ]);
  });
});
