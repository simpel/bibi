import type { Contact } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { ContactDto } from "./schema";

export type ToContactDtoInput = { row: Contact };

export const toContactDto = ({ row }: ToContactDtoInput): ContactDto => ({
  ...row,
  fields: asFieldValues({ value: row.fields }),
});

export type LoadContactInput = { context: Pick<OperationContext, "db">; id: string };

/** The active contact, or null when missing, archived or in another organization. */
export async function loadContact({ context, id }: LoadContactInput): Promise<ContactDto | null> {
  const row = await context.db.contact.findFirst({ where: { id } });
  return row ? toContactDto({ row }) : null;
}
