import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { toJson } from "../../shared/to-json";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import type { ContactCreateInput, ContactDto } from "./schema";
import { CONTACT_INCLUDE, toContactDto } from "./to-contact-dto";

export type InsertContactInput = {
  context: OperationContext;
  /** An active customer of the caller's organization, checked by the caller. */
  customerId: string;
  contact: Omit<ContactCreateInput, "customerId">;
};

/**
 * The one insert path for a contact person (`contact.create`, and the first contact of
 * `customer.create`, ADR 0081): checks the contact type and its own fields, then writes the
 * `Record` row and the contact. The caller records the change.
 */
export async function insertContact({
  context,
  customerId,
  contact: { entityTypeId, fields, ...data },
}: InsertContactInput): Promise<Result<ContactDto>> {
  const type = await loadTypeOfBase({ context, entityTypeId, base: "CONTACT" });
  if (!type.ok) return type;
  const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
  if (!checked.ok) return checked;
  const row = await createRecord({
    context,
    base: "CONTACT",
    entityTypeId,
    fields: checked.value.fields,
    links: checked.value.links,
    insert: ({ id }) =>
      context.db.contact.create({
        data: {
          id,
          ...data,
          entityTypeId,
          customerId,
          fields: toJson({ value: checked.value.fields }) ?? {},
          organizationId: context.organizationId,
        },
        include: CONTACT_INCLUDE,
      }),
  });
  return ok({ value: toContactDto({ row }) });
}
