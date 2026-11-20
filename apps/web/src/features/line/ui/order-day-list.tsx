import { cn, DaySnapshot } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CommentHashButton } from "@/features/comment/ui/comment-hash-button";
import { type OrderComments, subjectOf } from "@/features/comment/ui/comment-view";
import type { OrderDays } from "../order-days";

type Snapshot = OrderDays["days"][number];

const LINE_BLOCK = "line-";

/** Each of the order's own bars gets its line's comment icon in its hover card (ADR 0115). */
function withComments({ rows, comments }: { rows: Snapshot["rows"]; comments: OrderComments }) {
  return rows.map((row) => ({
    ...row,
    blocks: row.blocks.map((block) => {
      if (!block.id.startsWith(LINE_BLOCK)) return block;
      const lineId = block.id.slice(LINE_BLOCK.length);
      const subject = subjectOf({ state: comments, lineId });
      const action = (
        <CommentHashButton
          key={block.id}
          lineId={lineId}
          count={subject.comments.length}
          unread={subject.unreadIds.length > 0}
        />
      );
      return {
        ...block,
        details: { ...(block.details ?? { title: block.label }), extraActions: action },
      };
    }),
  }));
}

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/**
 * The order's days in the calendar, one snapshot each, and its lines without a time under the
 * first. Drawn on the order page and in the order sheet alike.
 */
export function OrderDayList({
  days,
  untimed,
  joined = false,
  comments,
}: OrderDays & { joined?: boolean; comments?: OrderComments | null }) {
  const t = useTranslations("line.day");
  const hourLabel = ({ hour }: { hour: number }) =>
    hour >= 24 ? t("nextDay", { hour: pad({ value: hour - 24 }) }) : pad({ value: hour });
  return days.map(({ day, date, ...snapshot }, index) => (
    <section
      key={day}
      className={cn("grid grid-cols-1 gap-2", joined && "p-4", joined && index > 0 && "border-t")}
      aria-label={t("title", { date })}
    >
      <h3 className="text-sm text-muted-foreground">{t("title", { date })}</h3>
      <DaySnapshot
        {...snapshot}
        rows={comments ? withComments({ rows: snapshot.rows, comments }) : snapshot.rows}
        hourLabel={hourLabel}
        className={joined ? "rounded-none border-0 p-0" : undefined}
      />
      {index === 0 && untimed.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("untimed", { lines: untimed.join(", ") })}
        </p>
      ) : null}
    </section>
  ));
}
