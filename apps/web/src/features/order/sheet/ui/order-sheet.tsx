"use client";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  StatusBadge,
} from "@bibi/ui";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { OrderDayList } from "@/features/line/ui/order-day-list";
import { ProgramTable } from "@/features/line/ui/program-table";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import type { OrderSheetData } from "../load-order-sheet";
import { OrderSheetFactsRow } from "./order-sheet-facts";
import { type OrderSheetState, useOrderSheet } from "./use-order-sheet";

export type OrderSheetProps = {
  /** The order to show; `null` closes the sheet. */
  orderId: string | null;
  onClose: () => void;
};

/** Read-only: no line can be changed here, so every row action is off. */
const READ_ONLY = { canEdit: false, canRemove: false, canChangeState: false, canAllocate: false };

/** The way to the order page: everything else about the order is there, and it can be changed. */
function OpenOrder({ id, size = "default" }: { id: string; size?: "default" | "sm" }) {
  const t = useTranslations("orderSheet");
  return (
    <Button asChild size={size}>
      <Link href={orderRoute({ id })}>
        {t("open")}
        <ArrowRightIcon aria-hidden />
      </Link>
    </Button>
  );
}

/** The order page's Program card, read only: its days in the calendar, then the lines. */
function SheetProgram({ program }: { program: NonNullable<OrderSheetData["program"]> }) {
  const t = useTranslations("line");
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{t("plural")}</h2>
      <div className="overflow-hidden rounded-xl border bg-card">
        <OrderDayList {...program.days} joined />
        {program.lines.length === 0 ? (
          <p className="border-t p-4 text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          <ProgramTable {...program} access={READ_ONLY} flush />
        )}
      </div>
    </section>
  );
}

/** The key facts and the program as on the order page, then the way there. */
function SheetBody({ data }: { data: OrderSheetData }) {
  const t = useTranslations("orderSheet");
  return (
    <div className="grid grid-cols-1 gap-8 px-4 pb-6">
      <OrderSheetFactsRow facts={data} />
      {data.program ? <SheetProgram program={data.program} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
        <p className="text-muted-foreground text-sm">{t("moreOnPage")}</p>
        <OpenOrder id={data.id} />
      </div>
    </div>
  );
}

function SheetHead({ state }: { state: OrderSheetState }) {
  const t = useTranslations("orderSheet");
  if (state.phase !== "ready") {
    return (
      <SheetHeader>
        <SheetTitle>{state.phase === "failed" ? t("failed") : t("loading")}</SheetTitle>
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
      </SheetHeader>
    );
  }
  const { id, title, reference, status } = state.data;
  // As the order page's title: the name with its number, the status on the right.
  return (
    <SheetHeader className="flex-row flex-wrap items-start justify-between gap-3 pr-12">
      <SheetTitle className="font-serif text-2xl leading-tight">
        <Link href={orderRoute({ id })} className="underline-offset-4 hover:underline">
          {title ?? t("untitled", { reference })}
        </Link>
        <span className="ml-2 font-normal text-base text-muted-foreground tabular-nums">
          {t("reference", { reference })}
        </span>
      </SheetTitle>
      <SheetDescription className="sr-only">{t("description")}</SheetDescription>
      <div className="flex items-center gap-2">
        {status ? (
          <StatusBadge label={status.name} color={status.color} className="h-8 px-3 text-sm" />
        ) : null}
        <OpenOrder id={id} size="sm" />
      </div>
    </SheetHeader>
  );
}

/**
 * Overview to detail, read only: an order opened from the pipeline or the calendar shows the top
 * of its order page beside the board (title, number and status, the key facts, the program).
 * Open order, at the top and the bottom, leads to the page, where it can be changed.
 */
export function OrderSheet({ orderId, onClose }: OrderSheetProps) {
  const state = useOrderSheet({ orderId });
  return (
    <Sheet open={orderId !== null} onOpenChange={(next) => (next ? null : onClose())}>
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
