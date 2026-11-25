import { listTasks, type TaskListInput } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { toTaskRows } from "../lib/to-task-rows";
import { loadMemberNames } from "../load-member-names";
import { TaskRows } from "./task-rows";

export type TaskSectionProps = {
  locale: Locale;
  /** Whose tasks: an order's or a customer's. */
  filter: Pick<TaskListInput, "orderId" | "customerId">;
  /** `/new/task?…` prefilled for this order or customer. */
  createHref: string;
  empty: string;
};

/** A record's tasks as outlined rows, open ones first, with Create task (spec: tasks). */
export async function TaskSection({ locale, filter, createHref, empty }: TaskSectionProps) {
  const [t, abilities, dates, tasks, members] = await Promise.all([
    getTranslations("task"),
    getCallerAbilities(),
    getDateTimeFormat(),
    runOperation({ operation: listTasks, input: { ...filter, limit: 100 } }),
    loadMemberNames(),
  ]);
  if (!tasks.ok) {
    return <ErrorState inline errorKey={handleLoadError({ error: tasks.error, locale })} />;
  }
  const canEdit = can({ abilities, permission: "task:write" });
  const rows = toTaskRows({ tasks: tasks.value.items, dates, members });
  return (
    <section className="grid gap-4" data-slot="task-section">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("section.title")}</h2>
        {canEdit ? (
          <Button asChild size="sm" variant="outline">
            <Link href={createHref}>
              <PlusIcon aria-hidden />
              {t("create")}
            </Link>
          </Button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <TaskRows tasks={rows} canEdit={canEdit} />
      )}
    </section>
  );
}
