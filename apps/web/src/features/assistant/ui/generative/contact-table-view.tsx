"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useContactColumns } from "@/features/contact/ui/use-contact-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type ContactTableViewProps = GenerativeProps<"contact-table">;

/** A page of contact persons; each name links to the customer's page, where they are edited. */
export function ContactTableView({ items, nextCursor }: ContactTableViewProps) {
  const t = useTranslations("assistant.ui.contact");
  const columns = useContactColumns<(typeof items)[number]>({ linkNames: true });
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="contact-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="contact"
        columns={columns}
        data={items}
        getRowId={(contact) => contact.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
