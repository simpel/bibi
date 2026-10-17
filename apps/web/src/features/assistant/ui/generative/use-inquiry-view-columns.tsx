import { Link } from "@okazi/i18n/navigation";
import type { ColumnDef } from "@okazi/ui";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import { desiredPeriod } from "@/features/inquiry/ui/desired-period";
import { InquiryStatusBadge } from "@/features/inquiry/ui/inquiry-status-badge";
import { inquiryRoute } from "@/lib/routes";
import type { InquiryTableViewProps } from "./inquiry-table-view";

type Row = InquiryTableViewProps["items"][number];

/** Registered date (link), status, desired dates and quantity of the inquiries in the chat card. */
export function useInquiryViewColumns(): ColumnDef<Row>[] {
  const t = useTranslations("assistant.ui.inquiry");
  const statuses = useTranslations("inquiry.statuses");
  const format = useFormatter();
  return useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "created",
        header: t("columns.created"),
        accessorFn: (inquiry) => new Date(inquiry.createdAt),
        cell: ({ row: { original: inquiry } }) => (
          <Link href={inquiryRoute({ id: inquiry.id })} className="font-medium hover:underline">
            {format.dateTime(new Date(inquiry.createdAt), { dateStyle: "medium" })}
          </Link>
        ),
      },
      {
        id: "status",
        header: t("columns.status"),
        accessorFn: (inquiry) => statuses(inquiry.inquiryStatus),
        cell: ({ row }) => <InquiryStatusBadge status={row.original.inquiryStatus} />,
      },
      {
        id: "when",
        header: t("columns.when"),
        accessorFn: (inquiry) => {
          const start = inquiry.desiredStartsAt ?? inquiry.desiredEndsAt;
          return start ? new Date(start) : null;
        },
        cell: ({ row }) => desiredPeriod({ format, inquiry: row.original }),
      },
      { id: "quantity", header: t("columns.quantity"), accessorFn: (inquiry) => inquiry.quantity },
    ],
    [t, statuses, format],
  );
}
