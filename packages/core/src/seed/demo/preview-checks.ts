import { previewOrderLines } from "../../features/order/preview-lines-operation";
import type { OrderPreviewLinesInput } from "../../features/order/preview-lines-schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrder } from "./order-types";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext };

const run = ({ context, input }: Ctx & { input: OrderPreviewLinesInput }) =>
  execute({ operation: previewOrderLines, input, context });

const SELECT = {
  ...{ entityTypeId: true, name: true, itemId: true, startsAt: true, endsAt: true },
  order: { select: { customerId: true, reference: true } },
} as const;

type ClashInput = Ctx & { soft: DemoOrder; hard: DemoOrder };

/**
 * L12's soft-held room line, previewed again as a draft line, clashes with L4's hard hold
 * (`HARD_CLASH` naming L4) and is prebooked, not refused, because the entry status starts the
 * room soft (ADR 0081 decision 8).
 */
async function clashFailures({ context, soft, hard }: ClashInput): Promise<string[]> {
  const softLine = soft.lines?.[0];
  const hardLine = hard.lines?.find((line) => line.item === softLine?.item);
  if (!softLine || !hardLine) return [`${soft.ref}: no line on ${hard.ref}'s item`];
  const [mine, theirs] = await Promise.all([
    context.db.line.findFirst({ where: { name: softLine.name }, select: SELECT }),
    context.db.line.findFirst({ where: { name: hardLine.name }, select: SELECT }),
  ]);
  if (!mine?.startsAt || !mine.endsAt || !theirs) return [`${soft.ref}: lines not found`];
  const { startsAt, endsAt, entityTypeId, name, itemId } = mine;
  const line = { entityTypeId, name, itemId, startsAt, endsAt };
  const input = { customerId: mine.order.customerId, startsAt, endsAt, headcount: 8 };
  const result = await run({ context, input: { ...input, lines: [line] } });
  if (!result.ok) return [`${soft.ref}: preview failed (${result.error.code})`];
  const issues = result.value.entries[0]?.lines[0]?.issues ?? [];
  const clash = issues.find(
    (issue) => issue.kind === "HARD_CLASH" && issue.orderReference === theirs.order.reference,
  );
  if (!clash) return [`${soft.ref}: no HARD_CLASH naming ${hard.ref}`];
  return clash.refusesCreate ? [`${soft.ref}: the clash would refuse Create`] : [];
}

/** The first package with a guest range previews in OUTSIDE_RANGE for one guest over its max. */
async function rangeFailures({ context, org }: Ctx & { org: DemoOrg }): Promise<string[]> {
  const ranged = org.templates.find((template) => template.maxGuests !== undefined);
  if (!ranged?.maxGuests) return [];
  const [template, customer] = await Promise.all([
    context.db.orderTemplate.findFirst({ where: { name: ranged.name }, select: { id: true } }),
    context.db.customer.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!template || !customer) return [`${ranged.name}: package or customer not found`];
  const startsAt = new Date(Date.now() + 30 * 86_400_000);
  const input = {
    ...{ customerId: customer.id, startsAt, endsAt: new Date(startsAt.getTime() + 8 * 3_600_000) },
    ...{ headcount: ranged.maxGuests + 1, templateIds: [template.id] },
  };
  const result = await run({ context, input });
  if (!result.ok) return [`${ranged.name}: preview failed (${result.error.code})`];
  const group = result.value.entries[0]?.group;
  return group === "OUTSIDE_RANGE" ? [] : [`${ranged.name}: ${group}, expected OUTSIDE_RANGE`];
}

export type CheckDemoPreviewInput = Ctx & { org: DemoOrg };

/**
 * ADR 0081 (`order.previewLines`): L12's soft-held room previews with a hard clash naming L4,
 * and a package with a guest range previews outside the range for a headcount above its max.
 * Writes nothing. Returns failure messages.
 */
export async function checkDemoPreview({ context, org }: CheckDemoPreviewInput) {
  const soft = org.orders.find((order) => order.ref === "L12");
  const hard = org.orders.find((order) => order.ref === "L4");
  const failures = [
    ...(soft && hard ? await clashFailures({ context, soft, hard }) : []),
    ...(await rangeFailures({ context, org })),
  ];
  return failures.map((failure) => `${org.slug}: preview ${failure}`);
}
