import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";

export type AccountingFormFooterProps = { canEdit: boolean; pending: boolean };

/** The save button, or a note that the settings are read-only without `finance:write`. */
export function AccountingFormFooter({ canEdit, pending }: AccountingFormFooterProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  if (!canEdit) return <p className="text-sm text-muted-foreground">{t("readOnly")}</p>;
  return (
    <div>
      <Button type="submit" disabled={pending}>
        {common("save")}
      </Button>
    </div>
  );
}
