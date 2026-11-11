"use client";

import type { FloorElementDto, FloorElementKindDto } from "@bibi/core/schemas";
import { BLOCKING_ISSUE_KINDS, layoutIssues } from "@bibi/core/schemas";
import { FloorDrawing, TooltipProvider } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type DragEvent, useMemo, useRef, useState } from "react";
import { placedOf, seatTotal, snapOpenings, toDraft } from "../lib/draft";
import { effectiveCapacityOf, type LayoutFacts, sameFacts } from "../lib/layout-facts";
import { outlineSize } from "../lib/outline-edit";
import { draftToDrawing } from "../lib/to-drawing";
import { DeleteLayoutDialog } from "./delete-layout-dialog";
import { type EditorDialog, EditorDialogs } from "./editor-dialogs";
import { EditorToolbar, type EditorToolbarProps } from "./editor-toolbar";
import { EmptyLayout } from "./empty-layout";
import { FurnitureDock, KIND_MIME } from "./furniture-dock";
import { LayoutDetailsDialog } from "./layout-details-dialog";
import { LayoutMenu } from "./layout-menu";
import { LayoutSummary } from "./layout-summary";
import type { LayoutTab } from "./layout-tabs";
import { SelectionToolbar } from "./selection-toolbar";
import { toDrawing, useDrawingPointer } from "./use-drawing-pointer";
import { useEditorKeys } from "./use-editor-keys";
import { useEditorSave } from "./use-editor-save";
import { useLayoutCommands } from "./use-layout-commands";
import { useLayoutDraft } from "./use-layout-draft";
import { toScreen, useStageSize } from "./use-stage-size";
import { useTemplateStart } from "./use-template-start";
import { useWallPointer } from "./use-wall-pointer";
import { WallHandles } from "./wall-handles";

export type EditorRoom = {
  widthCm: number;
  depthCm: number;
  outline: [number, number][];
  minAisleCm: number | null;
};

/** The open layout: its id and what it says about itself (ADR 0103). */
export type EditorLayout = LayoutFacts & { id: string };

export type LayoutEditorProps = {
  itemId: string;
  /** null on the floor plan page. */
  layout: EditorLayout | null;
  /** The room's people limit, null = none. */
  maxPeople: number | null;
  tabs: readonly LayoutTab[];
  creating: EditorToolbarProps["creating"];
  room: EditorRoom;
  /** The floor plan's fixed parts (on a layout tab). */
  fixed: readonly FloorElementDto[];
  elements: readonly FloorElementDto[];
  version: number;
  kinds: readonly FloorElementKindDto[];
  canEdit: boolean;
};

