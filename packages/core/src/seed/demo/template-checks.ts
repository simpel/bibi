import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoTemplatesInput = { context: ExecuteContext; org: DemoOrg };

type OrderInput = CheckDemoTemplatesInput & { order: DemoOrg["orders"][number] };

/**
 * An order made from a predefined order (ADR 0043): it has one line per template line, each in
 * the state the status grid gives its item type for the template's status (ADR 0044).
 */
async function orderFailures({ context, org, order }: OrderInput): Promise<string[]> {
  const template = org.templates.find((candidate) => candidate.name === order.template);
  if (!template) return [`${order.ref}: unknown template ${order.template}`];
  const lines = await context.db.line.findMany({
    where: { name: { in: template.lines.map((line) => line.name) } },
    select: {
      name: true,
      state: { select: { name: true } },
      item: { select: { entityType: { select: { name: true } } } },
    },
  });
  const failures =
    lines.length === template.lines.length
      ? []
      : [`${order.ref}: ${lines.length} lines, expected ${template.lines.length}`];
  for (const line of lines) {
    const type = line.item?.entityType.name;
    const cell = org.pipeline.cells.find(
      (row) => row.orderStatus === template.status && row.type === type,
    );
    if (cell && line.state?.name !== cell.state) {
      failures.push(`${order.ref}: ${line.name} is ${line.state?.name}, expected ${cell.state}`);
    }
  }
  return failures;
}

/**
 * ADR 0043 (predefined orders): the template count and each template's lines against the data
 * files, and that every order made from one has its lines in the states of the template's status.
 * Returns failure messages.
 */
export async function checkDemoTemplates({
  context,
  org,
}: CheckDemoTemplatesInput): Promise<string[]> {
  const failures: string[] = [];
  const rows = await context.db.orderTemplate.findMany({ include: { lines: true } });
  if (rows.length !== org.templates.length) {
    failures.push(`${rows.length} predefined orders, expected ${org.templates.length}`);
  }
  for (const template of org.templates) {
    const found = rows.find((row) => row.name === template.name);
    if (found?.lines.length !== template.lines.length) {
      failures.push(
        `${template.name}: ${found?.lines.length ?? 0} lines, expected ${template.lines.length}`,
      );
    }
  }
  for (const order of org.orders.filter((row) => row.template)) {
    failures.push(...(await orderFailures({ context, org, order })));
  }
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
