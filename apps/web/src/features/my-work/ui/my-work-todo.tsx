import type { DateTimeFormat } from "@bibi/core/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AttentionRow } from "@/features/dashboard/ui/attention-row";
import { Link } from "@/lib/navigation";
import { todoMore, todoRows } from "../lib/todo-rows";
import type { MyWorkWireish } from "./my-work-wireish";

export type MyWorkTodoProps = {
  work: Pick<MyWorkWireish, "todo" | "timeZone">;
  dates: DateTimeFormat;
};

/** What the caller must act on, soonest first (ADR 0110). */
export function MyWorkTodo({ work, dates }: MyWorkTodoProps) {
  const t = useTranslations("myWork.todo");
  const { timeZone } = work;
  const rows = todoRows({
    todo: work.todo,
    texts: {
      order: ({ reference, title }) => (title ? `#${reference} ${title}` : `#${reference}`),
      date: (value) => dates.dateTime({ instant: new Date(value), timeZone }),
      runSheet: ({ status, ...values }) => t(`runSheet.${status}`, values),
      runSheetDetail: (values) => t("runSheetDetail", values),
      hold: (values) => t("hold", values),
      holdDetail: (values) => t("holdDetail", values),
      quote: (values) => t("quote", values),
      quoteDetail: ({ sent, valid }) =>
        valid ? t("quoteValid", { sent, valid }) : t("quoteDetail", { sent }),
      messages: (values) => t("messages", values),
      messagesDetail: (values) => t("messagesDetail", values),
    },
  });
  return (
    <Card data-slot="my-work-todo" className="shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid divide-y">
            {rows.map(({ key, at: _at, ...row }) => (
              <AttentionRow key={key} {...row} />
            ))}
          </ul>
        )}
        {todoMore({ todo: work.todo }).map((more) => (
          <Link
            key={more.key}
            href={more.href}
            className="mt-2 block text-sm font-medium hover:underline"
          >
            {t(`more.${more.part}`, { count: more.count })}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
