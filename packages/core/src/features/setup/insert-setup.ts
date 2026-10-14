import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { SetupCreateInput, SetupDto } from "./schema";

export type InsertSetupInput = { context: OperationContext } & SetupCreateInput;

/** Shared by `setup.create` and `configuration.importTemplate`: unique name, insert, record. */
export async function insertSetup({
  context,
  ...input
}: InsertSetupInput): Promise<Result<SetupDto>> {
  if (await context.db.setup.findFirst({ where: { name: input.name } })) {
    return conflict({ message: `A setup named "${input.name}" exists` });
  }
  const setup = await context.db.setup.create({
    data: { ...input, organizationId: context.organizationId, createdBy: context.actor.userId },
  });
  context.recordChange({ entityId: setup.id, after: setup });
  return ok({ value: setup });
}
