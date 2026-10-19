import type { OperationContext } from "../../operations/types";
import { createRecord } from "../../records/create-record";
import { updateRecord } from "../../records/update-record";
import { toJson } from "../../shared/to-json";
import type { CheckedFields } from "../field-definition/split-links";
import type { TicketTemplateCreateInput, TicketTemplateUpdateInput } from "./schema";

type Details = Omit<TicketTemplateCreateInput, "lines" | "fields">;

export type InsertTemplateRowInput = {
  context: OperationContext;
  data: Details;
  fields: CheckedFields;
};

/** Creates a predefined ticket's row and its `Record` row (ADR 0056). */
export const insertTemplateRow = ({ context, data, fields }: InsertTemplateRowInput) =>
  createRecord({
    context,
    base: "TICKET_TEMPLATE",
    entityTypeId: data.entityTypeId,
    ...fields,
    insert: ({ id }) =>
      context.db.ticketTemplate.create({
        data: {
          ...{ id, ...data, fields: toJson({ value: fields.fields }) ?? {} },
          organizationId: context.organizationId,
        },
      }),
  });

export type UpdateTemplateRowInput = {
  context: OperationContext;
  id: string;
  data: Omit<TicketTemplateUpdateInput, "id" | "lines" | "fields">;
  /** The checked field values; undefined = unchanged. */
  fields: CheckedFields | undefined;
};

/** Updates a predefined ticket's row and mirrors its type and fields on its `Record` row. */
export async function updateTemplateRow({ context, id, data, fields }: UpdateTemplateRowInput) {
  const json = fields === undefined ? undefined : toJson({ value: fields.fields });
  await context.db.ticketTemplate.update({
    where: { id },
    data: { ...data, ...(json ? { fields: json } : {}) },
  });
  await updateRecord({
    context,
    id,
    change: { entityTypeId: data.entityTypeId, fields: json, links: fields?.links },
  });
}
