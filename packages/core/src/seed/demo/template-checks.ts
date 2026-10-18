import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoTemplatesInput = { context: ExecuteContext; org: DemoOrg };

type TicketInput = CheckDemoTemplatesInput & { ticket: DemoOrg["tickets"][number] };

/**
 * A ticket made from a predefined ticket (ADR 0043): it has one line per template line, each in
 * the state the phase grid gives its item type for the template's phase (ADR 0044).
 */
async function ticketFailures({ context, org, ticket }: TicketInput): Promise<string[]> {
  const template = org.templates.find((candidate) => candidate.name === ticket.template);
  if (!template) return [`${ticket.ref}: unknown template ${ticket.template}`];
  const lines = await context.db.programItem.findMany({
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
      : [`${ticket.ref}: ${lines.length} lines, expected ${template.lines.length}`];
  for (const line of lines) {
    const type = line.item?.entityType.name;
    const cell = org.pipeline.cells.find(
      (row) => row.phase === template.phase && row.type === type,
    );
    if (cell && line.state?.name !== cell.state) {
      failures.push(`${ticket.ref}: ${line.name} is ${line.state?.name}, expected ${cell.state}`);
    }
  }
  return failures;
}

/**
 * ADR 0043 (predefined tickets): the template count and each template's lines against the data
 * files, and that every ticket made from one has its lines in the states of the template's phase.
 * Returns failure messages.
 */
export async function checkDemoTemplates({
  context,
  org,
}: CheckDemoTemplatesInput): Promise<string[]> {
  const failures: string[] = [];
  const rows = await context.db.ticketTemplate.findMany({ include: { lines: true } });
  if (rows.length !== org.templates.length) {
    failures.push(`${rows.length} predefined tickets, expected ${org.templates.length}`);
  }
  for (const template of org.templates) {
    const found = rows.find((row) => row.name === template.name);
    if (found?.lines.length !== template.lines.length) {
      failures.push(
        `${template.name}: ${found?.lines.length ?? 0} lines, expected ${template.lines.length}`,
      );
    }
  }
  for (const ticket of org.tickets.filter((row) => row.template)) {
    failures.push(...(await ticketFailures({ context, org, ticket })));
  }
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
