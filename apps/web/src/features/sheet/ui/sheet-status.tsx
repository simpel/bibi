import type { DateTimeFormat, SheetDto } from "@bibi/core/schemas";
import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";

/** A sheet as the server (Date) or a tool result (ISO string) carries it. */
export type SheetStatusValue = Pick<SheetDto, "version" | "baseVersion" | "changes" | "blocked"> & {
  sentAt: Date | string | null;
};

export type SheetStatusProps = {
  sheet: SheetStatusValue;
  /** The viewer's date and time format: `getDateTimeFormat()` on the server, the hook in a client card. */
  dates: DateTimeFormat;
};

/** Version, whether it has been sent, and how many rows carry ★ since the last sent version. */
export function SheetStatus({ sheet, dates: format }: SheetStatusProps) {
  const t = useTranslations("sheet");
  const sent = sheet.sentAt ? new Date(sheet.sentAt) : null;
  return (
    <div data-slot="sheet-status" className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="secondary">{t("version", { version: sheet.version })}</Badge>
      <Badge variant={sent ? "outline" : "default"}>
        {sent
          ? t("sentAt", {
              when: format.dateTime({ instant: sent }),
            })
          : t("notSent")}
      </Badge>
      {sheet.blocked ? <Badge variant="destructive">{t("blocked")}</Badge> : null}
      {sheet.baseVersion !== null ? (
        <span className="text-muted-foreground">
          {t("changes", { count: sheet.changes.length, version: sheet.baseVersion })}
        </span>
      ) : null}
    </div>
  );
}
