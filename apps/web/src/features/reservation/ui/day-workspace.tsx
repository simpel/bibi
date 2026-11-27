"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import type { NeedOption, ReservationInitial } from "../lib/create-form";
import type { FloorBlock } from "../lib/floor-model";
import { tableStatus } from "../lib/floor-model";
import type { ReservationRow } from "../lib/reservation-row";
import type { TableChoice } from "../lib/table-choice";
import { BlockList } from "./block-list";
import { CreateReservationSheet } from "./create-reservation-sheet";
import { type FloorPlanData, FloorPlanPanel } from "./floor-plan-panel";
import { ReservationTable } from "./reservation-table";
import { TablePopover, type TableTarget } from "./table-popover";

export type DayWorkspaceProps = {
  roomItemId: string;
  date: string;
  title: string;
  /** Null when the room has no sitting (no layout to draw): the list alone. */
  plan: FloorPlanData | null;
  /** The sitting's slots as instants, shared by the floor and the list. */
  times: readonly { ms: number; label: string }[];
  initialMs: number;
  rows: readonly ReservationRow[];
  blocks: readonly FloorBlock[];
  canWrite: boolean;
  tablesByService: Readonly<Record<string, readonly TableChoice[]>>;
  needOptions: readonly NeedOption[];
};

const slotAtOrBefore = ({
  times,
  ms,
  fallback,
}: {
  times: DayWorkspaceProps["times"];
  ms: number;
  fallback: number;
}) => [...times].reverse().find((time) => time.ms <= ms)?.ms ?? times[0]?.ms ?? fallback;

/**
 * The waiter's screen (ADR 0119): the floor large, the day's reservations beside it, one time
 * selector for both. Selecting a reservation lights its tables; a click on a table shows who
 * holds it, or offers to seat guests there.
 */
export function DayWorkspace(props: DayWorkspaceProps) {
  const { plan, times, rows, blocks, canWrite } = props;
  const t = useTranslations("reservation.floor");
  const [atMs, setAtMs] = useState(props.initialMs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [target, setTarget] = useState<TableTarget | null>(null);
  const [createFor, setCreateFor] = useState<ReservationInitial | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timeLabel = times.find((time) => time.ms === atMs)?.label ?? "";
  const activeBlocks = blocks.filter((one) => one.startsAtMs <= atMs && atMs < one.endsAtMs);
  const elements = (plan?.tables ?? []).map(({ id, drawing }) => ({
    ...drawing,
    tone: tableStatus({ tableId: id, atMs, reservations: rows, blocks }).tone,
  }));
  const highlighted = useMemo(
    () => new Set(rows.find((row) => row.id === selectedId)?.tableIds ?? []),
    [rows, selectedId],
  );
  const select = ({ row }: { row: ReservationRow }) => {
    setSelectedId(row.id);
    if (times.length > 0) setAtMs(slotAtOrBefore({ times, ms: row.startsAtMs, fallback: atMs }));
  };
  const clickTable = ({ event }: { event: React.MouseEvent<SVGSVGElement> }) => {
    const id = (event.target as Element).closest("[data-id]")?.getAttribute("data-id");
    const table = plan?.tables.find((one) => one.id === id);
    const box = stage.current?.getBoundingClientRect();
    if (!table || !box) return setTarget(null);
    const status = tableStatus({ tableId: table.id, atMs, reservations: rows, blocks });
    if (status.reservationId) setSelectedId(status.reservationId);
    setTarget({
      tableId: table.id,
      label: table.drawing.label ?? "",
      seats: table.drawing.seats.length,
      x: event.clientX - box.left,
      y: event.clientY - box.top,
    });
  };
  const held =
    target === null
      ? null
      : (rows.find((row) => {
          const status = tableStatus({
            tableId: target.tableId,
            atMs,
            reservations: rows,
            blocks,
          });
          return row.id === status.reservationId;
        }) ?? null);
  const createHere = ({ tableId, party }: { tableId: string; party: number }) => {
    setTarget(null);
    setCreateFor({
      tableId,
      startsAt: new Date(atMs).toISOString(),
      partySize: party,
      walkInName: t("walkIn"),
    });
  };
  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
      {plan ? (
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={String(atMs)} onValueChange={(next) => setAtMs(Number(next))}>
              <SelectTrigger className="w-28" aria-label={t("time")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {times.map((time) => (
                  <SelectItem key={time.ms} value={String(time.ms)}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ul className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <li>{t("legend.booked")}</li>
              <li>{t("legend.seated")}</li>
              <li>{t("legend.blocked")}</li>
              <li>{t("legend.onlineOnly")}</li>
            </ul>
          </div>
          <div ref={stage} className="relative h-[60dvh] min-h-0 lg:h-auto lg:flex-1">
            <FloorPlanPanel
              title={props.title}
              plan={plan}
              elements={elements}
              blocks={activeBlocks}
              highlighted={highlighted}
              onClick={(event) => clickTable({ event })}
            />
            <TablePopover
              target={target}
              held={held}
              timeLabel={timeLabel}
              canWrite={canWrite}
              onClose={() => setTarget(null)}
              onCreateHere={createHere}
            />
          </div>
        </div>
      ) : null}
      <div className={`flex min-h-0 flex-col gap-4 overflow-y-auto ${plan ? "" : "lg:col-span-2"}`}>
        <ReservationTable
          rows={rows}
          canWrite={canWrite}
          selectedId={selectedId}
          onSelect={(row) => select({ row })}
        />
        <BlockList blocks={blocks} canWrite={canWrite} />
      </div>
      <CreateReservationSheet
        roomItemId={props.roomItemId}
        date={props.date}
        tablesByService={props.tablesByService}
        needOptions={props.needOptions}
        initial={createFor ?? undefined}
        open={createFor !== null}
        onOpenChange={(open) => (open ? null : setCreateFor(null))}
      />
    </div>
  );
}
