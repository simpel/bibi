import { archiveContact } from "../../features/contact/write-operations";
import { recordsMatching } from "../../features/field-definition/field-usage";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoLinksInput = {
  context: ExecuteContext;
  org: DemoOrg;
  /** `--skip-pipeline`: no tickets, so no ticket links. */
  skipPipeline: boolean;
};

/** How many LINK values the data files give the tickets (one row each). */
function expectedLinks({ org, skipPipeline }: Omit<CheckDemoLinksInput, "context">) {
  if (skipPipeline) return 0;
  const linkFields = new Map(
    org.config.types.map((type) => [
      type.name,
      new Set((type.fields ?? []).filter((f) => f.kind === "LINK").map((f) => f.name)),
    ]),
  );
  return org.tickets
    .flatMap((ticket) => Object.keys(ticket.fields ?? {}).map((name) => ({ ticket, name })))
    .filter(({ ticket, name }) => linkFields.get(ticket.type)?.has(name)).length;
}

/** No LINK field has a key in `Record.fields`: link ids live only in `RecordLink` (ADR 0056). */
async function linkKeysInJson({ context }: Pick<CheckDemoLinksInput, "context">) {
  const fields = await context.db.fieldDefinition.findMany({ where: { kind: "LINK" } });
  let total = 0;
  for (const { entityTypeId, key } of fields) {
    const match = { kind: "has" as const, key };
    total += (await recordsMatching({ context, entityTypeId, match })).total;
  }
  return total;
}

/** Archiving a linked contact is refused with CONFLICT and leaves it active. */
async function archiveOfLinkedRefused({ context, org }: Omit<CheckDemoLinksInput, "skipPipeline">) {
  const link = await context.db.recordLink.findFirst({ where: { target: { base: "CONTACT" } } });
  if (!link) return [];
  const input = { id: link.targetRecordId };
  const result = await execute({ operation: archiveContact, input, context });
  const still = await context.db.contact.count({ where: { id: link.targetRecordId } });
  return !result.ok && result.error.code === "CONFLICT" && still === 1
    ? []
    : [`${org.slug}: archiving a linked contact was not refused`];
}

/**
 * ADR 0056: the tickets' LINK values are `RecordLink` rows (as many as the data files give), each
 * pointing at an active record, none stored in `fields` JSON, and a linked record cannot be
 * archived.
 */
export async function checkDemoLinks({
  context,
  org,
  skipPipeline,
}: CheckDemoLinksInput): Promise<string[]> {
  const failures: string[] = [];
  const links = await context.db.recordLink.count();
  const expected = expectedLinks({ org, skipPipeline });
  if (links !== expected) failures.push(`${org.slug}: ${links} links, expected ${expected}`);
  const dangling = await context.db.recordLink.count({
    where: { target: { status: { not: "ACTIVE" } } },
  });
  if (dangling > 0) failures.push(`${org.slug}: ${dangling} links to inactive records`);
  const inJson = await linkKeysInJson({ context });
  if (inJson > 0) failures.push(`${org.slug}: ${inJson} records store a link id in fields`);
  return [...failures, ...(await archiveOfLinkedRefused({ context, org }))];
}
