import type { DateTimeFormat, WorkOrderDto } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** A work order as the server (Date) or a tool result (ISO string) carries it. */
export type WorkOrderStatusValue = Pick<
  WorkOrderDto,
  "version" | "baseVersion" | "changes" | "blocked"
> & {
  sentAt: Date | string | null;
};

export type WorkOrderStatusProps = {
  workOrder: WorkOrderStatusValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

/** Version, whether it has been sent, and how many rows carry ★ since the last sent version. */
export function WorkOrderStatus({ workOrder, dates: format }: WorkOrderStatusProps) {
  const t = useTranslations("workOrder");
  const sent = workOrder.sentAt ? new Date(workOrder.sentAt) : null;
  return (
    <div data-slot="work-order-status" className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="secondary">{t("version", { version: workOrder.version })}</Badge>
      <Badge variant={sent ? "outline" : "default"}>
        {sent
          ? t("sentAt", {
              when: format.dateTime({ instant: sent }),
            })
          : t("notSent")}
      </Badge>
      {workOrder.blocked ? <Badge variant="destructive">{t("blocked")}</Badge> : null}
      {workOrder.baseVersion !== null ? (
        <span className="text-muted-foreground">
          {t("changes", { count: workOrder.changes.length, version: workOrder.baseVersion })}
        </span>
      ) : null}
    </div>
  );
}
