import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { OrganizationPager } from "../billing/organization-pager";
import { OrganizationTable } from "../billing/organization-table";

export type OrganizationsAdminViewProps = { locale: Locale; cursor: string | undefined };

/** `/mothership/organizations`: Every organization registered on the platform. */
export async function OrganizationsAdminView({ locale, cursor }: OrganizationsAdminViewProps) {
  const ops = platformOperations();
  const [t, organizations] = await Promise.all([
    getTranslations("admin.organizations"),
    runPlatformOperation({ operation: ops.listBillingOrganizations, input: { cursor } }),
  ]);
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!organizations.ok) {
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={handleLoadError({ error: organizations.error, locale })} />
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {header}
      <section className="grid gap-3">
        <Suspense>
          <OrganizationTable organizations={organizations.value.items} />
        </Suspense>
        <OrganizationPager cursor={cursor} nextCursor={organizations.value.nextCursor} />
      </section>
    </div>
  );
}
