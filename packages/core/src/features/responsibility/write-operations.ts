import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkResponsibilityContents } from "./check-contents";
import { insertResponsibility } from "./insert-responsibility";
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
  permission: "responsibility:create",
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
  permission: "responsibility:edit",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await context.db.responsibility.findFirst({ where: { id } });
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
    const row = await context.db.responsibility.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...contents.value },
    });
    context.recordChange({
      entityId: id,
      before: ResponsibilitySchema.parse(before),
      after: ResponsibilitySchema.parse(row),
    });
    return ok({ value: row });
  },
});

export const archiveResponsibility = defineOperation({
  name: "responsibility.archive",
  kind: "command",
  description: "Archive a responsibility. Its name can then be reused.",
  input: ResponsibilityIdInputSchema,
  output: ResponsibilitySchema,
  permission: "responsibility:remove",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.responsibility.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Responsibility" });
    const row = await context.db.responsibility.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({
      entityId: id,
      before: ResponsibilitySchema.parse(before),
      after: ResponsibilitySchema.parse(row),
    });
    return ok({ value: row });
  },
});
