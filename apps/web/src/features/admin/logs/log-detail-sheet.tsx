"use client";

import type { SystemLogEntry } from "@bibi/core/schemas";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@bibi/ui";
import { ListTreeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import { LevelBadge } from "./level-badge";
import { LogDetailBody } from "./log-detail-fields";
import { useLogNavigation } from "./use-log-navigation";

export type LogDetailSheetProps = {
  /** `?log=` from the URL; the sheet is open while it is set. */
  selectedId: string | null;
  entry: SystemLogEntry | null;
};

/** Full log entry: indexed fields, raw JSON, and a jump to every line of the same request. */
export function LogDetailSheet({ selectedId, entry }: LogDetailSheetProps) {
  const t = useTranslations("admin.logs.detail");
  const format = useDateTimeFormat();
  const { navigate } = useLogNavigation();
  const close = () => navigate({ patch: { log: null } });
  return (
    <Sheet open={selectedId !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-mono text-base">
            {entry ? <LevelBadge level={entry.level} /> : null}
            <span className="break-all">{entry?.event ?? t("title")}</span>
          </SheetTitle>
          <SheetDescription>
            {entry ? format.dateTime({ instant: entry.time, seconds: true }) : t("notFound")}
          </SheetDescription>
        </SheetHeader>
        {entry ? <LogDetailBody entry={entry} /> : null}
        <SheetFooter>
          {entry?.requestId ? (
            <Button
              variant="secondary"
              onClick={() => navigate({ patch: { requestId: entry.requestId, log: null } })}
            >
              <ListTreeIcon />
              {t("sameRequest")}
            </Button>
          ) : null}
          <Button variant="outline" onClick={close}>
            {t("close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
