import { findSimilarCustomers } from "../../features/customer/find-similar-operation";
import { previewOrderLines } from "../../features/order/preview-lines-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext; org: DemoOrg };

const DAY_MS = 86_400_000;

/** The package previewed on the period of the order made from it (L7: D+1 10-12, 4 guests). */
async function clashFailures({ context, org }: Ctx): Promise<string[]> {
  const order = org.orders.find((row) => row.template === "Small meeting");
  const [template, row] = await Promise.all([
    context.db.orderTemplate.findFirst({ where: { name: "Small meeting" }, select: { id: true } }),
    context.db.line.findFirst({
      where: { name: "Small meeting room" },
      select: { startsAt: true, endsAt: true, order: { select: { customerId: true } } },
    }),
  ]);
  if (!order || !template || !row?.startsAt || !row.endsAt)
    return ["no order from Small meeting"];
  const input = {
    ...{ customerId: row.order.customerId, startsAt: row.startsAt, endsAt: row.endsAt },
    ...{ headcount: order.headcount ?? 4, templateIds: [template.id] },
  };
  const result = await execute({ operation: previewOrderLines, input, context });
  if (!result.ok) return [`preview failed (${result.error.code})`];
  const group = result.value.entries[0]?.group;
  return group === "CLASHES"
    ? []
    : [`Small meeting on ${order.ref}'s time is ${group}, not CLASHES`];
}

/** Wine tasting (8-16 guests, a drink and equipment that needs a pooled technician) for 14, far out. */
async function availableFailures({ context }: Pick<Ctx, "context">): Promise<string[]> {
  const [template, customer] = await Promise.all([
    context.db.orderTemplate.findFirst({ where: { name: "Wine tasting" }, select: { id: true } }),
    context.db.customer.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!template || !customer) return ["Wine tasting package or a customer is missing"];
  const startsAt = new Date(Date.now() + 400 * DAY_MS);
  const endsAt = new Date(startsAt.getTime() + 3 * 3_600_000);
  const input = { customerId: customer.id, startsAt, endsAt, headcount: 14 };
  const result = await execute({
    operation: previewOrderLines,
    input: { ...input, templateIds: [template.id] },
    context,
  });
  if (!result.ok) return [`preview failed (${result.error.code})`];
  const entry = result.value.entries[0];
  const lines = entry?.lines.length ?? 0;
  if (entry?.group !== "AVAILABLE")
    return [`Wine tasting for 14 is ${entry?.group}, not AVAILABLE`];
  return lines === 3 ? [] : [`Wine tasting previews ${lines} lines, expected 3`];
}

/** The tasting mail's sender domain belongs to one customer (the E2E draft resolves it). */
async function domainFailures({ context, org }: Ctx): Promise<string[]> {
  if (!org.customers.some((customer) => customer.name === "Kvarnby Design AB")) return [];
  const input = { email: "someone.new@kvarnby.test" };
  const found = await execute({ operation: findSimilarCustomers, input, context });
  const names = found.ok ? found.value.items.map((item) => item.customer.name) : [];
  return names.join() === "Kvarnby Design AB"
    ? []
    : [`kvarnby.test matches ${names.join() || "nothing"}`];
}

/**
 * The intake showcase (ADR 0081, `docs/demo-seed.md` check 24): Small meeting on the time of the
 * order made from it lands in CLASHES, the Wine tasting package fits 14 guests on a free day with
 * its three lines, and the sender's company domain finds exactly one customer. Writes nothing.
 */
export async function checkDemoShowcase({ context, org }: Ctx): Promise<string[]> {
  if (!org.templates.some((template) => template.name === "Wine tasting")) return [];
  const failures = [
    ...(await clashFailures({ context, org })),
    ...(await availableFailures({ context })),
    ...(await domainFailures({ context, org })),
  ];
  return failures.map((failure) => `${org.slug}: showcase ${failure}`);
}
