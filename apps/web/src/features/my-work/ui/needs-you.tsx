import { MY_WORK_TASK_GROUPS, type MyWorkTaskGroup, type NumberFormat } from "@bibi/core/schemas";
import { cn } from "@bibi/ui";
import { OctagonXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MyWorkTaskWireish } from "./my-work-wireish";
import { NeedsYouRow } from "./needs-you-row";

export type NeedsYouProps = {
  /** Null without `order:read`: nothing shows. */
  tasks: readonly MyWorkTaskWireish[] | null;
  numbers: NumberFormat;
};

/**
 * Needs you (spec: home): what the member must act on, in Blocked, Late, Today, Soon and Waiting
 * on customer, each shown only when it has tasks. Shared by the start page and the assistant.
 */
export function NeedsYou({ tasks, numbers }: NeedsYouProps) {
  const t = useTranslations("myWork.needsYou");
  if (tasks === null) return null;
  const groups = new Map<MyWorkTaskGroup, MyWorkTaskWireish[]>();
  for (const task of tasks) groups.set(task.group, [...(groups.get(task.group) ?? []), task]);
  return (
    <section data-slot="needs-you" className="grid gap-4">
      <h2 className="border-b pb-1.5 font-serif text-xl">{t("title")}</h2>
      {tasks.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      {MY_WORK_TASK_GROUPS.map((group) => {
        const list = groups.get(group);
        if (!list) return null;
        const blocked = group === "BLOCKED";
        return (
          <div key={group} data-group={group} className="grid gap-2">
            <h3
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                blocked ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {blocked ? <OctagonXIcon className="size-4" aria-hidden /> : null}
              {t(`groups.${group}`)}
              <span className="tabular-nums">{list.length}</span>
            </h3>
            <ul className="grid gap-2">
              {list.map((task) => (
                <NeedsYouRow key={task.key} task={task} numbers={numbers} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
