"use client";

import { Button, cn } from "@bibi/ui";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NeedOption, ReservationInitial } from "../lib/create-form";
import type { FloorBlock } from "../lib/floor-model";
import { tableStatus } from "../lib/floor-model";
import { nextPickColor, PICK_COLORS } from "../lib/pick-colors";
import type { ReservationRow } from "../lib/reservation-row";
import { slotLoad } from "../lib/slot-load";
import type { TableChoice } from "../lib/table-choice";
import { BlockList } from "./block-list";
import { BlockTablesDialog } from "./block-tables-dialog";
import { CreateReservationSheet } from "./create-reservation-sheet";
import { DraggableCard } from "./draggable-card";
import { type FloorPlanData, FloorPlanPanel } from "./floor-plan-panel";
import { PanZoom } from "./pan-zoom";
import { ReservationTable } from "./reservation-table";
import { TablePanel, type TableTarget } from "./table-panel";
import { TimeSlotButton } from "./time-slot-button";

export type DayWorkspaceProps = {
  roomItemId: string;
  date: string;
  /** The floor of each layout the day's sittings use, by layout id; none: the list alone. */
  plans: Readonly<Record<string, { title: string; data: FloorPlanData }>>;
  /** The sitting's slots as instants, shared by the floor and the list. */
  times: readonly { ms: number; label: string; layoutId: string }[];
  initialMs: number;
  rows: readonly ReservationRow[];
  blocks: readonly FloorBlock[];
  canWrite: boolean;
  tablesByService: Readonly<Record<string, readonly TableChoice[]>>;
  /** Every seated table of the room, for the block dialog. */
  allTables: readonly TableChoice[];
  needOptions: readonly NeedOption[];
};

type OpenTable = TableTarget & { color: number };

const CARD_WIDTH = 320;
const CARD_GAP = 12;
const CARD_ROW = 160;
const SIDE_INSET = 4;
const SIDE_DEFAULT = 448;
const SIDE_MIN = 320;
const SIDE_MAX = 900;
const SIDE_KEY_STEP = 24;

