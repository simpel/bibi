import { createEntityType } from "../../features/entity-type/write-operations";
import { createOrder } from "../../features/order/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import type { DemoOrg } from "./types";

type Ctx = { context: OperationContext };

/** Thrown to roll the check's transaction back while carrying its failures out. */
class CheckDone extends Error {
  readonly failures: string[];

  constructor({ failures }: { failures: string[] }) {
    super("intake create check");
    this.failures = failures;
  }
}

/** A line type, an order with a contact, an item with a split group (its groups) and a value. */
async function loadRefs({ context }: Ctx) {
  const [lineType, order, split, value] = await Promise.all([
    context.db.entityType.findFirst({ where: { base: "LINE" }, orderBy: { createdAt: "asc" } }),
    context.db.order.findFirst({
      where: { contactId: { not: null } },
      orderBy: { reference: "asc" },
    }),
    context.db.itemCustomisationGroup.findFirst({ where: { split: true } }),
    context.db.vocabularyValue.findFirst({ where: { vocabulary: { status: "ACTIVE" } } }),
  ]);
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: split?.itemId ?? "" },
    orderBy: { position: "asc" },
    include: { options: { where: { item: { status: "ACTIVE" } }, orderBy: { position: "asc" } } },
  });
  return { lineType, order, itemId: split?.itemId ?? null, groups, value };
}

type Refs = Awaited<ReturnType<typeof loadRefs>>;

/** Every group's least pick: 10 + 4 of a split group's first options, else its first options. */
const choicesOf = ({ groups }: Pick<Refs, "groups">) =>
  groups.flatMap((group) =>
    group.split
      ? group.options
          .slice(0, Math.min(2, group.maxPick))
          .map((option, index) => ({ itemId: option.itemId, quantity: index === 0 ? 10 : 4 }))
      : group.options.slice(0, group.minPick).map((option) => ({ itemId: option.itemId })),
  );

/** The dinner line: the split group's item for 14 with its choices, and one need. */
function lineOf({ refs, needTypeId }: { refs: Refs; needTypeId: string }) {
  const { lineType, itemId, value } = refs;
  const startsAt = new Date(Date.now() + 400 * 86_400_000);
  const need = value
    ? [{ entityTypeId: needTypeId, vocabularyValueId: value.id, quantity: 2 }]
    : [];
  return {
    ...{ entityTypeId: lineType?.id ?? "", name: "Intake check dinner", quantity: 14 },
    ...{ startsAt, endsAt: new Date(startsAt.getTime() + 3 * 3_600_000) },
    ...(itemId ? { itemId } : {}),
    options: itemId ? choicesOf(refs) : [],
    requirements: need,
  };
}

/** Creates the order twice with one intake key and returns what differs from the expectation. */
async function exercise({ context }: Ctx): Promise<string[]> {
  const refs = await loadRefs({ context });
  if (!refs.lineType || !refs.order?.contactId) return ["no line type or order with a contact"];
  const need = await runNested({
    operation: createEntityType,
    input: { base: "REQUIREMENT", name: "Intake check need" },
    context,
  });
  if (!need.ok) return [`requirement type: ${need.error.message}`];
  const { entityTypeId, customerId, contactId } = refs.order;
  const line = lineOf({ refs, needTypeId: need.value.id });
  const input = { entityTypeId, customerId, contactId, intakeKey: "seed-intake", lines: [line] };
  const first = await runNested({ operation: createOrder, input, context });
  if (!first.ok) return [`order.create failed: ${first.error.message}`];
  const again = await runNested({ operation: createOrder, input, context });
  const failures =
    again.ok && again.value.id === first.value.id ? [] : ["the repeat made a second order"];
  const orderId = first.value.id;
  const [orders, lines, needs] = await Promise.all([
    context.db.order.count({ where: { intakeKey: "seed-intake" } }),
    context.db.line.count({ where: { orderId } }),
    context.db.requirement.count({ where: { orderId } }),
  ]);
  const expected = { orders: 1, lines: 1 + line.options.length, needs: line.requirements.length };
  const actual = { orders, lines, needs };
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`made ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
  return failures;
}

export type CheckDemoIntakeCreateInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0081 decision 9 and 11: `order.create` makes an order with a dinner line, its split
 * options and a need in one command, and the same `intakeKey` again returns that order. Runs in
 * a transaction that is rolled back, so the demo data is unchanged. Returns failure messages.
 */
export async function checkDemoIntakeCreate({ context, org }: CheckDemoIntakeCreateInput) {
  try {
    await context.db.$transaction(async (tx) => {
      const nested = { ...context, db: tx, recordChange: () => undefined };
      throw new CheckDone({ failures: await exercise({ context: nested }) });
    });
  } catch (error) {
    if (!(error instanceof CheckDone)) throw error;
    return error.failures.map((failure) => `${org.slug}: intake create ${failure}`);
  }
  return [`${org.slug}: intake create check did not roll back`];
}
