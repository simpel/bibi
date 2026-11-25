import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { TaskList } from "@/features/task/ui/task-list";
import { pageTitle } from "@/lib/page-metadata";

type TasksPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: TasksPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "tasks" });
}

export default async function TasksPage({ params }: TasksPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <TaskList locale={locale} />
    </SimplePage>
  );
}
