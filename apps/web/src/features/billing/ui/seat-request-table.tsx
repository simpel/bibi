"use client";

import type { SeatRequestDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { SeatRequestActions } from "./seat-request-actions";
import { useSeatRequestColumns } from "./use-seat-request-columns";

export type SeatRequestTableProps = {
  requests: SeatRequestDto[];
  seatPrice: string;
  canEdit: boolean;
};

/** Invitations held for a seat (ADR 0095 §6); admins approve or decline each. */
export function SeatRequestTable({ requests, seatPrice, canEdit }: SeatRequestTableProps) {
  const t = useTranslations("billing.requests");
  const columns = useSeatRequestColumns({
    ...(canEdit
      ? {
          renderActions: (request) => (
            <SeatRequestActions request={request} seatPrice={seatPrice} />
          ),
        }
      : {}),
  });
  return (
    <PersistedDataTable
      tableId="billing.seat-requests"
      columns={columns}
      data={requests}
      getRowId={(request) => request.id}
      emptyText={t("empty")}
      flush
    />
  );
}
