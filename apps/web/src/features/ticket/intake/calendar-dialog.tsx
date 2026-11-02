import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { type CalendarDays, loadCalendarDaysAction } from "../../calendar/actions";
import { ReadOnlyCalendar } from "../../calendar/ui/read-only-calendar";
import { draftBookings } from "./draft-bookings";
import type { ReviewModel } from "./use-review-model";

type Load = { status: "loading" } | { status: "error"; errorKey: ErrorKey } | CalendarDays;

/** The calendar of the ticket's day, read once the dialog opens. */
function useCalendarDays({ date }: { date: string }): Load {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  useEffect(() => {
    let current = true;
    loadCalendarDaysAction({ from: date, to: date }).then((result) => {
      if (!current) return;
      setLoad(
        result.ok ? result.value : { status: "error", errorKey: errorKeyForCode(result.error) },
      );
    });
    return () => {
      current = false;
    };
  }, [date]);
  return load;
}

/** This draft's lines over the calendar, dashed in the primary or the destructive colour. */
function useOverlay({ model, days }: { model: ReviewModel; days: Load }) {
  const t = useTranslations("ticketIntake.snapshot");
  const { review, planned, timeZone } = model;
  return useMemo(() => {
    if ("status" in days) return [];
    const look = { ink: "var(--foreground)", hold: "soft" } as const;
    return draftBookings({
      ...{ lines: review.lines, planned, timeZone, ticket: t("draftTicket") },
      assetIds: new Set(days.assets.map(({ id }) => id)),
      draft: { ...look, name: t("draftState"), color: "var(--primary)" },
      clash: { ...look, name: t("clashState"), color: "var(--destructive)" },
    });
  }, [days, review.lines, planned, timeZone, t]);
}

export type CalendarDialogProps = { model: ReviewModel; onClose: () => void };

/**
 * "Open calendar" from the snapshot: the full calendar on the ticket's day, read-only, with this
 * draft's lines over it, in a dialog of 90% of the viewport. A booking opens a sheet over it.
 */
export function CalendarDialog({ model, onClose }: CalendarDialogProps) {
  const t = useTranslations("ticketIntake.snapshot");
  const date = model.when.date;
  const days = useCalendarDays({ date });
  const overlay = useOverlay({ model, days });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[90vh] w-[90vw] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle>{t("calendarTitle")}</DialogTitle>
          <DialogDescription>{t("calendarDescription")}</DialogDescription>
        </DialogHeader>
        {"status" in days ? (
          <div className="p-4">
            {days.status === "error" ? (
              <InlineLoadError errorKey={days.errorKey} />
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </div>
        ) : (
          <ReadOnlyCalendar days={days} range={{ from: date, to: date }} overlay={overlay} />
        )}
      </DialogContent>
    </Dialog>
  );
}
