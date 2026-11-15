import type { DateTimeFormat } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { orderRoute, quoteRoute, ROUTES } from "@/lib/routes";
import type { MyWorkFlagWireish } from "./my-work-wireish";

export type MyWorkFlagProps = {
  flag: MyWorkFlagWireish;
  orderId: string;
  timeZone: string;
  dates: DateTimeFormat;
};

/** Where a flag leads: its run sheet, its quote, else the order. */
function hrefOf({ flag, orderId }: Pick<MyWorkFlagProps, "flag" | "orderId">) {
  if (flag.runSheetId) return `${ROUTES.runSheets}/${encodeURIComponent(flag.runSheetId)}`;
  if (flag.quoteId) return quoteRoute({ id: flag.quoteId });
  return orderRoute({ id: orderId });
}

/** The card's most urgent flag as a chip that links to what to act on (spec: home). */
export function MyWorkFlag({ flag, orderId, timeZone, dates }: MyWorkFlagProps) {
  const t = useTranslations("myWork.flags");
  const date = flag.at ? dates.date({ instant: new Date(flag.at), timeZone }) : "";
  const runSheet = flag.runSheetName ?? "";
  const label =
    flag.kind === "HARD_CLASH"
      ? flag.reference === null
        ? t("HARD_CLASH_BLOCK")
        : t("HARD_CLASH", { reference: flag.reference })
      : flag.kind === "RUN_SHEET"
        ? t(`RUN_SHEET.${flag.runSheetStatus ?? "DRAFT"}`, { runSheet })
        : flag.kind === "UNREAD_MESSAGES"
          ? t("UNREAD_MESSAGES", { count: flag.count ?? 0 })
          : t(flag.kind, { date });
  const red = flag.kind === "HARD_CLASH" || flag.runSheetStatus === "BLOCKED";
  return (
    <Badge asChild variant={red ? "destructive" : "warning"}>
      <Link href={hrefOf({ flag, orderId })} className="gap-1 hover:underline">
        {red ? (
          <OctagonAlertIcon aria-hidden className="size-3" />
        ) : (
          <TriangleAlertIcon aria-hidden className="size-3" />
        )}
        {label}
      </Link>
    </Badge>
  );
}
