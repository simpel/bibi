import { type OrderStatusDto, TRANSITION_GATES } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { gateChoice } from "./flow-gates-form-schema";
import type { StatusRow } from "./status-rows";

export type StatusFlowQualifiersInput = { statuses: readonly OrderStatusDto[] };

/** `moves:` (any status, none, or a target) and `requires:` (the gates on moves into it). */
export function useStatusFlowQualifiers({
  statuses,
}: StatusFlowQualifiersInput): TableQualifier<StatusRow>[] {
  const t = useTranslations("orderStatus");
  return useMemo(() => {
    const gates = TRANSITION_GATES.map((gate) => t(`flow.gateNames.${gate}`));
    const moves = [t("anyStatus"), t("noTransitions"), ...statuses.map((s) => s.name)];
    return [
      {
        key: "moves",
        label: t("columns.transitions"),
        hint: moves.slice(0, 3).join(", "),
        pick: (row) => {
          if (row.closes) return t("noTransitions");
          return row.restrictsNext ? row.targets : t("anyStatus");
        },
        options: moves,
      },
      {
        key: "requires",
        label: t("flow.columns.gates"),
        hint: gates.join(", "),
        pick: (row) =>
          TRANSITION_GATES.filter(
            (gate) => gateChoice({ gatesInto: row.orderStatus.gatesInto, gate }).on,
          ).map((gate) => t(`flow.gateNames.${gate}`)),
        options: gates,
      },
    ];
  }, [t, statuses]);
}
