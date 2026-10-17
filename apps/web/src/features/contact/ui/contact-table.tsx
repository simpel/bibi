"use client";

import type { ContactDto } from "@okazi/core";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { ContactRowActions } from "./contact-row-actions";
import { useContactColumns } from "./use-contact-columns";

export type ContactTableProps = { contacts: ContactDto[]; data: TypedFormData; canWrite: boolean };

/** Contact rows: name, type, email and phone, with edit and archive when allowed. */
export function ContactTable({ contacts, data, canWrite }: ContactTableProps) {
  const t = useTranslations("contact");
  const columns = useContactColumns<ContactDto>({
    types: data.types,
    ...(canWrite
      ? { renderActions: (contact) => <ContactRowActions contact={contact} data={data} /> }
      : {}),
  });
  return (
    <PersistedDataTable
      tableId="contact"
      columns={columns}
      data={contacts}
      getRowId={(contact) => contact.id}
      emptyText={t("empty")}
    />
  );
}
