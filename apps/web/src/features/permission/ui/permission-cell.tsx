import type { Feature, PermissionAction } from "@bibi/core/schemas";
import { ALWAYS_VISIBLE_FEATURES, isLocked } from "@bibi/core/schemas";
import { Checkbox } from "@bibi/ui";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cellKey, type GridRow, isOn } from "../permission-grid";
import { HintTooltip } from "./hint-tooltip";

export type CellChange = { feature: Feature; action: PermissionAction; on: boolean };

export type PermissionCellProps = {
  row: GridRow;
  action: PermissionAction;
  granted: readonly string[];
  pending: boolean;
  savingKey: string | null;
  onChange: (input: CellChange) => void;
};

/** The feature has no such action. */
function NotAvailable() {
  return (
    <span aria-hidden="true" className="text-muted-foreground">
      –
    </span>
  );
}

/** One feature × action cell: an auto-saving checkbox, a spinner while it saves, or a locked box. */
export function PermissionCell(props: PermissionCellProps) {
  const { row, action, granted, pending, savingKey, onChange } = props;
  const t = useTranslations("permissions");
  const { feature } = row;
  if (!row.actions.includes(action)) return <NotAvailable />;
  const locked = isLocked({ feature, action });
  const label = `${t(`features.${feature}`)}: ${t(`actions.${action}`)}`;
  const lockedHint =
    action === "read" && ALWAYS_VISIBLE_FEATURES.includes(feature)
      ? t("alwaysVisible")
      : t("lockedHint");
  const checkbox = (
    <Checkbox
      checked={isOn({ granted, feature, action })}
      disabled={locked || pending}
      aria-label={locked ? `${label}. ${lockedHint}` : label}
      aria-busy={savingKey === cellKey({ feature, action })}
      onCheckedChange={(checked) => onChange({ feature, action, on: checked === true })}
    />
  );
  return (
    <div className="flex items-center gap-2">
      {locked ? (
        <HintTooltip hint={lockedHint}>
          <span className="inline-flex">{checkbox}</span>
        </HintTooltip>
      ) : (
        checkbox
      )}
      {savingKey === cellKey({ feature, action }) ? (
        <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
      ) : null}
    </div>
  );
}
