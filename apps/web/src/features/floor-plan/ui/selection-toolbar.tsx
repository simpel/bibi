import { Button, Separator, Tooltip, TooltipContent, TooltipTrigger } from "@bibi/ui";
import { CopyIcon, RotateCwIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { type DraftElement, effectiveOf, type KindMap } from "../lib/draft";
import { isOverridden, resetPiece, resizePiece, setAround, setSides } from "../lib/edit-pieces";
import { ChairsPopover, SizePopover } from "./piece-popovers";
import { SeatStepper } from "./seat-stepper";

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (shift: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={label}
          onClick={(event) => onClick(event.shiftKey)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type SelectionToolbarProps = {
  selected: readonly DraftElement[];
  kinds: KindMap;
  style: CSSProperties;
  onReplace: (element: DraftElement) => void;
  onRotate: (step: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

/** Tools next to the selection: size and chairs for one piece, then rotate, duplicate, delete. */
export function SelectionToolbar({
  selected,
  kinds,
  style,
  onReplace,
  onRotate,
  onDuplicate,
  onRemove,
}: SelectionToolbarProps) {
  const t = useTranslations("floorPlan");
  const one = selected.length === 1 ? selected[0] : undefined;
  const effective = one ? effectiveOf({ element: one, kinds }) : null;
  const shape = effective?.shape;
  return (
    <div
      role="toolbar"
      aria-label={t("selection.label")}
      style={style}
      className="absolute flex -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] items-center gap-0.5 rounded-lg border bg-card p-1 whitespace-nowrap shadow-sm"
    >
      {one && effective ? (
        <>
          {shape === "SEAT_ROW" ? null : (
            <SizePopover
              key={`${one.key}-${effective.widthCm}-${effective.depthCm}`}
              effective={effective}
              overridden={isOverridden({ element: one })}
              onChange={(change) =>
                onReplace(
                  change === "reset"
                    ? resetPiece({ element: one })
                    : resizePiece({ element: one, kinds, ...change }),
                )
              }
            />
          )}
          {shape === "RECT" ? (
            <ChairsPopover
              sides={effective.sides}
              total={effective.seatCount}
              onChange={(sides) => onReplace(setSides({ element: one, kinds, sides }))}
            />
          ) : null}
          {shape === "ROUND" || shape === "SEAT_ROW" ? (
            <SeatStepper
              value={effective.around}
              max={shape === "ROUND" ? 24 : 60}
              label={t("chairs.label")}
              onChange={(seats) => onReplace(setAround({ element: one, kinds, seats }))}
            />
          ) : null}
          <Separator orientation="vertical" className="mx-1 h-5" />
        </>
      ) : (
        <>
          <span className="px-2 text-sm text-muted-foreground">
            {t("selection.count", { count: selected.length })}
          </span>
          <Separator orientation="vertical" className="mx-1 h-5" />
        </>
      )}
      <IconAction label={t("selection.rotate")} onClick={(shift) => onRotate(shift ? 15 : 90)}>
        <RotateCwIcon />
      </IconAction>
      <IconAction label={t("selection.duplicate")} onClick={onDuplicate}>
        <CopyIcon />
      </IconAction>
      <IconAction label={t("selection.delete")} onClick={onRemove}>
        <Trash2Icon />
      </IconAction>
    </div>
  );
}
