import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { CheckSetupButton } from "./check-setup-button";

export type SetupChecksProps = {
  connection: IntegrationConnectionDto;
  name: string;
  /** When the last check ran, written on the server in the user's format. */
  checkedOn: string | null;
  canEdit: boolean;
};

/**
 * What the last check found at a connected accounting system (ADR 0108): the accounts and codings
 * Bibi books to that it lacks, or that all is in place, with a way to check again and to change
 * the accounts in Bibi (Administration → Accounting).
 */
export async function SetupChecks({ connection, name, checkedOn, canEdit }: SetupChecksProps) {
  const t = await getTranslations("integration.setup");
  const { setupCheckedAt, setupIssues, provider } = connection;
  const messages = { pending: t("checking", { name }), success: t("checkedToast", { name }) };
  return (
    <div className="grid gap-2 border-t pt-3">
      <p className="font-medium text-foreground">{t("heading")}</p>
      {setupCheckedAt === null ? (
        <p>{t("never", { name })}</p>
      ) : setupIssues.length === 0 ? (
        <p>{t("ok", { name })}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-foreground">
          {setupIssues.map((issue) => (
            <li key={`${issue.code}:${issue.account}:${issue.vatPercent}`}>
              {t(`issues.${issue.code}`, {
                name,
                account: issue.account ?? "",
                vat: issue.vatPercent ?? "",
              })}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {canEdit ? (
          <CheckSetupButton
            provider={provider}
            label={setupCheckedAt === null ? t("check") : t("recheck")}
            messages={messages}
          />
        ) : null}
        {setupIssues.length > 0 ? (
          <Link href={ROUTES.adminAccounting} className="text-sm underline underline-offset-4">
            {t("changeInBibi")}
          </Link>
        ) : null}
        {checkedOn ? <span className="text-xs">{t("checked", { date: checkedOn })}</span> : null}
      </div>
    </div>
  );
}
