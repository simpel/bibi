import { MY_WORK_TASK_GROUPS, type MyWorkTaskGroup, type NumberFormat } from "@bibi/core/schemas";
import { cn } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { MyWorkTaskWireish } from "./my-work-wireish";
import { NeedsYouRow } from "./needs-you-row";

export type NeedsYouProps = {
  /** Null without `order:read`: nothing shows. */
  tasks: readonly MyWorkTaskWireish[] | null;
  numbers: NumberFormat;
  /** The line shown with no tasks, e.g. "no matches" while searching; else "Nothing needs you". */
  empty?: string;
  /** Keys of tasks just dismissed, shown greyed out until the next page. */
  dimmed?: ReadonlySet<string>;
  /** A hover button per row, e.g. dismiss; none in the assistant's card. */
  action?: (input: { task: MyWorkTaskWireish }) => ReactNode;
};

/**
 * Needs you (spec: home): what the member must act on, in Blocked, Late, Today, Soon and Waiting
 * on customer, each shown only when it has tasks. Rows look like the notifications. It draws no
 * frame: the shell puts it at the top of the notification panel, the assistant in its card.
 */
export function NeedsYou({ tasks, numbers, empty, dimmed, action }: NeedsYouProps) {
  const t = useTranslations("myWork.needsYou");
  if (tasks === null) return null;
  const groups = new Map<MyWorkTaskGroup, MyWorkTaskWireish[]>();
  for (const task of tasks) groups.set(task.group, [...(groups.get(task.group) ?? []), task]);
  return (
    <section data-slot="needs-you" className="grid gap-2">
      <h2 className="flex items-baseline gap-2 px-3 pt-2 font-serif text-xl">
        {t("title")}
        {tasks.length > 0 ? (
          <span className="font-sans text-sm text-muted-foreground tabular-nums">
            {tasks.length}
          </span>
        ) : null}
      </h2>
      {tasks.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-muted-foreground">{empty ?? t("empty")}</p>
      ) : null}
      {MY_WORK_TASK_GROUPS.map((group) => {
        const list = groups.get(group);
        if (!list) return null;
        return (
          <div key={group} data-group={group} className="grid gap-0.5">
            <h3
              className={cn(
                "flex items-center gap-1.5 px-3 pt-1 text-xs font-medium",
                group === "BLOCKED" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {t(`groups.${group}`)}
              <span className="tabular-nums">{list.length}</span>
            </h3>
            <ul className="grid gap-0.5">
              {list.map((task) => (
                <NeedsYouRow
                  key={task.key}
                  task={task}
                  numbers={numbers}
                  dimmed={dimmed?.has(task.key) ?? false}
                  action={action?.({ task })}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
