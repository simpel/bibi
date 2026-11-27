import { getAccountingSettings } from "@bibi/core";
import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { typeRows } from "@/features/finance/lib/account-rows";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";
import { CheckSetupButton } from "./check-setup-button";
import {
  type AccountCheck,
  type ProviderAccountRow,
  ProviderAccountsTable,
} from "./provider-accounts-table";

export type ProviderAccountsProps = {
  connection: IntegrationConnectionDto;
  /** The accounting system's name in the viewer's language. */
  name: string;
  /** When the last check ran, written on the server in the user's format. */
  checkedOn: string | null;
  canEdit: boolean;
};

type Issue = IntegrationConnectionDto["setupIssues"][number];

/**
 * The accounts Bibi books to, listed next to what the last check found at the accounting system
 * (ADR 0108): each row works, has a problem to fix there, or has not been checked. A finding
 * that is about a VAT rate, not an account, is listed under the table.
 */
export async function ProviderAccounts({
  connection,
  name,
  checkedOn,
  canEdit,
}: ProviderAccountsProps) {
  const [t, setup, settings, itemTypes] = await Promise.all([
    getTranslations("integration.accounts"),
    getTranslations("integration.setup"),
    runOperation({ operation: getAccountingSettings, input: {} }),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  const { setupCheckedAt, setupIssues, provider } = connection;
  const checked = setupCheckedAt !== null;
  const issueText = ({ issue }: { issue: Issue }) =>
    setup(`issues.${issue.code}`, {
      name,
      account: issue.account ?? "",
      vat: issue.vatPercent ?? "",
    });
  const rows: ProviderAccountRow[] =
    settings.ok && itemTypes.ok
      ? [
          {
            id: "advances",
            purpose: t("purpose.advances"),
            account: settings.value.advancesAccount,
          },
          { id: "revenue", purpose: t("purpose.revenue"), account: settings.value.revenueAccount },
          ...typeRows({
            settings: settings.value,
            types: itemTypes.value.items.map(({ id, name: typeName }) => ({ id, name: typeName })),
          }).map((row) => ({
            id: row.id,
            purpose: t("purpose.revenueType", {
              type:
                itemTypes.value.items.find(
                  (type) => row.target.kind === "type" && type.id === row.target.entityTypeId,
                )?.name ?? "",
            }),
            account: row.value,
          })),
        ].map((row) => {
          const found = setupIssues.filter((issue) => issue.account === row.account);
          const check: AccountCheck = !checked
            ? "notChecked"
            : found.length > 0
              ? "attention"
              : "ok";
          return {
            ...row,
            check,
            problem: found.map((issue) => issueText({ issue })).join(" "),
          };
        })
      : [];
  const general = setupIssues.filter((issue) => issue.account === null);
  const messages = {
    pending: setup("checking", { name }),
    success: setup("checkedToast", { name }),
  };
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {canEdit ? (
          <CheckSetupButton
            provider={provider}
            label={t("checkNow", { name })}
            messages={messages}
          />
        ) : null}
        <Link href={ROUTES.adminAccounting} className="text-sm underline underline-offset-4">
          {t("editInBibi")}
        </Link>
        <span className="text-sm text-muted-foreground">
          {checkedOn ? t("checked", { date: checkedOn }) : t("never", { name })}
        </span>
      </div>
      {rows.length > 0 ? <ProviderAccountsTable rows={rows} name={name} /> : null}
      {general.length > 0 ? (
        <div className="grid gap-2">
          <p className="font-medium">{t("alsoNeeded", { name })}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {general.map((issue) => (
              <li key={`${issue.code}:${issue.vatPercent}`}>{issueText({ issue })}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {checked && setupIssues.length === 0 ? (
        <p className="text-sm text-muted-foreground">{setup("ok", { name })}</p>
      ) : null}
    </div>
  );
}
