import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedTemplate } from "./seed-template";

const START = "2026-12-01T08:00:00.000Z";

describe("cross-organization isolation: predefined orders", () => {
  it("hides one organization's template and refuses its ids on another's", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const secret = await seedTemplate({ client: a });
    const own = await seedTemplate({ client: b });
    for (const [name, args] of [
      ["orderTemplate_get", { id: secret.id }],
      ["orderTemplate_update", { id: secret.id, name: "Hijacked" }],
      ["orderTemplate_archive", { id: secret.id }],
      [
        "order_createFromTemplate",
        {
          ...{ templateId: secret.id, customerId: own.customerId, contactId: own.contactId },
          ...{ startsAt: START, headcount: 4 },
        },
      ],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const intruder = { ...secret.args, name: "Intruder" };
    const [typeIssue, statusIssue, itemIssue] = await Promise.all([
      call({
        client: b,
        name: "orderTemplate_create",
        args: { ...own.args, name: "Other type", entityTypeId: secret.entityTypeId },
      }),
      call({
        client: b,
        name: "orderTemplate_create",
        args: { ...own.args, name: "Other status", statusId: secret.statusId },
      }),
      call({ client: b, name: "orderTemplate_create", args: intruder }),
    ]);
    for (const refused of [typeIssue, statusIssue, itemIssue]) {
      expect(refused.data.code, JSON.stringify(refused.data)).toBe("VALIDATION");
    }
    const foreignCustomer = await call({
      client: b,
      name: "order_createFromTemplate",
      args: {
        ...{ templateId: own.id, customerId: secret.customerId, contactId: secret.contactId },
        ...{ startsAt: START, headcount: 4 },
      },
    });
    expect(foreignCustomer.data.code).toBe("VALIDATION");
    const listed = await call({ client: b, name: "orderTemplate_list" });
    expect(listed.data.items.map((item: { id: string }) => item.id)).toEqual([own.id]);
    const still = await call({ client: a, name: "orderTemplate_get", args: { id: secret.id } });
    expect(still.data.name).toBe("Secret template");
  });
});