const clampSide = ({ width }: { width: number }) =>
  Math.min(SIDE_MAX, Math.max(SIDE_MIN, Math.round(width)));

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
  const { plans, times, rows, blocks, canWrite } = props;
  const t = useTranslations("reservation.floor");
  const [atMs, setAtMs] = useState(props.initialMs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<readonly OpenTable[]>([]);
  const [createFor, setCreateFor] = useState<ReservationInitial | null>(null);
  const [frontId, setFrontId] = useState<string | null>(null);
  const [blockFor, setBlockFor] = useState<TableTarget | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [sideWidth, setSideWidth] = useState(SIDE_DEFAULT);
  const activeTime = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  // Syncs with the browser: keep the chosen time in view in the scrolling time bar.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the chosen time changes
  useEffect(() => {
    activeTime.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [atMs]);
  const current = times.find((time) => time.ms === atMs);
  const timeLabel = current?.label ?? "";
  // The floor follows the chosen time: lunch and dinner may use different layouts.
  const active = (current ? plans[current.layoutId] : undefined) ?? Object.values(plans)[0];
  const plan = active?.data ?? null;
  // Tables opened on another layout wait, hidden, until their time is chosen again.
  const shown = targets.filter((one) => plan?.tables.some((table) => table.id === one.tableId));
  const activeBlocks = blocks.filter((one) => one.startsAtMs <= atMs && atMs < one.endsAtMs);
  const elements = (plan?.tables ?? []).map(({ id, drawing }) => ({
    ...drawing,
    tone: tableStatus({ tableId: id, atMs, reservations: rows, blocks }).tone,
  }));
  const highlighted = useMemo(
    () => new Set(rows.find((row) => row.id === selectedId)?.tableIds ?? []),
    [rows, selectedId],
  );
  const openTables = ({ ids, replace = false }: { ids: readonly string[]; replace?: boolean }) =>
    setTargets((current) => {
      let next = replace ? [] : [...current];
      for (const id of ids) {
        const table = Object.values(plans)
          .flatMap((one) => one.data.tables)
          .find((one) => one.id === id);
        if (!table || next.some((one) => one.tableId === id)) continue;
        next = [
          ...next,
          {
            tableId: id,
            label: table.drawing.label ?? "",
            seats: table.drawing.seats.length,
            color: nextPickColor({ used: next.map((one) => one.color) }),
          },
        ];
      }
      return next;
    });
  /** A reservation picked in the list: its time on the bar and its tables opened on the floor. */
  const select = ({ row }: { row: ReservationRow }) => {
    setSelectedId(row.id);
    if (times.length > 0) setAtMs(slotAtOrBefore({ times, ms: row.startsAtMs, fallback: atMs }));
    openTables({ ids: row.tableIds, replace: true });
  };
  const clickTable = ({ event }: { event: React.MouseEvent<SVGSVGElement> }) => {
    const id = (event.target as Element).closest("[data-id]")?.getAttribute("data-id");
    if (!id) return;
    const status = tableStatus({ tableId: id, atMs, reservations: rows, blocks });
    if (status.reservationId) setSelectedId(status.reservationId);
    openTables({ ids: [id] });
  };
  /** Boxes open next to each other, left to right, in the room left of the sidebar; then a row down. */
  const sideBySide = ({ index }: { index: number }) => {
    const free = (shell.current?.clientWidth ?? 1000) - (listOpen ? sideWidth + 8 : 0) - 12;
    const columns = Math.max(1, Math.floor(free / (CARD_WIDTH + CARD_GAP)));
    return {
      x: (index % columns) * (CARD_WIDTH + CARD_GAP),
      y: Math.floor(index / columns) * CARD_ROW,
    };
  };
  const seatsOf = ({ layoutId }: { layoutId: string }) =>
    plans[layoutId]?.data.tables.reduce((sum, table) => sum + table.drawing.seats.length, 0) ?? 0;
  const close = ({ tableId }: { tableId: string }) =>
    setTargets((open) => open.filter((one) => one.tableId !== tableId));
  const heldAt = ({ tableId }: { tableId: string }) => {
    const status = tableStatus({ tableId, atMs, reservations: rows, blocks });
    return rows.find((row) => row.id === status.reservationId) ?? null;
  };
  const createHere = ({ tableId, party }: { tableId: string; party: number }) => {
    close({ tableId });
    setCreateFor({
      tableId,
      startsAt: new Date(atMs).toISOString(),
      partySize: party,
      walkInName: t("walkIn"),
    });
  };
  const list = (
    <div className="grid min-w-0 gap-4">
      <ReservationTable
        rows={rows}
        canWrite={canWrite}
        selectedId={selectedId}
        onSelect={(row) => select({ row })}
      />
      <div className="px-4 pb-4">
        <BlockList blocks={blocks} canWrite={canWrite} />
      </div>
    </div>
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {plan ? (
        <ul
          aria-label={t("time")}
          className="flex w-full shrink-0 snap-x snap-proximity gap-2 overflow-x-auto [scrollbar-width:none]"
        >
          {times.map((time) => (
            <li key={time.ms} className="min-w-20 flex-1 snap-start">
              <TimeSlotButton
                label={time.label}
                chosen={time.ms === atMs}
                load={slotLoad({ rows, ms: time.ms, seats: seatsOf({ layoutId: time.layoutId }) })}
                buttonRef={time.ms === atMs ? activeTime : undefined}
                onChoose={() => setAtMs(time.ms)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div
        ref={shell}
        className="relative min-h-[60dvh] flex-1 overflow-hidden rounded-xl border bg-card lg:min-h-0"
      >
        {plan ? (
          <>
            <div className="absolute inset-0 p-3">
              <PanZoom>
                <FloorPlanPanel
                  title={active?.title ?? ""}
                  plan={plan}
                  elements={elements}
                  blocks={activeBlocks}
                  highlighted={highlighted}
                  picked={shown.map((one) => ({
                    tableId: one.tableId,
                    color: PICK_COLORS[one.color] ?? PICK_COLORS[0],
                  }))}
                  onClick={(event) => clickTable({ event })}
                />
              </PanZoom>
            </div>
            <Button
              variant="outline"
              className="absolute right-3 top-3 z-20 size-12 bg-card"
              aria-label={listOpen ? t("hideList") : t("showList")}
              aria-pressed={listOpen}
              onClick={() => setListOpen(!listOpen)}
            >
              {listOpen ? (
                <PanelRightCloseIcon className="size-5" />
              ) : (
                <PanelRightOpenIcon className="size-5" />
              )}
            </Button>
            {listOpen ? (
              <div
                className="absolute bottom-3 right-1 top-1 z-10"
                style={{ width: `min(${sideWidth}px, calc(100% - 0.5rem))` }}
              >
                <div className="size-full overflow-y-auto overflow-x-hidden rounded-xl border bg-card shadow-lg">
                  {list}
                </div>
                {/* biome-ignore lint/a11y/useSemanticElements: a draggable splitter, not a rule between sections */}
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={t("resizeList")}
                  aria-valuemin={SIDE_MIN}
                  aria-valuemax={SIDE_MAX}
                  aria-valuenow={sideWidth}
                  tabIndex={0}
                  className="absolute inset-y-0 left-0 flex w-6 -translate-x-1/2 cursor-col-resize touch-none items-center justify-center"
                  onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                  onPointerMove={(event) => {
                    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                    const right = shell.current?.getBoundingClientRect().right ?? event.clientX;
                    setSideWidth(clampSide({ width: right - event.clientX - SIDE_INSET }));
                  }}
                  onKeyDown={(event) => {
                    const step =
                      event.key === "ArrowLeft"
                        ? SIDE_KEY_STEP
                        : event.key === "ArrowRight"
                          ? -SIDE_KEY_STEP
                          : 0;
                    if (step !== 0) setSideWidth(clampSide({ width: sideWidth + step }));
                  }}
                >
                  <span className="h-20 w-2.5 rounded-full bg-muted-foreground/60 shadow-sm ring-2 ring-card hover:bg-primary" />
                </div>
              </div>
            ) : null}
            {shown.map((target, index) => {
              const color = PICK_COLORS[target.color] ?? PICK_COLORS[0];
              return (
                <DraggableCard
                  key={target.tableId}
                  className={cn(
                    "left-3 top-3 max-h-[calc(100%-13rem)] w-80 border-l-4",
                    color.edge,
                  )}
                  initial={sideBySide({ index })}
                  raised={(frontId ?? shown.at(-1)?.tableId) === target.tableId}
                  onRaise={() => setFrontId(target.tableId)}
                >
                  <TablePanel
                    target={target}
                    color={color}
                    held={heldAt({ tableId: target.tableId })}
                    timeLabel={timeLabel}
                    canWrite={canWrite}
                    onClose={() => close({ tableId: target.tableId })}
                    onCreateHere={createHere}
                    onBlock={(next) => {
                      close({ tableId: next.tableId });
                      setBlockFor(next);
                    }}
                  />
                </DraggableCard>
              );
            })}
          </>
        ) : (
          <div className="size-full overflow-y-auto">{list}</div>
        )}
      </div>
      <BlockTablesDialog
        roomItemId={props.roomItemId}
        date={props.date}
        tables={props.allTables}
        tableId={blockFor?.tableId ?? null}
        startTime={timeLabel}
        open={blockFor !== null}
        onOpenChange={(open) => (open ? null : setBlockFor(null))}
      />
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
