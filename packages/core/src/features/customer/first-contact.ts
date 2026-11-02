import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { insertContact } from "../contact/insert-contact";
import type { ContactDto } from "../contact/schema";
import type { CustomerFirstContactInput } from "./schema";

type Ctx = { context: OperationContext };

/** The given contact type, else the organization's only active one (`VALIDATION` otherwise). */
async function contactTypeId({
  context,
  entityTypeId,
}: Ctx & { entityTypeId: string | undefined }): Promise<Result<string>> {
  if (entityTypeId) return ok({ value: entityTypeId });
  const types = await context.db.entityType.findMany({
    where: { base: "CONTACT" },
    select: { id: true },
    take: 2,
  });
  const only = types.length === 1 ? types[0] : undefined;
  if (only) return ok({ value: only.id });
  const message = types.length === 0 ? "No contact type" : "Choose a contact type";
  return invalid({ message, issues: [{ path: "entityTypeId", message }] });
}

/** Issue paths of the nested input start with `contact.`. */
function underContact<T>({ result }: { result: Result<T> }): Result<T> {
  if (result.ok || result.error.issues.length === 0) return result;
  const { code, message, issues } = result.error;
  const nested = issues.map((issue) => ({ ...issue, path: `contact.${issue.path}` }));
  return err({ error: new AppError({ code, message, issues: nested }) });
}

export type CreateFirstContactInput = Ctx & {
  customerId: string;
  contact: CustomerFirstContactInput;
};

/**
 * The first contact person of a customer created in the same command (ADR 0081), through the
 * same insert as `contact.create`, with its own audit row. A failure rolls the customer back.
 */
export async function createFirstContact({
  context,
  customerId,
  contact: { entityTypeId, ...contact },
}: CreateFirstContactInput): Promise<Result<ContactDto>> {
  const type = underContact({ result: await contactTypeId({ context, entityTypeId }) });
  if (!type.ok) return type;
  const input = { ...contact, entityTypeId: type.value };
  const created = underContact({
    result: await insertContact({ context, customerId, contact: input }),
  });
  if (!created.ok) return created;
  context.recordChange({ entityType: "contact", entityId: created.value.id, after: created.value });
  return created;
}
