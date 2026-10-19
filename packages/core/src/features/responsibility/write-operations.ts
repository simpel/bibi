import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkNotOnSheets } from "../sheet-definition/usage";
import { checkResponsibilityContents } from "./check-contents";
import { insertResponsibility } from "./insert-responsibility";
import { findResponsibility, replaceResponsibilityLinks } from "./responsibility-rows";
import {
  ResponsibilityCreateInputSchema,
  ResponsibilityIdInputSchema,
  ResponsibilitySchema,
  ResponsibilityUpdateInputSchema,
} from "./schema";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.responsibility.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A responsibility named "${name}" exists` });

export const createResponsibility = defineOperation({
  name: "responsibility.create",
  kind: "command",
  description:
    "Define a responsibility, e.g. Head of kitchen: the item types it covers, its default " +
    "assignee and optional default followers. Names are unique. Every covered id must be an " +
    "active item type and the people must be members (else VALIDATION).",
  input: ResponsibilityCreateInputSchema,
  output: ResponsibilitySchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertResponsibility({ context, ...input }),
});

/** Drops keys whose value is `undefined`, so a spread keeps the stored value. */
function definedOnly<T extends object>({ changes }: { changes: T }): Partial<T> {
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export const updateResponsibility = defineOperation({
  name: "responsibility.update",
  kind: "command",
  description:
    "Rename a responsibility or replace its covered item types, default assignee or default " +
    "followers. Omitted fields are unchanged.",
  input: ResponsibilityUpdateInputSchema,
  output: ResponsibilitySchema,
  permission: "configuration:write",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await findResponsibility({ context, id });
    if (!before) return notFound({ entity: "Responsibility" });
    if (name && (await nameTaken({ context, name, id }))) return taken({ name });
    const { entityTypeIds, defaultAssigneeId, defaultFollowerIds } = {
      ...before,
      ...definedOnly({ changes }),
    };
    const contents = await checkResponsibilityContents({
      context,
      contents: { entityTypeIds, defaultAssigneeId, defaultFollowerIds },
    });
    if (!contents.ok) return contents;
    await context.db.responsibility.update({
      where: { id },
      data: { ...(name ? { name } : {}), defaultAssigneeId: contents.value.defaultAssigneeId },
    });
    await replaceResponsibilityLinks({ context, responsibilityId: id, contents: contents.value });
    const after = await findResponsibility({ context, id });
    if (!after) return notFound({ entity: "Responsibility" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveResponsibility = defineOperation({
  name: "responsibility.archive",
  kind: "command",
  description:
    "Archive a responsibility. Its name can then be reused. Refused (CONFLICT) while an active " +
    "sheet definition goes to it.",
  input: ResponsibilityIdInputSchema,
  output: ResponsibilitySchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await findResponsibility({ context, id });
    if (!before) return notFound({ entity: "Responsibility" });
    const reference = { responsibilityId: id };
    const unused = await checkNotOnSheets({ context, reference, what: before.name });
    if (!unused.ok) return unused;
    const row = await context.db.responsibility.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = { ...before, ...row };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
