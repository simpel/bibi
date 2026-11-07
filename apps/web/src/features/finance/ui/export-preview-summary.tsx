import type { AccountingExportPreviewDto, ExportBlocker } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type ExportPreviewSummaryProps = {
  preview: AccountingExportPreviewDto;
  /** The date span, formatted by the caller; `null` when there are no vouchers. */
  span: string | null;
};

const BLOCKER_LINKS: Record<ExportBlocker["code"], string | null> = {
  ORG_NUMBER_MISSING: ROUTES.adminGeneral,
  VAT_ACCOUNT_MISSING: ROUTES.adminAccounting,
  NOTHING_TO_EXPORT: null,
};

const BLOCKER_FIX = {
  ORG_NUMBER_MISSING: "fixOrganization",
  VAT_ACCOUNT_MISSING: "fixAccounting",
} as const;

function Blocker({ blocker }: { blocker: ExportBlocker }) {
  const t = useTranslations("finance.export");
  const href = BLOCKER_LINKS[blocker.code];
  const fix = blocker.code === "NOTHING_TO_EXPORT" ? null : BLOCKER_FIX[blocker.code];
  return (
    <li className="text-sm">
      <span className="text-destructive">
        {t(`blockers.${blocker.code}`, { detail: blocker.detail ?? "" })}
      </span>
      {href && fix ? (
        <Link href={href} className="ml-2 font-medium hover:underline">
          {t(fix)}
        </Link>
      ) : null}
    </li>
  );
}

/** What an export of the range holds per kind and over which dates, and what stops it. */
export function ExportPreviewSummary({ preview, span }: ExportPreviewSummaryProps) {
  const t = useTranslations("finance.export");
  const nothing = preview.blockers.every(({ code }) => code === "NOTHING_TO_EXPORT");
  return (
    <div data-slot="export-preview" className="grid gap-3">
      {preview.voucherCount > 0 ? (
        <>
          <p className="text-sm font-medium">{t("vouchers", { count: preview.voucherCount })}</p>
          <ul className="grid gap-1 text-sm">
            {preview.counts.map(({ kind, count }) => (
              <li key={kind} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{t(`kinds.${kind}`)}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
          {span ? <p className="text-xs text-muted-foreground">{span}</p> : null}
          {preview.earlierExports > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("earlierExports", { count: preview.earlierExports })}
            </p>
          ) : null}
        </>
      ) : null}
      {preview.blockers.length > 0 && !(nothing && preview.voucherCount > 0) ? (
        <ul className="grid gap-1">
          {preview.blockers.map((blocker) => (
            <Blocker key={blocker.code} blocker={blocker} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