/** The floor plan or one layout, drawn to scale and edited in place (ADR 0099, 0102). */
export function LayoutEditor(props: LayoutEditorProps) {
  const { layout, room, kinds: kindList, canEdit } = props;
  const isLayout = layout !== null;
  const t = useTranslations("floorPlan");
  const kinds = useMemo(() => new Map(kindList.map((kind) => [kind.id, kind])), [kindList]);
  const draft = useLayoutDraft({
    initial: props.elements.map((element) => toDraft({ element })),
    outline: room.outline,
    // On the floor plan, doors and windows stay on a wall while pieces and corners move.
    normalize: layout
      ? undefined
      : ({ elements, outline }) => snapOpenings({ elements, outline, kinds }),
  });
  const { state } = draft;
  const room2: EditorRoom = {
    ...outlineSize({ outline: state.outline }),
    outline: state.outline,
    minAisleCm: room.minAisleCm,
  };
  const commands = useLayoutCommands({ draft, kinds, room: room2 });
  const [facts, setFacts] = useState<LayoutFacts>(
    layout ?? {
      name: "",
      description: null,
      capacity: null,
      setupMinutes: null,
      teardownMinutes: null,
    },
  );
  const [layoutDialog, setLayoutDialog] = useState<"details" | "delete" | null>(null);
  const [dialog, setDialog] = useState<EditorDialog>(null);
  const [issueIndex, setIssueIndex] = useState(-1);
  const svg = useRef<SVGSVGElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const size = useStageSize({ ref: stage });
  const editWalls = canEdit && !isLayout;
  const walls = useWallPointer({ draft });
  const pointer = useDrawingPointer({ svg, draft, walls: editWalls ? walls : null });
  useEditorKeys({
    commands,
    hasSelection: state.selected.size > 0,
    enabled: canEdit,
    removeCorner: editWalls ? walls.removeSelected : null,
  });
  const dirty = state.dirty || (layout ? !sameFacts({ a: facts, b: layout }) : false);
  const fixedPlaced = props.fixed
    .map((element) => placedOf({ element: toDraft({ element }), kinds }))
    .filter((p) => p !== null);
  const placed = state.elements
    .map((element) => placedOf({ element, kinds }))
    .filter((p) => p !== null);
  const seats = isLayout ? seatTotal({ elements: state.elements, kinds }) : null;
  const { capacity } = facts;
  const issues = isLayout
    ? layoutIssues({
        outline: room2.outline,
        fixed: fixedPlaced,
        elements: placed,
        capacity: effectiveCapacityOf({ capacity, seats: seats ?? 0 }),
        maxPeople: props.maxPeople,
      })
    : [];
  const blocked = issues.some((issue) => BLOCKING_ISSUE_KINDS.includes(issue.kind));
  const save = useEditorSave({
    itemId: props.itemId,
    layout: layout ? { id: layout.id, facts } : null,
    room: room2,
    elements: state.elements,
    version: props.version,
  });
  const warned = new Set(issues.flatMap((issue) => issue.elementIds));
  const nameOf = ({
    kindName,
    label,
    seats,
  }: {
    kindName: string;
    label: string | null;
    seats: number;
  }) => t("pieceName", { kind: kindName, label: label ?? "", seats });
  const drawn = state.elements.flatMap((element) => {
    const tone = state.selected.has(element.key)
      ? "selected"
      : warned.has(element.key)
        ? "warning"
        : "default";
    const one = draftToDrawing({ element, kinds, tone, nameOf });
    return one ? [one] : [];
  });
  const fixedDrawn = props.fixed.flatMap((element) => {
    const one = draftToDrawing({ element: toDraft({ element }), kinds, tone: "muted", nameOf });
    return one ? [one] : [];
  });
  const template = useTemplateStart({
    room: room2,
    kinds,
    fixed: fixedPlaced,
    commands,
    people: capacity ?? seats ?? 30,
  });
  const selected = state.elements.filter((element) => state.selected.has(element.key));
  const top = placed.filter((p) => state.selected.has(p.id));
  const anchor = top.length
    ? toScreen({
        size,
        room: room2,
        point: {
          x: top.reduce((s, p) => s + p.xCm, 0) / top.length,
          y: Math.min(...top.map((p) => p.yCm - p.depthCm / 2 - 60)),
        },
      })
    : null;
  const showIssue = () => {
    const next = (issueIndex + 1) % issues.length;
    setIssueIndex(next);
    commands.select(issues[next]?.elementIds ?? []);
  };
  const drop = ({ event }: { event: DragEvent<HTMLDivElement> }) => {
    const kindId = event.dataTransfer.getData(KIND_MIME);
    if (!kindId || !svg.current) return;
    event.preventDefault();
    const { x, y } = toDrawing({
      svg: svg.current,
      clientX: event.clientX,
      clientY: event.clientY,
    });
    commands.add({ kindId, xCm: x, yCm: y });
  };
  const dockKinds = kindList.filter((kind) => kind.fixed === !isLayout);
  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col">
        <EditorToolbar
          {...{
            itemId: props.itemId,
            tab: layout?.id ?? "",
            tabs: props.tabs,
            creating: props.creating,
            dirty,
            canEdit,
            blocked,
            save,
            draft,
          }}
        />
        {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target for pieces dragged from the dock; the dock buttons are the keyboard path */}
        <div
          ref={stage}
          className="relative min-h-0 flex-1 overflow-hidden bg-muted/40"
          onDragOver={(event) =>
            event.dataTransfer.types.includes(KIND_MIME) ? event.preventDefault() : null
          }
          onDrop={(event) => drop({ event })}
        >
          <FloorDrawing
            ref={svg}
            title={layout ? t("drawingOf", { name: facts.name }) : t("tabsPlan")}
            widthCm={room2.widthCm}
            depthCm={room2.depthCm}
            outline={room2.outline}
            fixed={fixedDrawn}
            elements={drawn}
            interactive={canEdit}
            widthLabel={isLayout ? t("metres", { value: room2.widthCm / 100 }) : undefined}
            className="size-full touch-none"
            overlay={
              <>
                {isLayout ? null : (
                  <WallHandles outline={state.outline} corner={walls.corner} editable={editWalls} />
                )}
                {pointer.box ? (
                  <rect className="fill-primary/10 stroke-primary stroke-2" {...pointer.box} />
                ) : null}
              </>
            }
            {...(canEdit ? pointer.handlers : {})}
          />
          {canEdit ? (
            <FurnitureDock kinds={dockKinds} kindMap={kinds} onAdd={commands.add} />
          ) : null}
          {canEdit ? (
            <LayoutMenu
              onEditDetails={isLayout ? () => setLayoutDialog("details") : null}
              onTemplate={isLayout ? template.replace : null}
              onRoomSize={isLayout ? null : () => setDialog("room")}
              onRectangle={isLayout ? null : commands.rectangle}
              onDelete={layout ? () => setLayoutDialog("delete") : null}
            />
          ) : null}
          <LayoutSummary
            seats={seats}
            capacity={capacity}
            maxPeople={isLayout ? props.maxPeople : null}
            issues={issues}
            onShowIssue={showIssue}
            hint={editWalls ? t("walls.hint") : null}
          />
          {canEdit && anchor && selected.length > 0 && !pointer.dragging ? (
            <SelectionToolbar
              selected={selected}
              kinds={kinds}
              exits={!isLayout}
              style={{
                left: Math.max(180, Math.min(size.width - 180, anchor.x)),
                top: Math.max(64, anchor.y),
              }}
              onReplace={commands.replace}
              onRotate={commands.rotate}
              onDuplicate={commands.duplicate}
              onRemove={commands.remove}
            />
          ) : null}
          {canEdit &&
          isLayout &&
          template.showStart &&
          state.elements.length === 0 &&
          props.elements.length === 0 ? (
            <EmptyLayout
              layoutName={facts.name}
              room={room2}
              kinds={kinds}
              fixed={fixedPlaced}
              onStart={template.start}
              onEmpty={template.dismiss}
            />
          ) : null}
        </div>
        <EditorDialogs {...{ dialog, setDialog, room: room2 }} setOutline={commands.setOutline} />
        {layout ? (
          <>
            <LayoutDetailsDialog
              key={JSON.stringify(facts)}
              open={layoutDialog === "details"}
              onOpenChange={(open) => setLayoutDialog(open ? "details" : null)}
              facts={facts}
              seats={seats ?? 0}
              maxPeople={props.maxPeople}
              onConfirm={setFacts}
            />
            <DeleteLayoutDialog
              open={layoutDialog === "delete"}
              onOpenChange={(open) => setLayoutDialog(open ? "delete" : null)}
              itemId={props.itemId}
              layout={{ id: layout.id, name: layout.name }}
            />
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
