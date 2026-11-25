import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadTask } from "@/features/task/load-task";
import { TaskDetail } from "@/features/task/ui/task-detail";
import { entityTitle } from "@/lib/page-metadata";

type TaskPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: TaskPageProps) {
  const { id } = await params;
  const task = await loadTask({ id });
  return entityTitle({ name: task.ok ? task.value.type.name : undefined, fallback: "Task" });
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <TaskDetail locale={locale} id={id} />
    </SimplePage>
  );
}
