import { PERMISSION_ACTIONS, type PermissionAction } from "@okazi/core/schemas";
import type { ColumnDef } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { type GridRow, isOn } from "../permission-grid";
import { HintTooltip } from "./hint-tooltip";
import { type CellChange, PermissionCell } from "./permission-cell";

export type UsePermissionColumnsInput = {
  granted: readonly string[];
  pending: boolean;
  savingKey: string | null;
  onChange: (input: CellChange) => void;
};

type ActionColumnInput = UsePermissionColumnsInput & {
  action: PermissionAction;
  header: string;
};

/** One action's column; it sorts by on, off and not available. */
function actionColumn({
  action,
  header,
  granted,
  pending,
  savingKey,
  onChange,
}: ActionColumnInput): ColumnDef<GridRow> {
  return {
    id: action,
    header,
    accessorFn: (row) =>
      row.actions.includes(action) ? Number(isOn({ granted, feature: row.feature, action })) : -1,
    cell: ({ row }) => (
      <PermissionCell
        row={row.original}
        action={action}
        granted={granted}
        pending={pending}
        savingKey={savingKey}
        onChange={onChange}
      />
    ),
  };
}

/** Feature · group · one column per action. */
export function usePermissionColumns({
  granted,
  pending,
  savingKey,
  onChange,
}: UsePermissionColumnsInput): ColumnDef<GridRow>[] {
  const t = useTranslations("permissions");
  return useMemo<ColumnDef<GridRow>[]>(
    () => [
      {
        id: "feature",
        header: t("columns.feature"),
        accessorFn: (row) => t(`features.${row.feature}`),
        cell: ({ row }) => (
          <HintTooltip hint={t(`featureDescriptions.${row.original.feature}`)}>
            <button
              type="button"
              className="cursor-help rounded-sm text-left font-medium underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(`features.${row.original.feature}`)}
            </button>
          </HintTooltip>
        ),
      },
      { id: "group", header: t("columns.group"), accessorFn: (row) => t(`groups.${row.group}`) },
      ...PERMISSION_ACTIONS.map((action) =>
        actionColumn({
          action,
          header: t(`actions.${action}`),
          granted,
          pending,
          savingKey,
          onChange,
        }),
      ),
    ],
    [t, granted, pending, savingKey, onChange],
  );
}
