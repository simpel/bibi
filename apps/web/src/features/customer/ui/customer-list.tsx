import { type CustomerDto, listCustomers } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { CreateCustomerButton } from "./create-customer-button";
import { CustomerTable } from "./customer-table";

export type CustomerListProps = { locale: Locale; cursor?: string | undefined };

const PAGE_SIZE = 20;

const GoToTypes = ({ label }: { label: string }) => (
  <Button asChild variant="outline">
    <Link href={ROUTES.settingsTypes}>{label}</Link>
  </Button>
);

/** Customers page body: header with create, the table (or an empty state) and pagination. */
export async function CustomerList({ locale, cursor }: CustomerListProps) {
  const t = await getTranslations("customer");
  const abilities = await getCallerAbilities();
  const [data, result] = await Promise.all([
    loadTypedFormData({ base: "CUSTOMER" }),
    runOperation({
      operation: listCustomers,
      input: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const noTypes = data.value.types.length === 0;
  const create =
    can({ abilities, permission: "customer:write" }) && !noTypes ? (
      <CreateCustomerButton />
    ) : undefined;
  const page: { items: CustomerDto[]; nextCursor: string | null } = result.value;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      {page.items.length === 0 && !cursor ? (
        <EmptyState
          title={t("empty")}
          description={noTypes ? t("noTypes") : t("emptyDescription")}
          action={noTypes ? <GoToTypes label={t("goToTypes")} /> : create}
        />
      ) : (
        <>
          <CustomerTable customers={page.items} types={data.value.types} />
          <CursorPagination
            pathname={ROUTES.customers}
            cursor={cursor}
            nextCursor={page.nextCursor}
          />
        </>
      )}
    </div>
  );
}
