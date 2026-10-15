import type { ContactDto } from "@okazi/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ContactRowActions } from "./contact-row-actions";

export type ContactTableProps = { contacts: ContactDto[]; data: TypedFormData; canWrite: boolean };

/** Contact rows: name, type, email and phone, with edit and archive when allowed. */
export async function ContactTable({ contacts, data, canWrite }: ContactTableProps) {
  const t = await getTranslations("contact");
  const common = await getTranslations("common");
  const typeName = ({ id }: { id: string }) => data.types.find((type) => type.id === id)?.name;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("columns.name")}</TableHead>
          <TableHead>{t("columns.type")}</TableHead>
          <TableHead>{t("columns.email")}</TableHead>
          <TableHead>{t("columns.phone")}</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">{common("actions")}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell>{typeName({ id: contact.entityTypeId }) ?? "–"}</TableCell>
            <TableCell>{contact.email ?? "–"}</TableCell>
            <TableCell>{contact.phone ?? "–"}</TableCell>
            <TableCell>
              {canWrite ? <ContactRowActions contact={contact} data={data} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
