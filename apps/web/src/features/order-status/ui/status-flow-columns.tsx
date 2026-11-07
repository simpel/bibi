import { type OrderStatusDto, TRANSITION_GATES } from "@bibi/core/schemas";
import {
  actionsColumn,
  ColorSwatch,
  type ColumnDef,
  createTableColumns,
  DataTableRowActions,
} from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Link, useRouter } from "@/lib/navigation";
import { gateChoice } from "./flow-gates-form-schema";
import { orderStatusEditHref } from "./order-status-row-actions";
import type { StatusRow } from "./status-rows";
import { movesText } from "./use-status-columns";

type Column = ColumnDef<StatusRow>;
type Translate = ReturnType<typeof useTranslations<"orderStatus">>;

export type GatesTextInput = {
  orderStatus: OrderStatusDto;
  statuses: readonly OrderStatusDto[];
  t: Translate;
};

/** The requirements on moves into a status ("Reason, Assignee (from New)"), "None" without. */
export function gatesText({ orderStatus, statuses, t }: GatesTextInput): string {
  const parts = TRANSITION_GATES.flatMap((gate) => {
    const choice = gateChoice({ gatesInto: orderStatus.gatesInto, gate });
    if (!choice.on) return [];
    const label = t(`flow.gateNames.${gate}`);
    if (choice.scope === "ANY") return [label];
    const from = choice.fromStatusIds.map((id) => statuses.find((s) => s.id === id)?.name ?? id);
    return [`${label} (${from.join(", ")})`];
  });
  return parts.join(", ") || t("noTransitions");
}

export type StatusFlowColumnsInput = { statuses: readonly OrderStatusDto[] };

/** Status (opens its rules) · where its orders may move · what moves into it need · Edit rules. */
export function useStatusFlowColumns({ statuses }: StatusFlowColumnsInput): Column[] {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const router = useRouter();
  return useMemo<Column[]>(
    () =>
      createTableColumns<StatusRow>({
        primary: [
          {
            id: "name",
            header: t("columns.name"),
            accessorFn: (row) => row.orderStatus.name,
            cell: ({ row }) => (
              <Link
                href={orderStatusEditHref({ id: row.original.orderStatus.id })}
                className="inline-flex items-center gap-2 font-medium hover:underline"
              >
                <ColorSwatch color={row.original.orderStatus.color} />
                {row.original.orderStatus.name}
              </Link>
            ),
          },
        ],
        relations: [
          {
            id: "moves",
            header: t("columns.transitions"),
            accessorFn: (row) => movesText({ row, t }),
          },
          {
            id: "gates",
            header: t("flow.columns.gates"),
            accessorFn: (row) => gatesText({ orderStatus: row.orderStatus, statuses, t }),
          },
        ],
        actions: [
          actionsColumn<StatusRow>({
            label: common("actions"),
            cell: ({ orderStatus }) => (
              <DataTableRowActions
                label={common("actions")}
                primary={[
                  {
                    label: t("flow.editRules"),
                    icon: PencilIcon,
                    onClick: () => router.push(orderStatusEditHref({ id: orderStatus.id })),
                  },
                ]}
              />
            ),
          }),
        ],
      }),
    [t, common, statuses, router],
  );
}
