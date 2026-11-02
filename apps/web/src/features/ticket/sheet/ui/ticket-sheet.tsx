"use client";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from "@bibi/ui";
import { SquareArrowOutUpRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgramTable } from "@/features/line/ui/program-table";
import { TicketDayList } from "@/features/line/ui/ticket-day-list";
import { Link } from "@/lib/navigation";
import { ticketRoute } from "@/lib/routes";
import type { TicketSheetData } from "../load-ticket-sheet";
import { TicketSheetFactsRow } from "./ticket-sheet-facts";
import { type TicketSheetState, useTicketSheet } from "./use-ticket-sheet";

export type TicketSheetProps = {
  /** The ticket to show; `null` closes the sheet. */
  ticketId: string | null;
  onClose: () => void;
};

/** Read-only: no line can be changed here, so every row action is off. */
const READ_ONLY = { canEdit: false, canRemove: false, canChangeState: false, canAllocate: false };

/** The ticket's days in the calendar, then its lines with their amounts. */
function SheetBody({ data }: { data: TicketSheetData }) {
  const t = useTranslations("ticketSheet");
  const { program } = data;
  return (
    <div className="grid grid-cols-1 gap-6 px-4 pb-6">
      <TicketSheetFactsRow {...data} />
      {program ? (
        <>
          <TicketDayList {...program.days} />
          <section className="grid grid-cols-1 gap-2" aria-label={t("lines")}>
            <h3 className="text-sm text-muted-foreground">{t("lines")}</h3>
            <ProgramTable {...program} access={READ_ONLY} />
          </section>
        </>
      ) : null}
    </div>
  );
}

function SheetHead({ state }: { state: TicketSheetState }) {
  const t = useTranslations("ticketSheet");
  if (state.phase !== "ready") {
    return (
      <SheetHeader>
        <SheetTitle>{state.phase === "failed" ? t("failed") : t("loading")}</SheetTitle>
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
      </SheetHeader>
    );
  }
  const { id, title, reference } = state.data;
  return (
    <SheetHeader className="flex-row flex-wrap items-start justify-between gap-3 pr-12">
      <div className="grid gap-1">
        <SheetTitle className="text-xl">{title ?? t("untitled", { reference })}</SheetTitle>
        <SheetDescription>{t("reference", { reference })}</SheetDescription>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={ticketRoute({ id })}>
          <SquareArrowOutUpRightIcon aria-hidden />
          {t("details")}
        </Link>
      </Button>
    </SheetHeader>
  );
}

/**
 * Overview to detail, read only: a ticket opened from the pipeline or the calendar shows its
 * title, its people, its days in the calendar and its lines beside the board. Details leaves
 * for the ticket page, where it can be changed.
 */
export function TicketSheet({ ticketId, onClose }: TicketSheetProps) {
  const state = useTicketSheet({ ticketId });
  return (
    <Sheet open={ticketId !== null} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
        <SheetHead state={state} />
        {state.phase === "ready" ? <SheetBody data={state.data} /> : null}
        {state.phase === "loading" ? (
          <div className="grid gap-3 px-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-40" />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
