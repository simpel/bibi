import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { loadOrder } from "@/features/order/load-order";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadTaskFormData } from "../load-task-form-data";
import { TaskForm } from "./task-form";
import type { TaskPrefill } from "./task-form-schema";

export type TaskCreateQuery = {
  customer?: string | undefined;
  order?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  item?: string | undefined;
};

export type TaskCreateProps = { locale: Locale; query: TaskCreateQuery };

const instant = ({ value }: { value: string | undefined }) => {
  const date = value ? new Date(value) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
};

/** An order's task takes its customer and contact; a calendar slot its times and row. */
async function prefillOf({ query }: { query: TaskCreateQuery }): Promise<TaskPrefill> {
  const order = query.order ? await loadOrder({ id: query.order }) : null;
  const linked = order?.ok ? order.value : null;
  return {
    customerId: linked?.customerId ?? query.customer,
    contactId: linked?.contactId ?? undefined,
    orderId: linked?.id,
    itemId: query.item,
    startsAt: instant({ value: query.from }),
    endsAt: instant({ value: query.to }),
  };
}

/** `/new/task`: a site visit, a tasting or a deadline around a customer (ADR 0117). */
export async function TaskCreate({ locale, query }: TaskCreateProps) {
  const [t, data, prefill] = await Promise.all([
    getTranslations("task"),
    loadTaskFormData(),
    prefillOf({ query }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell title={t("create")} description={t("createDescription")}>
      {data.value.types.length === 0 ? (
        <EmptyState
          title={t("noTypes")}
          description={t("noTypesDescription")}
          action={
            <Button asChild variant="outline">
              <Link href={ROUTES.adminTypes}>{t("goToTypes")}</Link>
            </Button>
          }
        />
      ) : (
        <TaskForm data={data.value} prefill={prefill} />
      )}
    </FormPageShell>
  );
}
