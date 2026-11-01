import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type FinanceSectionProps = {
  title: string;
  /** `null` = the caller may not read this part. */
  data: readonly unknown[] | null;
  /** Replaces the generic "nothing to show" line when `data` is empty. */
  emptyText?: string;
  children: ReactNode;
};

/** A titled card: its content, a "no data" line or a "no access" line (ADR 0071). */
export function FinanceSection({ title, data, emptyText, children }: FinanceSectionProps) {
  const t = useTranslations("finance");
  const note =
    data === null ? t("noAccess") : data.length === 0 ? (emptyText ?? t("noData")) : null;
  return (
    <Card data-slot="finance-section" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : children}
      </CardContent>
    </Card>
  );
}
