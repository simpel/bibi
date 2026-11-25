import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionGate } from "@/components/states/permission-gate";
import { TaskCreate, type TaskCreateQuery } from "@/features/task/ui/task-create";
import { pageTitle } from "@/lib/page-metadata";

type NewTaskPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: NewTaskPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "task", key: "create" });
}

const one = ({ value }: { value: string | string[] | undefined }) =>
  typeof value === "string" ? value : undefined;

export default async function NewTaskPage({ params, searchParams }: NewTaskPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const raw = await searchParams;
  const query: TaskCreateQuery = {
    customer: one({ value: raw.customer }),
    order: one({ value: raw.order }),
    from: one({ value: raw.from }),
    to: one({ value: raw.to }),
    item: one({ value: raw.item }),
  };
  return (
    <SimplePage>
      <PermissionGate permission="task:write">
        <TaskCreate locale={locale} query={query} />
      </PermissionGate>
    </SimplePage>
  );
}
