import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { insertSetup } from "./insert-setup";
import {
  SetupCreateInputSchema,
  SetupIdInputSchema,
  SetupListInputSchema,
  SetupListOutputSchema,
  SetupSchema,
  SetupUpdateInputSchema,
} from "./schema";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.setup.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A setup named "${name}" exists` });

export const listSetups = defineOperation({
  name: "setup.list",
  kind: "query",
  description:
    "List the organization's setups (e.g. Bio, U-bord, Mingel) with changeover time. " +
    "Items with the SETUPS behaviour have a capacity per setup.",
  input: SetupListInputSchema,
  output: SetupListOutputSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.setup.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getSetup = defineOperation({
  name: "setup.get",
  kind: "query",
  description: "Get one setup by id.",
  input: SetupIdInputSchema,
  output: SetupSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const setup = await context.db.setup.findFirst({ where: { id: input.id } });
    return setup ? ok({ value: setup }) : notFound({ entity: "Setup" });
  },
});

export const createSetup = defineOperation({
  name: "setup.create",
  kind: "command",
  description: "Create a setup. Setup names are unique.",
  input: SetupCreateInputSchema,
  output: SetupSchema,
  permission: "configuration:write",
  handler: ({ input, context }) => insertSetup({ context, ...input }),
});

export const updateSetup = defineOperation({
  name: "setup.update",
  kind: "command",
  description: "Rename a setup or change its changeover time. Omitted fields are unchanged.",
  input: SetupUpdateInputSchema,
  output: SetupSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, ...data }, context }) => {
    const before = await context.db.setup.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Setup" });
    if (data.name && (await nameTaken({ context, name: data.name, id }))) {
      return taken({ name: data.name });
    }
    const setup = await context.db.setup.update({ where: { id }, data });
    context.recordChange({ entityId: id, before, after: setup });
    return ok({ value: setup });
  },
});

export const archiveSetup = defineOperation({
  name: "setup.archive",
  kind: "command",
  description:
    "Archive a setup. Refused while an active item has a capacity for it or an active program item uses it.",
  input: SetupIdInputSchema,
  output: SetupSchema,
  permission: "configuration:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await context.db.setup.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Setup" });
    const used = await context.db.itemSetup.count({
      where: { setupId: id, item: { status: "ACTIVE" } },
    });
    if (used > 0) return conflict({ message: `${used} items have a capacity for this setup` });
    const scheduled = await context.db.programItem.count({ where: { setupId: id } });
    if (scheduled > 0) {
      return conflict({ message: `${scheduled} active program items use this setup` });
    }
    const setup = await context.db.setup.update({ where: { id }, data: { status: "ARCHIVED" } });
    context.recordChange({ entityId: id, before, after: setup });
    return ok({ value: setup });
  },
});

export const setupOperations = [listSetups, getSetup, createSetup, updateSetup, archiveSetup];
