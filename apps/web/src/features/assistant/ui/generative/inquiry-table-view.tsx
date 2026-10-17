"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";
import { useInquiryViewColumns } from "./use-inquiry-view-columns";

export type InquiryTableViewProps = GenerativeProps<"inquiry-table">;

/** A page of inquiries; each row links to the inquiry page. */
export function InquiryTableView({ items, nextCursor }: InquiryTableViewProps) {
  const t = useTranslations("assistant.ui.inquiry");
  const columns = useInquiryViewColumns();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="inquiry-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="inquiry.assistant"
        columns={columns}
        data={items}
        getRowId={(inquiry) => inquiry.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
