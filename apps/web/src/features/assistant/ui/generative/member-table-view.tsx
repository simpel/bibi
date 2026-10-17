"use client";

import { Card } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { useMemberColumns } from "@/features/member/ui/use-member-columns";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type MemberTableViewProps = GenerativeProps<"member-table">;

/** A page of staff members with their roles. */
export function MemberTableView({ items, nextCursor }: MemberTableViewProps) {
  const t = useTranslations("member");
  const columns = useMemberColumns<(typeof items)[number]>({ linkNames: true });
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  return (
    <Card data-slot="member-table" className="overflow-hidden shadow-none">
      <PersistedDataTable
        tableId="member"
        columns={columns}
        data={items}
        getRowId={(member) => member.id}
        emptyText={t("empty")}
      />
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
