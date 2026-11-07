"use client";

import type { SeatRequestDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PersistedDataTable } from "@/components/data-table/persisted-data-table";
import { TableFilterBar } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { useClientTableView } from "@/components/data-table/use-client-table-view";
import {
  type SeatDecision,
  SeatDecisionDialog,
  SeatRequestActions,
  SeatRequestRowMenu,
} from "./seat-request-actions";
import { useSeatRequestColumns } from "./use-seat-request-columns";

export type SeatRequestTableProps = {
  requests: SeatRequestDto[];
  seatPrice: string;
  canEdit: boolean;
};

const ROLES = ["admin", "manager", "member"] as const;

function useSeatRequestQualifiers({
  requests,
}: {
  requests: SeatRequestDto[];
}): TableQualifier<SeatRequestDto>[] {
  const t = useTranslations("billing.requests.columns");
  const roles = useTranslations("role");
  return useMemo(
    () => [
      {
        key: "role",
        label: t("role"),
        hint: ROLES.map((r) => roles(r)).join(", "),
        pick: (r) => (r.role ? roles(r.role) : undefined),
        options: ROLES.map((r) => roles(r)),
      },
      {
        key: "email",
        label: t("email"),
        hint: t("email"),
        pick: (r) => r.email,
        options: requests.map((r) => r.email),
      },
    ],
    [t, roles, requests],
  );
}

/** Invitations held for a seat (ADR 0095 §6); admins approve or decline each. */
export function SeatRequestTable({ requests, seatPrice, canEdit }: SeatRequestTableProps) {
  const t = useTranslations("billing.requests");
  const roles = useTranslations("role");
  const [decision, setDecision] = useState<SeatDecision | null>(null);
  const qualifiers = useSeatRequestQualifiers({ requests });
  const view = useClientTableView({
    rows: requests,
    qualifiers,
    getSearchText: (r) => `${r.email} ${r.role ? roles(r.role) : ""}`,
    totalLabel: (count) => `${count}`,
  });
  const columns = useSeatRequestColumns({
    ...(canEdit
      ? {
          renderActions: (request) => (
            <SeatRequestActions request={request} onDecide={setDecision} />
          ),
        }
      : {}),
  });
  return (
    <div className="grid gap-4">
      <TableFilterBar q={view.q} query={view.query} />
      <PersistedDataTable
        tableId="billing.seat-requests"
        columns={columns}
        data={view.rows}
        getRowId={(request) => request.id}
        {...(canEdit
          ? {
              rowMenu: (request: SeatRequestDto) => (
                <SeatRequestRowMenu request={request} onDecide={setDecision} />
              ),
            }
          : {})}
        emptyText={t("empty")}
        pagination={view.pagination}
      />
      {decision ? (
        <SeatDecisionDialog
          decision={decision}
          seatPrice={seatPrice}
          onClose={() => setDecision(null)}
        />
      ) : null}
    </div>
  );
}
