import type { Contact } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { recordFields, WITH_RECORD_LINKS, type WithRecordLinks } from "../../records/record-links";
import type { ContactDto } from "./schema";

export type ContactRow = Contact & WithRecordLinks;

export type ToContactDtoInput = { row: ContactRow };

export const toContactDto = ({ row }: ToContactDtoInput): ContactDto => {
  const { record: _record, ...contact } = row;
  return { ...contact, fields: recordFields({ row }) };
};

/** Prisma `include` for every contact read (`toContactDto`): its `LINK` values. */
export const CONTACT_INCLUDE = WITH_RECORD_LINKS;

export type LoadContactInput = { context: Pick<OperationContext, "db">; id: string };

/** The active contact, or null when missing, archived or in another organization. */
export async function loadContact({ context, id }: LoadContactInput): Promise<ContactDto | null> {
  const row = await context.db.contact.findFirst({
    where: { id },
    include: CONTACT_INCLUDE,
  });
  return row ? toContactDto({ row }) : null;
}
