import type { LineDto } from "@bibi/core";
import {
  ColorSwatch,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  StatusBadge,
} from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ProgramFormData } from "./program-form-data";

export type StateOfInput = { item: LineDto; data: ProgramFormData };

/** The line's state among the loaded states, if it has one. */
export const stateOf = ({ item, data }: StateOfInput) =>
  data.states.find((state) => state.id === item.stateId);

export type LineStateCellProps = {
  line: LineDto;
  data: ProgramFormData;
  pending?: boolean;
  canChangeState?: boolean;
  onStateChange?: (input: { lineId: string; stateId: string }) => void;
  onFollowStatus?: (input: { lineId: string }) => void;
};

type StateMenuContentProps = {
  line: LineDto;
  stateId: string;
  states: ProgramFormData["states"];
  onStateChange: (input: { lineId: string; stateId: string }) => void;
  onFollowStatus?: (input: { lineId: string }) => void;
};

function StateMenuContent({
  line,
  stateId,
  states,
  onStateChange,
  onFollowStatus,
}: StateMenuContentProps) {
  const t = useTranslations("line");
  return (
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>{t("changeState")}</DropdownMenuLabel>
      {states.map((target) => (
        <DropdownMenuItem
          key={target.id}
          onSelect={() => onStateChange({ lineId: line.id, stateId: target.id })}
          className={target.id === stateId ? "bg-accent font-medium" : undefined}
        >
          <ColorSwatch color={target.color} />
          <span>{target.name}</span>
        </DropdownMenuItem>
      ))}
      {line.stateOverridden && onFollowStatus ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onFollowStatus({ lineId: line.id })}>
            {t("followStatus")}
          </DropdownMenuItem>
        </>
      ) : null}
    </DropdownMenuContent>
  );
}

function StateBadgeTrigger({
  state,
  pending,
}: {
  state: { name: string; color: string };
  pending: boolean;
}) {
  return (
    <DropdownMenuTrigger asChild disabled={pending}>
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "group inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          pending && "cursor-wait opacity-80",
        )}
        aria-label={state.name}
      >
        <StatusBadge
          color={state.color}
          className={cn(
            "hover:bg-muted/80",
            pending && "animate-pulse ring-2 ring-primary/40 ring-offset-1",
          )}
          label={
            <>
              <span>{state.name}</span>
              <ChevronDownIcon className="size-3 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
            </>
          }
        />
      </button>
    </DropdownMenuTrigger>
  );
}

/**
 * The line's state as a unified badge (`StatusBadge`).
 * Clicking opens a dropdown to switch to a state its current state allows, with instant feedback.
 */
export function LineStateCell({
  line,
  data,
  pending = false,
  canChangeState = false,
  onStateChange,
  onFollowStatus,
}: LineStateCellProps) {
  const state = stateOf({ item: line, data });
  if (!state) return <span className="text-muted-foreground">–</span>;
  if (!canChangeState || !onStateChange) {
    return (
      <StatusBadge
        label={state.name}
        color={state.color}
        className={cn(pending && "animate-pulse ring-2 ring-primary/40 ring-offset-1")}
      />
    );
  }
  // The current state and the states its item type lets it move to (ADR 0044).
  const statesToShow = data.states.filter(
    (s) => s.id === state.id || state.transitionsTo.includes(s.id),
  );
  return (
    <DropdownMenu>
      <StateBadgeTrigger state={state} pending={pending} />
      <StateMenuContent
        line={line}
        stateId={state.id}
        states={statesToShow}
        onStateChange={onStateChange}
        onFollowStatus={onFollowStatus}
      />
    </DropdownMenu>
  );
}
