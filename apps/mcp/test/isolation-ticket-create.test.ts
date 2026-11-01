import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTemplate } from "./seed-template";

const PERIOD = { startsAt: "2026-12-01T08:00:00.000Z", endsAt: "2026-12-01T09:00:00.000Z" };

describe("cross-organization isolation: ticket.create with lines (ADR 0081)", () => {
  it("refuses another organization's template, item, option and list value ids", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedTemplate({ client: a });
    const own = await seedTemplate({ client: b });
    const base = {
      entityTypeId: own.entityTypeId,
      customerId: own.customerId,
      contactId: own.contactId,
    };
    const line = { entityTypeId: own.programTypeId, name: "Probe" };
    const need = { entityTypeId: own.requirementTypeId, quantity: 1 };
    const cases = [
      { templateId: secret.id },
      { lines: [{ ...line, itemId: secret.itemId, ...PERIOD }] },
      { lines: [{ ...line, options: [{ itemId: secret.itemId }] }] },
      { lines: [{ ...line, requirements: [{ ...need, vocabularyValueId: secret.valueId }] }] },
      {
        lines: [
          {
            ...line,
            requirements: [
              { ...need, vocabularyValueId: own.valueId, entityTypeId: secret.requirementTypeId },
            ],
          },
        ],
      },
    ];
    for (const extra of cases) {
      const refused = await call({ client: b, name: "ticket_create", args: { ...base, ...extra } });
      expect(["VALIDATION", "NOT_FOUND"], JSON.stringify(refused.data)).toContain(
        refused.data.code,
      );
    }
    const mine = await call({
      client: b,
      name: "ticket_create",
      args: {
        ...{ ...base, templateId: own.id, intakeKey: "isolation" },
        lines: [{ ...line, itemId: own.itemId, ...PERIOD }],
      },
    });
    expect(mine.isError, JSON.stringify(mine.data)).toBe(false);
  });
});
