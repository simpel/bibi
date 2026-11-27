import { type AppError, listAccountMappings, listIntegrationAccounts } from "@bibi/core";
import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import type { MappingCanvasLabels } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { purposeDefsOf } from "../lib/mapping-model";
import { MappingEditor } from "./mapping-editor";
import { RefreshAccountsButton } from "./refresh-accounts-button";

export type ProviderAccountsProps = {
  locale: Locale;
  connection: IntegrationConnectionDto;
  /** The accounting system's name in the viewer's language. */
  name: string;
  canEdit: boolean;
};

/**
 * What Bibi books to in the accounting system (ADR 0123): the purposes on the left, the system's
 * accounts on the right, a line per mapping. Problems found are listed under the canvas.
 */
export async function ProviderAccounts({
  locale,
  connection,
  name,
  canEdit,
}: ProviderAccountsProps) {
  const { provider, setupIssues, accountsSyncedAt } = connection;
  const [t, setup, common, mappings, accounts, itemTypes, dates] = await Promise.all([
    getTranslations("integration.accounts"),
    getTranslations("integration.setup"),
    getTranslations("common"),
    runOperation({ operation: listAccountMappings, input: {} }),
    runOperation({ operation: listIntegrationAccounts, input: { provider } }),
    loadEntityTypesOf({ base: "ITEM" }),
    getDateTimeFormat(),
  ]);
  const failure = ({ error }: { error: AppError }) => (
    <ErrorState inline errorKey={handleLoadError({ error, locale })} />
  );
  if (!mappings.ok) return failure({ error: mappings.error });
  if (!accounts.ok) return failure({ error: accounts.error });
  if (!itemTypes.ok) return failure({ error: itemTypes.error });
  const syncedOn = accountsSyncedAt ? dates.date({ instant: accountsSyncedAt }) : null;
  const refresh = canEdit ? (
    <RefreshAccountsButton
      provider={provider}
      label={t("refresh", { name })}
      messages={{ pending: t("refreshing", { name }), success: t("refreshed", { name }) }}
    />
  ) : null;
  const status = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {refresh}
      <span className="text-sm text-muted-foreground">
        {syncedOn ? t("syncedOn", { date: syncedOn }) : t("never", { name })}
      </span>
    </div>
  );
  if (!accounts.value.readable) {
    return (
      <div className="grid gap-4">
        <p className="text-sm">{setup("issues.ACCOUNTS_UNAVAILABLE", { name })}</p>
        {status}
      </div>
    );
  }
  const labels: MappingCanvasLabels = {
    purposes: t("canvas.purposes"),
    accounts: t("canvas.accounts", { name }),
    required: t("canvas.required"),
    inactive: t("canvas.inactive"),
    addAccount: t("canvas.addAccount"),
    searchAccounts: t("canvas.searchAccounts"),
    noAccountFound: t("canvas.noAccountFound"),
    chooseAccount: t("canvas.chooseAccount"),
    removeLine: t("canvas.removeLine"),
    unmapped: t("canvas.unmapped"),
  };
  const defs = purposeDefsOf({
    types: itemTypes.value.items.map(({ id, name: typeName }) => ({ id, name: typeName })),
    texts: {
      advances: t("purpose.advances"),
      revenueDefault: t("purpose.revenueDefault"),
      revenueDefaultHint: t("purpose.revenueDefaultHint"),
      revenueType: ({ type }) => t("purpose.revenueType", { type }),
    },
  });
  const issues = setupIssues.filter((issue) => issue.code !== "ACCOUNTS_UNAVAILABLE");
  return (
    <div className="grid gap-6">
      {status}
      <MappingEditor
        key={`${accountsSyncedAt?.getTime() ?? 0}:${JSON.stringify(mappings.value.mappings)}`}
        provider={provider}
        defs={defs}
        mappings={mappings.value.mappings}
        chart={accounts.value.accounts}
        issueAccounts={issues.map((issue) => issue.account)}
        canEdit={canEdit}
        labels={labels}
        attentionText={t("needsAttention")}
        messages={{ pending: common("saving"), success: t("saved") }}
      />
      {issues.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {issues.map((issue) => (
            <li key={`${issue.code}:${issue.account}:${issue.vatPercent}`}>
              {setup(`issues.${issue.code}`, {
                name,
                account: issue.account ?? "",
                vat: issue.vatPercent ?? "",
              })}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
